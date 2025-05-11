
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
        setEhAdmin(!!sessao?.ehAdmin);
        setEhGestorConteudos(!!sessao?.gestorConteudos);
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
      setEhAdmin(!!sessao.ehAdmin);
      setEhGestorConteudos(!!sessao.gestorConteudos);
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
        ehGestorConteudos
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAutenticacao = () => useContext(AuthContext);

export default useAutenticacao;
