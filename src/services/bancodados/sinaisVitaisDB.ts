
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  SinalVital,
  SubconjuntoDiagnostico,
  DiagnosticoCompleto,
} from "@/types/sinais-vitais";

export const fetchSinaisVitais = async (): Promise<SinalVital[]> => {
  const sinaisRef = collection(db, "sinaisVitais");
  const sinaisSnapshot = await getDocs(sinaisRef);
  return sinaisSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SinalVital[];
};

export const fetchSubconjuntos = async (): Promise<SubconjuntoDiagnostico[]> => {
  const subconjuntosRef = query(
    collection(db, "subconjuntosDiagnosticos"),
    where("tipo", "==", "NHB")
  );
  const subconjuntosSnapshot = await getDocs(subconjuntosRef);
  return subconjuntosSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as SubconjuntoDiagnostico[];
};

export const fetchDiagnosticos = async (): Promise<DiagnosticoCompleto[]> => {
  const diagnosticosRef = collection(db, "diagnosticosEnfermagem");
  const diagnosticosSnapshot = await getDocs(diagnosticosRef);
  return diagnosticosSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as DiagnosticoCompleto[];
};

export const createSinalVital = async (sinalVital: Omit<SinalVital, 'id' | 'createdAt' | 'updatedAt'>) => {
  const novoSinal = {
    ...sinalVital,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, "sinaisVitais"), novoSinal);
  return { ...sinalVital, id: docRef.id, createdAt: new Date() as any, updatedAt: new Date() as any };
};

export const updateSinalVital = async (id: string, sinalVital: SinalVital) => {
    const sinalRef = doc(db, "sinaisVitais", id);
    const dataToUpdate = { ...sinalVital };
    delete dataToUpdate.id; // Don't save id field in the document
    
    await updateDoc(sinalRef, {
      ...dataToUpdate,
      updatedAt: serverTimestamp(),
    });
    return { ...sinalVital, id, updatedAt: new Date() as any };
};

export const deleteSinalVital = async (id: string) => {
  await deleteDoc(doc(db, "sinaisVitais", id));
};
