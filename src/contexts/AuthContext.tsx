
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
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

  // Função para buscar dados do usuário no Firestore
  const loadUserData = async (uid: string): Promise<void> => {
    try {
      console.log('Buscando dados do usuário com UID:', uid);
      
      // Busca direta usando UID como ID do documento
      let userDocRef = doc(db, 'usuarios', uid);
      let userDocSnap = await getDoc(userDocRef);
      
      let userData;
      let docId;
      
      if (userDocSnap.exists()) {
        userData = userDocSnap.data() as Usuario;
        docId = userDocSnap.id;
        console.log('Documento encontrado por UID direto:', userData);
      } else {
        console.log('Documento não encontrado por UID direto, tentando busca por campo uid...');
        
        // Fallback: busca por campo 'uid' na coleção
        const q = query(collection(db, 'usuarios'), where('uid', '==', uid));
        const querySnap = await getDocs(q);
        
        if (!querySnap.empty) {
          const firstDoc = querySnap.docs[0];
          userData = firstDoc.data() as Usuario;
          docId = firstDoc.id;
          console.log('Documento encontrado por query uid:', userData);
        }
      }

      if (!userData) {
        console.log('Documento do usuário não encontrado');
        toast({
          title: "Cadastro não localizado",
          description: "Seu cadastro não foi localizado. Entre em contato com o suporte pelo nosso Instagram @portalcsaefloripa ou faça seu cadastro.",
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
        
        await signOut(auth);
        setUser(null);
        setSessionData(null);
        localStorage.removeItem('csae_session');
        navigate('/login');
        return;
      }

      // Processar documento do usuário
      await handleUserDocument(userData, uid, docId);
      
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      toast({
        title: "Erro de conexão",
        description: "Erro ao carregar dados do usuário. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
      
      await signOut(auth);
      setUser(null);
      setSessionData(null);
      localStorage.removeItem('csae_session');
      navigate('/login');
    }
  };

  // Função para processar o documento do usuário
  const handleUserDocument = async (userData: Usuario, uid: string, docId: string): Promise<void> => {
    console.log('Processando documento do usuário. Status:', userData.statusAcesso);
    
    if (userData.statusAcesso === 'Liberado') {
      // Criar objeto de sessão
      const session: SessionData = {
        nomeCompleto: userData.dadosPessoais.nomeCompleto,
        tipoUsuario: userData.tipoUsuario,
        uid: uid,
        statusAcesso: userData.statusAcesso,
        ehAdmin: userData.ehAdmin,
        gestorConteudos: userData.gestorConteudos,
        email: userData.email,
      };
      
      // Salvar no localStorage e estado
      localStorage.setItem('csae_session', JSON.stringify(session));
      setSessionData(session);
      
      console.log('Usuário autorizado. Sessão criada:', session);
    } else {
      // Status não liberado
      console.log('Status de acesso não liberado:', userData.statusAcesso);
      
      let message = "Seu perfil está em análise. Tente novamente mais tarde ou entre em contato pelo nosso Instagram @portalcsaefloripa";
      let variant: "default" | "destructive" = "default";
      let className = "bg-yellow-50 border-yellow-200";
      
      if (userData.statusAcesso === 'Recusado') {
        message = "Seu acesso foi negado. Entre em contato pelo nosso Instagram @portalcsaefloripa";
        variant = "destructive";
        className = "";
      }
      
      toast({
        title: userData.statusAcesso === 'Recusado' ? "Acesso negado" : "Perfil em análise",
        description: message,
        variant: variant,
        className: className,
      });
      
      await signOut(auth);
      setUser(null);
      setSessionData(null);
      localStorage.removeItem('csae_session');
      navigate('/login');
    }
  };

  // Configurar persistência e monitorar estado de autenticação
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Configurar persistência local
        await setPersistence(auth, browserLocalPersistence);
        
        // Monitorar mudanças no estado de autenticação
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log('Auth state changed. User:', user?.uid);
          
          if (user) {
            // Usuário autenticado - buscar dados
            setUser(user);
            await loadUserData(user.uid);
          } else {
            // Usuário não autenticado
            console.log('Nenhum usuário autenticado');
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
      console.log('Tentando fazer login com:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('Login realizado. UID:', user.uid);

      // Buscar dados do usuário no Firestore
      let userDocRef = doc(db, 'usuarios', user.uid);
      let userDocSnap = await getDoc(userDocRef);
      
      let userData;
      let docId;
      
      if (userDocSnap.exists()) {
        userData = userDocSnap.data() as Usuario;
        docId = userDocSnap.id;
      } else {
        // Fallback: busca por campo 'uid'
        const q = query(collection(db, 'usuarios'), where('uid', '==', user.uid));
        const querySnap = await getDocs(q);
        
        if (!querySnap.empty) {
          const firstDoc = querySnap.docs[0];
          userData = firstDoc.data() as Usuario;
          docId = firstDoc.id;
        }
      }

      if (!userData) {
        await signOut(auth);
        toast({
          title: "Cadastro não encontrado",
          description: "Seus dados não foram encontrados. Entre em contato com o suporte pelo nosso Instagram @portalcsaefloripa",
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
      }

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

      if (userData.statusAcesso === 'Recusado') {
        await signOut(auth);
        toast({
          title: "Acesso negado",
          description: "Seu acesso foi negado. Entre em contato pelo nosso Instagram @portalcsaefloripa",
          variant: "destructive",
        });
        return;
      }

      if (userData.statusAcesso !== 'Liberado') {
        await signOut(auth);
        toast({
          title: "Status inválido",
          description: "Status de acesso não reconhecido. Entre em contato com o suporte.",
          variant: "destructive",
        });
        return;
      }

      // Registrar histórico de acesso
      try {
        const updateRef = doc(db, 'usuarios', docId);
        await updateDoc(updateRef, {
          historicoAcesso: arrayUnion({
            dataHora: serverTimestamp(),
            ip: 'N/A',
          })
        });
      } catch (error) {
        console.error('Erro ao registrar histórico de acesso:', error);
        // Não impedir o login por erro no histórico
      }

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
