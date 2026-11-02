import type { IntervencaoAutoral, SituacaoSugestao } from '@/services/bancodados/intervencoesAutoraisDB';
import { normalizarAcao } from './intervencoesAutorais';
const situacaoSugestao = (item: IntervencaoAutoral) => item.status || 'aguardando';

export interface FiltrosSugestoes {
  status: SituacaoSugestao;
  texto: string;
  autor: string;
  diagnostico: string;
  resultado: string;
  ordem: 'recentes' | 'antigas';
  categoria?: string;
  tipo?: string;
  dimensao?: keyof NonNullable<IntervencaoAutoral['avaliacaoQualidade']> | '';
  classificacao?: string;
}

export function filtrarSugestoes(items: IntervencaoAutoral[], filtros: FiltrosSugestoes) {
  const contem = (valor: string | undefined, busca: string) => normalizarAcao(valor || '').includes(normalizarAcao(busca));
  return items.filter(item =>
    !item.divisao
    &&
    situacaoSugestao(item) === filtros.status
    && (!filtros.categoria || item.categoriaRejeicao === filtros.categoria)
    && (!filtros.tipo || (item.derivacao ? 'derivada' : 'original') === filtros.tipo)
    && (!filtros.dimensao || !filtros.classificacao || item.avaliacaoQualidade?.[filtros.dimensao] === filtros.classificacao)
    && contem(item.textoIntervencao, filtros.texto)
    && contem(item.autorNomeResolvido || item.autorNome, filtros.autor)
    && contem(item.tituloDiagnosticoOrigem, filtros.diagnostico)
    && contem(item.tituloResultadoOrigem || item.tituloResultadoVinculado, filtros.resultado)
  ).sort((a, b) => (filtros.ordem === 'recentes' ? -1 : 1) * ((a.dataCriacao?.toMillis?.() || 0) - (b.dataCriacao?.toMillis?.() || 0)));
}

export function contagensSugestoes(items: IntervencaoAutoral[]) {
  return { aguardando: items.filter(i => !i.divisao && situacaoSugestao(i) === 'aguardando').length,
    aprovada: items.filter(i => situacaoSugestao(i) === 'aprovada').length,
    rejeitada: items.filter(i => situacaoSugestao(i) === 'rejeitada').length };
}

export function sugestoesSemelhantes(item: IntervencaoAutoral, items: IntervencaoAutoral[]) {
  const normalized = normalizarAcao(item.textoIntervencao);
  return items.filter(other => other.id !== item.id && normalizarAcao(other.textoIntervencao) === normalized).length;
}

export function indiceSemelhantes(items: IntervencaoAutoral[]): Map<string, number> {
  const contagens = new Map<string, number>();
  for (const item of items) {
    const chave = normalizarAcao(item.textoIntervencao);
    contagens.set(chave, (contagens.get(chave) || 0) + 1);
  }
  return contagens;
}

export function taxaAprovacao(aprovadas: number, total: number): number | null {
  return total > 0 ? (aprovadas / total) * 100 : null;
}

export function resumoAprovacaoOriginais(items: IntervencaoAutoral[]) {
  const porId = new Map(items.map(item => [item.id, item]));
  const originais = items.filter(item => !item.derivacao);
  let integrais = 0;
  let parciais = 0;
  for (const item of originais) {
    if (!item.divisao) { if (situacaoSugestao(item) === 'aprovada') integrais++; continue; }
    const derivadas = item.divisao.derivadasIds.map(id => porId.get(id));
    const aprovadas = derivadas.filter(derivada => derivada?.status === 'aprovada').length;
    if (aprovadas === derivadas.length && derivadas.length > 0) integrais++;
    else if (aprovadas > 0) parciais++;
  }
  return { total: originais.length, integrais, parciais, taxa: taxaAprovacao(integrais, originais.length) };
}

export interface GrupoSugestoes { chave: string; tipo: 'exata' | 'normalizada' | 'similar'; ocorrencias: IntervencaoAutoral[]; autores: number; diagnosticos: string[]; resultados: string[] }

export function agruparSugestoes(items: IntervencaoAutoral[]): GrupoSugestoes[] {
  const porTexto = new Map<string, IntervencaoAutoral[]>();
  for (const item of items) {
    const chave = normalizarAcao(item.textoIntervencao).replace(/[.,;:!?()]/g, '').replace(/\s+/g, ' ');
    const grupo = porTexto.get(chave) || [];
    grupo.push(item); porTexto.set(chave, grupo);
  }
  const grupos = [...porTexto.entries()].filter(([, ocorrencias]) => ocorrencias.length > 1).map(([chave, ocorrencias]) => ({
    chave, tipo: (new Set(ocorrencias.map(item => item.textoIntervencao)).size === 1 ? 'exata' : 'normalizada') as GrupoSugestoes['tipo'],
    ocorrencias, autores: new Set(ocorrencias.map(item => item.autorId)).size,
    diagnosticos: [...new Set(ocorrencias.map(item => item.tituloDiagnosticoOrigem).filter((valor): valor is string => !!valor))],
    resultados: [...new Set(ocorrencias.map(item => item.tituloResultadoOrigem || item.tituloResultadoVinculado).filter(Boolean))],
  }));
  // Reordenações das mesmas palavras em um mesmo contexto são apenas candidatas
  // textuais. Mantemos a verificação clínica e a decisão individuais.
  const avulsas = [...porTexto.entries()].filter(([, ocorrencias]) => ocorrencias.length === 1);
  const porTokens = new Map<string, IntervencaoAutoral[]>();
  for (const [chave, [item]] of avulsas) {
    const tokens = chave.split(' ').filter(Boolean);
    if (tokens.length < 4) continue;
    const contexto = `${normalizarAcao(item.tituloDiagnosticoOrigem || '')}|${normalizarAcao(item.tituloResultadoOrigem || item.tituloResultadoVinculado)}`;
    const assinatura = `${contexto}|${[...tokens].sort().join(' ')}`;
    const grupo = porTokens.get(assinatura) || [];
    grupo.push(item); porTokens.set(assinatura, grupo);
  }
  for (const ocorrencias of porTokens.values()) if (ocorrencias.length > 1) grupos.push({
    chave: normalizarAcao(ocorrencias[0].textoIntervencao), tipo: 'similar', ocorrencias,
    autores: new Set(ocorrencias.map(item => item.autorId)).size,
    diagnosticos: [...new Set(ocorrencias.map(item => item.tituloDiagnosticoOrigem).filter((valor): valor is string => !!valor))],
    resultados: [...new Set(ocorrencias.map(item => item.tituloResultadoOrigem || item.tituloResultadoVinculado).filter(Boolean))],
  });
  return grupos.sort((a, b) => b.ocorrencias.length - a.ocorrencias.length);
}
