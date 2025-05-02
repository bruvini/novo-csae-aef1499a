
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase";
import { UsuarioAutenticado } from "@/services/bancodados/tipos";
import { registrarAcesso } from "@/services/bancodados/logAcessosDB";

// Tipos de resultado para operações de autenticação
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  errorCode?: string;
}

// Função para mapear códigos de erro do Firebase para mensagens amigáveis
export const mapFirebaseErrorToMessage = (error: FirebaseError): string => {
  const errorCode = error.code;

  const errorMessages: Record<string, string> = {
    "auth/email-already-in-use": "Este e-mail já está sendo usado por outra conta.",
    "auth/invalid-email": "O formato do e-mail é inválido.",
    "auth/user-disabled": "Esta conta foi desativada.",
    "auth/user-not-found": "Não existe usuário com este e-mail.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/weak-password": "A senha é muito fraca. Use pelo menos 6 caracteres.",
    "auth/invalid-credential": "Credenciais inválidas.",
    "auth/missing-password": "Por favor, insira uma senha.",
    "auth/too-many-requests": "Muitas tentativas. Por favor, tente novamente mais tarde.",
    "auth/network-request-failed": "Erro de rede. Verifique sua conexão e tente novamente.",
  };

  return errorMessages[errorCode] || "Ocorreu um erro ao processar sua solicitação.";
};

// Login com e-mail e senha
export const loginWithEmail = async (
  email: string,
  senha: string
): Promise<AuthResult> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    
    // Buscar dados adicionais do usuário do Firestore
    const userDoc = await getDoc(doc(db, "usuarios", userCredential.user.uid));
    const userData = userDoc.data() as Partial<UsuarioAutenticado>;
    
    // Salvar dados do usuário no localStorage
    localStorage.setItem('usuario', JSON.stringify({
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      nome: userData?.nome || userCredential.user.displayName,
      tipoUsuario: userData?.tipoUsuario || "Enfermeiro",
      ehAdmin: userData?.tipoUsuario === "Administrador",
      atuaSMS: userData?.atuaSMS || false,
      coren: userData?.coren || "",
      unidade: userData?.unidade || "",
      emailVerificado: userCredential.user.emailVerified,
    }));
    
    // Registrar acesso
    registrarAcesso({
      usuarioUid: userCredential.user.uid,
      usuarioEmail: userCredential.user.email || '',
      usuarioNome: userData?.nome || userCredential.user.displayName || '',
      pagina: 'login'
    });
    
    // Atualizar último acesso no Firestore
    await setDoc(
      doc(db, "usuarios", userCredential.user.uid),
      { ultimoAcesso: serverTimestamp() },
      { merge: true }
    );
    
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    console.error("Erro no login:", error);
    if (error instanceof FirebaseError) {
      return {
        success: false,
        error: mapFirebaseErrorToMessage(error),
        errorCode: error.code,
      };
    }
    return {
      success: false,
      error: "Erro ao fazer login. Tente novamente.",
    };
  }
};

// Função de registro (criar nova conta)
export const registerUser = async (
  email: string,
  senha: string,
  nome: string,
  tipoUsuario: "Administrador" | "Enfermeiro" | "Técnico" | "Estudante",
  coren?: string,
  unidade?: string
): Promise<AuthResult> => {
  try {
    // Criar usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      senha
    );
    
    // Atualizar o perfil com o nome completo
    await updateProfile(userCredential.user, {
      displayName: nome,
    });
    
    // Criar documento do usuário no Firestore
    await setDoc(doc(db, "usuarios", userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: email,
      nome: nome,
      tipoUsuario: tipoUsuario,
      coren: coren || "",
      unidade: unidade || "",
      ehAdmin: tipoUsuario === "Administrador",
      dataCriacao: serverTimestamp(),
      ultimoAcesso: serverTimestamp(),
    });
    
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error) {
    console.error("Erro no registro:", error);
    if (error instanceof FirebaseError) {
      return {
        success: false,
        error: mapFirebaseErrorToMessage(error),
        errorCode: error.code,
      };
    }
    return {
      success: false,
      error: "Erro ao registrar usuário. Tente novamente.",
    };
  }
};

// Função de logout
export const logout = async (): Promise<boolean> => {
  try {
    await signOut(auth);
    localStorage.removeItem('usuario');
    localStorage.removeItem('sessao');
    return true;
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    return false;
  }
};

// Verificar se temos um usuário logado no localStorage
export const verificarUsuarioLocal = (): boolean => {
  try {
    const userData = localStorage.getItem('usuario');
    return !!userData;
  } catch (error) {
    console.error("Erro ao verificar usuário local:", error);
    return false;
  }
};

// Verificar se usuário é admin no localStorage
export const verificarAdminLocal = (): boolean => {
  try {
    const userData = localStorage.getItem('usuario');
    if (userData) {
      const usuario = JSON.parse(userData);
      return usuario.ehAdmin === true || usuario.tipoUsuario === "Administrador";
    }
    return false;
  } catch (error) {
    console.error("Erro ao verificar admin local:", error);
    return false;
  }
};
