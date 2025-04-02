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
import { format } from "date-fns";
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
} from "lucide-react";
import NavigationMenu from "@/components/NavigationMenu";
import Header from "@/components/Header";
import MainFooter from "@/components/MainFooter";

interface Log {
  usuario_afetado: string;
  acao: "aprovado" | "recusado" | "revogado" | "reativado" | "excluído";
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
  };
  dataCadastro: Timestamp;
  statusAcesso: "Aguardando" | "Aprovado" | "Negado";
  dataAprovacao?: Timestamp;
  dataRevogacao?: Timestamp;
  motivoRevogacao?: string;
  dataUltimoAcesso?: Timestamp;
  historico_logs?: Log[];
}

const GestaoUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("pendentes");
  const [tipoUsuario, setTipoUsuario] = useState<
    "Administrador" | "Comum" | ""
  >("");

  // Estados para dialogs
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [justification, setJustification] = useState("");

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

  const filterUsuarios = (users: Usuario[], tab: string, term: string = "") => {
    let filtered = users;

    // Filtrar por tab
    if (tab === "pendentes") {
      filtered = filtered.filter((user) => user.statusAcesso === "Aguardando");
    } else if (tab === "ativos") {
      filtered = filtered.filter((user) => user.statusAcesso === "Aprovado");
    } else if (tab === "revogados") {
      filtered = filtered.filter((user) => user.statusAcesso === "Negado");
    }

    // Filtrar por termo de busca
    if (term) {
      const lowerTerm = term.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.dadosPessoais.nomeCompleto.toLowerCase().includes(lowerTerm) ||
          user.email.toLowerCase().includes(lowerTerm) ||
          user.dadosProfissionais.formacao.toLowerCase().includes(lowerTerm) ||
          (user.dadosProfissionais.lotacao &&
            user.dadosProfissionais.lotacao.toLowerCase().includes(lowerTerm))
      );
    }

    setUsuariosFiltrados(filtered);
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    filterUsuarios(usuarios, value, searchTerm);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    filterUsuarios(usuarios, currentTab, term);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    filterUsuarios(usuarios, currentTab, "");
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "N/A";
    return format(timestamp.toDate(), "dd/MM/yyyy 'às' HH:mm", {
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
        description: "Selecione se o usuário será Administrador ou Comum antes de aprovar.",
      });
      return;
    }

    try {
      const userRef = doc(db, "usuarios", selectedUser.id);
      const logEntry = createLogEntry(selectedUser, "aprovado");

      await updateDoc(userRef, {
        statusAcesso: 'Aprovado',
        dataAprovacao: Timestamp.now(),
        tipoUsuario: tipoUsuario,
        historico_logs: arrayUnion(logEntry)
      });

      // Atualizar estado local
      const updatedUsuarios = usuarios.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            statusAcesso: "Aprovado",
            dataAprovacao: Timestamp.now(),
            historico_logs: [...(user.historico_logs || []), logEntry],
          };
        }
        return user;
      });

      setUsuarios(updatedUsuarios);
      filterUsuarios(updatedUsuarios, currentTab, searchTerm);

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

      // Atualizar estado local
      const updatedUsuarios = usuarios.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            statusAcesso: "Negado",
            dataRevogacao: Timestamp.now(),
            motivoRevogacao: justification,
            historico_logs: [...(user.historico_logs || []), logEntry],
          };
        }
        return user;
      });

      setUsuarios(updatedUsuarios);
      filterUsuarios(updatedUsuarios, currentTab, searchTerm);

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

      // Atualizar estado local
      const updatedUsuarios = usuarios.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            statusAcesso: "Negado",
            dataRevogacao: Timestamp.now(),
            motivoRevogacao: justification,
            historico_logs: [...(user.historico_logs || []), logEntry],
          };
        }
        return user;
      });

      setUsuarios(updatedUsuarios);
      filterUsuarios(updatedUsuarios, currentTab, searchTerm);

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

      // Atualizar estado local
      const updatedUsuarios = usuarios.map((user) => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            statusAcesso: "Aprovado",
            dataAprovacao: Timestamp.now(),
            dataRevogacao: undefined,
            motivoRevogacao: undefined,
            historico_logs: [...(user.historico_logs || []), logEntry],
          };
        }
        return user;
      });

      setUsuarios(updatedUsuarios);
      filterUsuarios(updatedUsuarios, currentTab, searchTerm);

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
      filterUsuarios(updatedUsuarios, currentTab, searchTerm);

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

        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome, formação ou lotação..."
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

        <Tabs defaultValue="pendentes" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
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
                            {formatDate(usuario.dataUltimoAcesso) ||
                              "Nunca acessou"}
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
            {Object.entries(selectedUser?.dadosPessoais || {}).map(
              ([key, value]) => (
                <p key={key}>
                  <strong>{key}:</strong> {value || "N/A"}
                </p>
              )
            )}

            <h4 className="font-semibold mt-4">Dados Profissionais</h4>
            {Object.entries(selectedUser?.dadosProfissionais || {}).map(
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

      <MainFooter />
    </div>
  );
};

export default GestaoUsuarios;
