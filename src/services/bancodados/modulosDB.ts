
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, serverTimestamp, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ModuloDisponivel } from '@/types/modulos';

// Buscar todos os módulos disponíveis
export const buscarModulosDisponiveis = async (): Promise<ModuloDisponivel[]> => {
  try {
    const q = query(collection(db, 'modulosDisponiveis'), orderBy('ordem', 'asc'));
    const querySnapshot = await getDocs(q);
    const modulos: ModuloDisponivel[] = [];
    
    querySnapshot.forEach((doc) => {
      modulos.push({ id: doc.id, ...doc.data() } as ModuloDisponivel);
    });
    
    return modulos;
  } catch (error) {
    console.error("Erro ao buscar módulos disponíveis:", error);
    return [];
  }
};

// Buscar módulos disponíveis ativos
export const buscarModulosAtivos = async (): Promise<ModuloDisponivel[]> => {
  try {
    const q = query(
      collection(db, 'modulosDisponiveis'), 
      where('ativo', '==', true),
      orderBy('ordem', 'asc')
    );
    const querySnapshot = await getDocs(q);
    const modulos: ModuloDisponivel[] = [];
    
    querySnapshot.forEach((doc) => {
      modulos.push({ id: doc.id, ...doc.data() } as ModuloDisponivel);
    });
    
    return modulos;
  } catch (error) {
    console.error("Erro ao buscar módulos ativos:", error);
    return [];
  }
};

// Buscar módulos visíveis para determinado tipo de usuário
export const buscarModulosVisiveis = async (isAdmin: boolean, atuaSMS: boolean): Promise<ModuloDisponivel[]> => {
  try {
    let q;
    
    if (isAdmin) {
      // Admins podem ver todos os módulos ativos
      q = query(
        collection(db, 'modulosDisponiveis'),
        where('ativo', '==', true),
        orderBy('ordem', 'asc')
      );
    } else if (atuaSMS) {
      // Usuários SMS podem ver módulos de todos ou SMS
      q = query(
        collection(db, 'modulosDisponiveis'),
        where('ativo', '==', true),
        where('visibilidade', 'in', ['todos', 'sms']),
        orderBy('ordem', 'asc')
      );
    } else {
      // Usuários comuns podem ver apenas módulos para todos
      q = query(
        collection(db, 'modulosDisponiveis'),
        where('ativo', '==', true),
        where('visibilidade', '==', 'todos'),
        orderBy('ordem', 'asc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    const modulos: ModuloDisponivel[] = [];
    
    querySnapshot.forEach((doc) => {
      modulos.push({ id: doc.id, ...doc.data() } as ModuloDisponivel);
    });
    
    return modulos;
  } catch (error) {
    console.error("Erro ao buscar módulos visíveis:", error);
    return [];
  }
};

// Adicionar novo módulo
export const adicionarModulo = async (modulo: Omit<ModuloDisponivel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, 'modulosDisponiveis'), {
      ...modulo,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar módulo:", error);
    return null;
  }
};

// Atualizar módulo
export const atualizarModulo = async (id: string, dados: Partial<ModuloDisponivel>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'modulosDisponiveis', id);
    
    await updateDoc(docRef, {
      ...dados,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar módulo:", error);
    return false;
  }
};

// Remover módulo
export const removerModulo = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'modulosDisponiveis', id));
    return true;
  } catch (error) {
    console.error("Erro ao remover módulo:", error);
    return false;
  }
};

// Verificar se módulo está ativo e visível para o usuário
export const verificarModuloAtivo = async (nome: string, isAdmin: boolean, atuaSMS: boolean): Promise<boolean> => {
  try {
    const docRef = doc(db, 'modulosDisponiveis', nome);
    const docSnap = await getDocs(query(
      collection(db, 'modulosDisponiveis'), 
      where('nome', '==', nome)
    ));
    
    if (docSnap.empty) {
      return false;
    }
    
    const modulo = docSnap.docs[0].data() as ModuloDisponivel;
    
    if (!modulo.ativo) {
      return false;
    }
    
    // Verificar visibilidade
    if (isAdmin) {
      return true; // Admin vê tudo
    } else if (modulo.visibilidade === 'admin') {
      return false; // Somente admins
    } else if (modulo.visibilidade === 'sms' && !atuaSMS) {
      return false; // Somente SMS e usuário não é SMS
    }
    
    return true;
  } catch (error) {
    console.error(`Erro ao verificar módulo ${nome}:`, error);
    return false; // Em caso de erro, consideramos o módulo como inativo
  }
};
