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
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { ModuloDisponivel } from '@/types/modulos';

export interface ModuloDashboard {
  id?: string;
  titulo: string;
  descricao: string;
  nome?: string;
  link?: string;
  linkAcesso: string;
  icone: string;
  ordem: number;
  ativo: boolean;
  categoria?: 'clinico' | 'educacional' | 'gestao';
  visibilidade?: 'admin' | 'sms' | 'todos';
  exibirDashboard?: boolean;
  exibirNavbar?: boolean;
  dataCadastro: Date | Timestamp;
  dataAtualizacao?: Date | Timestamp;
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

export const atualizarModulo = async (id: string, dados: Partial<ModuloDashboard>): Promise<boolean> => {
  try {
    const moduloRef = doc(db, 'modulosDashboard', id);
    
    await updateDoc(moduloRef, { 
      ...dados, 
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

export const buscarModulosAtivos = async (): Promise<ModuloDisponivel[]> => {
  try {
    const modulosRef = collection(db, 'modulosDashboard');
    const q = query(modulosRef, where('ativo', '==', true));
    const snapshot = await getDocs(q);
    
    const modulos: ModuloDisponivel[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        titulo: data.titulo || '',
        descricao: data.descricao || '',
        nome: data.nome || data.titulo || '',
        link: data.linkAcesso || '',
        icone: data.icone || '',
        ativo: data.ativo || false,
        visibilidade: data.visibilidade || 'todos',
        ordem: data.ordem || 1000,
        categoria: data.categoria,
        exibirDashboard: data.exibirDashboard,
        exibirNavbar: data.exibirNavbar,
        linkAcesso: data.linkAcesso
      };
    });
    
    return modulos;
  } catch (error) {
    console.error('Erro ao buscar módulos ativos:', error);
    return [];
  }
};

// Function for GerenciadorModulos component
export const buscarModulosDisponiveis = async (): Promise<ModuloDisponivel[]> => {
  try {
    const modulosRef = collection(db, 'modulosDashboard');
    const snapshot = await getDocs(modulosRef);
    
    const modulos: ModuloDisponivel[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        titulo: data.titulo || '',
        descricao: data.descricao || '',
        nome: data.nome || data.titulo || '',
        link: data.linkAcesso || '',
        icone: data.icone || '',
        ativo: data.ativo || false,
        visibilidade: data.visibilidade || 'todos',
        ordem: data.ordem || 1000,
        categoria: data.categoria,
        exibirDashboard: data.exibirDashboard,
        exibirNavbar: data.exibirNavbar,
        linkAcesso: data.linkAcesso
      };
    });
    
    // Sort modules by order field
    return modulos.sort((a, b) => (a.ordem || 1000) - (b.ordem || 1000));
  } catch (error) {
    console.error('Erro ao buscar módulos disponíveis:', error);
    return [];
  }
};

// Aliases for module functions
export const adicionarModulo = async (modulo: Partial<ModuloDisponivel>): Promise<string> => {
  try {
    const moduloParaCriar: Omit<ModuloDashboard, 'id' | 'dataCadastro' | 'dataAtualizacao'> = {
      titulo: modulo.titulo || '',
      descricao: modulo.descricao || '',
      nome: modulo.nome,
      linkAcesso: modulo.linkAcesso || modulo.link || '',
      icone: modulo.icone || '',
      ordem: modulo.ordem || 1000,
      ativo: modulo.ativo !== undefined ? modulo.ativo : true,
      categoria: modulo.categoria,
      visibilidade: modulo.visibilidade,
      exibirDashboard: modulo.exibirDashboard,
      exibirNavbar: modulo.exibirNavbar
    };
    
    return await criarModulo(moduloParaCriar);
  } catch (error) {
    console.error('Erro ao adicionar módulo:', error);
    throw error;
  }
};

export const removerModulo = excluirModulo;

// Function to verify if a module is active
export const verificarModuloAtivo = async (
  moduloNome: string, 
  isAdmin: boolean, 
  atuaSMS: boolean
): Promise<boolean> => {
  try {
    const modulosRef = collection(db, 'modulosDashboard');
    const q = query(modulosRef, where('nome', '==', moduloNome));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return false;
    }
    
    const modulo = snapshot.docs[0].data() as ModuloDisponivel;
    
    // If module is not active, it's not available to anyone
    if (!modulo.ativo) {
      return false;
    }
    
    // Admin can access all modules
    if (isAdmin) {
      return true;
    }
    
    // Check visibility permissions
    if (modulo.visibilidade === 'todos') {
      return true;
    } else if (modulo.visibilidade === 'sms' && atuaSMS) {
      return true;
    } else if (modulo.visibilidade === 'admin') {
      return false; // Only admins can access admin modules
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar status do módulo:', error);
    return false;
  }
};

// Function to get visible modules based on user profile
export const buscarModulosVisiveis = async (
  isAdmin: boolean, 
  atuaSMS: boolean
): Promise<ModuloDisponivel[]> => {
  try {
    const modulosRef = collection(db, 'modulosDashboard');
    const q = query(modulosRef, where('ativo', '==', true));
    const snapshot = await getDocs(q);
    
    const modulos: ModuloDisponivel[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const modulo: ModuloDisponivel = {
        id: doc.id,
        titulo: data.titulo || '',
        descricao: data.descricao || '',
        nome: data.nome || data.titulo || '',
        link: data.linkAcesso || '',
        icone: data.icone || '',
        ativo: data.ativo || false,
        visibilidade: data.visibilidade || 'todos',
        ordem: data.ordem || 1000,
        categoria: data.categoria,
        exibirDashboard: data.exibirDashboard,
        exibirNavbar: data.exibirNavbar,
        linkAcesso: data.linkAcesso
      };
      
      // Filter based on visibility permissions
      if (
        modulo.visibilidade === 'todos' || 
        (modulo.visibilidade === 'admin' && isAdmin) ||
        (modulo.visibilidade === 'sms' && (atuaSMS || isAdmin))
      ) {
        modulos.push(modulo);
      }
    });
    
    // Sort modules by order field
    return modulos.sort((a, b) => (a.ordem || 1000) - (b.ordem || 1000));
  } catch (error) {
    console.error('Erro ao buscar módulos visíveis:', error);
    return [];
  }
};
