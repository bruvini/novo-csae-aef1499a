import assert from 'node:assert/strict';
import test from 'node:test';
import { reconstruirContinuidadePorConsulta, vinculosDoCatalogo, unicosNomes } from './indicadoresClinicosAvancados';

const data = (dia: string) => new Date(dia + 'T15:00:00Z');
const diagnostico = (id: string, acompanhamentoId?: string) =>
  ({ id, tituloDiagnostico: 'Diagnóstico ' + id, ...(acompanhamentoId ? { acompanhamentoId } : {}) });
const consulta = (id: string, dia: string, diagnosticos: ReturnType<typeof diagnostico>[], extra = {}) => ({
  idProcesso: id, status: 'concluido', dataInicio: data(dia),
  diagnostico: { diagnosticosSelecionados: diagnosticos }, ...extra,
});

test('um diagnóstico contribui para todas as NHBs e protocolos distintos', () => {
  const vinculos = vinculosDoCatalogo([
    { tipoSubconjunto: 'nhb', tituloSubconjunto: 'Oxigenação' },
    { tipoSubconjunto: 'NHB', tituloSubconjunto: 'Nutrição' },
    { tipoSubconjunto: 'Protocolo_Enfermagem', tituloSubconjunto: 'Saúde da Mulher' },
    { tipoSubconjunto: 'protocolo_enfermagem', tituloSubconjunto: 'Saúde da Criança' },
    { tipoSubconjunto: 'nhb', tituloSubconjunto: 'Oxigenação' },
  ]);
  assert.deepEqual(vinculos, { nhbs: ['Oxigenação', 'Nutrição'], protocolos: ['Saúde da Mulher', 'Saúde da Criança'] });
  assert.deepEqual(unicosNomes([' Nutrição ', 'nutrição', 'Oxigenação']), ['nutrição', 'Oxigenação']);
});

test('conta cada oportunidade de retorno: manter permite nova abordagem', () => {
  const source = consulta('p1', '2026-09-01', [diagnostico('d1', 'linha-1')]);
  const keep = consulta('p2', '2026-10-01', [diagnostico('d1', 'linha-1')], {
    diagnostico: {
      diagnosticosSelecionados: [diagnostico('d1', 'linha-1')],
      reavaliacoesAnteriores: [{ acompanhamentoId: 'linha-1', processoOrigemId: 'p1', diagnosticoOrigemId: 'd1', decisao: 'manter' }],
    },
  });
  const end = consulta('p3', '2026-11-01', [], {
    diagnostico: { diagnosticosSelecionados: [], reavaliacoesAnteriores: [
      { acompanhamentoId: 'linha-1', processoOrigemId: 'p2', diagnosticoOrigemId: 'd1', decisao: 'encerrar' },
    ] },
  });
  const next = consulta('p4', '2026-11-02', []);
  const result = reconstruirContinuidadePorConsulta([next, keep, source, end]);
  assert.equal(result.get('p1')?.oportunidades, 0);
  assert.deepEqual(result.get('p2'), { oportunidades: 1, abordados: 1, mantidos: 1, substituidos: 0, encerrados: 0, abordadosSemDecisao: 0 });
  assert.deepEqual(result.get('p3'), { oportunidades: 1, abordados: 1, mantidos: 0, substituidos: 0, encerrados: 1, abordadosSemDecisao: 0 });
  assert.equal(result.get('p4')?.oportunidades, 0);
});

test('somente consultas concluídas contam e uma marcação repetida não duplica a abordagem', () => {
  const p1 = consulta('origem', '2026-07-01', [diagnostico('d1')]);
  const rascunho = { ...consulta('rascunho', '2026-07-02', []), status: 'em_andamento' };
  const p2 = consulta('retorno', '2026-07-03', [], { avaliacao: {
    cuidadosAnterioresAbordados: [
      { acompanhamentoId: 'legado:origem:d1' },
      { acompanhamentoId: 'legado:origem:d1' },
    ],
  } });
  const result = reconstruirContinuidadePorConsulta([p1, rascunho, p2]);
  assert.equal(result.has('rascunho'), false);
  assert.deepEqual(result.get('retorno'), { oportunidades: 1, abordados: 1, mantidos: 0, substituidos: 0, encerrados: 0, abordadosSemDecisao: 1 });
});
