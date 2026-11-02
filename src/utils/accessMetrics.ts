export const LIMITE_HISTORICO_ACESSO = 200;
export const FUSO_PAINEL = 'America/Sao_Paulo';

export type OrigemRegistroAcesso = 'login_explicito' | 'restauracao_sessao' | 'recarregamento';

export function deveContabilizarLogin(origem: OrigemRegistroAcesso): boolean {
  return origem === 'login_explicito';
}

export function planejarRegistroLogin(total: unknown, historico: unknown): {
  proximoTotal: number;
  acrescentarHistorico: boolean;
} {
  return {
    proximoTotal: normalizarTotalAcessos(total) + 1,
    acrescentarHistorico: deveAcrescentarHistoricoAcesso(historico),
  };
}

export async function tentarRegistrarLogin(
  registrar: () => Promise<number | null>,
  aoFalhar: (error: unknown) => void,
): Promise<number | null> {
  try {
    return await registrar();
  } catch (error) {
    aoFalhar(error);
    return null;
  }
}

export function deveAcrescentarHistoricoAcesso(historico: unknown): boolean {
  return !Array.isArray(historico) || historico.length < LIMITE_HISTORICO_ACESSO;
}

export function normalizarTotalAcessos(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function somarTotalLoginsRegistrados(values: unknown[]): number {
  return values.reduce<number>((total, value) => total + normalizarTotalAcessos(value), 0);
}

export function converterDataAcesso(value: unknown): Date | null {
  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (typeof value === 'string' || typeof value === 'number') date = new Date(value);
  else if (value && typeof value === 'object') {
    const timestamp = value as { toDate?: () => Date; seconds?: number };
    if (typeof timestamp.toDate === 'function') date = timestamp.toDate();
    else if (typeof timestamp.seconds === 'number') date = new Date(timestamp.seconds * 1000);
  }
  return date && Number.isFinite(date.getTime()) ? date : null;
}

export function cacheTemporalAindaValido(value: unknown, agora: number, validadeMs: number): boolean {
  const date = converterDataAcesso(value);
  if (!date) return false;
  const idade = agora - date.getTime();
  return idade >= 0 && idade < validadeMs;
}

export function chaveDataSaoPaulo(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO_PAINEL,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function chaveMesSaoPaulo(date: Date): string {
  return chaveDataSaoPaulo(date).slice(0, 7);
}

export function diaSemanaSaoPaulo(date: Date): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: FUSO_PAINEL, weekday: 'short' }).format(date);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
}

export function preencherDias(
  contagem: Record<string, number>,
  inicio: string | undefined,
  fim: string,
): Array<{ key: string; novos: number }> {
  if (!inicio) return [];
  const cursor = new Date(`${inicio}T00:00:00Z`);
  const limite = new Date(`${fim}T00:00:00Z`);
  const entries: Array<{ key: string; novos: number }> = [];
  while (cursor <= limite) {
    const key = cursor.toISOString().slice(0, 10);
    entries.push({ key, novos: contagem[key] || 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return entries;
}
