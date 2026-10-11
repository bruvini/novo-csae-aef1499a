import assert from 'node:assert/strict';
import test from 'node:test';
import { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import {
  calcularEtapasCompletadas,
  executarAvancoAposSalvar,
  getMotivoBloqueio,
  isAchadoDoCatalogoAprovado,
  isEtapaAcessivel,
  obterRegistrosExameFisico,
  CatalogoAchadosAprovados,
  RequisitoDescricaoAvaliacao,
} from './processoUtils';

const requisitosDescricao: RequisitoDescricaoAvaliacao[] = [
  { exame: 'Abdome', achado: 'Dor à palpação' },
];

function criarProcesso(
  avaliacao: Partial<ProcessoEnfermagem['avaliacao']> = {}
): ProcessoEnfermagem {
  return {
    id: 'processo-teste',
    pacienteId: 'paciente-teste',
    enfermeiroId: 'enfermeiro-teste',
    status: 'em_andamento',
    etapaAtual: 1,
    dataInicio: null as unknown as ProcessoEnfermagem['dataInicio'],
    sessoesDeTrabalho: [],
    avaliacao: {
      coletaDeDadosSubjetivos: '',
      exameFisico: {},
      nhbsAfetadas: [],
      ...avaliacao,
    },
    diagnostico: { diagnosticosSelecionados: [] },
    planejamento: { diagnosticosPlanejados: [] },
    implementacao: {},
    evolucao: { resumoGerado: '' },
  };
}

test('libera Avaliação com entrevista e sinal vital igual a zero', () => {
  const processo = criarProcesso({
    coletaDeDadosSubjetivos: 'Entrevista realizada.',
    exameFisico: { 'Temperatura (°C)': 0 },
  });

  assert.deepEqual(calcularEtapasCompletadas(processo), [1]);
  assert.equal(isEtapaAcessivel(2, 1, [], processo), true);
  assert.equal(getMotivoBloqueio(2, 1, [], processo), null);
});

test('reconhece entrevista e achado registrado na Revisão de Sistemas', () => {
  const processo = criarProcesso({
    coletaDeDadosSubjetivos: 'Entrevista realizada.',
    exameFisicoMulti: { 'Abdome': ['Dor à palpação'] },
    exameFisicoDescricoes: { 'Abdome|||Dor à palpação': 'Dor em quadrante inferior direito.' },
  });

  assert.deepEqual(calcularEtapasCompletadas(processo), [1]);
  assert.equal(isEtapaAcessivel(2, 1, [], processo), true);
  assert.deepEqual(obterRegistrosExameFisico(processo.avaliacao), [
    {
      exame: 'Abdome',
      valor: 'Dor à palpação',
      tipo: 'achado',
      descricao: 'Dor em quadrante inferior direito.',
    },
  ]);
});

test('bloqueia entrevista sem exame físico e informa o que falta', () => {
  const processo = criarProcesso({ coletaDeDadosSubjetivos: 'Entrevista realizada.' });

  assert.deepEqual(calcularEtapasCompletadas(processo), []);
  assert.equal(isEtapaAcessivel(2, 1, [], processo), false);
  assert.match(getMotivoBloqueio(2, 1, [], processo) || '', /exame físico/i);
});

test('bloqueia exame físico sem coleta subjetiva e informa a entrevista pendente', () => {
  const processo = criarProcesso({ exameFisico: { 'Pressão Arterial': '120/80' } });

  assert.deepEqual(calcularEtapasCompletadas(processo), []);
  assert.equal(isEtapaAcessivel(2, 1, [], processo), false);
  assert.match(getMotivoBloqueio(2, 1, [], processo) || '', /coleta de dados subjetivos/i);
});

test('ignora campos e seleções vazios, mas preserva zero e números finitos', () => {
  const processo = criarProcesso({
    coletaDeDadosSubjetivos: '   ',
    exameFisico: {
      'Campo vazio': '   ',
      'Campo indefinido': undefined as unknown as string,
      'Campo não finito': Number.NaN,
    },
    exameFisicoMulti: { Abdome: ['', '   '] },
  });
  assert.deepEqual(calcularEtapasCompletadas(processo), []);
  assert.deepEqual(obterRegistrosExameFisico(processo.avaliacao), []);

  const valorZero = criarProcesso({ exameFisico: { 'Sinal vital': 0 } });
  assert.equal(obterRegistrosExameFisico(valorZero.avaliacao)[0]?.valor, 0);
});

test('exige descrição somente para achados selecionados marcados no catálogo', () => {
  const semDescricao = criarProcesso({
    coletaDeDadosSubjetivos: 'Entrevista realizada.',
    exameFisicoMulti: { Abdome: ['Dor à palpação'] },
  });

  assert.equal(calcularEtapasCompletadas(semDescricao, requisitosDescricao).includes(1), false);
  assert.match(
    getMotivoBloqueio(2, 1, [], semDescricao, requisitosDescricao) || '',
    /descrições obrigatórias/i
  );

  const comDescricao = criarProcesso({
    coletaDeDadosSubjetivos: 'Entrevista realizada.',
    exameFisicoMulti: { Abdome: ['Dor à palpação'] },
    exameFisicoDescricoes: { 'Abdome|||Dor à palpação': 'Descrição clínica registrada.' },
  });
  assert.equal(calcularEtapasCompletadas(comDescricao, requisitosDescricao).includes(1), true);
});

test('não permite selecionar achados fora do catálogo aprovado', () => {
  const catalogo: CatalogoAchadosAprovados[] = [{
    exames: [{
      nomeExame: 'Abdome',
      achados: [{
        descricaoAchado: 'Resultados da palpação',
        tipoAchado: 'opcoes',
        opcoes: [{ textoOpcao: 'Dor à palpação' }],
      }],
    }],
  }];

  assert.equal(isAchadoDoCatalogoAprovado(catalogo, 'Abdome', 'Dor à palpação'), true);
  assert.equal(isAchadoDoCatalogoAprovado(catalogo, 'Abdome', 'Resultados da palpação'), false);
  assert.equal(isAchadoDoCatalogoAprovado(catalogo, 'Abdome', 'Campo livre não cadastrado'), false);
  assert.equal(isAchadoDoCatalogoAprovado(catalogo, 'Exame não cadastrado', 'Dor à palpação'), false);
});

test('falha de salvamento não permite avanço; sucesso executa a transição uma vez', async () => {
  let avancos = 0;
  const falha = await executarAvancoAposSalvar(async () => false, () => { avancos += 1; });
  assert.equal(falha, false);
  assert.equal(avancos, 0);

  const sucesso = await executarAvancoAposSalvar(async () => true, () => { avancos += 1; });
  assert.equal(sucesso, true);
  assert.equal(avancos, 1);

  const erro = await executarAvancoAposSalvar(async () => { throw new Error('offline'); }, () => { avancos += 1; });
  assert.equal(erro, false);
  assert.equal(avancos, 1);
});

test('dados multi-select e descrições permanecem disponíveis para reabertura e histórico', () => {
  const processo = criarProcesso({
    exameFisico: { 'Pressão Arterial': '120/80', 'Peso (kg)': 0 },
    exameFisicoMulti: { 'Abdome': ['Dor à palpação'] },
    exameFisicoDescricoes: { 'Abdome|||Dor à palpação': 'Dor relatada durante palpação.' },
    nhbsAfetadas: [{ parametro: 'Abdome', nhb: 'Eliminações' }],
  });

  assert.deepEqual(obterRegistrosExameFisico(processo.avaliacao), [
    { exame: 'Pressão Arterial', valor: '120/80', tipo: 'parametro' },
    { exame: 'Peso (kg)', valor: 0, tipo: 'parametro' },
    {
      exame: 'Abdome',
      valor: 'Dor à palpação',
      tipo: 'achado',
      descricao: 'Dor relatada durante palpação.',
    },
  ]);
  assert.equal(processo.avaliacao.nhbsAfetadas[0]?.nhb, 'Eliminações');
});
