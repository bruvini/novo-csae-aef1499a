import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where, type Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Diagnostico } from './rolEnfermagemDB';
import { encontrarResultado, incorporarIntervencao } from '@/utils/intervencoesAutorais';
import { revisarSeparacao } from '@/utils/individualizacaoIntervencoes';
export { identificadorSugestao } from '@/utils/intervencoesAutorais';

export type SituacaoSugestao = 'aguardando' | 'aprovada' | 'rejeitada';
export const categoriasRejeicao = [
  'Já existente no catálogo', 'Outra categoria profissional', 'Não contemplada nos protocolos municipais',
  'Fundamentação insuficiente', 'Incompatível com diagnóstico', 'Incompatível com resultado',
  'Risco à segurança do paciente', 'Redação incompleta', 'Duplicada',
  'Fora do Processo de Enfermagem', 'Outro motivo',
] as const;
export type CategoriaRejeicao = typeof categoriasRejeicao[number];
export interface DestinoIntervencao { diagnosticoId: string; tituloDiagnostico: string; tituloResultado: string }
export interface PreparacaoAprovacao {
  acaoPrescrita: string;
  acaoEnfermeiro: string;
  destinos: DestinoIntervencao[];
  referenciaDeliberacao?: string;
  dataDeliberacao?: string;
  documentoHomologacao?: string;
  responsavelValidacao?: string;
}
export interface AvaliacaoQualidadeIntervencao {
  atomicidadeStatus?: 'unica' | 'multiplas_relacionadas' | 'multiplas_independentes' | 'indeterminada';
  especificidadeNivel?: 'adequada' | 'parcial' | 'insuficiente';
  pertinenciaClinica?: 'pertinente' | 'condicionada' | 'incompativel' | 'indeterminada';
  exequibilidadeNivel?: 'adequada' | 'parcial' | 'insuficiente';
  reavaliabilidadeNivel?: 'adequada' | 'parcial' | 'insuficiente';
  alertasSeguranca?: string[];
  intensidadeRevisao?: 'sem_alteracoes' | 'ajuste_textual' | 'reformulacao_tecnica' | 'desmembramento';
  observacaoTecnica?: string;
  avaliadorId?: string;
  avaliadoEm?: Timestamp;
  versaoCriterios?: string;
}
export interface IntervencaoAutoral {
  id?: string;
  textoIntervencao: string;
  tituloResultadoVinculado: string;
  autorId: string;
  autorNome: string;
  autorNomeResolvido?: string;
  origemStatus?: 'confirmada' | 'ambigua' | 'nao_recuperavel';
  dataCriacao?: Timestamp;
  diagnosticoOrigemId?: string;
  tituloDiagnosticoOrigem?: string;
  tituloResultadoOrigem?: string;
  identificadorSugestao?: string;
  status?: SituacaoSugestao;
  preparacao?: PreparacaoAprovacao;
  categoriaRejeicao?: CategoriaRejeicao;
  justificativaRejeicao?: string;
  avaliadorId?: string;
  avaliadorNome?: string;
  dataDecisao?: Timestamp;
  ultimaDecisaoId?: string;
  divisao?: { grupoId: string; derivadasIds: string[]; revisorId: string; revisorNome: string; dataHora: Timestamp };
  derivacao?: { originalId: string; grupoId: string; ordem: number; revisorId: string; dataHora: Timestamp };
  tipoRegistro?: 'derivada';
  avaliacaoQualidade?: AvaliacaoQualidadeIntervencao;
}

export const situacaoSugestao = (item: IntervencaoAutoral): SituacaoSugestao => item.status || 'aguardando';

