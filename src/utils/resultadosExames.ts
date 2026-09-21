import type { ResultadoExame } from '@/services/bancodados/examesDB';

export type StatusReferencia = 'normal' | 'atencao' | 'alterado' | 'neutro';

export interface ValorTextoRegistrado {
  resultadoClassificatorio: string;
  valorTexto: string;
  rotuloValorTexto?: string;
}

const TEXTOS_INVALIDOS = new Set(['undefined', 'null', 'nan']);

export const formatarValorClinico = (valor: unknown): string | null => {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === 'number' && !Number.isFinite(valor)) return null;
  const texto = String(valor).trim();
  if (!texto || TEXTOS_INVALIDOS.has(texto.toLocaleLowerCase('pt-BR'))) return null;
  return texto;
};

export const formatarResultadoExame = (
  valor: unknown,
  complemento?: ValorTextoRegistrado,
  rotuloCatalogo?: string,
): string | null => {
  const principal = formatarValorClinico(valor);
  if (!principal) return null;

  const valorComplementar = formatarValorClinico(complemento?.valorTexto);
  if (!valorComplementar || complemento?.resultadoClassificatorio !== principal) return principal;

  const rotulo = formatarValorClinico(complemento.rotuloValorTexto)
    || formatarValorClinico(rotuloCatalogo)
    || 'Informação complementar';
  return `${principal} — ${rotulo}: ${valorComplementar}`;
};

export const resolverStatusReferencia = (
  resultado: Pick<ResultadoExame, 'statusReferencia' | 'nomeAlteracao'>,
  isTextoNormal: (texto?: string | null) => boolean,
): StatusReferencia => {
  if (resultado.statusReferencia) return resultado.statusReferencia;
  return isTextoNormal(resultado.nomeAlteracao) ? 'normal' : 'alterado';
};

export const encontrarFaixaNumerica = <T extends { valorMinimo?: number | null; valorMaximo?: number | null }>(
  resultados: T[],
  valor: number,
): T | undefined => resultados.find((resultado) => {
  const minimoOk = resultado.valorMinimo == null || valor >= resultado.valorMinimo;
  const maximoOk = resultado.valorMaximo == null || valor <= resultado.valorMaximo;
  return minimoOk && maximoOk && (resultado.valorMinimo != null || resultado.valorMaximo != null);
});
