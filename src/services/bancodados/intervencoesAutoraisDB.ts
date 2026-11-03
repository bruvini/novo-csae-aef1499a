import { arrayUnion, collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where, type Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Diagnostico } from './rolEnfermagemDB';
import { encontrarResultado } from '@/utils/intervencoesAutorais';
import { revisarSeparacao } from '@/utils/individualizacaoIntervencoes';
import { validarPreparacao, type DestinoIntervencao, type ModoDisponibilidadeIntervencao, type PreparacaoAprovacao } from '@/utils/intervencoesBiblioteca';
export { identificadorSugestao } from '@/utils/intervencoesAutorais';
export { validarPreparacao } from '@/utils/intervencoesBiblioteca';
export type { DestinoIntervencao, ModoDisponibilidadeIntervencao, PreparacaoAprovacao } from '@/utils/intervencoesBiblioteca';

export type SituacaoSugestao = 'aguardando' | 'aprovada' | 'rejeitada';
export const categoriasRejeicao = [
  'Já existente no catálogo', 'Outra categoria profissional', 'Não contemplada nos protocolos municipais',
  'Fundamentação insuficiente', 'Incompatível com diagnóstico', 'Incompatível com resultado',
  'Risco à segurança do paciente', 'Redação incompleta', 'Duplicada',
  'Fora do Processo de Enfermagem', 'Outro motivo',
] as const;
export type CategoriaRejeicao = typeof categoriasRejeicao[number];
export interface IntervencaoBiblioteca {
  id: string;
  acaoPrescrita: string;
  acaoEnfermeiro: string;
  materiaisDeApoio: Array<{ tituloMaterialApoio: string; urlMaterialApoio: string }>;
  modoDisponibilidade: ModoDisponibilidadeIntervencao;
  destinos: DestinoIntervencao[];
  status: 'preparando' | 'disponivel';
  versao: number;
  sugestoesOrigemIds: string[];
  grupoOperacaoId?: string;
  criadoPorUid: string;
  criadoPorNome: string;
  criadoEm: Timestamp;
  publicadoEm?: Timestamp;
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
  intervencaoBibliotecaId?: string;
  grupoOperacaoId?: string;
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
    tx.set(auditRef, { sugestaoId: id, statusAnterior: situacaoSugestao(atual), statusNovo: situacaoSugestao(atual), tipo: 'avaliar', avaliadorId, destinos: [], justificativa: '', avaliacaoQualidade: novo, dataHora: serverTimestamp() });
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

const modoDaPreparacao = (preparacao: PreparacaoAprovacao): ModoDisponibilidadeIntervencao => preparacao.modoDisponibilidade || 'resultados_especificos';

function conferirDestinosNoCatalogo(destinos: DestinoIntervencao[], catalogos: Map<string, Diagnostico>) {
  for (const destino of destinos) {
    const diagnostico = catalogos.get(destino.diagnosticoId);
    if (!diagnostico) throw new Error('Diagnóstico de destino inexistente. Atualize o catálogo e tente novamente.');
    if (diagnostico.tituloDiagnostico !== destino.tituloDiagnostico) throw new Error('O diagnóstico mudou desde a seleção. Revise os destinos.');
    const resultado = destino.resultadoIndice === undefined
      ? encontrarResultado(diagnostico, destino.tituloResultado)
      : diagnostico.resultadosEsperados[destino.resultadoIndice];
    if (!resultado || resultado.tituloResultado !== destino.tituloResultado) throw new Error('Um resultado esperado mudou desde a seleção. Revise os destinos.');
  }
}

function criarPublicacao(destinos: DestinoIntervencao[], preparacao: PreparacaoAprovacao, idsOrigem: string[], uid: string, nome: string, grupoOperacaoId?: string) {
  return {
    acaoPrescrita: preparacao.acaoPrescrita.trim(),
    acaoEnfermeiro: preparacao.acaoEnfermeiro.trim(),
    materiaisDeApoio: (preparacao.materiaisDeApoio || []).map(item => ({ tituloMaterialApoio: item.tituloMaterialApoio.trim(), urlMaterialApoio: item.urlMaterialApoio.trim() })),
    modoDisponibilidade: modoDaPreparacao(preparacao),
    destinos,
    status: 'disponivel' as const,
    versao: 1,
    sugestoesOrigemIds: idsOrigem,
    ...(grupoOperacaoId ? { grupoOperacaoId } : {}),
    criadoPorUid: uid,
    criadoPorNome: nome,
    criadoEm: serverTimestamp(),
    publicadoEm: serverTimestamp(),
  };
}

/** As sugestões novas apontam para uma publicação canônica; o catálogo clínico não recebe cópias em massa. */
export async function listarIntervencoesBiblioteca(): Promise<IntervencaoBiblioteca[]> {
  const snapshot = await getDocs(query(collection(db, 'intervencoesBiblioteca'), where('status', '==', 'disponivel')));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as IntervencaoBiblioteca);
}

