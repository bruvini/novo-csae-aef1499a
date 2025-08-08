
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../firebase';
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

export async function aprovarUsuario(
  userId: string, 
  isAdmin: boolean, 
  paginasPermitidas: string[] = []
): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    const updateData: any = {
      statusAcesso: 'Aprovado',
      dataAprovacao: serverTimestamp(),
      ehAdmin: isAdmin,
      tipoUsuario: isAdmin ? 'Administrador' : 'Comum',
      paginasPermitidas: isAdmin ? [] : paginasPermitidas
    };
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error("Erro ao aprovar usuário:", error);
    throw error;
  }
}

export async function editarPrivilegiosUsuario(
  userId: string,
  isAdmin: boolean,
  paginasPermitidas: string[] = []
): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    const updateData: any = {
      ehAdmin: isAdmin,
      tipoUsuario: isAdmin ? 'Administrador' : 'Comum',
      paginasPermitidas: isAdmin ? [] : paginasPermitidas,
      dataAtualizacaoPrivilegios: serverTimestamp()
    };
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error("Erro ao editar privilégios do usuário:", error);
    throw error;
  }
}

export async function recusarUsuario(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, {
      statusAcesso: 'Recusado',
      dataRecusaAcesso: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao recusar usuário:", error);
    throw error;
  }
}

export async function excluirUsuario(userId: string, uid: string): Promise<void> {
  try {
    // Excluir documento do Firestore
    const userRef = doc(db, 'usuarios', userId);
    await deleteDoc(userRef);
    
    // Tentar excluir do Firebase Authentication
    // Nota: Esta operação pode falhar se o usuário não estiver autenticado ou não tiver permissões
    try {
      const userAuth = auth.currentUser;
      if (userAuth && userAuth.uid === uid) {
        await deleteUser(userAuth);
      }
    } catch (authError) {
      console.warn("Não foi possível excluir o usuário do Authentication:", authError);
      // Continuamos mesmo se não conseguirmos excluir do Auth
    }
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    throw error;
  }
}
