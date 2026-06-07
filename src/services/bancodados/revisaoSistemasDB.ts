
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  doc, 
  addDoc,
  updateDoc, 
  deleteDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';

export interface Achado {
  idadeMinima: number | null;
  idadeMaxima: number | null;
  idadeUnidade: 'dias' | 'meses' | 'anos' | '';
  criterioSexo: 'Masculino' | 'Feminino' | 'Ambos';
  descricaoAchado: string;
  ehAlteracao?: boolean;
  nomeAlteracao: string;
  subconjuntoNHBVinculado: string;
}

export interface ExamePropedeutico {
  nomeExame: string;
  propedeutica: string;
  achados: Achado[];
}

export interface SistemaCorporal {
  id: string;
  nomeSistema: string;
  descricaoSistema: string;
  dataCadastro: Timestamp;
  exames: ExamePropedeutico[];
}

export const getSistemas = async (): Promise<SistemaCorporal[]> => {
  try {
    const q = query(collection(db, 'RevisaoSistemas'), orderBy('dataCadastro', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SistemaCorporal[];
  } catch (error) {
    console.error('Erro ao buscar sistemas:', error);
    throw error;
  }
};

export const addSistema = async (sistema: Omit<SistemaCorporal, 'id' | 'dataCadastro'>): Promise<void> => {
  try {
    await addDoc(collection(db, 'RevisaoSistemas'), {
      ...sistema,
      dataCadastro: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao adicionar sistema:', error);
    throw error;
  }
};

export const updateSistema = async (id: string, sistema: Partial<SistemaCorporal>): Promise<void> => {
  try {
    const docRef = doc(db, 'RevisaoSistemas', id);
    const { dataCadastro, ...dadosParaAtualizar } = sistema;
    await updateDoc(docRef, dadosParaAtualizar);
  } catch (error) {
    console.error('Erro ao atualizar sistema:', error);
    throw error;
  }
};

export const deleteSistema = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'RevisaoSistemas', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao excluir sistema:', error);
    throw error;
  }
};

export const escutarSistemas = (callback: (sistemas: SistemaCorporal[]) => void) => {
  const q = query(collection(db, 'RevisaoSistemas'), orderBy('dataCadastro', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const sistemas = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SistemaCorporal[];
    
    callback(sistemas);
  });
};