/** A transação publica a referência canônica, decisão e auditoria em conjunto. */
export async function decidirSugestao(
  id: string, decisao: 'preparar' | 'rejeitar' | 'publicar', avaliadorId: string, avaliadorNome: string,
  dados: { preparacao?: PreparacaoAprovacao; categoria?: CategoriaRejeicao; justificativa?: string },
) {
  if (!avaliadorId || !avaliadorNome.trim()) throw new Error('Avaliador não identificado.');
  if (decisao === 'rejeitar' && (!dados.categoria || !dados.justificativa?.trim())) throw new Error('Categoria e justificativa são obrigatórias.');
  if (decisao !== 'rejeitar') validarPreparacao(dados.preparacao);
  const sugestaoRef = doc(db, 'intervencoesAutorais', id);
  const auditRef = doc(collection(db, 'decisoesIntervencoes'));
  const bibliotecaId = `sugestao-${id}`;
  const bibliotecaRef = doc(db, 'intervencoesBiblioteca', bibliotecaId);
  const destinos = decisao === 'publicar' && modoDaPreparacao(dados.preparacao!) === 'resultados_especificos' ? dados.preparacao!.destinos : [];
  const catalogoRefs = [...new Set(destinos.map(destino => destino.diagnosticoId))].map(diagnosticoId => doc(db, 'rolEnfermagem', diagnosticoId));
  await runTransaction(db, async tx => {
    const sugestaoSnap = await tx.get(sugestaoRef);
    if (!sugestaoSnap.exists()) throw new Error('Sugestão não encontrada.');
    const sugestao = sugestaoSnap.data() as IntervencaoAutoral;
    if (situacaoSugestao(sugestao) !== 'aguardando' || sugestao.divisao || sugestao.derivacao && sugestao.grupoOperacaoId) throw new Error('Sugestão já foi analisada ou está vinculada a outra operação.');
    const catalogos = new Map<string, Diagnostico>();
    for (const ref of catalogoRefs) {
      const snap = await tx.get(ref);
      if (snap.exists()) catalogos.set(snap.id, { id: snap.id, ...snap.data() } as Diagnostico);
    }
    if (decisao === 'publicar') {
      const existente = await tx.get(bibliotecaRef);
      if (existente.exists()) throw new Error('Já existe uma publicação canônica para esta sugestão. Atualize a lista e confira o estado da decisão.');
      conferirDestinosNoCatalogo(destinos, catalogos);
      tx.set(bibliotecaRef, criarPublicacao(destinos, dados.preparacao!, [id], avaliadorId, avaliadorNome));
    }
    const statusNovo: SituacaoSugestao = decisao === 'publicar' ? 'aprovada' : decisao === 'rejeitar' ? 'rejeitada' : 'aguardando';
    const base = { status: statusNovo, avaliadorId, avaliadorNome: avaliadorNome.trim(), dataDecisao: serverTimestamp(), ultimaDecisaoId: auditRef.id };
    tx.update(sugestaoRef, decisao === 'rejeitar'
      ? { ...base, categoriaRejeicao: dados.categoria, justificativaRejeicao: dados.justificativa!.trim() }
      : decisao === 'preparar' ? { ...base, preparacao: dados.preparacao }
        : { ...base, preparacao: dados.preparacao, intervencaoBibliotecaId: bibliotecaId });
    tx.set(auditRef, { sugestaoId: id, statusAnterior: 'aguardando', statusNovo, tipo: decisao, avaliadorId, destinos, ...(decisao === 'publicar' ? { intervencaoBibliotecaId: bibliotecaId } : {}), justificativa: dados.justificativa?.trim() || '', dataHora: serverTimestamp() });
  });
}

function sha256(value: string): Promise<string> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)).then(hash => Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join(''));
}

