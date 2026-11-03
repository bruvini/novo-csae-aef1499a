import {
  addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDocs, orderBy, query,
  serverTimestamp, Timestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";

/** Coleção real de produção identificada nesta revisão. */
export const TIMELINE_COLLECTION = "historiasPortal";

export interface TimelineEvent {
  id: string;
  dataEvento: Timestamp;
  dataReferencia: string;
  dataOrdenacao: string;
  titulo: string;
  subtitulo: string;
  textoRedacao: string;
  foto: string;
  legendaFoto: string;
  autoriaFoto: string;
  curtidasPor: string[];
}

export interface TimelineEventInput {
  dataEvento: string; // YYYY-MM
  titulo: string;
  subtitulo: string;
  textoRedacao: string;
  foto: string;
  legendaFoto: string;
  autoriaFoto: string;
}

export function dataParaInput(evento: Pick<TimelineEvent, "dataOrdenacao">): string {
  return evento.dataOrdenacao || "";
}

export function formatarDataEvento(evento: Pick<TimelineEvent, "dataReferencia" | "dataOrdenacao">): string {
  if (evento.dataReferencia) return evento.dataReferencia;
  const [ano, mes] = (evento.dataOrdenacao || "").split("-");
  return ano && mes ? mes + "/" + ano : "Data não informada";
}

export function validarEvento(input: TimelineEventInput): string[] {
  const erros: string[] = [];
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.dataEvento)) erros.push("Informe mês e ano do acontecimento.");
  if (input.titulo.trim().length < 3 || input.titulo.length > 180) erros.push("Título: informe de 3 a 180 caracteres.");
  if (input.subtitulo.length > 240) erros.push("Subtítulo: máximo de 240 caracteres.");
  if (input.textoRedacao.trim().length < 10 || input.textoRedacao.length > 12000) erros.push("Texto histórico: informe de 10 a 12 mil caracteres.");
  if (input.foto.trim() && !/^https:\/\//i.test(input.foto.trim())) erros.push("A imagem deve ter URL HTTPS.");
  if (input.foto.length > 2000) erros.push("URL de imagem muito longa.");
  if (input.legendaFoto.length > 300 || input.autoriaFoto.length > 160) erros.push("Legenda ou autoria da foto muito longa.");
  return erros;
}

function payload(input: TimelineEventInput) {
  const [ano, mes] = input.dataEvento.split("-");
  return {
    dataOrdenacao: input.dataEvento,
    dataReferencia: mes + "/" + ano,
    titulo: input.titulo.trim(),
    descricao: input.textoRedacao.trim(),
    subtitulo: input.subtitulo.trim(),
    foto: input.foto.trim(),
    legendaFoto: input.legendaFoto.trim(),
    autoriaFoto: input.autoriaFoto.trim(),
  };
}

/** Adapta documentos antigos sem apagar curtidas, autores ou metadados adicionais. */
export function adaptarHistoria(id: string, registro: Record<string, unknown>): TimelineEvent {
  const dataOrdenacao = typeof registro.dataOrdenacao === "string"
    ? registro.dataOrdenacao : "";
  const ref = typeof registro.dataReferencia === "string" ? registro.dataReferencia : "";
  const m = dataOrdenacao.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  const fromRef = ref.match(/^(0[1-9]|1[0-2])\/(\d{4})$/);
  const ordenacao = m ? dataOrdenacao : fromRef ? fromRef[2] + "-" + fromRef[1] : "";
  const date = ordenacao ? new Date(ordenacao + "-15T12:00:00") : new Date(0);
  const str = (key: string) => typeof registro[key] === "string" ? registro[key] as string : "";
  return {
    id,
    dataEvento: Timestamp.fromDate(date),
    dataReferencia: ref || (ordenacao ? ordenacao.slice(5,7) + "/" + ordenacao.slice(0,4) : ""),
    dataOrdenacao: ordenacao,
    titulo: str("titulo"),
    subtitulo: str("subtitulo"),
    textoRedacao: str("descricao") || str("textoRedacao"),
    foto: str("foto"),
    legendaFoto: str("legendaFoto"),
    autoriaFoto: str("autoriaFoto"),
    curtidasPor: Array.isArray(registro.curtidasPor)
      ? registro.curtidasPor.filter((x): x is string => typeof x === "string") : [],
  };
}

export async function listarEventos(): Promise<TimelineEvent[]> {
  const q = query(collection(db, TIMELINE_COLLECTION), orderBy("dataOrdenacao", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((item) => adaptarHistoria(item.id, item.data()));
}

export async function criarEvento(input: TimelineEventInput, uid: string): Promise<void> {
  const erros = validarEvento(input);
  if (erros.length) throw new Error(erros.join(" "));
  await addDoc(collection(db, TIMELINE_COLLECTION), {
    ...payload(input), curtidasPor: [],
    criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(),
    criadoPorUid: uid, atualizadoPorUid: uid,
  });
}

export async function editarEvento(id: string, input: TimelineEventInput, uid: string): Promise<void> {
  const erros = validarEvento(input);
  if (erros.length) throw new Error(erros.join(" "));
  // Patch seletivo: não substitui curtidasPor, criadoEm nem campos legados.
  await updateDoc(doc(db, TIMELINE_COLLECTION, id), {
    ...payload(input), atualizadoEm: serverTimestamp(), atualizadoPorUid: uid,
  });
}

export async function curtirEvento(id: string, uid: string, jaCurtiu: boolean): Promise<void> {
  await updateDoc(doc(db, TIMELINE_COLLECTION, id), {
    curtidasPor: jaCurtiu ? arrayRemove(uid) : arrayUnion(uid),
  });
}

export async function excluirEvento(id: string): Promise<void> {
  await deleteDoc(doc(db, TIMELINE_COLLECTION, id));
}
