/** Indicadores administrativos calculados exclusivamente sobre registros já carregados.
 * Não exibe média inventada se não houver pares de datas válidos.
 */
import type { TicketProblema, SugestaoMelhoria } from '@/services/bancodados/suporteDB';
import type { Usuario } from '@/types/usuario';

type TimeLike = { toDate?: () => Date; seconds?: number } | Date | string | number | null | undefined;

export function dataEmMilissegundos(value: TimeLike): number | null {
  if (!value) return null;
  try {
    const date = value instanceof Date ? value
      : typeof value === 'number' ? new Date(value)
      : typeof value === 'string' ? new Date(value)
      : typeof value.toDate === 'function' ? value.toDate()
      : typeof value.seconds === 'number' ? new Date(value.seconds * 1000)
      : null;
    const ms = date?.getTime();
    return typeof ms === 'number' && Number.isFinite(ms) ? ms : null;
  } catch { return null; }
}

export function mediaDuracaoHoras<T>(
  items: readonly T[],
  inicio: (item: T) => TimeLike,
  fim: (item: T) => TimeLike,
): number | null {
  const horas = items.flatMap((item) => {
    const de = dataEmMilissegundos(inicio(item));
    const ate = dataEmMilissegundos(fim(item));
    if (de === null || ate === null || ate < de) return [];
    return [(ate - de) / 3600000];
  });
  return horas.length ? horas.reduce((a, b) => a + b, 0) / horas.length : null;
}

export function formatarDuracaoHoras(horas: number | null): string {
  if (horas === null || !Number.isFinite(horas)) return '—';
  if (horas < 1) return `${Math.round(horas * 60)} min`;
  if (horas < 48) return `${horas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`;
  return `${(horas / 24).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`;
}

export function calcularIndicadoresTickets(tickets: readonly TicketProblema[]) {
  const abertos = tickets.filter((t) => t.status === 'Aberto').length;
  const resolvidos = tickets.filter((t) => t.status === 'Resolvido').length;
  const semLeitura = tickets.filter((t) => t.visualizadoPeloSuporte === false).length;
  const tempoResolucao = mediaDuracaoHoras(
    tickets.filter((t) => t.status === 'Resolvido'),
    (t) => t.dataCriacao, (t) => t.dataResolucao,
  );
  return { total: tickets.length, abertos, resolvidos, semLeitura, tempoResolucao };
}

export function calcularIndicadoresSugestoes(sugestoes: readonly SugestaoMelhoria[]) {
  const respondidas = sugestoes.filter((s) => Boolean(s.respostaAdmin?.trim())).length;
  const semLeitura = sugestoes.filter((s) => s.visualizadoPeloSuporte === false).length;
  const tempoResposta = mediaDuracaoHoras(
    sugestoes.filter((s) => Boolean(s.respostaAdmin?.trim())),
    (s) => s.dataCriacao, (s) => s.dataRespostaAdmin,
  );
  return {
    total: sugestoes.length,
    pendentes: sugestoes.length - respondidas,
    respondidas,
    semLeitura,
    tempoResposta,
  };
}

export function calcularIndicadoresUsuarios(grupos: {
  aguardando: readonly Usuario[];
  aprovados: readonly Usuario[];
  recusados: readonly Usuario[];
  revogados: readonly Usuario[];
}) {
  const { aguardando, aprovados, recusados, revogados } = grupos;
  const tempoAprovacao = mediaDuracaoHoras(aprovados,
    (u) => u.dataCadastro ?? u.termoResponsabilidadeData,
    (u) => u.dataAprovacao ?? u.dataLiberacaoAcesso,
  );
  const acessosInformados = aprovados.filter((u) => typeof u.totalAcessos === 'number');
  return {
    total: aguardando.length + aprovados.length + recusados.length + revogados.length,
    aguardando: aguardando.length,
    aprovados: aprovados.length,
    recusados: recusados.length,
    revogados: revogados.length,
    tempoAprovacao,
    totalAcessos: acessosInformados.length
      ? acessosInformados.reduce((acc, u) => acc + (u.totalAcessos || 0), 0)
      : null,
  };
}
