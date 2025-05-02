import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ModuloDashboard {
  id?: string;
  titulo: string;
  descricao: string;
  linkAcesso: string;
  icone: string;
  ordem: number;
  ativo: boolean;
  dataCadastro: Date;
  dataAtualizacao?: Date;
}

export const criarModulo = async (modulo: Omit<ModuloDashboard, 'id' | 'dataCadastro' | 'dataAtualizacao'>): Promise<string> => {
  try {
    const moduloRef = collection(db, 'modulosDashboard');
    const novoModulo = {
      ...modulo,
      dataCadastro: serverTimestamp(),
      dataAtualizacao: serverTimestamp()
    };
    const docRef = await addDoc(moduloRef, novoModulo);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar módulo:', error);
    throw error;
  }
};

export const buscarModulos = async (): Promise<ModuloDashboard[]> => {
  try {
    const moduloRef = collection(db, 'modulosDashboard');
    const snapshot = await getDocs(moduloRef);
    const modulos: ModuloDashboard[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ModuloDashboard[];
    return modulos;
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return [];
  }
};

export const buscarModuloPorId = async (id: string): Promise<ModuloDashboard | null> => {
  try {
    const moduloRef = doc(db, 'modulosDashboard', id);
    const docSnap = await getDoc(moduloRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ModuloDashboard;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar módulo por ID:', error);
    return null;
  }
};

export const atualizarModulo = async (id: string, dados: object): Promise<boolean> => {
  try {
    const moduloRef = doc(db, 'modulosDashboard', id);
    
    // Fix the spread issue by ensuring dados is an object
    await updateDoc(moduloRef, { 
      ...dados as object, 
      dataAtualizacao: serverTimestamp() 
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar módulo:', error);
    return false;
  }
};

export const excluirModulo = async (id: string): Promise<boolean> => {
  try {
    const moduloRef = doc(db, 'modulosDashboard', id);
    await deleteDoc(moduloRef);
    return true;
  } catch (error) {
    console.error('Erro ao excluir módulo:', error);
    return false;
  }
};

export const buscarModulosAtivos = async (): Promise<ModuloDashboard[]> => {
  try {
    const modulosRef = collection(db, 'modulosDashboard');
    const q = query(modulosRef, where('ativo', '==', true));
    const snapshot = await getDocs(q);
    const modulos: ModuloDashboard[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ModuloDashboard[];
    return modulos;
  } catch (error) {
    console.error('Erro ao buscar módulos ativos:', error);
    return [];
  }
};
