import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { registrarAcesso } from './bancodados/logAcessosDB';
import { db } from './firebase';
import { Usuario } from '@/types/usuario';

function isFirebaseError(error: unknown): error is { code: string; message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  );
}

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
    let userDoc = await getDoc(doc(db, "usuarios", usuario.uid));
    if (!userDoc.exists()) {
      const q = query(collection(db, "usuarios"), where("uid", "==", usuario.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        userDoc = snapshot.docs[0];
      } else {
        const novoUsuario: Usuario = {
          uid: usuario.uid,
          email: usuario.email || "",
          nome: usuario.displayName || "",
          dadosPessoais: {
            nomeCompleto: usuario.displayName || "",
            rg: "",
            cpf: "",
            rua: "",
            numero: "",
            bairro: "",
            cidade: "",
            uf: "",
            cep: "",
          },
          dadosProfissionais: {
            formacao: "",
            atuaSMS: false,
          },
          statusAcesso: "Aprovado",
          tipoUsuario: "Comum",
          dataCadastro: Timestamp.now(),
          termoResponsabilidadeData: Timestamp.now(),
        };
        await setDoc(doc(db, "usuarios", usuario.uid), novoUsuario);
        console.log("Usuário criado automaticamente ao verificar autenticação:", usuario.uid);
        userDoc = await getDoc(doc(db, "usuarios", usuario.uid));
      }
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
export const realizarLogin = async (
  email: string,
  senha: string
): Promise<SessaoUsuario> => {
  try {
    let resultado;
    try {
      resultado = await signInWithEmailAndPassword(auth, email, senha);
    } catch (error) {
      console.error("Erro de autenticação Firebase:", error);
      if (isFirebaseError(error)) {
        switch (error.code) {
          case "auth/invalid-email":
          case "auth/invalid-credential":
          case "auth/user-disabled":
            throw new Error("E-mail ou senha incorretos.");
          case "auth/user-not-found":
            throw new Error("Usuário não encontrado.");
          case "auth/wrong-password":
            throw new Error("Senha incorreta.");
          case "auth/network-request-failed":
            throw new Error("Erro de rede ao tentar logar.");
          default:
            throw new Error("Erro ao fazer login: " + error.message);
        }
      }
      throw new Error("Erro desconhecido ao fazer login.");
    }

    const usuario = resultado.user;

    let userDoc;
    try {
      userDoc = await getDoc(doc(db, "usuarios", usuario.uid));
      if (!userDoc.exists()) {
        const q = query(collection(db, "usuarios"), where("uid", "==", usuario.uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          userDoc = snapshot.docs[0];
        } else {
          const novoUsuario: Usuario = {
            uid: usuario.uid,
            email: usuario.email || "",
            nome: usuario.displayName || "",
            dadosPessoais: {
              nomeCompleto: usuario.displayName || "",
              rg: "",
              cpf: "",
              rua: "",
              numero: "",
              bairro: "",
              cidade: "",
              uf: "",
              cep: "",
            },
            dadosProfissionais: {
              formacao: "",
              atuaSMS: false,
            },
            statusAcesso: "Aprovado",
            tipoUsuario: "Comum",
            dataCadastro: Timestamp.now(),
            termoResponsabilidadeData: Timestamp.now(),
          };
          await setDoc(doc(db, "usuarios", usuario.uid), novoUsuario);
          console.log("Usuário criado automaticamente após login:", usuario.uid);
          userDoc = await getDoc(doc(db, "usuarios", usuario.uid));
        }
      }
    } catch (error) {
      console.error("Erro ao buscar usuário no Firestore:", error);
      throw new Error("Não foi possível recuperar os dados do usuário.");
    }

    const dadosUsuario = userDoc.data() as Usuario;

    try {
      await updateDoc(doc(db, "usuarios", usuario.uid), {
        dataUltimoAcesso: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao atualizar último acesso:", error);
    }

    try {
      await registrarAcesso(
        usuario.uid,
        dadosUsuario.dadosPessoais?.nomeCompleto || `${dadosUsuario.nome ?? ''} ${dadosUsuario.sobrenome ?? ''}`.trim(),
        usuario.email || '',
        'login',
        'Login realizado com sucesso',
        'sistema'
      );
    } catch (error) {
      console.error('Erro ao registrar acesso:', error);
    }

    const nomeUsuario =
      dadosUsuario.dadosPessoais?.nomeCompleto ||
      `${dadosUsuario.nome ?? ''} ${dadosUsuario.sobrenome ?? ''}`.trim() ||
      "Usuário";

    return {
      uid: usuario.uid,
      email: usuario.email!,
      nomeUsuario,
      tipoUsuario:
        dadosUsuario.tipoUsuario || (dadosUsuario.ehAdmin ? "Administrador" : "Comum"),
      usuario: {
        ...dadosUsuario,
        unidade: dadosUsuario.unidade || dadosUsuario.dadosProfissionais?.lotacao || "",
      },
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erro desconhecido ao fazer login.");
  }
};

// Realizar cadastro de usuário
export const realizarCadastro = async (email: string, senha: string, nome: string, sobrenome: string, instituicao: string): Promise<SessaoUsuario> => {
  try {
    const resultado = await createUserWithEmailAndPassword(auth, email, senha);
    const usuario = resultado.user;

    // Registrar acesso em log-acessos
    try {
      await registrarAcesso(
        usuario.uid,
        nome.trim() ? `${nome} ${sobrenome}`.trim() : '',
        email,
        'login',
        'Login realizado com sucesso',
        'sistema'
      );
    } catch (error) {
      console.error('Erro ao registrar acesso:', error);
    }

    const nomeUsuario = `${nome} ${sobrenome}`.trim();

    return {
      uid: usuario.uid,
      email,
      nomeUsuario,
      tipoUsuario: 'Comum',
      usuario: {
        uid: usuario.uid,
        email,
        nome,
        sobrenome,
        ehAdmin: false,
        gestorConteudos: false,
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
  } catch (error: unknown) {
    if (isFirebaseError(error)) {
      switch (error.code) {
        case "auth/email-already-in-use":
          throw new Error("Este e-mail já está sendo utilizado.");
        case "auth/weak-password":
          throw new Error("A senha deve ter pelo menos 6 caracteres.");
        default:
          throw new Error("Erro ao criar conta: " + error.message);
      }
    } else {
      throw new Error("Erro desconhecido ao criar conta.");
    }
  }

};

// Realizar logout
export const realizarLogout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error("Erro ao fazer logout: " + error.message);
    } else {
      throw new Error("Erro desconhecido ao fazer logout.");
    }
  }
};

// Recuperar senha
export const recuperarSenha = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: unknown) {
    if (isFirebaseError(error)) {
      if (error.code === "auth/user-not-found") {
        throw new Error("E-mail não encontrado.");
      } else {
        throw new Error("Erro ao recuperar senha: " + error.message);
      }
    } else {
      throw new Error("Erro desconhecido ao recuperar senha.");
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

export { useAutenticacao } from '@/hooks/useAutenticacao';
