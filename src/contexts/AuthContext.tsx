import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, collection, query, where, getDocs, increment } from 'firebase/firestore';
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
  paginasPermitidas?: string[];
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

  // Função unificada para buscar documento do usuário
  const getUserDoc = async (uid: string) => {
    try {
      // Tentativa 1: busca direta usando UID como ID do documento
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('Documento encontrado por UID direto:', docSnap.data());
        return { id: docSnap.id, ...docSnap.data() } as Usuario & { id: string };
      }
      
      // Tentativa 2: busca por campo 'uid' na coleção
      console.log('Documento não encontrado por UID direto, tentando query por campo uid...');
      const q = query(collection(db, 'usuarios'), where('uid', '==', uid));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        const firstDoc = querySnap.docs[0];
        console.log('Documento encontrado por query uid:', firstDoc.data());
        return { id: firstDoc.id, ...firstDoc.data() } as Usuario & { id: string };
      }
      
      // Nenhum documento encontrado
      console.log('Nenhum documento encontrado para UID:', uid);
      return null;
      
    } catch (error) {
      console.error('Erro ao buscar documento do usuário:', error);
      throw error;
    }
  };

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

  // Função para carregar dados do usuário no Firestore
  const loadUserData = async (uid: string): Promise<void> => {
    try {
      console.log('Buscando dados do usuário com UID:', uid);
      
      const userDoc = await getUserDoc(uid);
      
      if (!userDoc) {
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
      await handleUserDocument(userDoc, uid);
      
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

  // Função para processar o documento do usuário com verificação case-insensitive
  const handleUserDocument = async (userDoc: Usuario & { id: string }, uid: string): Promise<void> => {
    console.log('Processando documento do usuário. Status original:', userDoc.statusAcesso);
    
    // Normalizar status para comparação case-insensitive
    const status = (userDoc.statusAcesso || '').toLowerCase();
    console.log('Status normalizado:', status);
    
    if (status === 'aguardando') {
      console.log('Status: aguardando - perfil em análise');
      toast({
        title: "Perfil em análise",
        description: "Seu perfil está em análise. Tente novamente mais tarde ou entre em contato pelo nosso Instagram @portalcsaefloripa",
        variant: "default",
        className: "bg-yellow-50 border-yellow-200",
      });
      
      await signOut(auth);
      setUser(null);
      setSessionData(null);
      localStorage.removeItem('csae_session');
      navigate('/login');
      return;
    }
    
    if (status === 'rejeitado' || status === 'recusado') {
      console.log('Status: rejeitado/recusado - acesso negado');
      toast({
        title: "Acesso negado",
        description: "Seu acesso foi negado. Entre em contato pelo nosso Instagram @portalcsaefloripa",
        variant: "destructive",
      });
      
      await signOut(auth);
      setUser(null);
      setSessionData(null);
      localStorage.removeItem('csae_session');
      navigate('/login');
      return;
    }
    
    if (status === 'aprovado' || status === 'liberado') {
      console.log('Status: aprovado/liberado - acesso permitido');
      
      // Garantir que usuários existentes tenham paginasPermitidas definidas
      let paginasPermitidas = userDoc.paginasPermitidas;
      if (!userDoc.ehAdmin && (!paginasPermitidas || paginasPermitidas.length === 0)) {
        // Usuário comum sem páginas definidas - definir páginas padrão
        paginasPermitidas = ['ProcessoEnfermagem'];
        
        // Atualizar no Firestore
        try {
          const updateRef = doc(db, 'usuarios', userDoc.id);
          await updateDoc(updateRef, { paginasPermitidas });
          console.log('Páginas padrão definidas para usuário comum');
        } catch (error) {
          console.error('Erro ao definir páginas padrão:', error);
        }
      }
      
      // Criar objeto de sessão
      const session: SessionData = {
        nomeCompleto: userDoc.dadosPessoais.nomeCompleto,
        tipoUsuario: userDoc.tipoUsuario,
        uid: uid,
        statusAcesso: userDoc.statusAcesso,
        ehAdmin: userDoc.ehAdmin,
        gestorConteudos: userDoc.gestorConteudos,
        email: userDoc.email,
        paginasPermitidas: userDoc.ehAdmin ? [] : paginasPermitidas
      };
      
      // Salvar no localStorage e estado
      localStorage.setItem('csae_session', JSON.stringify(session));
      setSessionData(session);
      
      console.log('Usuário autorizado. Sessão criada:', session);
      return;
    }
    
    // Status não reconhecido
    console.log('Status não reconhecido:', userDoc.statusAcesso);
    toast({
      title: "Status inválido",
      description: "Status de acesso não reconhecido. Entre em contato com o suporte.",
      variant: "destructive",
    });
    
    await signOut(auth);
    setUser(null);
    setSessionData(null);
    localStorage.removeItem('csae_session');
    navigate('/login');
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
      const userDoc = await getUserDoc(user.uid);

      if (!userDoc) {
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

      // Verificar status com comparação case-insensitive
      const status = (userDoc.statusAcesso || '').toLowerCase();
      console.log('Status do usuário no login:', userDoc.statusAcesso, '(normalizado:', status + ')');

      if (status === 'aguardando') {
        await signOut(auth);
        toast({
          title: "Perfil em análise",
          description: "Seu perfil está em análise. Tente novamente mais tarde ou entre em contato pelo nosso Instagram @portalcsaefloripa",
          variant: "default",
          className: "bg-yellow-50 border-yellow-200",
        });
        return;
      }

      if (status === 'rejeitado' || status === 'recusado') {
        await signOut(auth);
        toast({
          title: "Acesso negado",
          description: "Seu acesso foi negado. Entre em contato pelo nosso Instagram @portalcsaefloripa",
          variant: "destructive",
        });
        return;
      }

      if (status !== 'aprovado' && status !== 'liberado') {
        await signOut(auth);
        toast({
          title: "Status inválido",
          description: "Status de acesso não reconhecido. Entre em contato com o suporte.",
          variant: "destructive",
        });
        return;
      }

      // Status aprovado - registrar histórico de acesso
      try {
        const updateRef = doc(db, 'usuarios', userDoc.id);
        await updateDoc(updateRef, {
          historicoAcesso: arrayUnion({
            dataHora: serverTimestamp(),
            ip: 'N/A',
          }),
          totalAcessos: increment(1)
        });
        console.log('Histórico de acesso registrado com sucesso');
      } catch (error) {
        console.error('Erro ao registrar histórico de acesso:', error);
        // Não impedir o login por erro no histórico
      }

      // Garantir que usuários existentes tenham paginasPermitidas definidas
      let paginasPermitidas = userDoc.paginasPermitidas;
      if (!userDoc.ehAdmin && (!paginasPermitidas || paginasPermitidas.length === 0)) {
        paginasPermitidas = ['ProcessoEnfermagem'];
        
        // Atualizar no Firestore
        try {
          const updateRef = doc(db, 'usuarios', userDoc.id);
          await updateDoc(updateRef, { paginasPermitidas });
          console.log('Páginas padrão definidas para usuário comum');
        } catch (error) {
          console.error('Erro ao definir páginas padrão:', error);
        }
      }

      // Criar sessão
      const session: SessionData = {
        nomeCompleto: userDoc.dadosPessoais.nomeCompleto,
        tipoUsuario: userDoc.tipoUsuario,
        uid: user.uid,
        statusAcesso: userDoc.statusAcesso,
        ehAdmin: userDoc.ehAdmin,
        gestorConteudos: userDoc.gestorConteudos,
        email: userDoc.email,
        paginasPermitidas: userDoc.ehAdmin ? [] : paginasPermitidas
      };

      localStorage.setItem('csae_session', JSON.stringify(session));
      setSessionData(session);

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a), ${userDoc.dadosPessoais.nomeCompleto}!`,
        variant: "default",
        className: "bg-green-50 border-green-200",
      });

      navigate('/dashboard');
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
    isAuthenticated: !!(user && sessionData && (sessionData.statusAcesso.toLowerCase() === 'aprovado' || sessionData.statusAcesso.toLowerCase() === 'liberado')),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
