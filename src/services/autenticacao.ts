
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';
import { buscarUsuarioPorUid, cadastrarUsuario as cadastrarUsuarioDB } from './bancodados/usuariosDB';
import { Usuario } from './bancodados/tipos';

// Interface for user profile
export interface PerfilUsuario {
  uid: string;
  email: string;
  nome: string;
  nomeUsuario: string;
  ehAdmin: boolean;
  atuaSMS: boolean;
}

// Authentication hook
export function useAutenticacao() {
  // Local state for authenticated user
  let usuario: User | null = null;
  let perfilUsuario: PerfilUsuario | null = null;
  let carregando = false;

  // Check if the user is authenticated
  const verificarAutenticacao = (): boolean => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      usuario = currentUser;
      return true;
    }
    return false;
  };

  // Check if the user is admin
  const verificarAdmin = (): boolean => {
    const sessao = obterSessao();
    return sessao?.ehAdmin === true;
  };

  // Login function
  const fazerLogin = async (email: string, senha: string) => {
    try {
      carregando = true;
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      usuario = userCredential.user;
      
      // Get user data from Firestore
      const userDB = await buscarUsuarioPorUid(userCredential.user.uid);
      
      // Check user status
      if (userDB && userDB.statusAcesso === "Bloqueado") {
        await fazerLogout();
        return {
          sucesso: false,
          mensagem: "Sua conta está bloqueada. Entre em contato com o administrador."
        };
      }
      
      if (userDB && userDB.statusAcesso === "Aguardando") {
        await fazerLogout();
        return {
          sucesso: false,
          mensagem: "Sua conta está aguardando aprovação. Tente novamente mais tarde."
        };
      }

      // Create user profile object
      if (userDB) {
        perfilUsuario = {
          uid: userDB.uid,
          email: userDB.email,
          nome: userDB.nome || "",
          nomeUsuario: userDB.dadosPessoais?.nomeCompleto || userDB.nome || "",
          ehAdmin: userDB.perfil === 'admin',
          atuaSMS: userDB.atuaSMS || false
        };
        
        // Save session to localStorage
        salvarSessao(perfilUsuario);
      }
      
      return { sucesso: true };
    } catch (error: any) {
      let mensagem = "Erro ao fazer login.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        mensagem = "E-mail ou senha inválidos.";
      } else if (error.code === 'auth/too-many-requests') {
        mensagem = "Muitas tentativas de login. Tente novamente mais tarde.";
      }
      
      return {
        sucesso: false,
        mensagem
      };
    } finally {
      carregando = false;
    }
  };

  // Register new user function
  const cadastrarUsuario = async (
    email: string,
    senha: string,
    dadosAdicionais: any
  ) => {
    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      
      // Set displayName
      await updateProfile(user, {
        displayName: dadosAdicionais.nomeCompleto || email.split('@')[0]
      });
      
      // Structure user data to save in Firestore
      const dadosUsuario: Omit<Usuario, 'dataCadastro' | 'statusAcesso'> = {
        uid: user.uid,
        nome: dadosAdicionais.nomeCompleto,
        email: email,
        perfil: 'usuario',
        foto: '',
        telefone: '',
        atuaSMS: dadosAdicionais.atuaSMS || false,
        dadosPessoais: {
          nomeCompleto: dadosAdicionais.nomeCompleto || '',
          rg: dadosAdicionais.rg || '',
          cpf: dadosAdicionais.cpf || '',
          endereco: {
            rua: dadosAdicionais.rua || '',
            numero: dadosAdicionais.numero || '',
            bairro: dadosAdicionais.bairro || '',
            cidade: dadosAdicionais.cidade || '',
            uf: dadosAdicionais.uf || '',
            cep: dadosAdicionais.cep || ''
          }
        },
        dadosProfissionais: {
          formacao: dadosAdicionais.formacao || '',
          numeroCoren: dadosAdicionais.numeroCoren || '',
          ufCoren: dadosAdicionais.ufCoren || '',
          dataInicioResidencia: dadosAdicionais.dataInicioResidencia || '',
          iesEnfermagem: dadosAdicionais.iesEnfermagem || '',
          atuaSMS: dadosAdicionais.atuaSMS || false,
          matricula: dadosAdicionais.matricula || '',
          cidadeTrabalho: dadosAdicionais.cidadeTrabalho || '',
          localCargo: dadosAdicionais.localCargo || '',
          lotacao: dadosAdicionais.lotacao || ''
        }
      };
      
      // Save to Firestore
      await cadastrarUsuarioDB(dadosUsuario);
      
      // Logout as user needs to wait for approval
      await fazerLogout();
      
      return { sucesso: true, usuario: user };
    } catch (error: any) {
      console.error("Erro ao cadastrar usuário:", error);
      
      let mensagem = "Erro ao cadastrar usuário.";
      if (error.code === 'auth/email-already-in-use') {
        mensagem = "Este e-mail já está sendo utilizado.";
      }
      
      return { sucesso: false, mensagem };
    }
  };

  // Logout function
  const fazerLogout = async () => {
    try {
      await signOut(auth);
      usuario = null;
      perfilUsuario = null;
      
      // Clear session
      localStorage.removeItem('sessao_usuario');
      
      return { sucesso: true };
    } catch (error) {
      return { sucesso: false, mensagem: "Erro ao fazer logout." };
    }
  };

  // Password recovery function
  const recuperarSenha = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { sucesso: true };
    } catch (error: any) {
      let mensagem = "Erro ao enviar e-mail de recuperação.";
      
      if (error.code === 'auth/user-not-found') {
        mensagem = "Não existe conta para este e-mail.";
      }
      
      return { sucesso: false, mensagem };
    }
  };

  // Save user session to localStorage
  const salvarSessao = (dados: Omit<PerfilUsuario, "uid">) => {
    if (!usuario) return;
    
    const sessao = {
      uid: usuario.uid,
      ...dados
    };
    
    localStorage.setItem('sessao_usuario', JSON.stringify(sessao));
  };

  // Get session from localStorage
  const obterSessao = (): PerfilUsuario | null => {
    const sessaoStr = localStorage.getItem('sessao_usuario');
    if (sessaoStr) {
      try {
        return JSON.parse(sessaoStr) as PerfilUsuario;
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  return {
    usuario: auth.currentUser,
    carregando,
    fazerLogin,
    cadastrarUsuario,
    fazerLogout,
    recuperarSenha,
    verificarAutenticacao,
    verificarAdmin,
    obterSessao,
    salvarSessao,
  };
}
