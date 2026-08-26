import { DiagnosticoPlanejado } from '@/types/processoEnfermagem';

interface DiagnosticoSelecionado {
  id: string;
  tituloDiagnostico: string;
}

export const reconciliarDiagnosticosPlanejados = (
  selecionados: DiagnosticoSelecionado[],
  planejamentoAtual: DiagnosticoPlanejado[]
): DiagnosticoPlanejado[] => {
  const selecionadosPorId = new Map(selecionados.map((diagnostico) => [diagnostico.id, diagnostico]));

  const preservados = [...planejamentoAtual]
    .sort((a, b) => a.ordemPrioridade - b.ordemPrioridade)
    .filter((diagnostico) => selecionadosPorId.has(diagnostico.diagnosticoId))
    .map((diagnostico) => ({
      ...diagnostico,
      tituloDiagnostico:
        selecionadosPorId.get(diagnostico.diagnosticoId)?.tituloDiagnostico ??
        diagnostico.tituloDiagnostico,
    }));

  const idsPreservados = new Set(preservados.map((diagnostico) => diagnostico.diagnosticoId));
  const adicionados = selecionados
    .filter((diagnostico) => !idsPreservados.has(diagnostico.id))
    .map((diagnostico) => ({
      diagnosticoId: diagnostico.id,
      tituloDiagnostico: diagnostico.tituloDiagnostico,
      ordemPrioridade: 0,
      intervencoesSelecionadas: [],
    }));

  return [...preservados, ...adicionados].map((diagnostico, index) => ({
    ...diagnostico,
    ordemPrioridade: index + 1,
  }));
};

export const planejamentosSaoIguais = (
  primeiro: DiagnosticoPlanejado[],
  segundo: DiagnosticoPlanejado[]
) => JSON.stringify(primeiro) === JSON.stringify(segundo);
