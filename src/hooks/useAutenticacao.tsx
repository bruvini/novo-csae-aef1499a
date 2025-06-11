
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { 
  verificarAutenticacao, 
  realizarLogin, 
  realizarLogout, 
  realizarCadastro, 
  recuperarSenha, 
  SessaoUsuario 
} from '@/services/autenticacao';
import { auth } from '@/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextProps {
  usuario: SessaoUsuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<SessaoUsuario>;
  cadastrar: (email: string, senha: string, nome: string, sobrenome: string, instituicao: string) => Promise<SessaoUsuario>;
  logout: () => Promise<void>;
  resetarSenha: (email: string) => Promise<void>;
  ehAdmin: boolean;
  ehGestorConteudos: boolean;
  // Add missing methods
  entrar: (email: string, senha: string) => Promise<SessaoUsuario>;
  sair: () => Promise<void>;
  registrar: (email: string, senha: string, nome: string, sobrenome: string, instituicao: string) => Promise<SessaoUsuario>;
  verificarAutenticacao: () => SessaoUsuario | null;
  verificarAdmin: () => boolean;
  obterSessao: () => SessaoUsuario | null;
  limparSessao: () => void;
  salvarSessao: (sessao: SessaoUsuario) => void;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<SessaoUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [ehAdmin, setEhAdmin] = useState(false);
  const [ehGestorConteudos, setEhGestorConteudos] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const sessao = await verificarAutenticacao();
        setUsuario(sessao);
        setEhAdmin(sessao?.tipoUsuario === 'Administrador' || !!sessao?.usuario?.ehAdmin);
        setEhGestorConteudos(!!sessao?.usuario?.gestorConteudos);
      } else {
        setUsuario(null);
        setEhAdmin(false);
        setEhGestorConteudos(false);
      }
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, senha: string): Promise<SessaoUsuario> => {
    setCarregando(true);
    try {
      const sessao = await realizarLogin(email, senha);
      setUsuario(sessao);
      setEhAdmin(sessao.tipoUsuario === 'Administrador' || !!sessao.usuario?.ehAdmin);
      setEhGestorConteudos(!!sessao.usuario?.gestorConteudos);
      return sessao;
    } finally {
      setCarregando(false);
    }
  };

  const cadastrar = async (email: string, senha: string, nome: string, sobrenome: string, instituicao: string): Promise<SessaoUsuario> => {
    setCarregando(true);
    try {
      const sessao = await realizarCadastro(email, senha, nome, sobrenome, instituicao);
      setUsuario(sessao);
      return sessao;
    } finally {
      setCarregando(false);
    }
  };

  const logout = async (): Promise<void> => {
    setCarregando(true);
    try {
      await realizarLogout();
      setUsuario(null);
      setEhAdmin(false);
      setEhGestorConteudos(false);
    } finally {
      setCarregando(false);
    }
  };

  const resetarSenha = async (email: string): Promise<void> => {
    await recuperarSenha(email);
  };

  // Implementation of missing methods
  const verificarAutenticacaoLocal = (): SessaoUsuario | null => {
    return usuario;
  };

  const verificarAdminLocal = (): boolean => {
    return ehAdmin;
  };

  const obterSessao = (): SessaoUsuario | null => {
    const sessaoArmazenada = localStorage.getItem('sessaoUsuario');
    if (sessaoArmazenada) {
      try {
        return JSON.parse(sessaoArmazenada);
      } catch (error) {
        console.error('Erro ao obter sessão:', error);
        return null;
      }
    }
    return usuario;
  };

  const limparSessao = (): void => {
    localStorage.removeItem('sessaoUsuario');
    localStorage.removeItem('usuario');
    setUsuario(null);
    setEhAdmin(false);
    setEhGestorConteudos(false);
  };

  const salvarSessao = (sessao: SessaoUsuario): void => {
    localStorage.setItem('sessaoUsuario', JSON.stringify(sessao));
    setUsuario(sessao);
    setEhAdmin(sessao.tipoUsuario === 'Administrador' || !!sessao.usuario?.ehAdmin);
    setEhGestorConteudos(!!sessao.usuario?.gestorConteudos);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        login,
        cadastrar,
        logout,
        resetarSenha,
        ehAdmin,
        ehGestorConteudos,
        // Add missing method implementations
        entrar: login,
        sair: logout,
        registrar: cadastrar,
        verificarAutenticacao: verificarAutenticacaoLocal,
        verificarAdmin: verificarAdminLocal,
        obterSessao,
        limparSessao,
        salvarSessao
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAutenticacao = () => useContext(AuthContext);

export default useAutenticacao;
