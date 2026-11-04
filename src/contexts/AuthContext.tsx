import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut, reload, getIdToken, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, increment, collection, query, where, getDocs, runTransaction, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/services/firebase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Usuario } from '@/types/usuario';
import { verificarElegibilidadeNPS } from '@/services/bancodados/suporteDB';
import { chaveDataSaoPaulo, deveContabilizarLogin, planejarRegistroLogin, tentarRegistrarLogin } from '@/utils/accessMetrics';

const NPS_PENDENTE_KEY = 'csae_nps_pendente';

interface SessionData {
  nomeCompleto: string;
  tipoUsuario: string;
  uid: string;
  statusAcesso: string;
  ehAdmin: boolean;
  gestorConteudos: boolean;
  email: string;
  paginasPermitidas?: string[];
  numeroCoren?: string;
  ufCoren?: string;
}

interface AuthContextType {
  user: User | null;
  sessionData: SessionData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  npsModalPendente: boolean;
  concluirNPSObrigatorio: () => void;
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
  const [npsModalPendente, setNpsModalPendente] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Função unificada para buscar documento do usuário
  const getUserDoc = async (uid: string) => {
    try {
      // Tentativa 1: busca direta usando UID como ID do documento
      const docRef = doc(db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('Documento do usuário localizado pelo ID.');
        return { id: docSnap.id, ...docSnap.data() } as Usuario & { id: string };
      }
      
      // Tentativa 2: busca por campo 'uid' na coleção
      console.log('Documento não encontrado por UID direto, tentando query por campo uid...');
      const q = query(collection(db, 'usuarios'), where('uid', '==', uid));
      const querySnap = await getDocs(q);
      
      if (!querySnap.empty) {
        const firstDoc = querySnap.docs[0];
        console.log('Documento do usuário localizado pelo campo UID.');
        return { id: firstDoc.id, ...firstDoc.data() } as Usuario & { id: string };
      }
      
      // Nenhum documento encontrado
      console.log('Nenhum perfil correspondente foi localizado.');
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
        // Verificar se há avaliação NPS pendente para este usuário
        const npsPendente = localStorage.getItem(NPS_PENDENTE_KEY);
        if (npsPendente === parsedSession.uid) {
          setNpsModalPendente(true);
        }
      } catch (error) {
        console.error('Erro ao carregar sessão do localStorage:', error);
        localStorage.removeItem('csae_session');
      }
    }
  }, []);

  // Função para carregar dados do usuário no Firestore
  const loadUserData = async (uid: string): Promise<void> => {
    try {
      console.log('Buscando perfil do usuário autenticado.');
      
      const userDoc = await getUserDoc(uid);
      
      if (!userDoc) {
        console.log('Documento do usuário não encontrado');
        toast({
          title: "Cadastro não localizado",
          description: "Não encontramos um perfil vinculado a esta conta. Se você já tentou se cadastrar, não crie outra conta nem use outro e-mail. Fale com gerenf.sms.pmf@gmail.com ou @portalcsaefloripa para verificarmos a situação.",
          variant: "destructive",
        });
        
        await signOut(auth);
        setUser(null);
        setSessionData(null);
        localStorage.removeItem('csae_session');
        navigate('/login');
        return;
      }

      // Sincronizar o e-mail confirmado pelo Firebase Authentication (unicidade no Auth).
      const authUser = auth.currentUser;
      if (authUser?.uid === uid) {
        await reload(authUser);
        if (authUser.emailVerified && authUser.email &&
          authUser.email.toLowerCase() !== userDoc.email.toLowerCase()) {
          await getIdToken(authUser, true);
          const novoEmail = authUser.email.toLowerCase();
          await updateDoc(doc(db, 'usuarios', userDoc.id), { email: novoEmail });
          userDoc.email = novoEmail;
        }
      }
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
    
    if (status === 'aguardandorevisaocadastro') {
      toast({
        title: "Atualização profissional em análise",
        description: "Sua conta está temporariamente suspensa até a decisão da equipe.",
        variant: "default",
      });
      await signOut(auth);
      setUser(null);
      setSessionData(null);
      localStorage.removeItem('csae_session');
      navigate('/login');
      return;
    }

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

    if (status === 'revogado') {
      toast({
        title: "Acesso revogado",
        description: "Seu acesso ao Portal foi revogado. Entre em contato com a equipe responsável para solicitar uma revisão.",
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
        paginasPermitidas: userDoc.ehAdmin ? [] : paginasPermitidas,
        numeroCoren: userDoc.dadosProfissionais?.numeroCoren,
        ufCoren: userDoc.dadosProfissionais?.ufCoren
      };
      
      // Salvar no localStorage e estado
      localStorage.setItem('csae_session', JSON.stringify(session));
      setSessionData(session);
      
      console.log('Sessão autorizada e carregada.');
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
        await setPersistence(auth, browserSessionPersistence);
        
        // Monitorar mudanças no estado de autenticação
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log('Estado de autenticação atualizado.');
          
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

      if (status === 'revogado') {
        await signOut(auth);
        toast({
          title: "Acesso revogado",
          description: "Seu acesso ao Portal foi revogado. Entre em contato com a equipe responsável para solicitar uma revisão.",
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

      // Só o login explícito registra acesso. Restauração por onAuthStateChanged
      // e recarregamentos não geram outro evento.
      const updateRef = doc(db, 'usuarios', userDoc.id);
      const novoTotalAcessos = await tentarRegistrarLogin(async () => {
        if (!deveContabilizarLogin('login_explicito')) return null;
        return runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(updateRef);
          if (!snapshot.exists()) throw new Error('Perfil de acesso não encontrado durante o registro do login.');
          const dadosAtuais = snapshot.data();
          const planoRegistro = planejarRegistroLogin(dadosAtuais.totalAcessos, dadosAtuais.historicoAcesso);
          const totalAtual = planoRegistro.proximoTotal - 1;
          if (Object.prototype.hasOwnProperty.call(dadosAtuais, 'totalAcessos') && totalAtual !== dadosAtuais.totalAcessos) {
            throw new Error('O contador legado de acessos não é um número inteiro válido.');
          }
          const atualizacao: Record<string, unknown> = {
            totalAcessos: totalAtual + 1,
            ultimoAcesso: serverTimestamp(),
          };
          // O número sequencial torna a gravação idempotente por usuário.
          const eventoRef = doc(db, 'eventosAcesso', `${user.uid}_${totalAtual + 1}`);
          const dia = chaveDataSaoPaulo(new Date());
          const diarioRef = doc(db, 'acessosDiarios', dia);
          // Os dados diários só podem ser lidos por administradores de BI.
          // Incrementar atomicamente sem leitura evita falha por permissão
          // para profissionais comuns e é seguro sob logins concorrentes.
          transaction.update(updateRef, atualizacao);
          transaction.set(eventoRef, { uid: user.uid, numero: totalAtual + 1, dia, dataHora: serverTimestamp() });
          transaction.set(diarioRef, { dia, total: increment(1), ultimoEvento: eventoRef.id }, { merge: true });
          return totalAtual + 1;
        });
      }, (error) => {
        console.error('[Auth] O login foi concluído, mas o acesso não foi contabilizado:', error);
        toast({
          title: 'Login realizado com ressalva',
          description: 'Não foi possível registrar este login nas estatísticas. O acesso ao Portal continua disponível.',
          variant: 'default',
        });
      });
      if (novoTotalAcessos !== null) {
        console.log(`[Auth] Acesso registrado para UID: ${user.uid}`);
      }

      // ── Verificar gatilho de NPS obrigatório (a cada 10 acessos) ──
      try {
        if (novoTotalAcessos && novoTotalAcessos % 10 === 0) {
          const elegivel = await verificarElegibilidadeNPS(user.uid);
          if (elegivel) {
            localStorage.setItem(NPS_PENDENTE_KEY, user.uid);
            setNpsModalPendente(true);
            console.log(`[Auth] NPS obrigatório ativado (acesso #${novoTotalAcessos})`);
          }
        }
      } catch (npsError) {
        // Nunca bloquear o login por erro no NPS
        console.error('[Auth] Erro ao verificar elegibilidade NPS:', npsError);
      }

      // Garantir que usuários existentes tenham paginasPermitidas definidas
      let paginasPermitidas = userDoc.paginasPermitidas;
      if (!userDoc.ehAdmin && (!paginasPermitidas || paginasPermitidas.length === 0)) {
        paginasPermitidas = ['ProcessoEnfermagem'];
        
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
        paginasPermitidas: userDoc.ehAdmin ? [] : paginasPermitidas,
        numeroCoren: userDoc.dadosProfissionais?.numeroCoren,
        ufCoren: userDoc.dadosProfissionais?.ufCoren
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
    } catch (error: unknown) {
      console.error('Erro no login:', error);
      let errorMessage = "Erro ao efetuar login. Tente novamente mais tarde.";
      const errorCode = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
        ? error.code
        : '';
      
      if (errorCode === 'auth/user-not-found') {
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
      } else if (errorCode === 'auth/wrong-password') {
        errorMessage = "Senha incorreta! Verifique e tente novamente.";
      } else if (errorCode === 'auth/invalid-credential') {
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

  const concluirNPSObrigatorio = () => {
    localStorage.removeItem(NPS_PENDENTE_KEY);
    setNpsModalPendente(false);
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setSessionData(null);
      setNpsModalPendente(false);
      localStorage.removeItem('csae_session');
      localStorage.removeItem(NPS_PENDENTE_KEY);
      
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
    npsModalPendente,
    concluirNPSObrigatorio,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
