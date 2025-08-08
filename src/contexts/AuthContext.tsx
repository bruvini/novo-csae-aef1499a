
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Usuario } from '@/types/usuario';

interface SessionData {
  nomeCompleto: string;
  tipoUsuario: string;
  uid: string;
  statusAcesso: string;
  ehAdmin: boolean;
  gestorConteudos: boolean;
  email: string;
}

interface AuthContextType {
  user: User | null;
  sessionData: SessionData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Carregar dados da sessão do localStorage ao iniciar
  useEffect(() => {
    const savedSession = localStorage.getItem('csae_session');
    if (savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        setSessionData(parsedSession);
      } catch (error) {
        console.error('Erro ao carregar sessão do localStorage:', error);
        localStorage.removeItem('csae_session');
      }
    }
  }, []);

  // Configurar persistência e monitorar estado de autenticação
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Configurar persistência local
        await setPersistence(auth, browserLocalPersistence);
        
        // Monitorar mudanças no estado de autenticação
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log('Auth state changed:', user?.uid);
          
          if (user) {
            try {
              // Buscar dados do usuário no Firestore
              const userDocRef = doc(db, 'usuarios', user.uid);
              const userDoc = await getDoc(userDocRef);
              
              if (userDoc.exists()) {
                const userData = userDoc.data() as Usuario;
                console.log('User data from Firestore:', userData);
                
                // Verificar status de acesso
                if (userData.statusAcesso === 'Liberado') {
                  // Criar objeto de sessão
                  const session: SessionData = {
                    nomeCompleto: userData.dadosPessoais.nomeCompleto,
                    tipoUsuario: userData.tipoUsuario,
                    uid: user.uid,
                    statusAcesso: userData.statusAcesso,
                    ehAdmin: userData.ehAdmin,
                    gestorConteudos: userData.gestorConteudos,
                    email: userData.email,
                  };
                  
                  // Salvar no localStorage e estado
                  localStorage.setItem('csae_session', JSON.stringify(session));
                  setSessionData(session);
                  setUser(user);
                } else {
                  // Status não aprovado - fazer logout
                  console.log('User status not approved:', userData.statusAcesso);
                  await signOut(auth);
                  setUser(null);
                  setSessionData(null);
                  localStorage.removeItem('csae_session');
                  navigate('/login');
                }
              } else {
                // Documento do usuário não existe
                console.log('User document not found');
                await signOut(auth);
                setUser(null);
                setSessionData(null);
                localStorage.removeItem('csae_session');
                navigate('/login');
              }
            } catch (error) {
              console.error('Erro ao buscar dados do usuário:', error);
              await signOut(auth);
              setUser(null);
              setSessionData(null);
              localStorage.removeItem('csae_session');
              navigate('/login');
            }
          } else {
            // Não há usuário autenticado
            setUser(null);
            setSessionData(null);
            localStorage.removeItem('csae_session');
            
            // Redirecionar para login se não estiver já lá
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && currentPath !== '/registrar') {
              navigate('/login');
            }
          }
          
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Buscar dados do usuário no Firestore
      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await signOut(auth);
        toast({
          title: "Erro de autenticação",
          description: "Dados do usuário não encontrados. Entre em contato com o suporte.",
          variant: "destructive",
        });
        return;
      }

      const userData = userDoc.data() as Usuario;

      if (userData.statusAcesso === 'Aguardando') {
        await signOut(auth);
        toast({
          title: "Perfil em análise",
          description: "Seu perfil está em análise. Tente novamente mais tarde ou entre em contato pelo nosso Instagram @portalcsaefloripa",
          variant: "default",
          className: "bg-yellow-50 border-yellow-200",
        });
        return;
      }

      if (userData.statusAcesso !== 'Liberado') {
        await signOut(auth);
        toast({
          title: "Acesso negado",
          description: "Seu acesso foi negado. Entre em contato pelo nosso Instagram @portalcsaefloripa",
          variant: "destructive",
        });
        return;
      }

      // Registrar histórico de acesso
      await updateDoc(userDocRef, {
        historicoAcesso: arrayUnion({
          dataHora: serverTimestamp(),
          ip: 'N/A', // Pode ser implementado posteriormente
        })
      });

      // Criar sessão
      const session: SessionData = {
        nomeCompleto: userData.dadosPessoais.nomeCompleto,
        tipoUsuario: userData.tipoUsuario,
        uid: user.uid,
        statusAcesso: userData.statusAcesso,
        ehAdmin: userData.ehAdmin,
        gestorConteudos: userData.gestorConteudos,
        email: userData.email,
      };

      localStorage.setItem('csae_session', JSON.stringify(session));
      setSessionData(session);

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a), ${userData.dadosPessoais.nomeCompleto}!`,
        variant: "default",
        className: "bg-green-50 border-green-200",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Erro no login:', error);
      let errorMessage = "Erro ao efetuar login. Tente novamente mais tarde.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "Este e-mail não está cadastrado. Faça seu cadastro!";
        // Sinalizar para destacar botão de cadastro
        toast({
          title: "E-mail não encontrado",
          description: errorMessage,
          variant: "destructive",
          action: (
            <button 
              onClick={() => navigate('/registrar')}
              className="bg-csae-green-600 text-white px-3 py-1 rounded text-sm hover:bg-csae-green-700"
            >
              Cadastrar-se
            </button>
          ),
        });
        return;
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Senha incorreta! Verifique e tente novamente.";
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = "Credenciais inválidas. Verifique seus dados e tente novamente.";
      }

      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setSessionData(null);
      localStorage.removeItem('csae_session');
      
      toast({
        title: "Logout realizado",
        description: "Você saiu da sessão.",
        variant: "default",
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro ao sair. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    sessionData,
    loading,
    login,
    logout,
    isAuthenticated: !!(user && sessionData && sessionData.statusAcesso === 'Liberado'),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
