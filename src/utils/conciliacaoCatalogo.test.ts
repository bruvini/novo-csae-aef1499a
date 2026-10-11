import assert from 'node:assert/strict';
import test from 'node:test';
import {
  conciliarCatalogoClinico, type InventarioClinico, type FontesPlanilha,
} from './conciliacaoCatalogo';

function origem(): FontesPlanilha {
  return {
    SinaisVitais: [{
      linha: 2, celulas: [
        'Frequência Cardíaca', '', 'bpm', '18', '65', 'anos',
        'Ambos', 'Repouso', '60', '100', 'Normal', '',
      ],
    }],
    ExamesLabImagem: [{
      linha: 3, celulas: [
        'Sorologia para Sífilis', '', 'Laboratorial', 'Teste rápido',
        'Qualitativo', '', '', '', 'Ambos', '', '',
        'Não reagente', 'Normal', '',
      ],
    }],
    RevisaoSistemas: [{
      linha: 4, celulas: [
        'Sistema Tegumentar', '', 'Inspeção', 'Coloração da Pele',
        '', '', 'anos', 'Ambos', 'Pálido', 'Palidez', 'Oxigenação',
      ],
    }],
  };
}
function base(): InventarioClinico {
  return {
    projeto: 'csaefloripa', modo: 'somente_leitura', geradoEmUTC: '2026-10-11T12:00:00Z',
    colecoes: {
      SinaisVitais: [{
        id: 'v1', nome: 'Frequência Cardíaca',
        referencias: [{
          idadeMinima: 18, idadeMaxima: 65, idadeUnidade: 'anos',
          sexo: 'Ambos', condicao: 'Repouso', valorMinimo: 60,
          valorMaximo: 100, alteracao: 'Normal', nhb: '',
        }],
      }],
      RevisaoSistemas: [{
        id: 's1', nome: 'Sistema Tegumentar',
        exames: [{ nome: 'Coloração da Pele', achados: [{ nome: 'Pálido' }] }],
      }],
      ExamesLabImagem: [{
        id: 'e1', nome: 'Sorologia para Sífilis', tipo: 'Imagem',
        componentes: [{ nome: 'Teste rápido', resultados: [] }],
      }],
      subconjuntosEnfermagem: [{ nome: 'Oxigenação', tipo: 'nhb' }],
    },
  };
}
test('produz comparação read-only: referência equivalente, classificação divergente e exame físico existente', () => {
  const resultado = conciliarCatalogoClinico(base(), origem());
  assert.equal(resultado.modo, 'somente_leitura');
  assert.equal(resultado.propostas.length, 3);
  assert.deepEqual(resultado.contagensOrigem,
    { SinaisVitais: 1, RevisaoSistemas: 1, ExamesLabImagem: 1 });
  const vital = resultado.propostas.find(p => p.aba === 'SinaisVitais');
  assert.equal(vital?.acao, 'reutilizar');
  assert.deepEqual(vital?.documentosFirestore, ['v1']);
  assert.equal(resultado.propostas.find(p => p.aba === 'ExamesLabImagem')?.acao, 'revisao-obrigatoria');
  assert.equal(resultado.propostas.find(p => p.aba === 'RevisaoSistemas')?.acao, 'reutilizar');
  assert.ok(resultado.propostas.every(p => p.exigeAprovacaoCSAE));
});
test('diferente faixa não autoriza atualização automática', () => {
  const linhas = origem();
  linhas.SinaisVitais[0].celulas[9] = '110';
  const resultado = conciliarCatalogoClinico(base(), linhas);
  assert.equal(resultado.propostas.find(p => p.aba === 'SinaisVitais')?.acao, 'conferir-referencias');
});
test('NHB divergente e duplicidade de catálogos exigem revisão obrigatória', () => {
  const linhas = origem();
  linhas.SinaisVitais[0].celulas[11] = 'Necessidade não cadastrada';
  const inventario = base();
  inventario.colecoes.SinaisVitais.push({
    id: 'v2', nome: 'Frequência Cardíaca (FC)', referencias: [],
  });
  const resultado = conciliarCatalogoClinico(inventario, linhas);
  const vital = resultado.propostas.find(p => p.aba === 'SinaisVitais');
  assert.equal(vital?.acao, 'revisao-obrigatoria');
  assert.deepEqual(vital?.documentosFirestore, ['v1', 'v2']);
  assert.match(vital?.justificativa || '', /NHB/);
});
test('recusa inventário de outro projeto, incompleto ou sem marca somente leitura', () => {
  const inv = base();
  inv.projeto = 'outro-projeto';
  assert.throws(() => conciliarCatalogoClinico(inv, origem()), /Inventário recusado/);
  const outro = base();
  outro.modo = 'edicao';
  assert.throws(() => conciliarCatalogoClinico(outro, origem()), /Inventário recusado/);
});
test('novo achado deve ser revisado sem tocar nos IDs dos exames antigos', () => {
  const linhas = origem();
  linhas.RevisaoSistemas.push({
    linha: 10, celulas: [
      'Sistema Tegumentar', '', 'Palpação', 'Turgor',
      '', '', 'anos', 'Ambos', 'Diminuído', 'Desidratação', 'Oxigenação',
    ],
  });
  const resultado = conciliarCatalogoClinico(base(), linhas);
  const sistema = resultado.propostas.find(p => p.aba === 'RevisaoSistemas');
  assert.equal(sistema?.acao, 'complementar-candidato');
  assert.deepEqual(sistema?.linhasOrigem, [4, 10]);
  assert.deepEqual(sistema?.documentosFirestore, ['s1']);
});

test('exame com nome parcial do legado não vira cadastro novo automaticamente', () => {
  const inventario = base();
  inventario.colecoes.ExamesLabImagem[0].nome =
    'Sorologia para Sífilis — Teste Treponêmico (TR) + VDRL';
  const relatorio = conciliarCatalogoClinico(inventario, origem());
  const exame = relatorio.propostas.find(p => p.aba === 'ExamesLabImagem');
  assert.equal(exame?.acao, 'revisao-obrigatoria');
  assert.deepEqual(exame?.documentosFirestore, ['e1']);
  assert.match(exame?.justificativa || '', /parcialmente/);
});
