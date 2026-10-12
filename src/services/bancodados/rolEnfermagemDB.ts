
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';

export interface MaterialApoio {
  tituloMaterialApoio: string;
  urlMaterialApoio: string;
}

export interface Intervencao {
  acaoEnfermeiro: string;
  acaoPrescrita: string;
  materiaisDeApoio: MaterialApoio[];
}

export interface ResultadoEsperado {
  tituloResultado: string;
  descricaoResultado: string;
  intervencoes: Intervencao[];
}

export interface Subconjunto {
  tipoSubconjunto: string;
  tituloSubconjunto: string;
}

export interface Diagnostico {
  id: string;
  tituloDiagnostico: string;
  descricaoDiagnostico: string;
  subconjuntos: Subconjunto[];
  resultadosEsperados: ResultadoEsperado[];
  dataCadastro: Timestamp;
}

export const getDiagnosticos = (callback: (diagnosticos: Diagnostico[]) => void) => {
  const q = query(
    collection(db, 'rolEnfermagem'),
    orderBy('dataCadastro', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const diagnosticos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Diagnostico[];
    
    callback(diagnosticos);
  });
};

export const addDiagnostico = async (data: Omit<Diagnostico, 'id' | 'dataCadastro'>): Promise<void> => {
  try {
    await addDoc(collection(db, 'rolEnfermagem'), {
      ...data,
      dataCadastro: Timestamp.now()
    });
  } catch (error) {
    console.error('Erro ao adicionar diagnóstico:', error);
    throw error;
  }
};

export const updateDiagnostico = async (id: string, data: Partial<Diagnostico>): Promise<void> => {
  try {
    const docRef = doc(db, 'rolEnfermagem', id);
    const { dataCadastro, ...dadosParaAtualizar } = data;
    await updateDoc(docRef, dadosParaAtualizar);
  } catch (error) {
    console.error('Erro ao atualizar diagnóstico:', error);
    throw error;
  }
};

export const deleteDiagnostico = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'rolEnfermagem', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao excluir diagnóstico:', error);
    throw error;
  }
};
