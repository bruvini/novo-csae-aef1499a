
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
