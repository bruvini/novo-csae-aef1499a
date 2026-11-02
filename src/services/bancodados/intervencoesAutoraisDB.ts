import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where, type Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Diagnostico } from './rolEnfermagemDB';
import { encontrarResultado, incorporarIntervencao } from '@/utils/intervencoesAutorais';
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
}

export const situacaoSugestao = (item: IntervencaoAutoral): SituacaoSugestao => item.status || 'aguardando';

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

export async function listarSugestoes(): Promise<IntervencaoAutoral[]> {
  const snapshot = await getDocs(collection(db, 'intervencoesAutorais'));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as IntervencaoAutoral);
}

export async function obterSugestao(id: string): Promise<IntervencaoAutoral | null> {
  const snapshot = await getDoc(doc(db, 'intervencoesAutorais', id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } as IntervencaoAutoral : null;
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
    if (situacaoSugestao(sugestao) !== 'aguardando') throw new Error('Sugestão já foi analisada');
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
