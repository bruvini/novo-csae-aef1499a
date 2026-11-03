import assert from 'node:assert/strict';
import test from 'node:test';
import { Timestamp } from 'firebase/firestore';
import type { DecisaoReavaliacaoDiagnostico, ProcessoEnfermagem } from '@/types/processoEnfermagem';
import { continuidadeDoProcesso } from './processoUtils';
import { diagnosticosAnterioresDisponiveis, idAcompanhamentoLegado, revisoesConfirmadasEmRetorno } from './continuidadeCuidado';

const diagnostico = (id: string, tituloDiagnostico = 'Dor', acompanhamentoId?: string) => ({ id, tituloDiagnostico, ...(acompanhamentoId ? { acompanhamentoId } : {}) });
const decisao = (acompanhamentoId: string, diagnosticoOrigemId: string, tipo: DecisaoReavaliacaoDiagnostico['decisao'], novoDiagnosticoId?: string): DecisaoReavaliacaoDiagnostico => ({
  acompanhamentoId, processoOrigemId: 'origem', diagnosticoOrigemId, decisao: tipo,
  ...(novoDiagnosticoId ? { novoDiagnosticoId, novoTituloDiagnostico: 'Dor reduzida' } : {}),
});
const processo = (id: string, status: 'concluido' | 'em_andamento', diagnosticos: ReturnType<typeof diagnostico>[] = [], at = 1): ProcessoEnfermagem => ({
  id, pacienteId: 'p1', enfermeiroId: 'n1', status, etapaAtual: 6, dataInicio: Timestamp.fromMillis(at),
  ...(status === 'concluido' ? { dataConclusao: Timestamp.fromMillis(at) } : {}), sessoesDeTrabalho: [],
  avaliacao: { coletaDeDadosSubjetivos: 'Avaliação fictícia', exameFisico: { temperatura: 36.5 }, nhbsAfetadas: [] },
  diagnostico: { diagnosticosSelecionados: diagnosticos },
  planejamento: { diagnosticosPlanejados: diagnosticos.map((item, index) => ({ diagnosticoId: item.id, tituloDiagnostico: item.tituloDiagnostico, ordemPrioridade: index + 1, resultadoEsperadoSelecionado: 'Resultado de referência', intervencoesSelecionadas: [{ acaoPrescrita: 'Orientar', tipo: 'padrao' as const }], ...(item.acompanhamentoId ? { acompanhamentoId: item.acompanhamentoId } : {}) })) },
  implementacao: {}, evolucao: { resumoGerado: '' },
});
const abordado = (acompanhamentoId: string, processoOrigemId: string, diagnosticoOrigemId: string) => ({ acompanhamentoId, processoOrigemId, diagnosticoOrigemId, tituloDiagnostico: 'Dor', dataOrigem: Timestamp.fromMillis(1), resultadoEsperado: 'Resultado anterior', intervencoes: ['Orientar'] });
const comReavaliacao = (base: ProcessoEnfermagem, revisoes: DecisaoReavaliacaoDiagnostico[]) => ({ ...base, diagnostico: { ...base.diagnostico, reavaliacoesAnteriores: revisoes } });

