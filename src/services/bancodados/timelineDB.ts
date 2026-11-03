import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query,
  serverTimestamp, Timestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";

// Mesmos nomes de coleção/campos da versão histórica de 2025.
// Os documentos antigos continuam legíveis sem migração destrutiva.
export interface TimelineEvent {
  id: string;
  dataEvento: Timestamp;
  titulo: string;
  subtitulo: string;
  textoRedacao: string;
  foto: string;
  legendaFoto: string;
  autoriaFoto: string;
}

export interface TimelineEventInput {
  dataEvento: string; // YYYY-MM-DD, dia local do evento
  titulo: string;
  subtitulo: string;
  textoRedacao: string;
  foto: string;
  legendaFoto: string;
  autoriaFoto: string;
}

export const TIMELINE_COLLECTION = "timelineEvents";

export function dataParaInput(data: Timestamp | undefined): string {
  if (!data || typeof data.toDate !== "function") return "";
  const d = data.toDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatarDataEvento(data: Timestamp | undefined): string {
  if (!data || typeof data.toDate !== "function") return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  }).format(data.toDate());
}

export function validarEvento(input: TimelineEventInput): string[] {
  const erros: string[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dataEvento) ||
      Number.isNaN(new Date(input.dataEvento + "T12:00:00").getTime())) {
    erros.push("Informe uma data válida para o acontecimento.");
  }
  if (input.titulo.trim().length < 3 || input.titulo.length > 180) erros.push("Título: informe de 3 a 180 caracteres.");
  if (input.subtitulo.trim().length < 3 || input.subtitulo.length > 240) erros.push("Subtítulo: informe de 3 a 240 caracteres.");
  if (input.textoRedacao.trim().length < 10 || input.textoRedacao.length > 12000) erros.push("Texto histórico: informe de 10 a 12 mil caracteres.");
  if (input.foto.trim() && !/^https:\/\//i.test(input.foto.trim())) erros.push("A imagem deve ter URL HTTPS.");
  if (input.foto.length > 2000) erros.push("URL de imagem muito longa.");
  if (input.legendaFoto.length > 300 || input.autoriaFoto.length > 160) erros.push("Legenda ou autoria da foto muito longa.");
  return erros;
}

function payload(input: TimelineEventInput) {
  return {
    dataEvento: Timestamp.fromDate(new Date(input.dataEvento + "T12:00:00")),
    titulo: input.titulo.trim(),
    subtitulo: input.subtitulo.trim(),
    textoRedacao: input.textoRedacao.trim(),
    foto: input.foto.trim(),
    legendaFoto: input.legendaFoto.trim(),
    autoriaFoto: input.autoriaFoto.trim(),
  };
}

export async function listarEventos(): Promise<TimelineEvent[]> {
  const q = query(collection(db, TIMELINE_COLLECTION), orderBy("dataEvento", "asc"));
  const docs = await getDocs(q);
  return docs.docs.map((item) => ({
    ...item.data(),
    id: item.id,
  } as TimelineEvent));
}

export async function criarEvento(input: TimelineEventInput, uid: string): Promise<void> {
  const erros = validarEvento(input);
  if (erros.length) throw new Error(erros.join(" "));
  await addDoc(collection(db, TIMELINE_COLLECTION), {
    ...payload(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    criadoPor: uid,
    atualizadoPor: uid,
  });
}

export async function editarEvento(id: string, input: TimelineEventInput, uid: string): Promise<void> {
  const erros = validarEvento(input);
  if (erros.length) throw new Error(erros.join(" "));
  await updateDoc(doc(db, TIMELINE_COLLECTION, id), {
    ...payload(input),
    updatedAt: serverTimestamp(),
    atualizadoPor: uid,
  });
}

export async function excluirEvento(id: string): Promise<void> {
  await deleteDoc(doc(db, TIMELINE_COLLECTION, id));
}
