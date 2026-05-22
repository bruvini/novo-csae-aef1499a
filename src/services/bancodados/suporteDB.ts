import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { differenceInHours } from 'date-fns';

// ─── Interfaces ──────────────────────────────────────────────

export interface TicketProblema {
  id?: string;
  usuarioId: string;
  nomeUsuario: string;
  moduloAferido: string;
  descricao: string;
  status: 'Aberto' | 'Resolvido';
  respostaAdmin?: string;
  dataCriacao: Timestamp;
  dataResolucao?: Timestamp;
}

export interface SugestaoMelhoria {
  id?: string;
  usuarioId: string;
  nomeUsuario: string;
  categoria: string;
  descricao: string;
  respostaAdmin?: string;
  dataCriacao: Timestamp;
}

export interface PesquisaNPS {
  id?: string;
  usuarioId: string;
  nomeUsuario: string;
  notaGeral: number;
  notaUsabilidade: number;
  notaPerformance: number;
  comentario?: string;
  dataCriacao: Timestamp;
}

// ─── Tickets ─────────────────────────────────────────────────

export async function buscarMeusTickets(usuarioId: string): Promise<TicketProblema[]> {
  const ref = collection(db, 'tickets_suporte');
  const q = query(ref, where('usuarioId', '==', usuarioId), orderBy('dataCriacao', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as TicketProblema[];
}

export async function buscarTodosTickets(): Promise<TicketProblema[]> {
  const ref = collection(db, 'tickets_suporte');
  const q = query(ref, orderBy('dataCriacao', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as TicketProblema[];
}

export async function salvarTicket(
  data: Omit<TicketProblema, 'id' | 'dataCriacao' | 'dataResolucao' | 'status'>
): Promise<void> {
  const ref = collection(db, 'tickets_suporte');
  await addDoc(ref, {
    ...data,
    status: 'Aberto',
    dataCriacao: serverTimestamp(),
  });
}

export async function responderTicket(ticketId: string, resposta: string): Promise<void> {
  const ref = doc(db, 'tickets_suporte', ticketId);
  await updateDoc(ref, { respostaAdmin: resposta });
}

export async function resolverTicket(ticketId: string, resposta: string): Promise<void> {
  const ref = doc(db, 'tickets_suporte', ticketId);
  await updateDoc(ref, {
    status: 'Resolvido',
    respostaAdmin: resposta,
    dataResolucao: serverTimestamp(), // Obrigatório para cálculo futuro de SLA
  });
}

// ─── Sugestões ───────────────────────────────────────────────

export async function buscarMinhasSugestoes(usuarioId: string): Promise<SugestaoMelhoria[]> {
  const ref = collection(db, 'sugestoes_melhoria');
  const q = query(ref, where('usuarioId', '==', usuarioId), orderBy('dataCriacao', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as SugestaoMelhoria[];
}

export async function buscarTodasSugestoes(): Promise<SugestaoMelhoria[]> {
  const ref = collection(db, 'sugestoes_melhoria');
  const q = query(ref, orderBy('dataCriacao', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as SugestaoMelhoria[];
}

export async function salvarSugestao(
  data: Omit<SugestaoMelhoria, 'id' | 'dataCriacao'>
): Promise<void> {
  const ref = collection(db, 'sugestoes_melhoria');
  await addDoc(ref, { ...data, dataCriacao: serverTimestamp() });
}

export async function responderSugestao(sugestaoId: string, resposta: string): Promise<void> {
  const ref = doc(db, 'sugestoes_melhoria', sugestaoId);
  await updateDoc(ref, { respostaAdmin: resposta });
}

// ─── NPS ─────────────────────────────────────────────────────

/**
 * Verifica se o usuário pode avaliar o portal.
 * Retorna true se elegível, false se já avaliou nas últimas 48h.
 */
export async function verificarElegibilidadeNPS(usuarioId: string): Promise<boolean> {
  const ref = collection(db, 'pesquisas_nps');
  const q = query(
    ref,
    where('usuarioId', '==', usuarioId),
    orderBy('dataCriacao', 'desc'),
    limit(1)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return true;

  const ultimaAvaliacao = snapshot.docs[0].data();
  const dataCriacao: Timestamp = ultimaAvaliacao.dataCriacao;

  // Converter Timestamp do Firestore para Date nativo antes de calcular diferença
  const dataJS = dataCriacao.toDate();
  const horasDecorridas = differenceInHours(new Date(), dataJS);

  return horasDecorridas >= 48;
}

export async function salvarPesquisaNPS(
  data: Omit<PesquisaNPS, 'id' | 'dataCriacao'>
): Promise<void> {
  const elegivel = await verificarElegibilidadeNPS(data.usuarioId);
  if (!elegivel) {
    throw new Error('Você já avaliou o portal nas últimas 48 horas. Tente novamente mais tarde.');
  }

  const ref = collection(db, 'pesquisas_nps');
  await addDoc(ref, { ...data, dataCriacao: serverTimestamp() });
}

export async function buscarAvaliacoesNPS(): Promise<PesquisaNPS[]> {
  const ref = collection(db, 'pesquisas_nps');
  const q = query(ref, orderBy('dataCriacao', 'desc'), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as PesquisaNPS[];
}