/** O original permanece imutável; cada derivada recebe revisão independente. */
export async function desmembrarSugestao(id: string, textos: string[], revisorId: string, revisorNome: string): Promise<string[]> {
  const acoes = revisarSeparacao(textos);
  if (acoes.length > 5) throw new Error('Desmembre até cinco intervenções por operação.');
  if (!revisorId || !revisorNome) throw new Error('Revisor não identificado.');
  const originalRef = doc(db, 'intervencoesAutorais', id);
  const ids = acoes.map((_, index) => `${id}-d${index + 1}`);
  if (ids.some(childId => childId.length > 128)) throw new Error('Identificador da sugestão original excede o limite.');
  const childRefs = ids.map(childId => doc(db, 'intervencoesAutorais', childId));
  const auditRef = doc(collection(db, 'decisoesIntervencoes'));
  await runTransaction(db, async tx => {
    const originalSnap = await tx.get(originalRef);
    if (!originalSnap.exists()) throw new Error('Sugestão original não encontrada.');
    const original = originalSnap.data() as IntervencaoAutoral;
    if (situacaoSugestao(original) !== 'aguardando' || original.divisao || original.derivacao) throw new Error('Sugestão já analisada ou desmembrada.');
    const existing = [];
    for (const ref of childRefs) existing.push(await tx.get(ref));
    if (existing.some(snapshot => snapshot.exists())) throw new Error('Já existe uma proposta derivada.');
    tx.update(originalRef, { divisao: { grupoId: id, derivadasIds: ids, revisorId, revisorNome, dataHora: serverTimestamp() }, ultimaDecisaoId: auditRef.id });
    acoes.forEach((textoIntervencao, index) => tx.set(childRefs[index], {
      textoIntervencao, tituloResultadoVinculado: original.tituloResultadoVinculado || '',
      tituloResultadoOrigem: original.tituloResultadoOrigem || '',
      diagnosticoOrigemId: original.diagnosticoOrigemId || '',
      tituloDiagnosticoOrigem: original.tituloDiagnosticoOrigem || '',
      autorId: original.autorId, autorNome: original.autorNome,
      ...(original.autorNomeResolvido ? { autorNomeResolvido: original.autorNomeResolvido } : {}),
      status: 'aguardando', tipoRegistro: 'derivada', dataCriacao: serverTimestamp(),
      derivacao: { originalId: id, grupoId: id, ordem: index + 1, revisorId, dataHora: serverTimestamp() },
    }));
    tx.set(auditRef, { sugestaoId: id, statusAnterior: 'aguardando', statusNovo: 'aguardando', tipo: 'desmembrar', avaliadorId: revisorId, destinos: [], justificativa: '', dataHora: serverTimestamp() });
  });
  return ids;
}

export async function salvarAvaliacaoQualidade(id: string, avaliacao: AvaliacaoQualidadeIntervencao, avaliadorId: string) {
  if (!avaliadorId) throw new Error('Avaliador não identificado.');
  const sugestaoRef = doc(db, 'intervencoesAutorais', id);
  const auditRef = doc(collection(db, 'decisoesIntervencoes'));
  await runTransaction(db, async tx => {
    const snapshot = await tx.get(sugestaoRef);
    if (!snapshot.exists()) throw new Error('Sugestão não encontrada.');
    const atual = snapshot.data() as IntervencaoAutoral;
    const novo = { ...avaliacao, avaliadorId, avaliadoEm: serverTimestamp(), versaoCriterios: 'experimental-v1' };
    tx.update(sugestaoRef, { avaliacaoQualidade: novo, ultimaDecisaoId: auditRef.id });
    tx.set(auditRef, { sugestaoId: id, statusAnterior: situacaoSugestao(atual), statusNovo: situacaoSugestao(atual), tipo: 'avaliar', avaliadorId, destinos: [], justificativa: '', dataHora: serverTimestamp() });
  });
}

