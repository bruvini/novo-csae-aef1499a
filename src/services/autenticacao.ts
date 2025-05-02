
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

// Interface para perfil de usuário do sistema
export interface PerfilUsuario {
  uid: string;
  email: string;
  nome: string;
  nomeUsuario: string;
  ehAdmin: boolean;
  atuaSMS: boolean;
}

// Hook para autenticação
export function useAutenticacao() {
  // Estado local para usuário autenticado
  let usuario: User | null = null;
  let perfilUsuario: PerfilUsuario | null = null;
  let carregando = false;

  // Verificar se o usuário está autenticado
  const verificarAutenticacao = (): boolean => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      usuario = currentUser;
      return true;
    }
    return false;
  };

  // Verificar se o usuário é admin
  const verificarAdmin = (): boolean => {
    const sessao = obterSessao();
    return sessao?.ehAdmin === true;
  };

  // Função para fazer login
  const fazerLogin = async (email: string, senha: string) => {
    try {
      carregando = true;
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      usuario = userCredential.user;
      
      // Buscar dados do usuário no Firestore
      const userDB = await buscarUsuarioPorUid(userCredential.user.uid);
      
      // Verificar status do usuário
      if (userDB && userDB.statusAcesso === 'Bloqueado') {
        await fazerLogout();
        return {
          sucesso: false,
          mensagem: "Sua conta está bloqueada. Entre em contato com o administrador."
        };
      }
      
      if (userDB && userDB.statusAcesso === 'Aguardando') {
        await fazerLogout();
        return {
          sucesso: false,
          mensagem: "Sua conta está aguardando aprovação. Tente novamente mais tarde."
        };
      }

      // Criar objeto de perfil do usuário
      if (userDB) {
        perfilUsuario = {
          uid: userDB.uid,
          email: userDB.email,
          nome: userDB.nome || "",
          ehAdmin: userDB.perfil === 'admin',
          atuaSMS: userDB.atuaSMS || false
        };
        
        // Salvar sessão no localStorage
        salvarSessao(perfilUsuario);
        
        // Registrar acesso (implementação fora do escopo)
        // await registrarAcesso(userDB.uid);
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

  // Função para cadastrar novo usuário
  const cadastrarUsuario = async (
    email: string,
    senha: string,
    dadosAdicionais: any
  ) => {
    try {
      // Criar usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      
      // Definir displayName
      await updateProfile(user, {
        displayName: dadosAdicionais.nomeCompleto || email.split('@')[0]
      });
      
      // Estruturar dados do usuário para salvar no Firestore
      const dadosUsuario: Omit<Usuario, 'dataCadastro' | 'statusAcesso'> = {
        uid: user.uid,
        nome: dadosAdicionais.nomeCompleto,
        email: email,
        perfil: 'usuario',
        foto: '',
        telefone: '',
        atuaSMS: dadosAdicionais.atuaSMS || false,
        dadosPessoais: {
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
          matricula: dadosAdicionais.matricula || '',
          cidadeTrabalho: dadosAdicionais.cidadeTrabalho || '',
          localCargo: dadosAdicionais.localCargo || '',
          lotacao: dadosAdicionais.lotacao || ''
        }
      };
      
      // Salvar no Firestore
      await cadastrarUsuarioDB(dadosUsuario);
      
      // Fazer logout pois o usuário precisa aguardar aprovação
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

  // Função para sair
  const fazerLogout = async () => {
    try {
      await signOut(auth);
      usuario = null;
      perfilUsuario = null;
      
      // Limpar sessão
      localStorage.removeItem('sessao_usuario');
      
      return { sucesso: true };
    } catch (error) {
      return { sucesso: false, mensagem: "Erro ao fazer logout." };
    }
  };

  // Função para recuperar senha
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

  // Função para salvar sessão do usuário no localStorage
  const salvarSessao = (dados: Omit<PerfilUsuario, "uid">) => {
    if (!usuario) return;
    
    const sessao = {
      uid: usuario.uid,
      ...dados
    };
    
    localStorage.setItem('sessao_usuario', JSON.stringify(sessao));
  };

  // Função para obter sessão do localStorage
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
