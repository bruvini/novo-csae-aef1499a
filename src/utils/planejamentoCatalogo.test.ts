import test from 'node:test';
import assert from 'node:assert/strict';
import { combinarIntervencoesPlanejamento, removerProcessoPorId, resolverDiagnosticoPlanejamento } from './planejamentoCatalogo';
import type { Diagnostico, Intervencao } from '@/services/bancodados/rolEnfermagemDB';
import type { IntervencaoBiblioteca } from '@/services/bancodados/intervencoesAutoraisDB';
import { isDiagnosticoPositivo, obterPendenciasPlanejamento } from './processoUtils';

const diagnostico = (id: string, resultadosEsperados: Diagnostico['resultadosEsperados'] = []) => ({
  id, tituloDiagnostico: 'Diagnóstico teste', descricaoDiagnostico: '', subconjuntos: [], resultadosEsperados,
  dataCadastro: {} as Diagnostico['dataCadastro'],
}) as Diagnostico;

test('resolução do diagnóstico apresenta estados distintos do catálogo e consulta por ID exato', () => {
  const item = diagnostico('catalogo-1', [{ tituloResultado: 'Resultado', descricaoResultado: '', intervencoes: [] }]);
  assert.deepEqual(resolverDiagnosticoPlanejamento(item.id, [], 'carregando'), { estado: 'carregando' });
  assert.deepEqual(resolverDiagnosticoPlanejamento(item.id, [], 'erro'), { estado: 'erro' });
  assert.deepEqual(resolverDiagnosticoPlanejamento('inexistente', [item], 'carregado'), { estado: 'nao_encontrado' });
  assert.equal(resolverDiagnosticoPlanejamento(item.id, [diagnostico(item.id)], 'carregado').estado, 'sem_resultados');
  assert.deepEqual(resolverDiagnosticoPlanejamento(item.id, [item], 'carregado'), { estado: 'com_resultados', diagnostico: item });
});

test('diagnóstico sem resultados só fica isento quando sua natureza positiva está explicitamente homologada', () => {
  const positivo = { ...diagnostico('positivo'), naturezaDiagnostico: 'promocao_saude' as const };
  const naoClassificado = diagnostico('nao-classificado');
  assert.equal(isDiagnosticoPositivo(positivo.naturezaDiagnostico, undefined), true);
  assert.equal(isDiagnosticoPositivo(naoClassificado.naturezaDiagnostico, undefined), false);
  const selecao = [{ id: positivo.id, tituloDiagnostico: positivo.tituloDiagnostico, naturezaDiagnostico: positivo.naturezaDiagnostico }];
  assert.deepEqual(obterPendenciasPlanejamento({ diagnosticosSelecionados: selecao }, [{ diagnosticoId: positivo.id, tituloDiagnostico: positivo.tituloDiagnostico, ordemPrioridade: 1, naturezaDiagnostico: positivo.naturezaDiagnostico, intervencoesSelecionadas: [], justificativaSemIntervencao: 'Sem intervenção indicada nesta consulta.' }]), []);
  assert.match(obterPendenciasPlanejamento({ diagnosticosSelecionados: [{ id: naoClassificado.id, tituloDiagnostico: naoClassificado.tituloDiagnostico }] }, [{ diagnosticoId: naoClassificado.id, tituloDiagnostico: naoClassificado.tituloDiagnostico, ordemPrioridade: 1, intervencoesSelecionadas: [] }])[0], /resultado esperado/);
});

test('combina intervenções nativas e aprovadas na mesma lista sem duplicar ações', () => {
  const nativa: Intervencao = { acaoPrescrita: 'Monitorar sinais vitais', acaoEnfermeiro: 'A cada turno', materiaisDeApoio: [] };
  const aprovada = {
    id: 'publicada-1', acaoPrescrita: 'Monitorar sinais vitais', acaoEnfermeiro: 'A cada turno', materiaisDeApoio: [],
    modoDisponibilidade: 'resultados_especificos', destinos: [], status: 'disponivel', versao: 2, sugestoesOrigemIds: [],
  } as IntervencaoBiblioteca;
  const transversal = { ...aprovada, id: 'transversal-1', acaoPrescrita: 'Oferecer orientação', modoDisponibilidade: 'transversal' } as IntervencaoBiblioteca;
  const resultado = combinarIntervencoesPlanejamento([nativa], [aprovada, transversal]);
  assert.equal(resultado.length, 2);
  assert.deepEqual(resultado.map(item => item.origem), ['biblioteca', 'biblioteca']);
  assert.equal(resultado[0].chave, 'biblioteca:publicada-1:v2');
  assert.equal(resultado[1].chave, 'biblioteca:transversal-1:v2');
});

test('exclusão remove apenas o processo confirmado e preserva os demais processos', () => {
  const processos = [{ idProcesso: 'a' }, { idProcesso: 'b' }, { idProcesso: 'c' }];
  assert.deepEqual(removerProcessoPorId(processos, 'b'), [{ idProcesso: 'a' }, { idProcesso: 'c' }]);
  assert.deepEqual(processos, [{ idProcesso: 'a' }, { idProcesso: 'b' }, { idProcesso: 'c' }]);
});