/** ID estável e transação impedem reenvio de uma sugestão já analisada. */
export async function salvarIntervencoesAutorais(intervencoes: IntervencaoAutoral[]): Promise<void> {
  for (const item of intervencoes) {
    if (!item.identificadorSugestao || !item.autorId) throw new Error('Sugestão sem identificador ou autor');
    await runTransaction(db, async tx => {
      const ref = doc(db, 'intervencoesAutorais', item.identificadorSugestao!);
      if ((await tx.get(ref)).exists()) return;
      tx.set(ref, {
        textoIntervencao: item.textoIntervencao,
        tituloResultadoVinculado: item.tituloResultadoVinculado,
        tituloResultadoOrigem: item.tituloResultadoOrigem || '',
        diagnosticoOrigemId: item.diagnosticoOrigemId || '',
        tituloDiagnosticoOrigem: item.tituloDiagnosticoOrigem || '',
        autorId: item.autorId, autorNome: item.autorNome,
        ...(item.autorNomeResolvido ? { autorNomeResolvido: item.autorNomeResolvido } : {}),
        origemStatus: item.diagnosticoOrigemId ? 'confirmada' : 'nao_recuperavel',
        identificadorSugestao: item.identificadorSugestao,
        status: 'aguardando', dataCriacao: serverTimestamp(),
      });
    });
  }
}

const chavePendencias = (uid: string) => `csae-sugestoes-pendentes-${uid}`;
export async function reprocessarSugestoesPendentes(uid: string): Promise<void> {
  if (!uid) return;
  const pendentes = JSON.parse(localStorage.getItem(chavePendencias(uid)) || '[]') as IntervencaoAutoral[];
  if (!pendentes.length) return;
  await salvarIntervencoesAutorais(pendentes);
  localStorage.removeItem(chavePendencias(uid));
}

/** Fila local de retentativa: não inclui paciente nem prontuário. */
export async function encaminharSugestoes(intervencoes: IntervencaoAutoral[], uid: string): Promise<void> {
  const chave = chavePendencias(uid);
  const anteriores = JSON.parse(localStorage.getItem(chave) || '[]') as IntervencaoAutoral[];
  const porId = new Map([...anteriores, ...intervencoes].map(item => [item.identificadorSugestao, item]));
  const pendentes = [...porId.values()];
  localStorage.setItem(chave, JSON.stringify(pendentes));
  await salvarIntervencoesAutorais(pendentes);
  localStorage.removeItem(chave);
}

let cacheSugestoes: { dados: IntervencaoAutoral[]; atualizadoEm: number } | null = null;
let leituraSugestoes: Promise<IntervencaoAutoral[]> | null = null;
export async function listarSugestoes(): Promise<IntervencaoAutoral[]> {
  if (cacheSugestoes && Date.now() - cacheSugestoes.atualizadoEm < 120_000) return cacheSugestoes.dados;
  if (leituraSugestoes) return leituraSugestoes;
  leituraSugestoes = getDocs(collection(db, 'intervencoesAutorais'))
    .then(snapshot => {
      const dados = snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as IntervencaoAutoral);
      cacheSugestoes = { dados, atualizadoEm: Date.now() };
      return dados;
    }).finally(() => { leituraSugestoes = null; });
  return leituraSugestoes;
}

export async function obterSugestao(id: string): Promise<IntervencaoAutoral | null> {
  const snapshot = await getDoc(doc(db, 'intervencoesAutorais', id));
  const item = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as IntervencaoAutoral : null;
  if (item && cacheSugestoes) {
    const index = cacheSugestoes.dados.findIndex(existing => existing.id === id);
    const dados = [...cacheSugestoes.dados];
    if (index >= 0) dados[index] = item;
    else dados.push(item);
    cacheSugestoes = { dados, atualizadoEm: Date.now() };
  }
  return item;
}

function validarPreparacao(preparacao: PreparacaoAprovacao | undefined, homologada: boolean) {
  if (!preparacao?.acaoPrescrita.trim() || !preparacao.acaoEnfermeiro.trim() || !preparacao.destinos.length) {
    throw new Error('Preencha as duas ações e selecione ao menos um resultado esperado.');
  }
  if (preparacao.destinos.length > 5 || new Set(preparacao.destinos.map(d => `${d.diagnosticoId}|${d.tituloResultado}`)).size !== preparacao.destinos.length) {
    throw new Error('Destinos repetidos ou acima do limite de cinco.');
  }
  if (homologada && (!preparacao.referenciaDeliberacao?.trim() || !preparacao.dataDeliberacao || !preparacao.documentoHomologacao?.trim() || !preparacao.responsavelValidacao?.trim())) {
    throw new Error('Informe todos os dados da homologação institucional.');
  }
}

