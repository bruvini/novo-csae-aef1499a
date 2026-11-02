import type { ProcessoEnfermagem, EvolucaoEnfermagem, IntervencaoImplementada } from '@/types/processoEnfermagem';
import { encontrarImplementada } from '@/utils/materiaisApoioProcesso';

export function referenciaIntervencao(diagnosticoId: string, intervencaoId: string | undefined, indice: number): string {
  return `${diagnosticoId}::${intervencaoId || `legado-${indice}`}`;
}

export function obterIntervencoesDaConsulta(processo: ProcessoEnfermagem) {
  return (processo.planejamento?.diagnosticosPlanejados || []).flatMap((diag) => {
    const existentes = processo.implementacao?.[diag.tituloDiagnostico]?.intervencoes || [];
    const usadas = new Set<number>();
    return (diag.intervencoesSelecionadas || []).map((prescrita, indice) => {
      const implementada: IntervencaoImplementada | undefined = encontrarImplementada(prescrita, existentes, usadas);
      return {
        id: referenciaIntervencao(diag.diagnosticoId, prescrita.intervencaoId, indice),
        diagnosticoId: diag.diagnosticoId,
        tituloDiagnostico: diag.tituloDiagnostico,
        resultadoEsperado: diag.resultadoEsperadoSelecionado,
        prescrita,
        implementada,
        executada: Boolean(implementada?.implementadoNestaConsulta),
      };
    });
  });
}

export function referenciaResultado(diagnosticoId: string, resultadoId: string | undefined): string {
  return `${diagnosticoId}::${resultadoId || 'legado'}`;
}

/** Remove somente avaliações sem referência atual; mantém todo o restante legado. */
export function conciliarEvolucao(processo: ProcessoEnfermagem): EvolucaoEnfermagem {
  const evolucao = processo.evolucao || { resumoGerado: '' };
  const executadas = new Set(obterIntervencoesDaConsulta(processo).filter((item) => item.executada).map((item) => item.id));
  const resultados = new Set((processo.planejamento?.diagnosticosPlanejados || [])
    .filter((diag) => diag.resultadoEsperadoSelecionado)
    .map((diag) => referenciaResultado(diag.diagnosticoId, diag.resultadoPlanejadoId)));
  const respostasIntervencoes = Object.fromEntries(Object.entries(evolucao.respostasIntervencoes || {}).filter(([id]) => executadas.has(id)));
  const observacoesCompartilhadas = (evolucao.observacoesCompartilhadas || [])
    .map((item) => ({ ...item, intervencaoIds: item.intervencaoIds.filter((id) => executadas.has(id)) }))
    .filter((item) => item.intervencaoIds.length > 0);
  const avaliacoesResultados = Object.fromEntries(Object.entries(evolucao.avaliacoesResultados || {}).filter(([id]) => resultados.has(id)));
  const mudou = JSON.stringify(respostasIntervencoes) !== JSON.stringify(evolucao.respostasIntervencoes || {})
    || JSON.stringify(observacoesCompartilhadas) !== JSON.stringify(evolucao.observacoesCompartilhadas || [])
    || JSON.stringify(avaliacoesResultados) !== JSON.stringify(evolucao.avaliacoesResultados || {});
  return {
    ...evolucao,
    ...(evolucao.respostasIntervencoes ? { respostasIntervencoes } : {}),
    ...(evolucao.observacoesCompartilhadas ? { observacoesCompartilhadas } : {}),
    ...(evolucao.avaliacoesResultados ? { avaliacoesResultados } : {}),
    ...(mudou ? { resumoGerado: '' } : {}),
  };
}