export async function decidirSugestoesEmGrupo(
  idsEntrada: string[], decisao: 'publicar' | 'rejeitar', avaliadorId: string, avaliadorNome: string,
  dados: { preparacao?: PreparacaoAprovacao; categoria?: CategoriaRejeicao; justificativa?: string },
  progresso: (concluidas: number, total: number) => void = () => undefined,
) {
  const ids = [...new Set(idsEntrada)].sort();
  if (ids.length < 2 || ids.length > 100) throw new Error('Selecione de 2 a 100 sugestões pendentes para uma operação em grupo.');
  if (!avaliadorId || !avaliadorNome.trim()) throw new Error('Avaliador não identificado.');
  if (decisao === 'rejeitar' && (!dados.categoria || !dados.justificativa?.trim())) throw new Error('Categoria e justificativa são obrigatórias.');
  if (decisao === 'publicar') validarPreparacao(dados.preparacao);
  const operacaoId = `grupo-${(await sha256(JSON.stringify([ids, decisao, decisao === 'publicar' ? dados.preparacao : [dados.categoria, dados.justificativa]]))).slice(0, 48)}`;
  const operacaoRef = doc(db, 'operacoesDecisoesIntervencoes', operacaoId);
  const bibliotecaId = `operacao-${operacaoId}`;
  const bibliotecaRef = doc(db, 'intervencoesBiblioteca', bibliotecaId);
  const destinos = decisao === 'publicar' && modoDaPreparacao(dados.preparacao!) === 'resultados_especificos' ? dados.preparacao!.destinos : [];
  const catalogoRefs = [...new Set(destinos.map(destino => destino.diagnosticoId))].map(diagnosticoId => doc(db, 'rolEnfermagem', diagnosticoId));
  await runTransaction(db, async tx => {
    const [operacaoSnap, ...sugestoes] = await Promise.all([tx.get(operacaoRef), ...ids.map(id => tx.get(doc(db, 'intervencoesAutorais', id)))]);
    if (sugestoes.some(item => !item.exists())) throw new Error('Uma sugestão do grupo não existe. Atualize a fila.');
    const dadosSugestoes = sugestoes.map(item => item.data() as IntervencaoAutoral);
    if (operacaoSnap.exists()) {
      const existente = operacaoSnap.data();
      if (JSON.stringify(existente.sugestaoIds) !== JSON.stringify(ids) || existente.tipo !== decisao) throw new Error('O identificador da operação já está associado a outro conjunto.');
      if (existente.status === 'concluida') return;
      if (dadosSugestoes.some(item => situacaoSugestao(item) !== 'aguardando' && item.grupoOperacaoId !== operacaoId)) throw new Error('Uma sugestão já recebeu decisão concorrente; o grupo não foi alterado.');
      return;
    }
    if (dadosSugestoes.some(item => situacaoSugestao(item) !== 'aguardando' || item.divisao)) throw new Error('O grupo contém sugestões que já não estão pendentes. Atualize a fila.');
    const catalogos = new Map<string, Diagnostico>();
    for (const ref of catalogoRefs) {
      const snap = await tx.get(ref);
      if (snap.exists()) catalogos.set(snap.id, { id: snap.id, ...snap.data() } as Diagnostico);
    }
    if (decisao === 'publicar') {
      conferirDestinosNoCatalogo(destinos, catalogos);
      tx.set(bibliotecaRef, { ...criarPublicacao(destinos, dados.preparacao!, ids, avaliadorId, avaliadorNome, operacaoId), status: 'preparando', publicadoEm: null });
    }
    tx.set(operacaoRef, { tipo: decisao, status: 'preparando', sugestaoIds: ids, concluidasIds: [], ...(decisao === 'publicar' ? { intervencaoBibliotecaId: bibliotecaId } : { categoria: dados.categoria, justificativa: dados.justificativa!.trim() }), criadoPorUid: avaliadorId, criadoPorNome: avaliadorNome.trim(), criadoEm: serverTimestamp() });
  });
  const operacaoInicial = await getDoc(operacaoRef);
  if (!operacaoInicial.exists()) return { operacaoId, bibliotecaId, concluida: true, total: ids.length };
  if (operacaoInicial.data().status === 'concluida') return { operacaoId, bibliotecaId: decisao === 'publicar' ? bibliotecaId : undefined, concluida: true, total: ids.length };
  let concluidas = (operacaoInicial.data().concluidasIds || []) as string[];
  progresso(concluidas.length, ids.length);
  for (const id of ids) {
    if (concluidas.includes(id)) continue;
    const sugestaoRef = doc(db, 'intervencoesAutorais', id);
    const auditRef = doc(collection(db, 'decisoesIntervencoes'));
    await runTransaction(db, async tx => {
      const [operacaoSnap, sugestaoSnap] = await Promise.all([tx.get(operacaoRef), tx.get(sugestaoRef)]);
      if (!operacaoSnap.exists() || !sugestaoSnap.exists()) throw new Error('Operação ou sugestão não encontrada; execute novamente para retomar com segurança.');
      const operacao = operacaoSnap.data();
      const sugestao = sugestaoSnap.data() as IntervencaoAutoral;
      if (operacao.status !== 'preparando' || !operacao.sugestaoIds.includes(id)) throw new Error('A operação em grupo não corresponde à sugestão.');
      if (situacaoSugestao(sugestao) !== 'aguardando') {
        if (sugestao.grupoOperacaoId !== operacaoId || sugestao.status !== (decisao === 'publicar' ? 'aprovada' : 'rejeitada')) throw new Error('A sugestão foi decidida por outra operação. As demais permanecem sem alteração.');
        tx.update(operacaoRef, { concluidasIds: arrayUnion(id) });
        return;
      }
      const statusNovo: SituacaoSugestao = decisao === 'publicar' ? 'aprovada' : 'rejeitada';
      tx.update(sugestaoRef, decisao === 'publicar'
        ? { status: statusNovo, avaliadorId, avaliadorNome: avaliadorNome.trim(), dataDecisao: serverTimestamp(), ultimaDecisaoId: auditRef.id, preparacao: dados.preparacao, intervencaoBibliotecaId: bibliotecaId, grupoOperacaoId: operacaoId }
        : { status: statusNovo, avaliadorId, avaliadorNome: avaliadorNome.trim(), dataDecisao: serverTimestamp(), ultimaDecisaoId: auditRef.id, categoriaRejeicao: dados.categoria, justificativaRejeicao: dados.justificativa!.trim(), grupoOperacaoId: operacaoId });
      tx.set(auditRef, { sugestaoId: id, statusAnterior: 'aguardando', statusNovo, tipo: decisao === 'publicar' ? 'publicar_grupo' : 'rejeitar_grupo', avaliadorId, destinos, justificativa: dados.justificativa?.trim() || '', grupoOperacaoId: operacaoId, idsAfetados: ids, ...(decisao === 'publicar' ? { intervencaoBibliotecaId: bibliotecaId } : {}), dataHora: serverTimestamp() });
      tx.update(operacaoRef, { concluidasIds: arrayUnion(id) });
    });
    concluidas = [...new Set([...concluidas, id])];
    progresso(concluidas.length, ids.length);
  }
  const sugestaoFinais = await Promise.all(ids.map(obterSugestao));
  if (sugestaoFinais.some(item => !item || item.grupoOperacaoId !== operacaoId || item.status !== (decisao === 'publicar' ? 'aprovada' : 'rejeitada'))) {
    throw new Error('A operação ficou parcial. Nenhuma publicação compartilhada foi ativada; tente novamente para retomar.');
  }
  await runTransaction(db, async tx => {
    const operacaoSnap = await tx.get(operacaoRef);
    if (!operacaoSnap.exists() || ids.some(id => !operacaoSnap.data().concluidasIds?.includes(id))) throw new Error('Não foi possível confirmar todas as decisões do grupo.');
    if (decisao === 'publicar') {
      const bibliotecaSnap = await tx.get(bibliotecaRef);
      if (!bibliotecaSnap.exists()) throw new Error('Publicação do grupo não encontrada.');
      tx.update(bibliotecaRef, { status: 'disponivel', publicadoEm: serverTimestamp() });
    }
    tx.update(operacaoRef, { status: 'concluida', concluidaEm: serverTimestamp() });
  });
  return { operacaoId, bibliotecaId: decisao === 'publicar' ? bibliotecaId : undefined, concluida: true, total: ids.length };
}

export async function listarDecisoes(sugestaoId: string) {
  const snapshot = await getDocs(query(collection(db, 'decisoesIntervencoes'), where('sugestaoId', '==', sugestaoId)));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as { id: string; sugestaoId: string; tipo: string; avaliadorId: string; dataHora: Timestamp; avaliacaoQualidade?: AvaliacaoQualidadeIntervencao }));
}
