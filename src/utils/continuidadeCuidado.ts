import type { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import { Timestamp } from 'firebase/firestore';

export function idAcompanhamentoLegado(processoId: string, diagnosticoId: string): string {
  return `legado:${processoId}:${diagnosticoId}`;
}

export function diagnosticosAnterioresDisponiveis(
  processos: ProcessoEnfermagem[], processoAtualId: string,
) {
  const concluidos = processos
    .filter(p => p.id !== processoAtualId && p.status === 'concluido')
    .sort((a, b) => dataMillis(a.dataConclusao || a.dataInicio) - dataMillis(b.dataConclusao || b.dataInicio));
  const atuais = new Map<string, { processo: ProcessoEnfermagem; diagnosticoId: string; titulo: string; acompanhamentoId: string }>();

  for (const processo of concluidos) {
    for (const decisao of processo.diagnostico?.reavaliacoesAnteriores || []) {
      atuais.delete(decisao.acompanhamentoId);
      if (decisao.decisao === 'encerrar') continue;
      const diagnosticoId = decisao.decisao === 'substituir' ? decisao.novoDiagnosticoId : decisao.diagnosticoOrigemId;
      const diagnosticoAtual = processo.diagnostico?.diagnosticosSelecionados.find(item => item.id === diagnosticoId);
      if (diagnosticoAtual) atuais.set(decisao.acompanhamentoId, {
        processo, diagnosticoId: diagnosticoAtual.id, titulo: diagnosticoAtual.tituloDiagnostico, acompanhamentoId: decisao.acompanhamentoId,
      });
    }

    const diagnosticosComDecisao = new Set((processo.diagnostico?.reavaliacoesAnteriores || [])
      .filter(decisao => decisao.decisao !== 'encerrar')
      .map(decisao => decisao.decisao === 'substituir' ? decisao.novoDiagnosticoId : decisao.diagnosticoOrigemId)
      .filter((id): id is string => Boolean(id)));
    for (const diagnostico of processo.diagnostico?.diagnosticosSelecionados || []) {
      if (diagnosticosComDecisao.has(diagnostico.id)) continue;
      const plano = processo.planejamento?.diagnosticosPlanejados?.find(item => item.diagnosticoId === diagnostico.id);
      const acompanhamentoId = diagnostico.acompanhamentoId || plano?.acompanhamentoId || idAcompanhamentoLegado(processo.id, diagnostico.id);
      if (atuais.has(acompanhamentoId)) continue;
      atuais.set(acompanhamentoId, { processo, diagnosticoId: diagnostico.id, titulo: diagnostico.tituloDiagnostico, acompanhamentoId });
    }
  }

  return [...atuais.values()].map(({ processo, diagnosticoId, titulo, acompanhamentoId }) => {
    const plano = processo.planejamento?.diagnosticosPlanejados?.find(item => item.diagnosticoId === diagnosticoId);
    const diagnostico = processo.diagnostico?.diagnosticosSelecionados.find(item => item.id === diagnosticoId);
    return {
      acompanhamentoId,
      processoOrigemId: processo.id,
      diagnosticoOrigemId: diagnosticoId,
      dataOrigem: processo.dataConclusao || processo.dataInicio,
      tituloDiagnostico: titulo,
      naturezaDiagnostico: diagnostico?.naturezaDiagnostico,
      resultadoEsperado: plano?.resultadoEsperadoSelecionado,
      intervencoes: plano?.intervencoesSelecionadas?.map(item => item.acaoPrescrita) || [],
    };
  }).sort((a, b) => dataMillis(b.dataOrigem) - dataMillis(a.dataOrigem));
}

function dataMillis(value: unknown): number {
  if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return 0;
}

export function formatarDataConsulta(value: unknown, incluirHora = true): string {
  const data = value instanceof Timestamp ? value.toDate() : value instanceof Date ? value : null;
  if (!data || Number.isNaN(data.getTime())) return 'Data não registrada';
  return data.toLocaleString('pt-BR', incluirHora ? undefined : { dateStyle: 'short' });
}

export function revisoesConfirmadasEmRetorno(processos: ProcessoEnfermagem[]) {
  return diagnosticosAnterioresDisponiveis(processos, '').map(item => ({
    acompanhamentoId: item.acompanhamentoId,
    processoId: item.processoOrigemId,
    diagnosticoId: item.diagnosticoOrigemId,
    titulo: item.tituloDiagnostico,
  }));
}
