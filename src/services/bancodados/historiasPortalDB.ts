import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebase";

export interface HistoriaPortal {
  id: string;
  dataReferencia: string;
  dataOrdenacao: string;
  titulo: string;
  descricao: string;
  criadoEm?: Timestamp;
  criadoPorUid: string;
  atualizadoEm?: Timestamp;
  atualizadoPorUid: string;
  curtidasPor: string[];
  imagemUrl?: string;
  imagemStoragePath?: string;
}

export interface HistoriaPortalInput {
  dataReferencia: string;
  dataOrdenacao: string;
  titulo: string;
  descricao: string;
}

const ordenarHistorias = (historias: HistoriaPortal[]) =>
  historias.sort((a, b) => {
    const porData = a.dataOrdenacao.localeCompare(b.dataOrdenacao);
    if (porData !== 0) return porData;

    const criadoA = a.criadoEm?.toMillis() ?? 0;
    const criadoB = b.criadoEm?.toMillis() ?? 0;
    return criadoA - criadoB || a.id.localeCompare(b.id);
  });

export const observarHistoriasPortal = (
  onChange: (historias: HistoriaPortal[]) => void,
  onError: (error: Error) => void,
) =>
  onSnapshot(
    collection(db, "historiasPortal"),
    (snapshot) => {
      const historias = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          ...data,
          curtidasPor: (data.curtidasPor as string[] | undefined) ?? [],
        } as HistoriaPortal;
      });
      onChange(ordenarHistorias(historias));
    },
    onError,
  );

export const criarHistoriaPortal = async (
  historia: HistoriaPortalInput,
  uid: string,
) => {
  const agora = serverTimestamp();
  return addDoc(collection(db, "historiasPortal"), {
    ...historia,
    criadoEm: agora,
    criadoPorUid: uid,
    atualizadoEm: agora,
    atualizadoPorUid: uid,
    curtidasPor: [],
  });
};

export const atualizarHistoriaPortal = async (
  id: string,
  historia: HistoriaPortalInput,
  uid: string,
) =>
  updateDoc(doc(db, "historiasPortal", id), {
    ...historia,
    atualizadoEm: serverTimestamp(),
    atualizadoPorUid: uid,
  });

export const excluirHistoriaPortal = async (id: string) =>
  deleteDoc(doc(db, "historiasPortal", id));

export const curtirHistoriaPortal = async (id: string, uid: string) =>
  runTransaction(db, async (transaction) => {
    const historiaRef = doc(db, "historiasPortal", id);
    const historiaSnapshot = await transaction.get(historiaRef);

    if (!historiaSnapshot.exists()) {
      throw new Error("Esta história não está mais disponível.");
    }

    const curtidas = (historiaSnapshot.data().curtidasPor as string[] | undefined) ?? [];
    if (curtidas.includes(uid)) return false;

    transaction.update(historiaRef, { curtidasPor: [...curtidas, uid] });
    return true;
  });
