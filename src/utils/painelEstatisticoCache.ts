import type { RegistroProducao } from './painelEstatistico';

export const CACHE_PROCESSOS_SCHEMA_VERSION = 9;
export const CACHE_CHUNK_LIMITE_BYTES = 350_000;
export const CACHE_VALIDADE_MS = 12 * 60 * 60 * 1000;

export function tamanhoJsonBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export function removerUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== undefined).map((item) => removerUndefined(item)) as T;
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, removerUndefined(item)]),
    ) as T;
  }
  return value;
}

export function particionarRegistrosPorTamanho(
  registros: RegistroProducao[],
  limiteBytes = CACHE_CHUNK_LIMITE_BYTES,
): RegistroProducao[][] {
  const chunks: RegistroProducao[][] = [];
  let atual: RegistroProducao[] = [];
  for (const registro of registros.map((item) => removerUndefined(item))) {
    const candidato = [...atual, registro];
    if (atual.length > 0 && tamanhoJsonBytes({ registros: candidato }) > limiteBytes) {
      chunks.push(atual);
      atual = [registro];
    } else {
      atual = candidato;
    }
    if (tamanhoJsonBytes({ registros: atual }) > limiteBytes) {
      throw new Error(`Registro de produção excede sozinho o limite seguro de ${limiteBytes} bytes.`);
    }
  }
  if (atual.length > 0) chunks.push(atual);
  return chunks;
}

export function cacheProducaoValido(
  data: Record<string, unknown> | undefined,
  agora = Date.now(),
): boolean {
  if (!data || data.schemaVersion !== CACHE_PROCESSOS_SCHEMA_VERSION) return false;
  const timestamp = data.ultimaAtualizacao as { toDate?: () => Date } | Date | undefined;
  const atualizadoEm = timestamp instanceof Date ? timestamp : timestamp?.toDate?.();
  return Boolean(
    atualizadoEm
    && agora - atualizadoEm.getTime() < CACHE_VALIDADE_MS
    && Array.isArray(data.lotacoesUnicas)
    && Array.isArray(data.lotacaoDocumentos)
    && typeof data.registroChunks === 'number',
  );
}

export async function tentarPersistirCache(
  persistir: () => Promise<void>,
  registrarErro: (error: unknown) => void = console.error,
): Promise<boolean> {
  try {
    await persistir();
    return true;
  } catch (error) {
    registrarErro(error);
    return false;
  }
}

export type EstadoProducao = 'loading' | 'error' | 'empty' | 'success';

export function resolverEstadoProducao(
  loading: boolean,
  error: string | null,
  totalProcessos?: number,
): EstadoProducao {
  if (loading) return 'loading';
  if (error) return 'error';
  if (!totalProcessos) return 'empty';
  return 'success';
}

export function exportacaoPainelHabilitada(
  loadingUsuarios: boolean,
  estadoProducao: EstadoProducao,
  possuiDadosUsuarios: boolean,
  possuiDadosProducao: boolean,
  exportando: boolean,
): boolean {
  return !loadingUsuarios
    && estadoProducao === 'success'
    && possuiDadosUsuarios
    && possuiDadosProducao
    && !exportando;
}

export function normalizarExecutores(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}