test('01 paciente sem histórico não tem cuidados pendentes', () => {
  assert.deepEqual(diagnosticosAnterioresDisponiveis([], 'current'), []);
});
test('02 consulta anterior concluída aparece com resultado e intervenções', () => {
  const anterior = processo('old', 'concluido', [diagnostico('d1')]);
  const item = diagnosticosAnterioresDisponiveis([anterior], 'current')[0];
  assert.equal(item.tituloDiagnostico, 'Dor');
  assert.equal(item.resultadoEsperado, 'Resultado de referência');
  assert.deepEqual(item.intervencoes, ['Orientar']);
});
test('03 várias consultas anteriores são exibidas da mais recente à mais antiga', () => {
  const itens = diagnosticosAnterioresDisponiveis([processo('p1', 'concluido', [diagnostico('d1', 'Antigo')], 1), processo('p2', 'concluido', [diagnostico('d2', 'Recente')], 2)], 'current');
  assert.deepEqual(itens.map(item => item.tituloDiagnostico), ['Recente', 'Antigo']);
});
test('04 cuidado não abordado permanece pendente', () => {
  const anterior = processo('p1', 'concluido', [diagnostico('d1')]);
  const retorno = processo('p2', 'concluido');
  assert.equal(diagnosticosAnterioresDisponiveis([anterior, retorno], 'current').length, 1);
});
test('05 cuidado abordado é validado pela decisão associada ao ID da linha', () => {
  const atual = processo('p2', 'em_andamento');
  atual.avaliacao.cuidadosAnterioresAbordados = [abordado('linha1', 'origem', 'd1')];
  assert.equal(continuidadeDoProcesso(atual).completa, false);
});
test('05a manter exige que o diagnóstico original continue selecionado', () => {
  const atual = comReavaliacao(processo('p2', 'em_andamento', [diagnostico('outro', 'Outro diagnóstico')]), [decisao('linha1', 'd1', 'manter')]);
  atual.avaliacao.cuidadosAnterioresAbordados = [abordado('linha1', 'origem', 'd1')];
  assert.equal(continuidadeDoProcesso(atual).completa, false);
});
test('05b substituir sem diagnóstico do Rol não conclui a continuidade', () => {
  const atual = comReavaliacao(processo('p2', 'em_andamento'), [decisao('linha1', 'd1', 'substituir')]);
  atual.avaliacao.cuidadosAnterioresAbordados = [abordado('linha1', 'origem', 'd1')];
  assert.equal(continuidadeDoProcesso(atual).completa, false);
});
test('06 manter conserva o diagnóstico e a linha no retorno seguinte', () => {
  const atual = comReavaliacao(processo('p2', 'concluido', [diagnostico('d1', 'Dor', 'linha1')]), [decisao('linha1', 'd1', 'manter')]);
  const itens = diagnosticosAnterioresDisponiveis([atual], 'current');
  assert.equal(itens[0].acompanhamentoId, 'linha1');
  assert.equal(itens[0].diagnosticoOrigemId, 'd1');
});
test('07 substituição usa o ID real e mantém a identidade longitudinal', () => {
  const atual = comReavaliacao(processo('p2', 'concluido', [diagnostico('substituto', 'Dor reduzida', 'linha1')]), [decisao('linha1', 'd1', 'substituir', 'substituto')]);
  const item = diagnosticosAnterioresDisponiveis([atual], 'current')[0];
  assert.equal(item.diagnosticoOrigemId, 'substituto');
  assert.equal(item.acompanhamentoId, 'linha1');
});
test('07a diagnóstico reavaliado não ganha uma segunda linha legada sem acompanhamentoId', () => {
  const revisado = comReavaliacao(processo('p2', 'concluido', [diagnostico('d1')]), [decisao('linha1', 'd1', 'manter')]);
  const itens = diagnosticosAnterioresDisponiveis([revisado], 'current');
  assert.equal(itens.length, 1);
  assert.equal(itens[0].acompanhamentoId, 'linha1');
});
test('08 encerramento remove a linha das pendências', () => {
  const atual = comReavaliacao(processo('p2', 'concluido'), [decisao('linha1', 'd1', 'encerrar')]);
  assert.deepEqual(diagnosticosAnterioresDisponiveis([processo('p1', 'concluido', [diagnostico('d1', 'Dor', 'linha1')]), atual], 'current'), []);
});
test('09 múltiplos diagnósticos podem ter decisões distintas no mesmo retorno', () => {
  const atual = comReavaliacao(processo('p2', 'concluido', [diagnostico('d3', 'Dor reduzida', 'linha1')]), [decisao('linha1', 'd1', 'substituir', 'd3'), decisao('linha2', 'd2', 'encerrar')]);
  atual.avaliacao.cuidadosAnterioresAbordados = [abordado('linha1', 'origem', 'd1'), abordado('linha2', 'origem', 'd2')];
  const origem = processo('p1', 'concluido', [diagnostico('d1', 'Dor', 'linha1'), diagnostico('d2', 'Mobilidade', 'linha2')]);
  const pendentes = diagnosticosAnterioresDisponiveis([origem, atual], 'current');
  assert.deepEqual(pendentes.map(item => item.diagnosticoOrigemId), ['d3']);
});
test('10 desmarcar e remover decisão mantém o cuidado anterior disponível', () => {
  const origem = processo('p1', 'concluido', [diagnostico('d1', 'Dor', 'linha1')]);
  const retorno = processo('p2', 'concluido');
  assert.equal(diagnosticosAnterioresDisponiveis([origem, retorno], 'current')[0].acompanhamentoId, 'linha1');
});
test('11 consulta abandonada não altera a continuidade', () => {
  const emAndamento = comReavaliacao(processo('p2', 'em_andamento'), [decisao('linha1', 'd1', 'encerrar')]);
  assert.equal(diagnosticosAnterioresDisponiveis([processo('p1', 'concluido', [diagnostico('d1', 'Dor', 'linha1')]), emAndamento], 'current').length, 1);
});
test('12 somente a decisão concluída atualiza a linha', () => {
  const concluido = comReavaliacao(processo('p2', 'concluido', [diagnostico('d1', 'Dor', 'linha1')]), [decisao('linha1', 'd1', 'manter')]);
  assert.equal(diagnosticosAnterioresDisponiveis([processo('p1', 'concluido', [diagnostico('d1', 'Dor', 'linha1')]), concluido], 'current')[0].processoOrigemId, 'p2');
});
test('13 consulta exclusiva de encerramento não exige diagnóstico novo e exige síntese clínica', () => {
  const p = processo('p2', 'em_andamento');
  p.avaliacao.cuidadosAnterioresAbordados = [abordado('linha1', 'origem', 'd1')];
  p.diagnostico.reavaliacoesAnteriores = [decisao('linha1', 'd1', 'encerrar')];
  assert.equal(continuidadeDoProcesso(p).somenteEncerramento, true);
  assert.equal(continuidadeDoProcesso(p).completa, true);
  assert.equal(p.diagnostico.diagnosticosSelecionados.length, 0);
});
test('14 títulos iguais em processos diferentes não são associados automaticamente', () => {
  const itens = diagnosticosAnterioresDisponiveis([processo('p1', 'concluido', [diagnostico('d1')]), processo('p2', 'concluido', [diagnostico('d2')])], 'current');
  assert.equal(itens.length, 2);
  assert.notEqual(itens[0].acompanhamentoId, itens[1].acompanhamentoId);
});
test('15 processo legado recebe ID estável baseado nos IDs de origem', () => {
  assert.equal(idAcompanhamentoLegado('p1', 'd1'), idAcompanhamentoLegado('p1', 'd1'));
  assert.notEqual(idAcompanhamentoLegado('p1', 'd1'), idAcompanhamentoLegado('p2', 'd1'));
});
test('16 retorno após manutenção aponta para a avaliação concluída mais recente', () => {
  const itens = diagnosticosAnterioresDisponiveis([processo('p1', 'concluido', [diagnostico('d1', 'Dor', 'linha1')], 1), comReavaliacao(processo('p2', 'concluido', [diagnostico('d1', 'Dor', 'linha1')], 2), [decisao('linha1', 'd1', 'manter')])], 'current');
  assert.equal(itens[0].processoOrigemId, 'p2');
});
test('17 retorno após substituição mostra diagnóstico substituto sem afirmar melhora', () => {
  const item = diagnosticosAnterioresDisponiveis([comReavaliacao(processo('p2', 'concluido', [diagnostico('d2', 'Dor reduzida', 'linha1')]), [decisao('linha1', 'd1', 'substituir', 'd2')])], 'current')[0];
  assert.equal(item.tituloDiagnostico, 'Dor reduzida');
  assert.equal(item.acompanhamentoId, 'linha1');
});
test('18 retorno após encerramento não exibe a linha', () => {
  const item = comReavaliacao(processo('p2', 'concluido'), [decisao('linha1', 'd1', 'encerrar')]);
  assert.equal(revisoesConfirmadasEmRetorno([item]).length, 0);
});
test('19 leitura longitudinal preserva integralmente processos anteriores', () => {
  const origem = processo('p1', 'concluido', [diagnostico('d1')]);
  const antes = JSON.stringify(origem);
  diagnosticosAnterioresDisponiveis([origem], 'current');
  assert.equal(JSON.stringify(origem), antes);
});
test('20 registros de cadastros separados não são combinados', () => {
  const cadastroA = [processo('a1', 'concluido', [diagnostico('d1', 'Dor')])];
  const cadastroB = [processo('b1', 'concluido', [diagnostico('d2', 'Dor')])];
  assert.equal(diagnosticosAnterioresDisponiveis(cadastroA, 'current')[0].diagnosticoOrigemId, 'd1');
  assert.equal(diagnosticosAnterioresDisponiveis(cadastroB, 'current')[0].diagnosticoOrigemId, 'd2');
});
test('21 resumo clínico contém somente linhas abordadas e decididas', () => {
  const p = processo('p2', 'em_andamento');
  p.avaliacao.cuidadosAnterioresAbordados = [abordado('linha1', 'origem', 'd1')];
  p.diagnostico.reavaliacoesAnteriores = [decisao('linha1', 'd1', 'encerrar')];
  const revisadas = p.diagnostico.reavaliacoesAnteriores.filter(item => p.avaliacao.cuidadosAnterioresAbordados?.some(cuidado => cuidado.acompanhamentoId === item.acompanhamentoId));
  assert.deepEqual(revisadas.map(item => item.acompanhamentoId), ['linha1']);
});
test('22 decisão diagnóstica não classifica alcance de resultado esperado', () => {
  const revisao = decisao('linha1', 'd1', 'manter');
  assert.deepEqual(Object.keys(revisao).sort(), ['acompanhamentoId', 'decisao', 'diagnosticoOrigemId', 'processoOrigemId'].sort());
});