/** Todas as leituras precedem as escritas; a transação detecta alterações concorrentes. */
export async function decidirSugestao(
  id: string, decisao: 'preparar' | 'rejeitar' | 'publicar', avaliadorId: string, avaliadorNome: string,
  dados: { preparacao?: PreparacaoAprovacao; categoria?: CategoriaRejeicao; justificativa?: string },
) {
  if (!avaliadorId || !avaliadorNome) throw new Error('Avaliador não identificado');
  if (decisao === 'rejeitar' && (!dados.categoria || !dados.justificativa?.trim())) throw new Error('Categoria e justificativa são obrigatórias.');
  if (decisao !== 'rejeitar') validarPreparacao(dados.preparacao, decisao === 'publicar');
  const sugestaoRef = doc(db, 'intervencoesAutorais', id);
  const auditRef = doc(collection(db, 'decisoesIntervencoes'));
  const destinos = decisao === 'publicar' ? dados.preparacao!.destinos : [];
  const refs = [...new Set(destinos.map(destino => destino.diagnosticoId))].map(diagnosticoId => doc(db, 'rolEnfermagem', diagnosticoId));
  await runTransaction(db, async tx => {
    const sugestaoSnap = await tx.get(sugestaoRef);
    if (!sugestaoSnap.exists()) throw new Error('Sugestão não encontrada');
    const sugestao = sugestaoSnap.data() as IntervencaoAutoral;
    if (situacaoSugestao(sugestao) !== 'aguardando' || sugestao.divisao) throw new Error('Sugestão já foi analisada ou desmembrada');
    const catalogoSnaps = [];
    for (const ref of refs) catalogoSnaps.push(await tx.get(ref));
    const statusNovo: SituacaoSugestao = decisao === 'publicar' ? 'aprovada' : decisao === 'rejeitar' ? 'rejeitada' : 'aguardando';
    if (decisao === 'publicar') {
      for (const snap of catalogoSnaps) {
        if (!snap.exists()) throw new Error('Diagnóstico de destino inexistente');
        const diagnostico = { id: snap.id, ...snap.data() } as Diagnostico;
        const resultadosEsperados = incorporarIntervencao(diagnostico, destinos.filter(d => d.diagnosticoId === snap.id).map(d => d.tituloResultado), dados.preparacao!.acaoPrescrita.trim(), dados.preparacao!.acaoEnfermeiro.trim());
        for (const destino of destinos.filter(d => d.diagnosticoId === snap.id)) {
          if (destino.tituloDiagnostico !== diagnostico.tituloDiagnostico) throw new Error('Diagnóstico alterado desde a seleção');
          encontrarResultado(diagnostico, destino.tituloResultado);
        }
        tx.update(snap.ref, { resultadosEsperados, ultimaSugestaoPublicada: id });
      }
    }
    const base = { status: statusNovo, avaliadorId, avaliadorNome, dataDecisao: serverTimestamp(), ultimaDecisaoId: auditRef.id };
    tx.update(sugestaoRef, decisao === 'rejeitar'
      ? { ...base, categoriaRejeicao: dados.categoria, justificativaRejeicao: dados.justificativa!.trim() }
      : { ...base, preparacao: dados.preparacao });
    tx.set(auditRef, { sugestaoId: id, statusAnterior: 'aguardando', statusNovo, tipo: decisao, avaliadorId, destinos, justificativa: dados.justificativa?.trim() || '', dataHora: serverTimestamp() });
  });
}

export async function listarDecisoes(sugestaoId: string) {
  const snapshot = await getDocs(query(collection(db, 'decisoesIntervencoes'), where('sugestaoId', '==', sugestaoId)));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; sugestaoId: string; tipo: string; avaliadorId: string; dataHora: Timestamp }));
}
