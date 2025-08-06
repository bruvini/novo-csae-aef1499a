
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ValorReferenciaVital {
  idadeMinima: number | null;
  idadeMaxima: number | null;
  idadeUnidade: 'dias' | 'meses' | 'anos' | '' | 'not-specified';
  criterioSexo: 'Masculino' | 'Feminino' | 'Ambos';
  criterioCondicao: string;
  valorMinimo: number | null;
  valorMaximo: number | null;
  nomeAlteracao: string;
  subconjuntoNHBVinculado: string;
}

export interface SinalVital {
  id: string;
  sinalVitalNome: string;
  sinalVitalDescricao: string;
  unidadeMedida: string;
  valoresDeReferencia: ValorReferenciaVital[];
  dataCadastro?: Timestamp;
}

export interface SinalVitalInput extends Omit<SinalVital, 'id' | 'dataCadastro'> {}

const COLLECTION_NAME = 'SinaisVitais';

export const getSinaisVitais = (callback: (sinais: SinalVital[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('sinalVitalNome'));
  
  return onSnapshot(q, (snapshot) => {
    const sinais: SinalVital[] = [];
    snapshot.forEach((doc) => {
      sinais.push({
        id: doc.id,
        ...doc.data()
      } as SinalVital);
    });
    callback(sinais);
  });
};

export const addSinalVital = async (sinal: SinalVitalInput) => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...sinal,
    dataCadastro: Timestamp.now()
  });
  return docRef.id;
};

export const updateSinalVital = async (id: string, sinal: SinalVitalInput) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, sinal);
};

export const deleteSinalVital = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const getSinaisVitaisCount = async (): Promise<number> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.size;
};
