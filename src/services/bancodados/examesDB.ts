
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
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ResultadoExame {
  // Campos para exames laboratoriais
  idadeMinima?: number | null;
  idadeMaxima?: number | null;
  idadeUnidade?: 'dias' | 'meses' | 'anos' | '';
  criterioSexo?: 'Masculino' | 'Feminino' | 'Ambos';
  valorMinimo?: number | null;
  valorMaximo?: number | null;
  // Campo para exames de imagem
  resultadoClassificatorio?: string;
  // Campos comuns
  nomeAlteracao: string;
  subconjuntoNHBVinculado: string;
}

export interface ComponenteExame {
  componenteAnalisado: string;
  unidadeMedida: string;
  resultados: ResultadoExame[];
}

export interface Exame {
  id: string;
  nomeExame: string;
  descricaoExame: string;
  tipoExame: 'Laboratorial' | 'Imagem';
  componentes: ComponenteExame[];
  dataCadastro?: Timestamp;
}

export interface ExameInput extends Omit<Exame, 'id' | 'dataCadastro'> {}

const COLLECTION_NAME = 'ExamesLabImagem';

export const getExames = (callback: (exames: Exame[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('nomeExame'));
  
  return onSnapshot(q, (snapshot) => {
    const exames: Exame[] = [];
    snapshot.forEach((doc) => {
      exames.push({
        id: doc.id,
        ...doc.data()
      } as Exame);
    });
    callback(exames);
  });
};

export const addExame = async (exame: ExameInput) => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...exame,
    dataCadastro: Timestamp.now()
  });
  return docRef.id;
};

export const updateExame = async (id: string, exame: ExameInput) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, exame);
};

export const deleteExame = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const getExamesCount = async (): Promise<number> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.size;
};

export const buscarNomesExamesUnicos = async (): Promise<string[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const nomes = new Set<string>();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.nomeExame) {
        nomes.add(data.nomeExame);
      }
    });

    return Array.from(nomes).sort();
  } catch (error) {
    console.error('Erro ao buscar nomes de exames únicos:', error);
    throw error;
  }
};

export const buscarExamePorNome = async (nomeExame: string): Promise<Exame | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('nomeExame', '==', nomeExame)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Exame;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar exame por nome:', error);
    throw error;
  }
};

// Nova função para buscar nomes únicos de exames
export const getNomesDeExamesUnicos = async (): Promise<string[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const nomes = snapshot.docs.map(doc => doc.data().nomeExame);
    // Usa um Set para garantir que a lista contenha apenas valores únicos
    return [...new Set(nomes)].sort();
  } catch (error) {
    console.error('Erro ao buscar nomes de exames únicos:', error);
    throw error;
  }
};
