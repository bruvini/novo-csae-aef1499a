type Instante = { toMillis?: () => number; toDate?: () => Date } | Date | string | number | null | undefined;

export interface ProcessoComTempo {
  sessoesDeTrabalho?: Array<{ inicioSessao?: Instante; fimSessao?: Instante }> | null;
  tempoAtividadeMinutos?: number;
  tempoAtivoSegundos?: number;
}

function emMilissegundos(value: Instante): number | null {
  try {
    if (!value) return null;
    let ms: number;
    if (typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
      ms = value.toMillis();
    } else if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
      ms = value.toDate().getTime();
    } else if (value instanceof Date) {
      ms = value.getTime();
    } else {
      ms = new Date(value as string | number).getTime();
    }
    return Number.isFinite(ms) ? ms : null;
  } catch {
    return null;
  }
}

/**
 * Soma apenas atividade registrada em sessões encerradas.
 * Não utiliza dataInicio→dataConclusao como horas trabalhadas: esse intervalo
 * inclui pausas, turnos e dias sem atividade.
 */
export function calcularTempoAtivoSegundos(processo: ProcessoComTempo): number {
  const sessoes = Array.isArray(processo.sessoesDeTrabalho) ? processo.sessoesDeTrabalho : [];
  let acumulado = 0;
  for (const sessao of sessoes) {
    const inicio = emMilissegundos(sessao.inicioSessao);
    const fim = emMilissegundos(sessao.fimSessao);
    if (inicio === null || fim === null) continue;
    const segundos = (fim - inicio) / 1000;
    if (segundos > 0 && segundos <= 24 * 3600) acumulado += segundos;
  }
  if (acumulado > 0) return acumulado;
  if (typeof processo.tempoAtivoSegundos === 'number' && Number.isFinite(processo.tempoAtivoSegundos) && processo.tempoAtivoSegundos > 0)
    return processo.tempoAtivoSegundos;
  if (typeof processo.tempoAtividadeMinutos === 'number' && Number.isFinite(processo.tempoAtividadeMinutos) && processo.tempoAtividadeMinutos > 0)
    return processo.tempoAtividadeMinutos * 60;
  return 0;
}

export function formatarTempoRegistrado(minutos: number): string {
  const total = Number.isFinite(minutos) ? Math.max(0, Math.floor(minutos)) : 0;
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  return `${horas.toLocaleString('pt-BR')}h ${String(resto).padStart(2, '0')}min`;
}
