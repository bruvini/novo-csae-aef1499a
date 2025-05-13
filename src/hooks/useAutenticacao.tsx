
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '@/services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { buscarUsuarioPorUid } from '@/services/bancodados';
import { SessaoUsuario } from '@/types/usuario';

// Define the shape of our context
export interface AuthContextProps {
  usuario: SessaoUsuario | null;
  carregando: boolean;
  erro: string | null;
  registrar: (email: string, senha: string, dados: any) => Promise<SessaoUsuario | null>;
  entrar: (email: string, senha: string) => Promise<SessaoUsuario | null>;
  sair: () => Promise<void>;
  limparSessao: () => void;
  salvarSessao: (sessao: SessaoUsuario) => void;
  verificarAutenticacao: () => boolean;
  verificarAdmin: () => boolean;
  obterSessao: () => SessaoUsuario | null;
}

// Create the context with a default empty value
const AuthContext = createContext<AuthContextProps>({
  usuario: null,
  carregando: true,
  erro: null,
  registrar: async () => null,
  entrar: async () => null,
  sair: async () => {},
  limparSessao: () => {},
  salvarSessao: () => {},
  verificarAutenticacao: () => false,
  verificarAdmin: () => false,
  obterSessao: () => null
});

// Hook to use the auth context
export const useAutenticacao = () => useContext(AuthContext);

// Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [usuario, setUsuario] = useState<SessaoUsuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Check for user on initial load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Get user data from our database
        buscarUsuarioPorUid(user.uid)
          .then((userData) => {
            if (userData) {
              const sessao: SessaoUsuario = {
                uid: user.uid,
                email: user.email || '',
                nome: userData.nome || '',
                ehAdmin: userData.ehAdmin || false,
              };
              setUsuario(sessao);
              localStorage.setItem('userSession', JSON.stringify(sessao));
            } else {
              setUsuario(null);
              localStorage.removeItem('userSession');
            }
          })
          .catch((error) => {
            console.error("Error fetching user data:", error);
            setErro("Erro ao buscar dados do usuário");
          })
          .finally(() => {
            setCarregando(false);
          });
      } else {
        setUsuario(null);
        localStorage.removeItem('userSession');
        setCarregando(false);
      }
    });

    // Check for stored session if no active user
    const storedSession = localStorage.getItem('userSession');
    if (storedSession && !usuario) {
      setUsuario(JSON.parse(storedSession));
    }

    return () => unsubscribe();
  }, []);

  // Register function
  const registrar = async (email: string, senha: string, dados: any): Promise<SessaoUsuario | null> => {
    try {
      // This is a placeholder, we assume registerWithEmailAndPassword is imported from autenticacao.ts
      // In a real implementation, this would call the actual registration function
      const user = await import('@/services/autenticacao').then(m => m.registerWithEmailAndPassword(email, senha, dados));
      return user;
    } catch (error) {
      console.error("Registration error:", error);
      setErro("Erro ao registrar usuário");
      return null;
    }
  };

  // Login function
  const entrar = async (email: string, senha: string): Promise<SessaoUsuario | null> => {
    try {
      // Call login function from autenticacao.ts
      const user = await import('@/services/autenticacao').then(m => m.loginWithEmailAndPassword(email, senha));
      return user;
    } catch (error) {
      console.error("Login error:", error);
      setErro("Erro ao fazer login");
      return null;
    }
  };

  // Logout function
  const sair = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUsuario(null);
      localStorage.removeItem('userSession');
    } catch (error) {
      console.error("Logout error:", error);
      setErro("Erro ao fazer logout");
    }
  };

  // Save session
  const salvarSessao = (sessao: SessaoUsuario): void => {
    setUsuario(sessao);
    localStorage.setItem('userSession', JSON.stringify(sessao));
  };

  // Clear session
  const limparSessao = (): void => {
    setUsuario(null);
    localStorage.removeItem('userSession');
  };

  // Check if user is authenticated
  const verificarAutenticacao = (): boolean => {
    return usuario !== null;
  };

  // Check if user is admin
  const verificarAdmin = (): boolean => {
    return usuario?.ehAdmin || false;
  };

  // Get current session
  const obterSessao = (): SessaoUsuario | null => {
    if (usuario) return usuario;
    
    const storedSession = localStorage.getItem('userSession');
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      return parsed;
    }
    
    return null;
  };

  const value = {
    usuario,
    carregando,
    erro,
    registrar,
    entrar,
    sair,
    limparSessao,
    salvarSessao,
    verificarAutenticacao,
    verificarAdmin,
    obterSessao
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
