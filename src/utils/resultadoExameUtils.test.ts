import assert from 'node:assert/strict';
import test from 'node:test';
import { formatarLinhaResultadoExame, obterOpcoesValorComplementar } from './resultadoExameUtils';

const rotuloVdrl = [{ resultadoClassificatorio: 'Reagente', rotuloValorTexto: 'Titulação' }];

test('usa as opções de titulação cadastradas e faz fallback se a lista estiver ausente', () => {
  const opcoes = ['Inconclusivo', '1:2', '1:4', '1:8', '1:16', '1:32', '1:64', '1:128', '1:256', '1:512', '1:1024', '1:2048'];
  assert.deepEqual(obterOpcoesValorComplementar({ tipoValorTexto: 'lista', opcoesValorTexto: opcoes }), opcoes);
  assert.deepEqual(obterOpcoesValorComplementar({ tipoValorTexto: 'lista' }), []);
  assert.deepEqual(obterOpcoesValorComplementar({ tipoValorTexto: 'livre', opcoesValorTexto: opcoes }), []);
});

test('mantém resultados reagente e não reagente de teste rápido como laboratoriais', () => {
  assert.equal(
    formatarLinhaResultadoExame({ tipoExame: 'Laboratorial', nomeExame: 'Teste Rápido de Sífilis', componente: 'Teste Treponêmico', valor: 'Reagente' }),
    'Exame laboratorial — Teste Rápido de Sífilis — Teste Treponêmico: Reagente'
  );
  assert.equal(
    formatarLinhaResultadoExame({ tipoExame: 'Laboratorial', nomeExame: 'Teste Rápido de Sífilis', componente: 'Teste Treponêmico', valor: 'Não Reagente' }),
    'Exame laboratorial — Teste Rápido de Sífilis — Teste Treponêmico: Não Reagente'
  );
});

test('mantém valores quantitativos exatamente como registrados, inclusive zero', () => {
  assert.equal(
    formatarLinhaResultadoExame({ tipoExame: 'Laboratorial', nomeExame: 'Hemograma', componente: 'Leucócitos', valor: 0 }),
    'Exame laboratorial — Hemograma — Leucócitos: 0'
  );
});

test('inclui titulação de VDRL apenas quando corresponde à classificação salva', () => {
  assert.equal(
    formatarLinhaResultadoExame({
      tipoExame: 'Laboratorial', nomeExame: 'Sorologia para Sífilis', componente: 'VDRL', valor: 'Reagente',
      resultadosConfigurados: rotuloVdrl,
      valorTexto: { resultadoClassificatorio: 'Reagente', valorTexto: '1:8' },
    }),
    'Exame laboratorial — Sorologia para Sífilis — VDRL: Reagente — Titulação: 1:8'
  );
  assert.equal(
    formatarLinhaResultadoExame({
      tipoExame: 'Laboratorial', nomeExame: 'Sorologia para Sífilis', componente: 'VDRL', valor: 'Não Reagente',
      resultadosConfigurados: rotuloVdrl,
      valorTexto: { resultadoClassificatorio: 'Reagente', valorTexto: '1:8' },
    }),
    'Exame laboratorial — Sorologia para Sífilis — VDRL: Não Reagente'
  );
});

test('apresenta exames de imagem como imagem e nunca mostra nome undefined', () => {
  const linha = formatarLinhaResultadoExame({ tipoExame: 'Imagem', nomeExame: '', componente: 'Ultrassonografia', valor: 'Alterado' });
  assert.equal(linha, 'Exame de imagem — Ultrassonografia — Ultrassonografia: Alterado');
  assert.equal(linha.includes('undefined'), false);
});
