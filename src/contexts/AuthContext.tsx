import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  increment,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/services/firebase";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Usuario } from "@/types/usuario";
import { verificarElegibilidadeNPS } from "@/services/bancodados/suporteDB";
import { cadastroEmAndamento } from "@/utils/registrationFlow";
import { paginasPadraoPorTipo, PERMISSION_SCHEMA_VERSION } from "@/lib/pages";

const NPS_PENDENTE_KEY = "csae_nps_pendente";

const garantirPermissoesAtuais = async (usuario: Usuario & { id: string }) => {
  const paginasAtuais = usuario.paginasPermitidas || [];
  if ((usuario.versaoPermissoes || 0) >= PERMISSION_SCHEMA_VERSION) {
    return paginasAtuais;
  }

  const paginasPermitidas = usuario.ehAdmin
    ? paginasPadraoPorTipo(true)
    : [...new Set([...paginasPadraoPorTipo(false), ...paginasAtuais])];

  try {
    await updateDoc(doc(db, "usuarios", usuario.id), {
      paginasPermitidas,
      versaoPermissoes: PERMISSION_SCHEMA_VERSION,
    });
  } catch (error) {
    console.error("Erro ao atualizar o padrão de permissões:", error);
  }

  return paginasPermitidas;
};

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
  atualizarNomeSessao: (nomeCompleto: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
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
      const docRef = doc(db, "usuarios", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("Documento encontrado por UID direto:", docSnap.data());
        return { id: docSnap.id, ...docSnap.data() } as Usuario & {
          id: string;
        };
      }

      // Tentativa 2: busca por campo 'uid' na coleção
      console.log(
        "Documento não encontrado por UID direto, tentando query por campo uid...",
      );
      const q = query(collection(db, "usuarios"), where("uid", "==", uid));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        const firstDoc = querySnap.docs[0];
        console.log("Documento encontrado por query uid:", firstDoc.data());
        return { id: firstDoc.id, ...firstDoc.data() } as Usuario & {
          id: string;
        };
      }

      // Nenhum documento encontrado
      console.log("Nenhum documento encontrado para UID:", uid);
      return null;
    } catch (error) {
      console.error("Erro ao buscar documento do usuário:", error);
      throw error;
    }
  };

  // Carregar dados da sessão do localStorage ao iniciar
  useEffect(() => {
    const savedSession = localStorage.getItem("csae_session");
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
        console.error("Erro ao carregar sessão do localStorage:", error);
        localStorage.removeItem("csae_session");
      }
    }
  }, []);

  useEffect(() => {
    if (!user?.uid || !sessionData) return;

    return onSnapshot(
      doc(db, "usuarios", user.uid),
      async (snapshot) => {
        if (!snapshot.exists()) return;
        const dados = snapshot.data() as Usuario;
        if (dados.statusAcesso?.toLowerCase() !== "revogado") return;

        toast({
          title: "Acesso revogado",
          description: `Sua sessão foi encerrada. Motivo: ${dados.motivoRevogacao || "não informado"}. Para esclarecimentos, entre em contato com gerenf.sms.pmf@gmail.com ou @portalcsaefloripa.`,
          variant: "destructive",
        });
        await signOut(auth);
        setUser(null);
        setSessionData(null);
        localStorage.removeItem("csae_session");
        navigate("/login");
      },
      (error) => console.error("Erro ao acompanhar status de acesso:", error),
    );
  }, [navigate, sessionData, toast, user?.uid]);

  // Função para carregar dados do usuário no Firestore
  const loadUserData = async (uid: string): Promise<void> => {
    try {
      console.log("Buscando dados do usuário com UID:", uid);

      const userDoc = await getUserDoc(uid);

      if (!userDoc) {
        console.log("Documento do usuário não encontrado");
        toast({
          title: "Cadastro não localizado",
          description:
            "Seu cadastro não foi localizado. Entre em contato com o suporte pelo nosso Instagram @portalcsaefloripa ou faça seu cadastro.",
          variant: "destructive",
          action: (
            <button
              onClick={() => navigate("/registrar")}
              className="bg-csae-green-600 text-white px-3 py-1 rounded text-sm hover:bg-csae-green-700"
            >
              Cadastrar-se
            </button>
          ),
        });

        await signOut(auth);
        setUser(null);
        setSessionData(null);
        localStorage.removeItem("csae_session");
        navigate("/login");
        return;
      }

      // Processar documento do usuário
      await handleUserDocument(userDoc, uid);
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
      toast({
        title: "Erro de conexão",
        description:
          "Erro ao carregar dados do usuário. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });

      await signOut(auth);
      setUser(null);
      setSessionData(null);
      localStorage.removeItem("csae_session");
      navigate("/login");
    }
  };

  // Função para processar o documento do usuário com verificação case-insensitive
  const handleUserDocument = async (
    userDoc: Usuario & { id: string },
    uid: string,
  ): Promise<void> => {
    console.log(
      "Processando documento do usuário. Status original:",
      userDoc.statusAcesso,
    );

    // Normalizar status para comparação case-insensitive
    const status = (userDoc.statusAcesso || "").toLowerCase();
    console.log("Status normalizado:", status);

    if (status === "aguardando") {
      console.log("Status: aguardando - perfil em análise");
      toast({
        title: "Perfil em análise",
        description:
          "Seu perfil está em análise. Tente novamente mais tarde ou entre em contato pelo nosso Instagram @portalcsaefloripa",
        variant: "default",
        className: "bg-yellow-50 border-yellow-200",
      });

      await signOut(auth);
      setUser(null);
      setSessionData(null);
      localStorage.removeItem("csae_session");
      navigate("/login");
      return;
    }

    if (status === "revisaocadastral") {
      const dataSolicitacao =
        userDoc.alteracaoProfissionalPendente?.dataSolicitacao;
      const dataTexto = dataSolicitacao?.toDate
        ? dataSolicitacao.toDate().toLocaleDateString("pt-BR")
        : "data não informada";
      toast({
        title: "Alterações cadastrais em revisão",
        description: `As alterações profissionais enviadas em ${dataTexto} ainda estão sendo analisadas. Seu acesso será liberado após a revisão.`,
        className: "bg-amber-50 border-amber-200",
      });
      await signOut(auth);
      setUser(null);
      setSessionData(null);
      localStorage.removeItem("csae_session");
      navigate("/login");
      return;
    }

    if (status === "revogado") {
      const dataTexto = userDoc.dataRevogacao?.toDate
        ? userDoc.dataRevogacao.toDate().toLocaleDateString("pt-BR")
        : "data não informada";
      toast({
        title: "Acesso revogado",
        description: `Seu acesso foi revogado em ${dataTexto}. Motivo: ${userDoc.motivoRevogacao || "não informado"}. Para esclarecimentos, entre em contato com gerenf.sms.pmf@gmail.com ou @portalcsaefloripa.`,
        variant: "destructive",
      });
      await signOut(auth);
      setUser(null);
      setSessionData(null);
      localStorage.removeItem("csae_session");
      navigate("/login");
      return;
    }

    if (status === "rejeitado" || status === "recusado") {
      console.log("Status: rejeitado/recusado - acesso negado");
      toast({
        title: "Acesso negado",
        description:
          "Seu acesso foi negado. Entre em contato pelo nosso Instagram @portalcsaefloripa",
        variant: "destructive",
      });

      await signOut(auth);
      setUser(null);
      setSessionData(null);
      localStorage.removeItem("csae_session");
      navigate("/login");
      return;
    }

    if (status === "aprovado" || status === "liberado") {
      console.log("Status: aprovado/liberado - acesso permitido");

      if (userDoc.ultimaRevisaoCadastral?.status === "Recusada") {
        toast({
          title: "Alteração cadastral revisada",
          description: `Sua alteração profissional foi recusada: ${userDoc.ultimaRevisaoCadastral.motivo || "motivo não informado"}. Seus dados anteriores foram mantidos. Consulte seu Perfil para mais detalhes.`,
          variant: "destructive",
        });
      }

      const paginasPermitidas = await garantirPermissoesAtuais(userDoc);

      // Criar objeto de sessão
      const session: SessionData = {
        nomeCompleto: userDoc.dadosPessoais.nomeCompleto,
        tipoUsuario: userDoc.tipoUsuario,
        uid: uid,
        statusAcesso: userDoc.statusAcesso,
        ehAdmin: userDoc.ehAdmin,
        gestorConteudos: userDoc.gestorConteudos,
        email: userDoc.email,
        paginasPermitidas,
        numeroCoren: userDoc.dadosProfissionais?.numeroCoren,
        ufCoren: userDoc.dadosProfissionais?.ufCoren,
      };

      // Salvar no localStorage e estado
      localStorage.setItem("csae_session", JSON.stringify(session));
      setSessionData(session);

      console.log("Usuário autorizado. Sessão criada:", session);
      return;
    }

    // Status não reconhecido
    console.log("Status não reconhecido:", userDoc.statusAcesso);
    toast({
      title: "Status inválido",
      description:
        "Status de acesso não reconhecido. Entre em contato com o suporte.",
      variant: "destructive",
    });

    await signOut(auth);
    setUser(null);
    setSessionData(null);
    localStorage.removeItem("csae_session");
    navigate("/login");
  };

  // Configurar persistência e monitorar estado de autenticação
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Configurar persistência local
        await setPersistence(auth, browserSessionPersistence);

        // Monitorar mudanças no estado de autenticação
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          console.log("Auth state changed. User:", user?.uid);

          // A criação de conta autentica o usuário antes de o documento ser gravado.
          // Durante esse curto intervalo, o próprio fluxo de cadastro controla a sessão.
          if (user && cadastroEmAndamento()) {
            console.log(
              "Cadastro em andamento: aguardando a gravação do perfil no Firestore.",
            );
            setUser(null);
            setSessionData(null);
            setLoading(false);
            return;
          }

          if (user) {
            // Usuário autenticado - buscar dados
            setUser(user);
            await loadUserData(user.uid);
          } else {
            // Usuário não autenticado
            console.log("Nenhum usuário autenticado");
            setUser(null);
            setSessionData(null);
            localStorage.removeItem("csae_session");

            // Redirecionar para login se não estiver já lá
            const currentPath = window.location.pathname;
            if (currentPath !== "/login" && currentPath !== "/registrar") {
              navigate("/login");
            }
          }

          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Erro ao inicializar autenticação:", error);
        setLoading(false);
      }
    };

    initializeAuth();
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log("Tentando fazer login com:", email);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      console.log("Login realizado. UID:", user.uid);

      // Buscar dados do usuário no Firestore
      const userDoc = await getUserDoc(user.uid);

      if (!userDoc) {
        await signOut(auth);
        toast({
          title: "Cadastro não encontrado",
          description:
            "Seus dados não foram encontrados. Entre em contato com o suporte pelo nosso Instagram @portalcsaefloripa",
          variant: "destructive",
          action: (
            <button
              onClick={() => navigate("/registrar")}
              className="bg-csae-green-600 text-white px-3 py-1 rounded text-sm hover:bg-csae-green-700"
            >
              Cadastrar-se
            </button>
          ),
        });
        return;
      }

      // Verificar status com comparação case-insensitive
      const status = (userDoc.statusAcesso || "").toLowerCase();
      console.log(
        "Status do usuário no login:",
        userDoc.statusAcesso,
        "(normalizado:",
        status + ")",
      );

      if (status === "aguardando") {
        await signOut(auth);
        toast({
          title: "Perfil em análise",
          description:
            "Seu perfil está em análise. Tente novamente mais tarde ou entre em contato pelo nosso Instagram @portalcsaefloripa",
          variant: "default",
          className: "bg-yellow-50 border-yellow-200",
        });
        return;
      }

      if (status === "revisaocadastral") {
        const dataSolicitacao =
          userDoc.alteracaoProfissionalPendente?.dataSolicitacao;
        const dataTexto = dataSolicitacao?.toDate
          ? dataSolicitacao.toDate().toLocaleDateString("pt-BR")
          : "data não informada";
        await signOut(auth);
        toast({
          title: "Alterações cadastrais em revisão",
          description: `As alterações profissionais enviadas em ${dataTexto} ainda estão sendo analisadas. Seu acesso será liberado após a revisão.`,
          className: "bg-amber-50 border-amber-200",
        });
        return;
      }

      if (status === "revogado") {
        const dataTexto = userDoc.dataRevogacao?.toDate
          ? userDoc.dataRevogacao.toDate().toLocaleDateString("pt-BR")
          : "data não informada";
        await signOut(auth);
        toast({
          title: "Acesso revogado",
          description: `Seu acesso foi revogado em ${dataTexto}. Motivo: ${userDoc.motivoRevogacao || "não informado"}. Para esclarecimentos, entre em contato com gerenf.sms.pmf@gmail.com ou @portalcsaefloripa.`,
          variant: "destructive",
        });
        return;
      }

      if (status === "rejeitado" || status === "recusado") {
        await signOut(auth);
        toast({
          title: "Acesso negado",
          description:
            "Seu acesso foi negado. Entre em contato pelo nosso Instagram @portalcsaefloripa",
          variant: "destructive",
        });
        return;
      }

      if (status !== "aprovado" && status !== "liberado") {
        await signOut(auth);
        toast({
          title: "Status inválido",
          description:
            "Status de acesso não reconhecido. Entre em contato com o suporte.",
          variant: "destructive",
        });
        return;
      }

      if (userDoc.ultimaRevisaoCadastral?.status === "Recusada") {
        toast({
          title: "Alteração cadastral revisada",
          description: `Sua alteração profissional foi recusada: ${userDoc.ultimaRevisaoCadastral.motivo || "motivo não informado"}. Seus dados anteriores foram mantidos. Consulte seu Perfil para mais detalhes.`,
          variant: "destructive",
        });
      }

      // Status aprovado - registrar histórico e estatísticas de acesso
      try {
        const updateRef = doc(db, "usuarios", userDoc.id);

        // 1. Atualizar contador e data do último acesso (Operação Segura)
        await updateDoc(updateRef, {
          totalAcessos: increment(1),
          ultimoAcesso: serverTimestamp(),
        });
        console.log(
          `[Auth] Contador de acessos incrementado para UID: ${user.uid}`,
        );

        // 2. Adicionar ao array de histórico (Operação separada para evitar erros de serverTimestamp no arrayUnion)
        await updateDoc(updateRef, {
          historicoAcesso: arrayUnion({
            dataHora: Timestamp.now(), // Usando Timestamp do cliente para permitir gravação no array
            ip: "N/A",
          }),
        });
        console.log(
          `[Auth] Histórico de acesso registrado para UID: ${user.uid}`,
        );
      } catch (error) {
        console.error(
          "[Auth] Erro crítico ao atualizar metadados de acesso no Firestore:",
          error,
        );
        // Não impedimos o fluxo de login se apenas as estatísticas falharem
      }

      // ── Verificar gatilho de NPS obrigatório (a cada 10 acessos) ──
      try {
        const novoTotal = (userDoc.totalAcessos || 0) + 1;
        if (novoTotal % 10 === 0) {
          const elegivel = await verificarElegibilidadeNPS(user.uid);
          if (elegivel) {
            localStorage.setItem(NPS_PENDENTE_KEY, user.uid);
            setNpsModalPendente(true);
            console.log(
              `[Auth] NPS obrigatório ativado (acesso #${novoTotal})`,
            );
          }
        }
      } catch (npsError) {
        // Nunca bloquear o login por erro no NPS
        console.error("[Auth] Erro ao verificar elegibilidade NPS:", npsError);
      }

      const paginasPermitidas = await garantirPermissoesAtuais(userDoc);

      // Criar sessão
      const session: SessionData = {
        nomeCompleto: userDoc.dadosPessoais.nomeCompleto,
        tipoUsuario: userDoc.tipoUsuario,
        uid: user.uid,
        statusAcesso: userDoc.statusAcesso,
        ehAdmin: userDoc.ehAdmin,
        gestorConteudos: userDoc.gestorConteudos,
        email: userDoc.email,
        paginasPermitidas,
        numeroCoren: userDoc.dadosProfissionais?.numeroCoren,
        ufCoren: userDoc.dadosProfissionais?.ufCoren,
      };

      localStorage.setItem("csae_session", JSON.stringify(session));
      setSessionData(session);

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a), ${userDoc.dadosPessoais.nomeCompleto}!`,
        variant: "default",
        className: "bg-green-50 border-green-200",
      });

      navigate("/dashboard");
    } catch (error: unknown) {
      console.error("Erro no login:", error);
      let errorMessage = "Erro ao efetuar login. Tente novamente mais tarde.";
      const errorCode =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "";

      if (errorCode === "auth/user-not-found") {
        errorMessage = "Este e-mail não está cadastrado. Faça seu cadastro!";
        toast({
          title: "E-mail não encontrado",
          description: errorMessage,
          variant: "destructive",
          action: (
            <button
              onClick={() => navigate("/registrar")}
              className="bg-csae-green-600 text-white px-3 py-1 rounded text-sm hover:bg-csae-green-700"
            >
              Cadastrar-se
            </button>
          ),
        });
        return;
      } else if (errorCode === "auth/wrong-password") {
        errorMessage = "Senha incorreta! Verifique e tente novamente.";
      } else if (errorCode === "auth/invalid-credential") {
        errorMessage =
          "Credenciais inválidas. Verifique seus dados e tente novamente.";
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

  const atualizarNomeSessao = (nomeCompleto: string) => {
    setSessionData((sessaoAtual) => {
      if (!sessaoAtual) return sessaoAtual;
      const novaSessao = { ...sessaoAtual, nomeCompleto };
      localStorage.setItem("csae_session", JSON.stringify(novaSessao));
      return novaSessao;
    });
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setSessionData(null);
      setNpsModalPendente(false);
      localStorage.removeItem("csae_session");
      localStorage.removeItem(NPS_PENDENTE_KEY);

      toast({
        title: "Logout realizado",
        description: "Você saiu da sessão.",
        variant: "default",
      });

      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
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
    isAuthenticated: !!(
      user &&
      sessionData &&
      (sessionData.statusAcesso.toLowerCase() === "aprovado" ||
        sessionData.statusAcesso.toLowerCase() === "liberado")
    ),
    npsModalPendente,
    concluirNPSObrigatorio,
    atualizarNomeSessao,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
