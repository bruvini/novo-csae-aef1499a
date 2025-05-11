
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  browserSessionPersistence,
  setPersistence,
  User as FirebaseUser,
  UserCredential,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { registrarAcesso } from './bancodados';

import { Usuario } from '@/types/usuario';

// Tipo para representar a sessão do usuário
export interface SessaoUsuario {
  uid: string;
  email: string | null;
  nome?: string;
  sobrenome?: string;
  createdAt?: Timestamp;
  admin?: boolean;
  gestorConteudos?: boolean;
  totens?: string[];
  ultimoAcesso?: Timestamp;
  contadorAcessos?: number;
  statusAprovacao?: 'pendente' | 'aprovado' | 'reprovado';
}

// Função para verificar se há um usuário autenticado
export const verificarAutenticacao = async (): Promise<SessaoUsuario | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    
    // Buscar dados adicionais do usuário no Firestore
    const docRef = doc(db, "usuarios", currentUser.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data() as Usuario;
      return {
        uid: currentUser.uid,
        email: currentUser.email,
        nome: userData.nome,
        sobrenome: userData.sobrenome,
        createdAt: userData.createdAt,
        admin: userData.admin || false,
        gestorConteudos: userData.gestorConteudos || false,
        totens: userData.totens || [],
        ultimoAcesso: userData.ultimoAcesso,
        contadorAcessos: userData.contadorAcessos || 0,
        statusAprovacao: userData.statusAprovacao
      };
    }
    
    return {
      uid: currentUser.uid,
      email: currentUser.email
    };
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return null;
  }
};

// Função para realizar login
export const realizarLogin = async (email: string, senha: string): Promise<SessaoUsuario> => {
  try {
    // Define a persistência para sessão (fecha ao fechar o navegador)
    await setPersistence(auth, browserSessionPersistence);
    
    // Realiza a autenticação
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user: FirebaseUser = userCredential.user;
    
    // Buscar dados adicionais do usuário no Firestore
    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);
    
    // Se o documento existe, retorna os dados completos
    if (docSnap.exists()) {
      const userData = docSnap.data() as Usuario;
      
      // Atualiza o último acesso e incrementa o contador
      await updateDoc(docRef, {
        ultimoAcesso: Timestamp.now(),
        contadorAcessos: (userData.contadorAcessos || 0) + 1
      });
      
      // Registrar o acesso no log
      await registrarAcesso(user.uid);
      
      return {
        uid: user.uid,
        email: user.email,
        nome: userData.nome,
        sobrenome: userData.sobrenome,
        admin: userData.admin || false,
        gestorConteudos: userData.gestorConteudos || false,
        totens: userData.totens || [],
        ultimoAcesso: Timestamp.now(),
        contadorAcessos: (userData.contadorAcessos || 0) + 1,
        statusAprovacao: userData.statusAprovacao
      };
    }
    
    // Se o documento não existe, retorna apenas os dados básicos
    return {
      uid: user.uid,
      email: user.email
    };
  } catch (error) {
    console.error("Erro no login:", error);
    throw error;
  }
};

// Função para realizar cadastro
export const realizarCadastro = async (
  email: string,
  senha: string,
  nome: string,
  sobrenome: string,
  instituicao: string
): Promise<SessaoUsuario> => {
  try {
    // Cria o usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;
    
    // Criar documento do usuário no Firestore
    const novoUsuario: Usuario = {
      uid: user.uid,
      email: user.email || '',
      nome,
      sobrenome,
      instituicao,
      createdAt: Timestamp.now(),
      admin: false,
      gestorConteudos: false,
      statusAprovacao: 'pendente',
      ultimoAcesso: Timestamp.now(),
      contadorAcessos: 1
    };
    
    await setDoc(doc(db, "usuarios", user.uid), novoUsuario);
    
    // Registrar o primeiro acesso
    await registrarAcesso(user.uid);
    
    // Retorna os dados da sessão
    return {
      uid: user.uid,
      email: user.email,
      nome,
      sobrenome,
      admin: false,
      gestorConteudos: false,
      ultimoAcesso: Timestamp.now(),
      contadorAcessos: 1,
      statusAprovacao: 'pendente'
    };
  } catch (error) {
    console.error("Erro no cadastro:", error);
    throw error;
  }
};

// Função para realizar logout
export const realizarLogout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro no logout:", error);
    throw error;
  }
};

// Função para recuperar senha
export const recuperarSenha = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Erro na recuperação de senha:", error);
    throw error;
  }
};
