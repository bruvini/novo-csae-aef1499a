
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc,
  updateDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { Usuario } from '@/types/usuario';

export async function buscarUsuariosAguardando(): Promise<Usuario[]> {
  try {
    const q = query(
      collection(db, 'usuarios'), 
      where('statusAcesso', '==', 'Aguardando'),
      orderBy('dataCadastro', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const usuarios: Usuario[] = [];
    querySnapshot.forEach((doc) => {
      usuarios.push({
        ...doc.data() as Usuario,
        id: doc.id
      });
    });
    
    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários aguardando:", error);
    return [];
  }
}

export async function buscarUsuariosAprovados(): Promise<Usuario[]> {
  try {
    const q = query(
      collection(db, 'usuarios'), 
      where('statusAcesso', '==', 'Aprovado'),
      orderBy('dataCadastro', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const usuarios: Usuario[] = [];
    querySnapshot.forEach((doc) => {
      usuarios.push({
        ...doc.data() as Usuario,
        id: doc.id
      });
    });
    
    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários aprovados:", error);
    return [];
  }
}

export async function aprovarUsuario(userId: string, isAdmin: boolean): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    const updateData: any = {
      statusAcesso: 'Aprovado',
      dataAprovacao: serverTimestamp()
    };
    
    if (isAdmin) {
      updateData.tipoUsuario = 'Administrador';
    } else {
      updateData.tipoUsuario = 'Comum';
    }
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error("Erro ao aprovar usuário:", error);
    throw error;
  }
}

export async function recusarUsuario(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, {
      statusAcesso: 'Negado',
      dataRevogacao: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao recusar usuário:", error);
    throw error;
  }
}
