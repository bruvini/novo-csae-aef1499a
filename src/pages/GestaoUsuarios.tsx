import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  arrayUnion,
  query,
  where,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistance } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Ban,
  RefreshCw,
  Trash2,
  FileDown,
  RotateCcw,
  Clock,
  BookX,
  UserX,
  Calendar,
  AlarmClock,
} from "lucide-react";
import NavigationMenu from "@/components/NavigationMenu";
import Header from "@/components/Header";
import MainFooter from "@/components/MainFooter";
import {
  isResidenteExpirado,
  calcularDataProrrogacao,
} from "@/components/login/ResidenteUtils";

interface Log {
  usuario_afetado: string;
  acao:
    | "aprovado"
    | "recusado"
    | "revogado"
    | "reativado"
    | "excluído"
    | "prorrogado";
  quem_realizou: string;
  data_hora: Timestamp;
  justificativa?: string;
}

interface Usuario {
  id: string;
  uid: string;
  email: string;
  dadosPessoais: {
    nomeCompleto: string;
    rg: string;
    cpf: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  dadosProfissionais: {
    formacao: string;
    numeroCoren?: string;
    ufCoren?: string;
    dataInicioResidencia?: string;
    iesEnfermagem?: string;
    atuaSMS: boolean;
    lotacao?: string;
    matricula?: string;
    cidadeTrabalho?: string;
    localCargo?: string;
    dataProrrogacaoResidencia?: string;
  };
  dataCadastro: Timestamp;
  statusAcesso: "Aguardando" | "Aprovado" | "Negado";
  dataAprovacao?: Timestamp;
  dataRevogacao?: Timestamp;
  motivoRevogacao?: string;
  dataUltimoAcesso?: Timestamp;
  historico_logs?: Log[];
  tipoUsuario?: "Administrador" | "Comum";
  logAcessos?: Timestamp[];
}

// Opções para os filtros
const opcoesFormacao = [
  "Enfermeiro",
  "Residente de Enfermagem",
  "Técnico de Enfermagem",
  "Acadêmico de Enfermagem",
];

// Simulação das opções de lotação
const opcoesLotacao = [
  "Hospital Universitário",
  "UPA Norte da Ilha",
  "UPA Sul da Ilha",
  "Centro de Saúde Ingleses",
  "Centro de Saúde Córrego Grande",
  "Centro de Saúde Pantanal",
  "Secretaria Municipal de Saúde",
  "CAPS",
  "Outra",
];

const GestaoUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("pendentes");
  const [tipoUsuario, setTipoUsuario] = useState<
    "Administrador" | "Comum" | ""
  >("");

  // Estados para filtros avançados
  const [filtroFormacao, setFiltroFormacao] = useState("");
  const [filtroAtuaSMS, setFiltroAtuaSMS] = useState("");
  const [filtroLotacao, setFiltroLotacao] = useState("");

  // Novo estado para residentes com acesso vencido
  const [residentesVencidos, setResidentesVencidos] = useState<Usuario[]>([]);

