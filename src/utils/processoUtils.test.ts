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


test('ticket Renata 2: quatro diagnósticos escolhidos liberam planejamento mesmo com stepper defasado', () => {
  const processo = criarProcesso({
    coletaDeDadosSubjetivos: 'Consulta de pré-natal: entrevista concluída.',
    exameFisico: { 'Pressão Arterial': '110/70' },
  });
  processo.diagnostico.diagnosticosSelecionados = Array.from({ length: 4 }, (_, index) => ({
    id: `diag-${index + 1}`,
    tituloDiagnostico: `Diagnóstico ${index + 1}`,
  }));
  assert.deepEqual(calcularEtapasCompletadas(processo), [1, 2]);
  // Na versão anterior, o array [1] deixava a Etapa 3 bloqueada.
  assert.equal(isEtapaAcessivel(3, 2, [1], processo), true);
  assert.equal(getMotivoBloqueio(3, 2, [1], processo), null);
});

test('ticket Renata 1: resultados e intervenções liberam implementação mesmo com progresso anterior', () => {
  const processo = criarProcesso({
    coletaDeDadosSubjetivos: 'Avaliação registrada.',
    exameFisico: { 'Sinal vital': 80 },
  });
  processo.diagnostico.diagnosticosSelecionados = [
    { id: 'a', tituloDiagnostico: 'Diagnóstico A' },
    { id: 'b', tituloDiagnostico: 'Diagnóstico B' },
  ];
  processo.planejamento.diagnosticosPlanejados = [
    { diagnosticoId: 'a', tituloDiagnostico: 'Diagnóstico A', ordemPrioridade: 1,
      resultadoEsperadoSelecionado: 'Resultado A', intervencoesSelecionadas: [{ acaoPrescrita: 'Orientar', tipo: 'padrao' }] },
    { diagnosticoId: 'b', tituloDiagnostico: 'Diagnóstico B', ordemPrioridade: 2,
      resultadoEsperadoSelecionado: 'Resultado B', intervencoesSelecionadas: [{ acaoPrescrita: 'Acompanhar', tipo: 'padrao' }] },
  ];
  assert.deepEqual(calcularEtapasCompletadas(processo), [1, 2, 3]);
  assert.equal(isEtapaAcessivel(4, 3, [1, 2], processo), true);
  assert.equal(getMotivoBloqueio(4, 3, [1, 2], processo), null);
});

test('planejamento incompleto informa diagnóstico exato e bloqueia sem apagar os completos', () => {
  const processo = criarProcesso({
    coletaDeDadosSubjetivos: 'Entrevista feita',
    exameFisico: { Temperatura: 36 },
  });
  processo.diagnostico.diagnosticosSelecionados = [
    { id: '1', tituloDiagnostico: 'Risco de infecção' },
    { id: '2', tituloDiagnostico: 'Dor aguda' },
  ];
  processo.planejamento.diagnosticosPlanejados = [
    { diagnosticoId: '1', tituloDiagnostico: 'Risco de infecção', ordemPrioridade: 1,
      resultadoEsperadoSelecionado: 'Resultado esperado', intervencoesSelecionadas: [{ acaoPrescrita: 'Avaliar', tipo: 'padrao' }] },
  ];
  assert.equal(isEtapaAcessivel(4, 3, [1, 2, 3], processo), false);
  assert.match(getMotivoBloqueio(4, 3, [1, 2, 3], processo) || '', /Dor aguda: planejamento ainda não iniciado/);

  processo.planejamento.diagnosticosPlanejados.push({
    diagnosticoId: '2', tituloDiagnostico: 'Dor aguda', ordemPrioridade: 2,
    resultadoEsperadoSelecionado: 'Resultado', intervencoesSelecionadas: [],
  });
  assert.match(getMotivoBloqueio(4, 3, [], processo) || '', /Dor aguda: falta intervenção/);
  assert.equal(isEtapaAcessivel(4, 3, [1, 2, 3], processo), false);
});

test('diagnóstico positivo dispensa resultado e intervenção mas não dispensa planejamento vinculado', () => {
  const processo = criarProcesso({
    coletaDeDadosSubjetivos: 'Entrevista feita',
    exameFisico: { Temperatura: 36 },
  });
  processo.diagnostico.diagnosticosSelecionados = [{ id: 'positive', tituloDiagnostico: 'Disposição para melhorar' }];
  processo.planejamento.diagnosticosPlanejados = [{
    diagnosticoId: 'positive', tituloDiagnostico: 'Disposição para melhorar', ordemPrioridade: 1,
    isPositivo: true, intervencoesSelecionadas: [],
  }];
  assert.equal(isEtapaAcessivel(4, 3, [], processo), true);
});
