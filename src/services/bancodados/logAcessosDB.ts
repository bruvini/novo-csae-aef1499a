
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Registra um novo acesso do usuário no Firestore
 * @param uid ID do usuário que está acessando o sistema
 */
export async function registrarAcesso(uid: string): Promise<boolean> {
  try {
    console.log("Registrando acesso para usuário:", uid);
    const usuarioRef = doc(db, 'usuarios', uid);
    
    // Verificar se o documento existe antes de tentar atualizar
    const docSnap = await getDoc(usuarioRef);
    if (!docSnap.exists()) {
      console.error("Documento de usuário não encontrado para UID:", uid);
      return false;
    }
    
    // Adicionar timestamp no array de logAcessos
    await updateDoc(usuarioRef, {
      logAcessos: arrayUnion(Timestamp.now()),
      dataUltimoAcesso: Timestamp.now() // Também atualizar o campo de último acesso para compatibilidade
    });
    
    console.log("Acesso registrado com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao registrar acesso do usuário:", error);
    return false;
  }
}

/**
 * Obtém histórico de acessos de um usuário
 * @param uid ID do usuário
 */
export async function obterHistoricoAcessos(uid: string): Promise<Timestamp[]> {
  try {
    const usuarioRef = doc(db, 'usuarios', uid);
    const docSnap = await getDoc(usuarioRef);
    
    if (!docSnap.exists()) {
      console.error("Documento de usuário não encontrado para UID:", uid);
      return [];
    }
    
    const userData = docSnap.data();
    return (userData.logAcessos || []) as Timestamp[];
  } catch (error) {
    console.error("Erro ao obter histórico de acessos:", error);
    return [];
  }
}