  // Estados para dialogs
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProrrogarDialogOpen, setIsProrrogarDialogOpen] = useState(false);
  const [isAlterarFormacaoDialogOpen, setIsAlterarFormacaoDialogOpen] =
    useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [justification, setJustification] = useState("");
  const [novaFormacao, setNovaFormacao] = useState("");

  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock do usuário administrador atual (substituir pela autenticação real depois)
  const adminUser = { uid: "admin123", email: "admin@example.com" };

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const usuariosRef = collection(db, "usuarios");
        const snapshot = await getDocs(usuariosRef);
        const fetchedUsuarios = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Usuario[];

        setUsuarios(fetchedUsuarios);

        // Identificar residentes com acesso vencido
        const residentes = fetchedUsuarios.filter(
          (usuario) =>
            usuario.dadosProfissionais.formacao === "Residente de Enfermagem" &&
            usuario.statusAcesso === "Aprovado" &&
            isResidenteExpirado(usuario.dadosProfissionais.dataInicioResidencia)
        );

        setResidentesVencidos(residentes);

        // Aplicar filtros iniciais
        filterUsuarios(fetchedUsuarios, currentTab, searchTerm);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os usuários.",
        });
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  const filterUsuarios = (
    users: Usuario[],
    tab: string,
    term: string = "",
    formacao: string = filtroFormacao,
    atuaSMS: string = filtroAtuaSMS,
    lotacao: string = filtroLotacao
  ) => {
    let filtered = users;

    // Filtrar por tab
    if (tab === "pendentes") {
      filtered = filtered.filter((user) => user.statusAcesso === "Aguardando");
    } else if (tab === "ativos") {
      filtered = filtered.filter((user) => user.statusAcesso === "Aprovado");
    } else if (tab === "revogados") {
      filtered = filtered.filter((user) => user.statusAcesso === "Negado");
    } else if (tab === "residentes") {
      // Apenas mostrar residentes com acesso vencido
      filtered = residentesVencidos;
    }

    // Filtrar por termo de busca (nome ou matrícula)
    if (term) {
      const lowerTerm = term.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.dadosPessoais.nomeCompleto.toLowerCase().includes(lowerTerm) ||
          (user.dadosProfissionais.matricula &&
            user.dadosProfissionais.matricula.toLowerCase().includes(lowerTerm))
      );
    }

    // Filtrar por formação
    if (formacao) {
      filtered = filtered.filter(
        (user) => user.dadosProfissionais.formacao === formacao
      );
    }

    // Filtrar por atuação na SMS
    if (atuaSMS) {
      const atuaSMSBool = atuaSMS === "Sim";
      filtered = filtered.filter(
        (user) => user.dadosProfissionais.atuaSMS === atuaSMSBool
      );
    }

    // Filtrar por lotação
    if (lotacao) {
      filtered = filtered.filter(
        (user) => user.dadosProfissionais.lotacao === lotacao
      );
    }

    setUsuariosFiltrados(filtered);
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    filterUsuarios(
      usuarios,
      value,
      searchTerm,
      filtroFormacao,
      filtroAtuaSMS,
      filtroLotacao
    );
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    filterUsuarios(
      usuarios,
      currentTab,
      term,
      filtroFormacao,
      filtroAtuaSMS,
      filtroLotacao
    );
  };

  const handleFormacaoChange = (value: string) => {
    setFiltroFormacao(value);
    filterUsuarios(
      usuarios,
      currentTab,
      searchTerm,
      value,
      filtroAtuaSMS,
      filtroLotacao
    );
  };

  const handleAtuaSMSChange = (value: string) => {
    setFiltroAtuaSMS(value);
    filterUsuarios(
      usuarios,
      currentTab,
      searchTerm,
      filtroFormacao,
      value,
      filtroLotacao
    );
  };

  const handleLotacaoChange = (value: string) => {
    setFiltroLotacao(value);
    filterUsuarios(
      usuarios,
      currentTab,
      searchTerm,
      filtroFormacao,
      filtroAtuaSMS,
      value
    );
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFiltroFormacao("");
    setFiltroAtuaSMS("");
    setFiltroLotacao("");
    filterUsuarios(usuarios, currentTab, "", "", "", "");
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "N/A";
    return format(timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    });
  };

  const formatUltimoAcesso = (acessos: Timestamp[] | undefined) => {
    if (!acessos || acessos.length === 0) return "Nunca acessou";

    // Ordenar acessos do mais recente para o mais antigo
    const acessosOrdenados = [...acessos].sort(
      (a, b) => b.toDate().getTime() - a.toDate().getTime()
    );

    const ultimoAcesso = acessosOrdenados[0];
    return format(ultimoAcesso.toDate(), "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    });
  };

  const getTempoDesdeUltimoAcesso = (acessos: Timestamp[] | undefined) => {
    if (!acessos || acessos.length === 0) return "Nunca acessou";

    // Ordenar acessos do mais recente para o mais antigo
    const acessosOrdenados = [...acessos].sort(
      (a, b) => b.toDate().getTime() - a.toDate().getTime()
    );

    const ultimoAcesso = acessosOrdenados[0];
    return formatDistance(ultimoAcesso.toDate(), new Date(), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  // Ações de usuário
  const openApproveDialog = (user: Usuario) => {
    setSelectedUser(user);
    setIsApproveDialogOpen(true);
  };

  const openRejectDialog = (user: Usuario) => {
    setSelectedUser(user);
    setJustification("");
    setIsRejectDialogOpen(true);
  };

  const openRevokeDialog = (user: Usuario) => {
    setSelectedUser(user);
    setJustification("");
    setIsRevokeDialogOpen(true);
  };

  const openReactivateDialog = (user: Usuario) => {
    setSelectedUser(user);
    setIsReactivateDialogOpen(true);
  };

  const openDeleteDialog = (user: Usuario) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const openProrrogarDialog = (user: Usuario) => {
    setSelectedUser(user);
    setIsProrrogarDialogOpen(true);
  };

  const openAlterarFormacaoDialog = (user: Usuario) => {
    setSelectedUser(user);
    setNovaFormacao(user.dadosProfissionais.formacao);
    setIsAlterarFormacaoDialogOpen(true);
  };

  const createLogEntry = (
    usuario: Usuario,
    acao: Log["acao"],
    justificativa?: string
  ): Log => {
    const log: any = {
      usuario_afetado: usuario.uid,
      acao,
      quem_realizou: adminUser.uid,
      data_hora: Timestamp.now(),
    };

    if (justificativa) {
      log.justificativa = justificativa;
    }

    return log;
  };

  const approveUser = async () => {
    if (!selectedUser || !tipoUsuario) {
      toast({
        variant: "destructive",
        title: "Tipo de usuário não selecionado",
        description:
          "Selecione se o usuário será Administrador ou Comum antes de aprovar.",
      });
      return;
    }

    try {
      const userRef = doc(db, "usuarios", selectedUser.id);
      const logEntry = createLogEntry(selectedUser, "aprovado");

      await updateDoc(userRef, {
        statusAcesso: "Aprovado",
        dataAprovacao: Timestamp.now(),
        tipoUsuario: tipoUsuario,
        historico_logs: arrayUnion(logEntry),
      });

      // Atualizar estado local com tipagem correta
      const updatedUsuarios = usuarios.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            statusAcesso: "Aprovado" as const,
            dataAprovacao: Timestamp.now(),
            tipoUsuario,
            historico_logs: [...(user.historico_logs || []), logEntry],
          };
        }
        return user;
      });

      setUsuarios(updatedUsuarios);
      filterUsuarios(
        updatedUsuarios,
        currentTab,
        searchTerm,
        filtroFormacao,
        filtroAtuaSMS,
        filtroLotacao
      );

      toast({
        title: "Usuário aprovado",
        description: "Acesso liberado com sucesso.",
      });

      setIsApproveDialogOpen(false);
    } catch (error) {
      console.error("Erro ao aprovar usuário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível aprovar o usuário.",
      });
    }
  };

  const rejectUser = async () => {
    if (!selectedUser || !justification.trim()) return;

    try {
      const userRef = doc(db, "usuarios", selectedUser.id);
      const logEntry = createLogEntry(selectedUser, "recusado", justification);

      await updateDoc(userRef, {
        statusAcesso: "Negado",
        dataRevogacao: Timestamp.now(),
        motivoRevogacao: justification,
        historico_logs: arrayUnion(logEntry),
      });

      // Atualizar estado local com tipagem correta
      const updatedUsuarios = usuarios.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            statusAcesso: "Negado" as const,
            dataRevogacao: Timestamp.now(),
            motivoRevogacao: justification,
            historico_logs: [...(user.historico_logs || []), logEntry],
          };
        }
        return user;
      });

      setUsuarios(updatedUsuarios);
      filterUsuarios(
        updatedUsuarios,
        currentTab,
        searchTerm,
        filtroFormacao,
        filtroAtuaSMS,
        filtroLotacao
      );

      toast({
        title: "Acesso recusado",
        description: "O usuário foi notificado.",
      });

      setIsRejectDialogOpen(false);
      setJustification("");
    } catch (error) {
      console.error("Erro ao recusar usuário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível recusar o acesso.",
      });
    }
  };

  const revokeUser = async () => {
    if (!selectedUser || !justification.trim()) return;

    try {
      const userRef = doc(db, "usuarios", selectedUser.id);
      const logEntry = createLogEntry(selectedUser, "revogado", justification);

      await updateDoc(userRef, {
        statusAcesso: "Negado",
        dataRevogacao: Timestamp.now(),
        motivoRevogacao: justification,
        historico_logs: arrayUnion(logEntry),
      });

      // Atualizar estado local com tipagem correta
      const updatedUsuarios = usuarios.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            statusAcesso: "Negado" as const,
            dataRevogacao: Timestamp.now(),
            motivoRevogacao: justification,
            historico_logs: [...(user.historico_logs || []), logEntry],
          };
        }
        return user;
      });

      setUsuarios(updatedUsuarios);
      filterUsuarios(
        updatedUsuarios,
        currentTab,
        searchTerm,
        filtroFormacao,
        filtroAtuaSMS,
        filtroLotacao
      );

      toast({
        title: "Acesso revogado",
        description: "O usuário foi notificado.",
      });

      setIsRevokeDialogOpen(false);
      setJustification("");
    } catch (error) {
      console.error("Erro ao revogar acesso:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível revogar o acesso.",
      });
    }
  };

  const reactivateUser = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, "usuarios", selectedUser.id);
      const logEntry = createLogEntry(selectedUser, "reativado");

      await updateDoc(userRef, {
        statusAcesso: "Aprovado",
        dataAprovacao: Timestamp.now(),
        dataRevogacao: null,
        motivoRevogacao: null,
        historico_logs: arrayUnion(logEntry),
      });

      // Atualizar estado local com tipagem correta
      const updatedUsuarios = usuarios.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            statusAcesso: "Aprovado" as const,
            dataAprovacao: Timestamp.now(),
            dataRevogacao: undefined,
            motivoRevogacao: undefined,
            historico_logs: [...(user.historico_logs || []), logEntry],
          };
        }
        return user;
      });

      setUsuarios(updatedUsuarios);
      filterUsuarios(
        updatedUsuarios,
        currentTab,
        searchTerm,
        filtroFormacao,
        filtroAtuaSMS,
        filtroLotacao
      );

      toast({
        title: "Usuário reativado",
        description: "Acesso liberado novamente com sucesso.",
      });

      setIsReactivateDialogOpen(false);
    } catch (error) {
      console.error("Erro ao reativar usuário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível reativar o usuário.",
      });
    }
  };

  const prorrogarResidente = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, "usuarios", selectedUser.id);
      const logEntry = createLogEntry(
        selectedUser,
        "prorrogado",
        "Prorrogação de 30 dias concedida"
      );

      // Calcular nova data de prorrogação (baseada na data de início + 2 anos + 30 dias)
      const dataProrrogacao = calcularDataProrrogacao(
        selectedUser.dadosProfissionais.dataInicioResidencia || ""
      );

      await updateDoc(userRef, {
        "dadosProfissionais.dataProrrogacaoResidencia": dataProrrogacao,
        historico_logs: arrayUnion(logEntry),
      });

      // Atualizar estado local
      const updatedUsuarios = usuarios.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            dadosProfissionais: {
              ...user.dadosProfissionais,
              dataProrrogacaoResidencia: dataProrrogacao,
            },
            historico_logs: [...(user.historico_logs || []), logEntry],
          };
        }
        return user;
      });

      setUsuarios(updatedUsuarios);

      // Atualizar a lista de residentes vencidos
      const novoResidentesVencidos = updatedUsuarios.filter(
        (usuario) =>
          usuario.dadosProfissionais.formacao === "Residente de Enfermagem" &&
          usuario.statusAcesso === "Aprovado" &&
          isResidenteExpirado(
            usuario.dadosProfissionais.dataInicioResidencia
          ) &&
          (!usuario.dadosProfissionais.dataProrrogacaoResidencia ||
            new Date(usuario.dadosProfissionais.dataProrrogacaoResidencia) <
              new Date())
      );

      setResidentesVencidos(novoResidentesVencidos);
      filterUsuarios(
        updatedUsuarios,
        currentTab,
        searchTerm,
        filtroFormacao,
        filtroAtuaSMS,
        filtroLotacao
      );

      toast({
        title: "Acesso prorrogado",
        description: "Prorrogação de 30 dias concedida com sucesso.",
      });

      setIsProrrogarDialogOpen(false);
    } catch (error) {
      console.error("Erro ao prorrogar acesso do residente:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível prorrogar o acesso.",
      });
    }
  };

  const alterarFormacaoResidente = async () => {
    if (!selectedUser || !novaFormacao) return;

    try {
      const userRef = doc(db, "usuarios", selectedUser.id);
      const logEntry = createLogEntry(
        selectedUser,
        "reativado",
        `Alteração de formação de "${selectedUser.dadosProfissionais.formacao}" para "${novaFormacao}"`
      );

      await updateDoc(userRef, {
        "dadosProfissionais.formacao": novaFormacao,
        historico_logs: arrayUnion(logEntry),
      });

      // Atualizar estado local
      const updatedUsuarios = usuarios.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            dadosProfissionais: {
              ...user.dadosProfissionais,
              formacao: novaFormacao,
            },
            historico_logs: [...(user.historico_logs || []), logEntry],
          };
        }
        return user;
      });

      setUsuarios(updatedUsuarios);

      // Atualizar a lista de residentes vencidos
      const novoResidentesVencidos = updatedUsuarios.filter(
        (usuario) =>
          usuario.dadosProfissionais.formacao === "Residente de Enfermagem" &&
          usuario.statusAcesso === "Aprovado" &&
          isResidenteExpirado(usuario.dadosProfissionais.dataInicioResidencia)
      );

      setResidentesVencidos(novoResidentesVencidos);
      filterUsuarios(
        updatedUsuarios,
        currentTab,
        searchTerm,
        filtroFormacao,
        filtroAtuaSMS,
        filtroLotacao
      );

      toast({
        title: "Formação alterada",
        description: `Formação alterada para ${novaFormacao} com sucesso.`,
      });

      setIsAlterarFormacaoDialogOpen(false);
    } catch (error) {
      console.error("Erro ao alterar formação do usuário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar a formação.",
      });
    }
  };

  const deleteUser = async () => {
    if (!selectedUser) return;

    try {
      const userRef = doc(db, "usuarios", selectedUser.id);
      const logEntry = createLogEntry(selectedUser, "excluído");

      // Criar log separado antes de excluir o usuário
      await addDoc(collection(db, "logs_sistema"), logEntry);
      await deleteDoc(userRef);

      // Atualizar estado local
      const updatedUsuarios = usuarios.filter(
        (user) => user.id !== selectedUser.id
      );

      setUsuarios(updatedUsuarios);
      filterUsuarios(
        updatedUsuarios,
        currentTab,
        searchTerm,
        filtroFormacao,
        filtroAtuaSMS,
        filtroLotacao
      );

      toast({
        title: "Usuário excluído",
        description: "Cadastro removido permanentemente.",
      });

      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o usuário.",
      });
    }
  };

  const exportToXlsx = () => {
    // Implementação futura - exportar para Excel
    toast({
      title: "Exportação",
      description: "Funcionalidade em implementação.",
    });
  };

  const getRevogacaoMotivo = (user: Usuario) => {
    if (!user.motivoRevogacao) return "Não especificado";

    if (user.motivoRevogacao.includes("inatividade")) {
      return (
        <div className="flex items-center text-amber-600">
          <Clock className="mr-1 h-4 w-4" />
          <span>Inatividade</span>
        </div>
      );
    } else if (user.motivoRevogacao.toLowerCase().includes("residência")) {
      return (
        <div className="flex items-center text-blue-600">
          <BookX className="mr-1 h-4 w-4" />
          <span>Término de residência</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-600">
          <UserX className="mr-1 h-4 w-4" />
          <span>Decisão administrativa</span>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <NavigationMenu activeItem="gestao-usuarios" />

      <main className="flex-1 container max-w-screen-xl mx-auto my-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-csae-green-700">
            Gestão de Usuários
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie os acessos à plataforma, aprovando novos usuários ou
            revogando acessos existentes.
          </p>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                className="pl-10"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleResetFilters}
            >
              <RotateCcw className="h-4 w-4" />
              Limpar filtros
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 ml-auto"
              onClick={exportToXlsx}
            >
              <FileDown className="h-4 w-4" />
              Exportar dados
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="formacao">Formação</Label>
              <Select
                value={filtroFormacao}
                onValueChange={handleFormacaoChange}
              >
                <SelectTrigger id="formacao">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {opcoesFormacao.map((opcao) => (
                    <SelectItem key={opcao} value={opcao}>
                      {opcao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="atuaSMS">Atua na SMS</Label>
              <Select
                value={filtroAtuaSMS || "placeholder"}
                onValueChange={(v) =>
                  handleAtuaSMSChange(v === "placeholder" ? "" : v)
                }
              >
                <SelectTrigger id="atuaSMS">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>
                    Todos
                  </SelectItem>
                  <SelectItem value="Sim">Sim</SelectItem>
                  <SelectItem value="Não">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lotacao">Lotação</Label>
              <Select
                value={filtroLotacao || "placeholder"}
                onValueChange={(v) =>
                  handleLotacaoChange(v === "placeholder" ? "" : v)
                }
              >
                <SelectTrigger id="lotacao">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>
                    Todas
                  </SelectItem>
                  {opcoesLotacao.map((opcao) => (
                    <SelectItem key={opcao} value={opcao}>
                      {opcao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pendentes" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="pendentes" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Usuários Pendentes
            </TabsTrigger>
            <TabsTrigger value="ativos" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Usuários Ativos
            </TabsTrigger>
            <TabsTrigger value="revogados" className="flex items-center gap-2">
              <Ban className="h-4 w-4" />
              Acessos Revogados
            </TabsTrigger>
            <TabsTrigger value="residentes" className="flex items-center gap-2">
              <AlarmClock className="h-4 w-4" />
              Residentes Vencidos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="animate-fade-in">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-csae-green-700">
                  Usuários Aguardando Aprovação
                </h2>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">
                    Carregando usuários...
                  </p>
                ) : usuariosFiltrados.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    Não há usuários aguardando aprovação.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome Completo</TableHead>
                        <TableHead>Data de Cadastro</TableHead>
                        <TableHead>Formação</TableHead>
                        <TableHead>Atua na SMS</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuariosFiltrados.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">
                            {usuario.dadosPessoais.nomeCompleto}
                          </TableCell>
                          <TableCell>
                            {formatDate(usuario.dataCadastro)}
                          </TableCell>
                          <TableCell>
                            {usuario.dadosProfissionais.formacao}
                          </TableCell>
                          <TableCell>
                            {usuario.dadosProfissionais.atuaSMS ? "Sim" : "Não"}
                          </TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                onClick={() => openApproveDialog(usuario)}
                              >
                                <CheckCircle className="h-4 w-4" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => openRejectDialog(usuario)}
                              >
                                <XCircle className="h-4 w-4" />
                                Recusar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ativos" className="animate-fade-in">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-csae-green-700">
                  Usuários com Acesso Ativo
                </h2>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">
                    Carregando usuários...
                  </p>
                ) : usuariosFiltrados.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    Não há usuários ativos no momento.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome Completo</TableHead>
                        <TableHead>Data de Aprovação</TableHead>
                        <TableHead>Último Acesso</TableHead>
                        <TableHead>Total de Acessos</TableHead>
                        <TableHead>Formação</TableHead>
                        <TableHead>Atua na SMS?</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuariosFiltrados.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">
                            {usuario.dadosPessoais.nomeCompleto}
                          </TableCell>
                          <TableCell>
                            {formatDate(usuario.dataAprovacao)}
                          </TableCell>
                          <TableCell>
                            {formatUltimoAcesso(usuario.logAcessos)}
                            <div className="text-xs text-gray-500">
                              {getTempoDesdeUltimoAcesso(usuario.logAcessos)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {usuario.logAcessos ? usuario.logAcessos.length : 0}
                          </TableCell>
                          <TableCell>
                            {usuario.dadosProfissionais.formacao}
                          </TableCell>
                          <TableCell>
                            {usuario.dadosProfissionais.atuaSMS ? "Sim" : "Não"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => openRevokeDialog(usuario)}
                              >
                                <Ban className="h-4 w-4" />
                                Revogar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revogados" className="animate-fade-in">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-csae-green-700">
                  Usuários com Acesso Revogado ou Recusado
                </h2>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">
                    Carregando usuários...
                  </p>
                ) : usuariosFiltrados.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    Não há usuários revogados ou recusados.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome Completo</TableHead>
                        <TableHead>Data de Revogação</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Formação</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usuariosFiltrados.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">
                            {usuario.dadosPessoais.nomeCompleto}
                          </TableCell>
                          <TableCell>
                            {formatDate(usuario.dataRevogacao)}
                          </TableCell>
                          <TableCell>{getRevogacaoMotivo(usuario)}</TableCell>
                          <TableCell>
                            {usuario.dadosProfissionais.formacao}
                          </TableCell>
                          <TableCell>{usuario.email}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                onClick={() => openReactivateDialog(usuario)}
                              >
                                <RefreshCw className="h-4 w-4" />
                                Reativar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => openDeleteDialog(usuario)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="residentes" className="animate-fade-in">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-csae-green-700">
                  Residentes com Acesso Vencido
                </h2>
                {loading ? (
                  <p className="text-center py-8 text-gray-500">
                    Carregando usuários...
                  </p>
                ) : residentesVencidos.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">
                    Não há residentes com acesso vencido.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome Completo</TableHead>
                        <TableHead>Início da Residência</TableHead>
                        <TableHead>Instituição</TableHead>
                        <TableHead>Último Acesso</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {residentesVencidos.map((usuario) => (
                        <TableRow key={usuario.id}>
                          <TableCell className="font-medium">
                            {usuario.dadosPessoais.nomeCompleto}
                          </TableCell>
                          <TableCell>
                            {usuario.dadosProfissionais.dataInicioResidencia ||
                              "Não informada"}
                          </TableCell>
                          <TableCell>
                            {usuario.dadosProfissionais.iesEnfermagem ||
                              "Não informada"}
                          </TableCell>
                          <TableCell>
                            {formatUltimoAcesso(usuario.logAcessos)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                onClick={() =>
                                  openAlterarFormacaoDialog(usuario)
                                }
                              >
                                <RefreshCw className="h-4 w-4" />
                                Alterar Formação
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                onClick={() => openProrrogarDialog(usuario)}
                              >
                                <Calendar className="h-4 w-4" />
                                Prorrogar 30 dias
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de aprovar usuário */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar usuário</DialogTitle>
            <DialogDescription>
              Você está prestes a conceder acesso para{" "}
              {selectedUser?.dadosPessoais.nomeCompleto}. Esta ação será
              registrada no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[400px] overflow-y-auto">
            <h4 className="font-semibold">Dados Pessoais</h4>
            {selectedUser &&
              Object.entries(selectedUser.dadosPessoais || {}).map(
                ([key, value]) => (
                  <p key={key}>
                    <strong>{key}:</strong> {value || "N/A"}
                  </p>
                )
              )}

            <h4 className="font-semibold mt-4">Dados Profissionais</h4>
            {selectedUser &&
              Object.entries(selectedUser.dadosProfissionais || {}).map(
                ([key, value]) => (
                  <p key={key}>
                    <strong>{key}:</strong>{" "}
                    {value === true
                      ? "Sim"
                      : value === false
                      ? "Não"
                      : value || "N/A"}
                  </p>
                )
              )}

            <h4 className="font-semibold mt-4">Tipo de Usuário</h4>
            <select
              value={tipoUsuario}
              onChange={(e) =>
                setTipoUsuario(e.target.value as "Administrador" | "Comum")
              }
              className="w-full border rounded p-2"
            >
              <option value="">Selecione o tipo de usuário</option>
              <option value="Administrador">Administrador</option>
              <option value="Comum">Comum</option>
            </select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={approveUser}
              className="bg-csae-green-600 hover:bg-csae-green-700"
            >
              Confirmar aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de recusar usuário */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar acesso</DialogTitle>
            <DialogDescription>
              Você está recusando o acesso de{" "}
              {selectedUser?.dadosPessoais.nomeCompleto}. Por favor, informe o
              motivo da recusa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              placeholder="Descreva o motivo da recusa de acesso..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={rejectUser}
              disabled={!justification.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de revogar acesso */}
      <Dialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revogar acesso</DialogTitle>
            <DialogDescription>
              Você está revogando o acesso de{" "}
              {selectedUser?.dadosPessoais.nomeCompleto}. Por favor, informe o
              motivo da revogação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Textarea
              placeholder="Descreva o motivo da revogação de acesso..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRevokeDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={revokeUser}
              disabled={!justification.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmar revogação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de reativar usuário */}
      <Dialog
        open={isReactivateDialogOpen}
        onOpenChange={setIsReactivateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reativar usuário</DialogTitle>
            <DialogDescription>
              Você está prestes a reativar o acesso de{" "}
              {selectedUser?.dadosPessoais.nomeCompleto}. Esta ação será
              registrada no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Formação:</p>
              <p className="text-sm text-gray-600">
                {selectedUser?.dadosProfissionais.formacao}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Lotação:</p>
              <p className="text-sm text-gray-600">
                {selectedUser?.dadosProfissionais.lotacao || "Não informada"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Motivo da revogação anterior:
              </p>
              <p className="text-sm text-gray-600">
                {selectedUser?.motivoRevogacao || "Não informado"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReactivateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={reactivateUser}
              className="bg-csae-green-600 hover:bg-csae-green-700"
            >
              Confirmar reativação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de excluir usuário */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir usuário</DialogTitle>
            <DialogDescription>
              Você está prestes a excluir permanentemente o cadastro de{" "}
              {selectedUser?.dadosPessoais.nomeCompleto}. Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 p-4 rounded-md border border-red-200 my-2">
            <p className="text-red-600 text-sm">
              <strong>Atenção:</strong> A exclusão é permanente e todos os dados
              associados a este usuário serão removidos do sistema. Um log da
              ação será mantido por questões de auditoria.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={deleteUser} variant="destructive">
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de prorrogar acesso de residente */}
      <Dialog
        open={isProrrogarDialogOpen}
        onOpenChange={setIsProrrogarDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prorrogar acesso de residente</DialogTitle>
            <DialogDescription>
              Você está prorrogando o acesso de{" "}
              {selectedUser?.dadosPessoais.nomeCompleto} por 30 dias. Esta ação
              será registrada no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Data de início da residência:
              </p>
              <p className="text-sm text-gray-600">
                {selectedUser?.dadosProfissionais.dataInicioResidencia ||
                  "Não informada"}
              </p>
            </div>
            <div className="space-y-1 mt-2">
              <p className="text-sm font-medium">Instituição:</p>
              <p className="text-sm text-gray-600">
                {selectedUser?.dadosProfissionais.iesEnfermagem ||
                  "Não informada"}
              </p>
            </div>

            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 my-4">
              <p className="text-amber-700 text-sm">
                <strong>Atenção:</strong> A prorrogação é válida por 30 dias.
                Após este período, o acesso será automaticamente bloqueado
                novamente.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProrrogarDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={prorrogarResidente}
              className="bg-csae-green-600 hover:bg-csae-green-700"
            >
              Confirmar prorrogação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de alterar formação do residente */}
      <Dialog
        open={isAlterarFormacaoDialogOpen}
        onOpenChange={setIsAlterarFormacaoDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar formação do usuário</DialogTitle>
            <DialogDescription>
              Você está alterando a formação de{" "}
              {selectedUser?.dadosPessoais.nomeCompleto}. Esta ação será
              registrada no sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Formação atual:</p>
              <p className="text-sm text-gray-600">
                {selectedUser?.dadosProfissionais.formacao}
              </p>
            </div>

            <div className="mt-4">
              <Label htmlFor="novaFormacao">Nova formação</Label>
              <Select
                value={novaFormacao || "placeholder"}
                onValueChange={(v) =>
                  setNovaFormacao(v === "placeholder" ? "" : v)
                }
              >
                <SelectTrigger id="novaFormacao">
                  <SelectValue placeholder="Selecione a nova formação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>
                    Selecione a nova formação
                  </SelectItem>
                  {opcoesFormacao.map((opcao) => (
                    <SelectItem key={opcao} value={opcao}>
                      {opcao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 my-4">
              <p className="text-blue-700 text-sm">
                <strong>Informação:</strong> Alterar a formação do usuário
                permitirá que ele continue com acesso ao sistema sem as
                restrições aplicadas a residentes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAlterarFormacaoDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={alterarFormacaoResidente}
              className="bg-csae-green-600 hover:bg-csae-green-700"
              disabled={!novaFormacao}
            >
              Confirmar alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MainFooter />
    </div>
  );
};

export default GestaoUsuarios;
