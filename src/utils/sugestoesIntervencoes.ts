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
}

export function filtrarSugestoes(items: IntervencaoAutoral[], filtros: FiltrosSugestoes) {
  const contem = (valor: string | undefined, busca: string) => normalizarAcao(valor || '').includes(normalizarAcao(busca));
  return items.filter(item =>
    situacaoSugestao(item) === filtros.status
    && contem(item.textoIntervencao, filtros.texto)
    && contem(item.autorNome, filtros.autor)
    && contem(item.tituloDiagnosticoOrigem, filtros.diagnostico)
    && contem(item.tituloResultadoOrigem || item.tituloResultadoVinculado, filtros.resultado)
  ).sort((a, b) => (filtros.ordem === 'recentes' ? -1 : 1) * ((a.dataCriacao?.toMillis?.() || 0) - (b.dataCriacao?.toMillis?.() || 0)));
}

export function contagensSugestoes(items: IntervencaoAutoral[]) {
  return { aguardando: items.filter(i => situacaoSugestao(i) === 'aguardando').length,
    aprovada: items.filter(i => situacaoSugestao(i) === 'aprovada').length,
    rejeitada: items.filter(i => situacaoSugestao(i) === 'rejeitada').length };
}

export function sugestoesSemelhantes(item: IntervencaoAutoral, items: IntervencaoAutoral[]) {
  const normalized = normalizarAcao(item.textoIntervencao);
  return items.filter(other => other.id !== item.id && normalizarAcao(other.textoIntervencao) === normalized).length;
}
