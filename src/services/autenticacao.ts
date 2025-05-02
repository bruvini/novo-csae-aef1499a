
import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { buscarUsuarioPorUid } from './bancodados/usuariosDB';

interface Sessao {
  uid: string;
  email: string;
  nomeUsuario: string;
  tipoUsuario: string;
  statusAcesso: string;
  dataExpiracao: number;
  atuaSMS?: boolean;
}

export const useAutenticacao = () => {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);

  useEffect(() => {
    console.info('Inicializando listener de autenticação');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.info('Estado de autenticação alterado: Autenticado');
        setUsuario(user);
      } else {
        console.info('Estado de autenticação alterado: Não autenticado');
        setUsuario(null);
        localStorage.removeItem('sessao');
      }
      
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  const obterSessao = (): Sessao | null => {
    const sessaoJSON = localStorage.getItem('sessao');
    
    if (sessaoJSON) {
      try {
        const sessao = JSON.parse(sessaoJSON);
        console.info('Sessão obtida do localStorage:', sessao);
        
        // Verificar se a sessão expirou
        if (sessao.dataExpiracao && Date.now() > sessao.dataExpiracao) {
          console.warn('Sessão expirada');
          localStorage.removeItem('sessao');
          return null;
        }
        
        return sessao;
      } catch (error) {
        console.error('Erro ao obter sessão do localStorage:', error);
        return null;
      }
    }
    
    return null;
  };

  const verificarAutenticacao = (): boolean => {
    const sessao = obterSessao();
    
    if (sessao) {
      console.info('Sessão existente:', sessao);
      return true;
    }
    
    return false;
  };

  const verificarAdmin = (): boolean => {
    const sessao = obterSessao();
    return sessao?.tipoUsuario === 'Administrador';
  };

  // Renomeado para fazerLogin para manter compatibilidade com os métodos existentes
  const fazerLogin = async (email: string, senha: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, senha);
      const usuarioAuth = userCredential.user;
      
      const usuarioDB = await buscarUsuarioPorUid(usuarioAuth.uid);
      
      if (!usuarioDB) {
        throw new Error('Usuário não encontrado na base de dados.');
      }
      
      if (usuarioDB.statusAcesso !== 'Aprovado') {
        throw new Error(`Acesso ${usuarioDB.statusAcesso.toLowerCase()}. Entre em contato com um administrador.`);
      }
      
      // Definir prazo de expiração da sessão em 30 dias
      const dataExpiracao = Date.now() + 30 * 24 * 60 * 60 * 1000;
      
      // Gravar dados da sessão no localStorage
      const sessao: Sessao = {
        uid: usuarioAuth.uid,
        email: usuarioAuth.email || '',
        nomeUsuario: usuarioDB.nomeCompleto,
        tipoUsuario: usuarioDB.tipoUsuario,
        statusAcesso: usuarioDB.statusAcesso,
        dataExpiracao,
        atuaSMS: usuarioDB.atuaSMS
      };
      
      localStorage.setItem('sessao', JSON.stringify(sessao));
      
      return { sucesso: true };
    } catch (error: any) {
      let mensagemErro = 'Erro ao fazer login. Tente novamente.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        mensagemErro = 'E-mail ou senha inválidos.';
      } else if (error.code === 'auth/too-many-requests') {
        mensagemErro = 'Muitas tentativas de login. Tente novamente mais tarde.';
      } else if (error.message) {
        mensagemErro = error.message;
      }
      
      return { 
        sucesso: false, 
        mensagem: mensagemErro
      };
    }
  };

  // Renomeado para fazerLogout para manter compatibilidade
  const fazerLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('sessao');
      return { sucesso: true };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      return { 
        sucesso: false, 
        mensagem: 'Erro ao fazer logout. Tente novamente.'
      };
    }
  };

  // Aliases para manter compatibilidade com os códigos que usam os nomes antigos
  const entrar = fazerLogin;
  const sair = fazerLogout;
  const limparSessao = () => localStorage.removeItem('sessao');
  const salvarSessao = (dados: Omit<Sessao, 'dataExpiracao'>) => {
    const dataExpiracao = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem('sessao', JSON.stringify({...dados, dataExpiracao}));
  };

  return {
    usuario,
    carregando,
    fazerLogin,
    fazerLogout,
    verificarAutenticacao,
    verificarAdmin,
    obterSessao,
    // Exportar aliases
    entrar,
    sair,
    limparSessao,
    salvarSessao
  };
};
