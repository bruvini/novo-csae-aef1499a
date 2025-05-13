
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  setDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { UsuarioAutenticado } from '@/types/usuario';

// Buscar usuário pelo ID (uid)
export const buscarUsuarioPorUid = async (uid: string): Promise<UsuarioAutenticado | null> => {
  try {
    const userRef = doc(db, 'usuarios', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UsuarioAutenticado;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    throw error;
  }
};

// Buscar todos os usuários
export const fetchAllUsuarios = async (): Promise<UsuarioAutenticado[]> => {
  try {
    const q = query(collection(db, 'usuarios'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UsuarioAutenticado));
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    throw error;
  }
};

// Atualizar usuário
export const updateUsuario = async (userId: string, data: Partial<UsuarioAutenticado>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'usuarios', userId), data);
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
};

// Excluir usuário
export const deleteUsuario = async (userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'usuarios', userId));
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    throw error;
  }
};

// Buscar usuário por email
export const buscarUsuarioPorEmail = async (email: string): Promise<UsuarioAutenticado | null> => {
  try {
    const q = query(collection(db, 'usuarios'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as UsuarioAutenticado;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar usuário por email:", error);
    throw error;
  }
};

// Criar usuário
export const criarUsuario = async (uid: string, userData: Partial<UsuarioAutenticado>): Promise<void> => {
  try {
    await setDoc(doc(db, 'usuarios', uid), userData);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
};
