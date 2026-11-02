import assert from 'node:assert/strict';
import test from 'node:test';
import type { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import { calcularEtapasCompletadas, getMotivoBloqueio, isDiagnosticoPositivo, isEtapaAcessivel } from './processoUtils';

const positive = { id: 'd1', tituloDiagnostico: 'Diagnóstico exemplo', naturezaDiagnostico: 'promocao_saude' as const };
const problem = { id: 'd2', tituloDiagnostico: 'Diagnóstico que exige cuidado', naturezaDiagnostico: 'problema' as const };

function fixture(overrides: Partial<ProcessoEnfermagem> = {}): ProcessoEnfermagem {
  return {
    id: 'p1', pacienteId: 'paciente-teste', enfermeiroId: 'enfermeiro-teste', status: 'em_andamento',
    etapaAtual: 1, dataInicio: {} as ProcessoEnfermagem['dataInicio'], sessoesDeTrabalho: [],
    avaliacao: { coletaDeDadosSubjetivos: 'Relato de teste', exameFisico: { Temperatura: 36 }, nhbsAfetadas: [] },
    diagnostico: { diagnosticosSelecionados: [positive] },
    planejamento: { diagnosticosPlanejados: [{
      diagnosticoId: 'd1', tituloDiagnostico: positive.tituloDiagnostico, naturezaDiagnostico: 'promocao_saude',
      ordemPrioridade: 1, intervencoesSelecionadas: [], justificativaSemIntervencao: 'Acompanhamento de rotina sem necessidade de ação adicional.',
    }] },
    implementacao: { [positive.tituloDiagnostico]: { intervencoes: [] } },
    evolucao: { resumoGerado: 'Resumo final de teste', julgamentoClinico: 'Resultados avaliados; manter acompanhamento.' },
    ...overrides,
  };
}

function intervention(acaoPrescrita = 'Orientar autocuidado', tipo: 'padrao' | 'autoral' = 'padrao') {
  return { acaoPrescrita, tipo };
}

function processWithAction(tipo: 'padrao' | 'autoral' = 'padrao') {
  const plano = {
    diagnosticoId: 'd1', tituloDiagnostico: positive.tituloDiagnostico, naturezaDiagnostico: 'promocao_saude' as const,
    ordemPrioridade: 1, resultadoEsperadoSelecionado: 'Manter condição de saúde',
    intervencoesSelecionadas: [intervention('Orientar autocuidado', tipo)],
  };
  return fixture({
    planejamento: { diagnosticosPlanejados: [plano] },
    implementacao: { [positive.tituloDiagnostico]: { intervencoes: [{
      ...intervention('Orientar autocuidado', tipo), implementadoNestaConsulta: true, quemExecuta: 'Enfermeiro',
    }] } },
    evolucao: { resumoGerado: 'Resumo final', julgamentoClinico: 'Resultado observado e avaliado.' },
  });
}

test('diagnóstico positivo com intervenção padronizada completa o processo sem perder resultados', () => {
  const process = processWithAction('padrao');
  assert.deepEqual(calcularEtapasCompletadas(process), [1, 2, 3, 4, 5, 6]);
  assert.equal(process.planejamento.diagnosticosPlanejados[0].resultadoEsperadoSelecionado, 'Manter condição de saúde');
});

test('intervenção positiva autoral pode ser documentada sem inventar resultado do catálogo', () => {
  const process = processWithAction('autoral');
  process.planejamento.diagnosticosPlanejados[0].resultadoEsperadoSelecionado = undefined;
  assert.deepEqual(calcularEtapasCompletadas(process), [1, 2, 3, 4, 5, 6]);
});

test('diagnóstico positivo com intervenção autoral completa sem registrar ações implícitas', () => {
  const process = processWithAction('autoral');
  assert.deepEqual(calcularEtapasCompletadas(process), [1, 2, 3, 4, 5, 6]);
  assert.equal(process.evolucao.intervencoesExecutadas, undefined);
});

test('processo exclusivamente positivo sem intervenção exige justificativa e julgamento clínico', () => {
  const process = fixture();
  assert.deepEqual(calcularEtapasCompletadas(process), [1, 2, 3, 4, 5, 6]);
  assert.equal(process.implementacao[positive.tituloDiagnostico].intervencoes.length, 0);
  assert.equal(process.evolucao.julgamentoClinico, 'Resultados avaliados; manter acompanhamento.');
  const semEvolucao = fixture({ evolucao: { resumoGerado: '' } });
  assert.deepEqual(calcularEtapasCompletadas(semEvolucao), [1, 2, 3, 4]);
});

test('diagnósticos mistos exigem implementação do diagnóstico não positivo', () => {
  const process = fixture({
    diagnostico: { diagnosticosSelecionados: [positive, problem] },
    planejamento: { diagnosticosPlanejados: [
      fixture().planejamento.diagnosticosPlanejados[0],
      { diagnosticoId: 'd2', tituloDiagnostico: problem.tituloDiagnostico, naturezaDiagnostico: 'problema', ordemPrioridade: 2, resultadoEsperadoSelecionado: 'Resultado esperado', intervencoesSelecionadas: [intervention()] },
    ] },
    implementacao: {
      [positive.tituloDiagnostico]: { intervencoes: [] },
      [problem.tituloDiagnostico]: { intervencoes: [{ ...intervention(), implementadoNestaConsulta: true, quemExecuta: 'Enfermeiro' }] },
    },
  });
  assert.ok(calcularEtapasCompletadas(process).includes(4));
  const semAcaoObrigatória = { ...process, implementacao: { [positive.tituloDiagnostico]: { intervencoes: [] } } };
  assert.ok(!calcularEtapasCompletadas(semAcaoObrigatória).includes(4));
});

test('planejamento incompleto de diagnóstico não positivo bloqueia implementação', () => {
  const process = fixture({
    diagnostico: { diagnosticosSelecionados: [problem] },
    planejamento: { diagnosticosPlanejados: [{ diagnosticoId: 'd2', tituloDiagnostico: problem.tituloDiagnostico, ordemPrioridade: 1, intervencoesSelecionadas: [] }] },
  });
  assert.ok(!calcularEtapasCompletadas(process).includes(3));
  assert.equal(isEtapaAcessivel(4, 3, [], process), false);
  assert.match(getMotivoBloqueio(4, 3, [], process) || '', /resultado esperado e intervenção/);
});

test('retirar ou alterar diagnóstico invalida planejamento obsoleto', () => {
  const stalePlan = fixture({
    diagnostico: { diagnosticosSelecionados: [{ id: 'd2', tituloDiagnostico: problem.tituloDiagnostico }] },
  });
  assert.ok(!calcularEtapasCompletadas(stalePlan).includes(3));
  const removedDiagnosis = fixture({ diagnostico: { diagnosticosSelecionados: [] } });
  assert.ok(!calcularEtapasCompletadas(removedDiagnosis).includes(2));
  assert.ok(!calcularEtapasCompletadas(removedDiagnosis).includes(3));
  const mixed = fixture({
    diagnostico: { diagnosticosSelecionados: [problem] },
    planejamento: { diagnosticosPlanejados: [
      { diagnosticoId: 'd1', tituloDiagnostico: positive.tituloDiagnostico, ordemPrioridade: 1, naturezaDiagnostico: 'promocao_saude', intervencoesSelecionadas: [], justificativaSemIntervencao: 'Justificada.' },
      { diagnosticoId: 'd2', tituloDiagnostico: problem.tituloDiagnostico, ordemPrioridade: 2, resultadoEsperadoSelecionado: 'Meta', intervencoesSelecionadas: [intervention()] },
    ] },
  });
  assert.ok(!calcularEtapasCompletadas(mixed).includes(3));
});

test('processo reaberto em andamento recalcula acesso pelas cinco etapas clínicas', () => {
  const reopened = processWithAction();
  assert.equal(reopened.status, 'em_andamento');
  assert.equal(isEtapaAcessivel(5, 4, [], reopened), true);
  const editado = { ...reopened, evolucao: { resumoGerado: '' } };
  assert.equal(isEtapaAcessivel(6, 5, [], editado), false);
});

test('processo concluído anteriormente mantém estado e dados clínicos existentes', () => {
  const concluido = processWithAction();
  concluido.status = 'concluido';
  assert.deepEqual(calcularEtapasCompletadas(concluido), [1, 2, 3, 4, 5, 6]);
  assert.equal(concluido.planejamento.diagnosticosPlanejados[0].resultadoEsperadoSelecionado, 'Manter condição de saúde');
});

test('sem ações executadas não cria intervenções fictícias no registro final', () => {
  const process = fixture();
  const acoesExecutadas = Object.values(process.evolucao.intervencoesExecutadas || {}).flat();
  assert.deepEqual(acoesExecutadas, []);
  assert.equal(process.implementacao[positive.tituloDiagnostico].intervencoes.some((item) => item.implementadoNestaConsulta), false);
});

test('resultados e evolução persistem no objeto enviado à gravação sem perda', () => {
  const process = processWithAction();
  const payload = {
    planejamento: process.planejamento,
    implementacao: process.implementacao,
    evolucao: process.evolucao,
  };
  assert.equal(payload.planejamento.diagnosticosPlanejados[0].resultadoEsperadoSelecionado, 'Manter condição de saúde');
  assert.equal(payload.evolucao.julgamentoClinico, 'Resultado observado e avaliado.');
  assert.equal(payload.implementacao[positive.tituloDiagnostico].intervencoes[0].implementadoNestaConsulta, true);
});

test('classificação explícita tem prioridade sobre o marcador legado; ausência não usa título', () => {
  assert.equal(isDiagnosticoPositivo('promocao_saude', false), true);
  assert.equal(isDiagnosticoPositivo('risco', true), false);
  assert.equal(isDiagnosticoPositivo(undefined, true), true);
  assert.equal(isDiagnosticoPositivo(undefined, false), false);
});
