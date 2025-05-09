
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

// Adicionar novo módulo
export const adicionarModulo = async (modulo: Omit<ModuloDisponivel, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    // Garantir valores padrão para os novos campos
    const moduloCompleto = {
      ...modulo,
      slug: modulo.slug || `/${modulo.nome}`,
      icone: modulo.icone || 'FileText',
      visibilidade: modulo.visibilidade || 'todos',
      exibirNoDashboard: modulo.exibirNoDashboard !== undefined ? modulo.exibirNoDashboard : true,
      exibirNavbar: modulo.exibirNavbar !== undefined ? modulo.exibirNavbar : true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'modulosDisponiveis'), moduloCompleto);
    
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

// Verificar se módulo está ativo e sua visibilidade
export const verificarModuloAtivo = async (nome: string): Promise<{ativo: boolean, visibilidade: 'todos' | 'admin' | 'sms'}> => {
  try {
    const q = query(
      collection(db, 'modulosDisponiveis'),
      where('nome', '==', nome)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { ativo: false, visibilidade: 'todos' }; 
    }
    
    const modulo = querySnapshot.docs[0].data() as ModuloDisponivel;
    return {
      ativo: modulo.ativo,
      visibilidade: modulo.visibilidade || 'todos'
    };
  } catch (error) {
    console.error(`Erro ao verificar módulo ${nome}:`, error);
    return { ativo: false, visibilidade: 'todos' }; // Em caso de erro, consideramos o módulo como inativo
  }
};
