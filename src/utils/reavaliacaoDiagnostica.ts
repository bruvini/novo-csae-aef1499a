import type { DecisaoReavaliacaoDiagnostico } from '@/types/processoEnfermagem';

export interface DiagnosticoSelecionadoReavaliacao {
  id: string;
  tituloDiagnostico: string;
  acompanhamentoId?: string;
  naturezaDiagnostico?: 'problema' | 'risco' | 'promocao_saude';
}

export function atualizarSelecaoAposReavaliacao(
  selecionados: DiagnosticoSelecionadoReavaliacao[],
  acompanhamentoId: string,
  decisao: DecisaoReavaliacaoDiagnostico['decisao'],
  destino?: DiagnosticoSelecionadoReavaliacao,
): DiagnosticoSelecionadoReavaliacao[] {
  const restantes = selecionados.filter(item => item.acompanhamentoId !== acompanhamentoId);
  if (decisao === 'encerrar' || !destino) return restantes;

  const jaSelecionadoIndependentemente = restantes.some(item => item.id === destino.id && !item.acompanhamentoId);
  if (jaSelecionadoIndependentemente) return restantes;

  return [...restantes, { ...destino, acompanhamentoId }];
}
