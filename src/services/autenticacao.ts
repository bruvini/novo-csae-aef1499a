
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Usuario } from '@/types/usuario';
import { useAutenticacao } from '@/hooks/useAutenticacao'; // Import the hook

export interface SessaoUsuario {
  uid: string;
  email: string;
  nomeUsuario: string;
  tipoUsuario: 'Administrador' | 'Comum';
  usuario: Usuario;
}

export const auth = getAuth();

// Verificar se o usuário está autenticado
export const verificarAutenticacao = async (): Promise<SessaoUsuario | null> => {
  const auth = getAuth();
  const usuario = auth.currentUser;

  if (!usuario) {
    return null;
  }

  try {
    const userDoc = await getDoc(doc(db, "usuarios", usuario.uid));
    if (!userDoc.exists()) {
      return null;
    }

    const dadosUsuario = userDoc.data() as Usuario;

    const nomeUsuario = dadosUsuario.dadosPessoais?.nomeCompleto || 
                        `${dadosUsuario.nome ?? ''} ${dadosUsuario.sobrenome ?? ''}`.trim() ||
                        'Usuário';

    return {
      uid: usuario.uid,
      email: usuario.email!,
      nomeUsuario,
      tipoUsuario: dadosUsuario.tipoUsuario || (dadosUsuario.ehAdmin ? 'Administrador' : 'Comum'),
      usuario: {
        ...dadosUsuario,
        unidade: dadosUsuario.unidade || dadosUsuario.dadosProfissionais?.lotacao || '',
      }
    };
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error);
    return null;
  }
};

// Realizar login do usuário
export const realizarLogin = async (email: string, senha: string): Promise<SessaoUsuario> => {
  try {
    const resultado = await signInWithEmailAndPassword(auth, email, senha);
    const usuario = resultado.user;

    const userDoc = await getDoc(doc(db, "usuarios", usuario.uid));
    
    if (!userDoc.exists()) {
      throw new Error("Usuário não encontrado no banco de dados.");
    }
    
    const dadosUsuario = userDoc.data() as Usuario;

    // Registrar data de último login
    await updateDoc(doc(db, "usuarios", usuario.uid), {
      dataUltimoAcesso: serverTimestamp()
    });
    
    // Registrar acesso em log-acessos
    try {
      await addDoc(collection(db, "logAcessos"), {
        usuarioId: usuario.uid,
        timestamp: serverTimestamp(),
        plataforma: "web"
      });
    } catch (error) {
      console.error("Erro ao registrar acesso:", error);
    }

    const nomeUsuario = dadosUsuario.dadosPessoais?.nomeCompleto || 
                        `${dadosUsuario.nome ?? ''} ${dadosUsuario.sobrenome ?? ''}`.trim() ||
                        'Usuário';

    return {
      uid: usuario.uid,
      email: usuario.email!,
      nomeUsuario,
      tipoUsuario: dadosUsuario.tipoUsuario || (dadosUsuario.ehAdmin ? 'Administrador' : 'Comum'),
      usuario: {
        ...dadosUsuario,
        unidade: dadosUsuario.unidade || dadosUsuario.dadosProfissionais?.lotacao || '',
      }
    };
  } catch (error: any) {
    if (error.code === "auth/invalid-credential") {
      throw new Error("E-mail ou senha incorretos.");
    } else if (error.code === "auth/user-not-found") {
      throw new Error("Usuário não encontrado.");
    } else if (error.code === "auth/wrong-password") {
      throw new Error("Senha incorreta.");
    } else {
      throw new Error("Erro ao fazer login: " + error.message);
    }
  }
};

// Realizar cadastro de usuário
export const realizarCadastro = async (email: string, senha: string, nome: string, sobrenome: string, instituicao: string): Promise<SessaoUsuario> => {
  try {
    const resultado = await createUserWithEmailAndPassword(auth, email, senha);
    const usuario = resultado.user;

    // Criar documento do usuário no Firestore
    const dadosUsuario = {
      nome,
      sobrenome,
      email,
      instituicao,
      ehAdmin: false,
      gestorConteudos: false,
      statusAprovacao: "Pendente",
      createdAt: serverTimestamp(),
      ultimoLogin: serverTimestamp()
    };

    await setDoc(doc(db, "usuarios", usuario.uid), dadosUsuario);

    // Registrar acesso em log-acessos
    try {
      await addDoc(collection(db, "logAcessos"), {
        usuarioId: usuario.uid,
        timestamp: serverTimestamp(),
        plataforma: "web"
      });
    } catch (error) {
      console.error("Erro ao registrar acesso:", error);
    }

    const nomeUsuario = `${nome} ${sobrenome}`.trim();

    return {
      uid: usuario.uid,
      email,
      nomeUsuario,
      tipoUsuario: 'Comum',
      usuario: {
        ...dadosUsuario,
        uid: usuario.uid,
        dataCadastro: serverTimestamp(),
        statusAcesso: 'Aguardando',
        dadosPessoais: {
          nomeCompleto: nomeUsuario,
          rg: '',
          cpf: '',
          rua: '',
          numero: '',
          bairro: '',
          cidade: '',
          uf: '',
          cep: ''
        },
        dadosProfissionais: {
          formacao: 'Acadêmico de Enfermagem',
          atuaSMS: false
        }
      } as Usuario
    };
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      throw new Error("Este e-mail já está sendo utilizado.");
    } else if (error.code === "auth/weak-password") {
      throw new Error("A senha deve ter pelo menos 6 caracteres.");
    } else {
      throw new Error("Erro ao criar conta: " + error.message);
    }
  }
};

// Realizar logout
export const realizarLogout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error("Erro ao fazer logout: " + error.message);
  }
};

// Recuperar senha
export const recuperarSenha = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      throw new Error("E-mail não encontrado.");
    } else {
      throw new Error("Erro ao recuperar senha: " + error.message);
    }
  }
};

// Verificar se usuário já existe
export const verificarUsuarioExistente = async (email: string): Promise<boolean> => {
  try {
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("email", "==", email));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Erro ao verificar usuário:", error);
    return false;
  }
};

// Export for back-compatibility
export { useAutenticacao } from '@/hooks/useAutenticacao';
