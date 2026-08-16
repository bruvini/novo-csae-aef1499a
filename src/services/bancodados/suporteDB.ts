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
  onSnapshot,
  writeBatch,
  type Unsubscribe,
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
  visualizadoPeloSuporte?: boolean;
  dataVisualizacaoSuporte?: Timestamp;
  respostaVisualizadaPeloUsuario?: boolean;
  dataRespostaAdmin?: Timestamp;
  dataVisualizacaoResposta?: Timestamp;
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
  visualizadoPeloSuporte?: boolean;
  dataVisualizacaoSuporte?: Timestamp;
  respostaVisualizadaPeloUsuario?: boolean;
  dataRespostaAdmin?: Timestamp;
  dataVisualizacaoResposta?: Timestamp;
  dataCriacao: Timestamp;
}

export interface ContagemNotificacoesSuporte {
  tickets: number;
  sugestoes: number;
  total: number;
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
    visualizadoPeloSuporte: false,
    dataCriacao: serverTimestamp(),
  });
}

export async function responderTicket(ticketId: string, resposta: string): Promise<void> {
  const ref = doc(db, 'tickets_suporte', ticketId);
  await updateDoc(ref, {
    respostaAdmin: resposta,
    visualizadoPeloSuporte: true,
    respostaVisualizadaPeloUsuario: false,
    dataRespostaAdmin: serverTimestamp(),
  });
}

export async function resolverTicket(ticketId: string, resposta: string): Promise<void> {
  const ref = doc(db, 'tickets_suporte', ticketId);
  await updateDoc(ref, {
    status: 'Resolvido',
    respostaAdmin: resposta,
    visualizadoPeloSuporte: true,
    respostaVisualizadaPeloUsuario: false,
    dataRespostaAdmin: serverTimestamp(),
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
  await addDoc(ref, {
    ...data,
    visualizadoPeloSuporte: false,
    dataCriacao: serverTimestamp(),
  });
}

export async function responderSugestao(sugestaoId: string, resposta: string): Promise<void> {
  const ref = doc(db, 'sugestoes_melhoria', sugestaoId);
  await updateDoc(ref, {
    respostaAdmin: resposta,
    visualizadoPeloSuporte: true,
    respostaVisualizadaPeloUsuario: false,
    dataRespostaAdmin: serverTimestamp(),
  });
}

// ─── Notificações de suporte ────────────────────────────────

const criarContagem = (tickets: number, sugestoes: number): ContagemNotificacoesSuporte => ({
  tickets,
  sugestoes,
  total: tickets + sugestoes,
});

export function observarRespostasNaoVisualizadas(
  usuarioId: string,
  callback: (contagem: ContagemNotificacoesSuporte) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let tickets = 0;
  let sugestoes = 0;

  const notificar = () => callback(criarContagem(tickets, sugestoes));
  const tratarErro = (error: Error) => onError?.(error);

  const ticketsQuery = query(
    collection(db, 'tickets_suporte'),
    where('usuarioId', '==', usuarioId)
  );
  const sugestoesQuery = query(
    collection(db, 'sugestoes_melhoria'),
    where('usuarioId', '==', usuarioId)
  );

  const cancelarTickets = onSnapshot(ticketsQuery, (snapshot) => {
    tickets = snapshot.docs.filter((documento) => {
      const ticket = documento.data() as TicketProblema;
      return Boolean(ticket.respostaAdmin?.trim()) && ticket.respostaVisualizadaPeloUsuario !== true;
    }).length;
    notificar();
  }, tratarErro);

  const cancelarSugestoes = onSnapshot(sugestoesQuery, (snapshot) => {
    sugestoes = snapshot.docs.filter((documento) => {
      const sugestao = documento.data() as SugestaoMelhoria;
      return Boolean(sugestao.respostaAdmin?.trim()) && sugestao.respostaVisualizadaPeloUsuario !== true;
    }).length;
    notificar();
  }, tratarErro);

  return () => {
    cancelarTickets();
    cancelarSugestoes();
  };
}

export function observarItensNovosSuporte(
  callback: (contagem: ContagemNotificacoesSuporte) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  let tickets = 0;
  let sugestoes = 0;

  const notificar = () => callback(criarContagem(tickets, sugestoes));
  const tratarErro = (error: Error) => onError?.(error);

  const cancelarTickets = onSnapshot(
    query(collection(db, 'tickets_suporte'), where('visualizadoPeloSuporte', '==', false)),
    (snapshot) => {
      tickets = snapshot.size;
      notificar();
    },
    tratarErro
  );

  const cancelarSugestoes = onSnapshot(
    query(collection(db, 'sugestoes_melhoria'), where('visualizadoPeloSuporte', '==', false)),
    (snapshot) => {
      sugestoes = snapshot.size;
      notificar();
    },
    tratarErro
  );

  return () => {
    cancelarTickets();
    cancelarSugestoes();
  };
}

async function marcarDocumentosComoVisualizados(
  colecao: 'tickets_suporte' | 'sugestoes_melhoria',
  ids: string[],
  dados: Record<string, unknown>
): Promise<void> {
  const idsUnicos = [...new Set(ids.filter(Boolean))];

  for (let inicio = 0; inicio < idsUnicos.length; inicio += 450) {
    const batch = writeBatch(db);
    idsUnicos.slice(inicio, inicio + 450).forEach((id) => {
      batch.update(doc(db, colecao, id), dados);
    });
    await batch.commit();
  }
}

export async function marcarTicketsComoVisualizadosPeloUsuario(ids: string[]): Promise<void> {
  await marcarDocumentosComoVisualizados('tickets_suporte', ids, {
    respostaVisualizadaPeloUsuario: true,
    dataVisualizacaoResposta: serverTimestamp(),
  });
}

export async function marcarSugestoesComoVisualizadasPeloUsuario(ids: string[]): Promise<void> {
  await marcarDocumentosComoVisualizados('sugestoes_melhoria', ids, {
    respostaVisualizadaPeloUsuario: true,
    dataVisualizacaoResposta: serverTimestamp(),
  });
}

export async function marcarTicketComoVisualizadoPeloSuporte(ticketId: string): Promise<void> {
  await updateDoc(doc(db, 'tickets_suporte', ticketId), {
    visualizadoPeloSuporte: true,
    dataVisualizacaoSuporte: serverTimestamp(),
  });
}

export async function marcarSugestaoComoVisualizadaPeloSuporte(sugestaoId: string): Promise<void> {
  await updateDoc(doc(db, 'sugestoes_melhoria', sugestaoId), {
    visualizadoPeloSuporte: true,
    dataVisualizacaoSuporte: serverTimestamp(),
  });
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
