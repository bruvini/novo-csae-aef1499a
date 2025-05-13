
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { Usuario } from './tipos';

export async function verificarUsuarioExistente(email: string, numeroCoren?: string, ufCoren?: string, matricula?: string): Promise<boolean> {
  const verificacoes = [];

  // Verificar e-mail
  const emailQuery = query(collection(db, 'usuarios'), where('email', '==', email));
  verificacoes.push(getDocs(emailQuery));
  
  // Verificar COREN se fornecido
  if (numeroCoren && ufCoren) {
    const corenQuery = query(
      collection(db, 'usuarios'),
      where('dadosProfissionais.numeroCoren', '==', numeroCoren),
      where('dadosProfissionais.ufCoren', '==', ufCoren)
    );
    verificacoes.push(getDocs(corenQuery));
  }

  // Verificar matrícula se fornecida
  if (matricula) {
    const matriculaQuery = query(
      collection(db, 'usuarios'),
      where('dadosProfissionais.matricula', '==', matricula)
    );
    verificacoes.push(getDocs(matriculaQuery));
  }

  // Executar todas as verificações
  const resultados = await Promise.all(verificacoes);
  
  // Verificar se alguma consulta retornou resultados
  return resultados.some((querySnapshot: QuerySnapshot<DocumentData>) => !querySnapshot.empty);
}

export async function cadastrarUsuario(usuario: Omit<Usuario, 'dataCadastro' | 'statusAcesso'>): Promise<string> {
  const usuarioCompleto = {
    ...usuario,
    dataCadastro: serverTimestamp(),
    statusAcesso: 'Aguardando' as const
  };

  const docRef = await addDoc(collection(db, 'usuarios'), usuarioCompleto);
  return docRef.id;
}

export async function buscarUsuarioPorUid(uid: string): Promise<Usuario | null> {
  try {
    // Buscar pelo uid nos documentos da coleção usuarios
    const q = query(collection(db, 'usuarios'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Retornar o primeiro documento encontrado (deve ser único)
    const docData = querySnapshot.docs[0].data();
    const userId = querySnapshot.docs[0].id;
    
    // Conversão segura usando o operador spread para garantir que todos os campos estejam presentes
    const usuario: Usuario = {
      ...docData as Omit<Usuario, 'id'>,
      id: userId
    };
    
    return usuario;
  } catch (error) {
    console.error("Erro ao buscar usuário por uid:", error);
    return null;
  }
}
