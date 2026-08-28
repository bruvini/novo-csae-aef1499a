import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RotateCcw,
  UserMinus,
  UserCheck,
  UserX,
  UserRoundCog,
} from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import TabelaUsuarios from "@/components/gestao-usuarios/TabelaUsuarios";
import ModalDetalhesUsuario from "@/components/gestao-usuarios/ModalDetalhesUsuario";
import ModalConfirmacaoAprovacao from "@/components/gestao-usuarios/ModalConfirmacaoAprovacao";
import ModalEdicaoPrivilegios from "@/components/gestao-usuarios/ModalEdicaoPrivilegios";
import ModalConfirmacaoExclusao from "@/components/gestao-usuarios/ModalConfirmacaoExclusao";
import ModalMotivoRecusa from "@/components/gestao-usuarios/ModalMotivoRecusa";
import ModalRevisaoCadastral from "@/components/gestao-usuarios/ModalRevisaoCadastral";
import {
  buscarUsuariosAguardando,
  buscarUsuariosAprovados,
  buscarUsuariosRecusados,
  buscarUsuariosRevisaoCadastral,
  aprovarUsuario,
  editarPrivilegiosUsuario,
  recusarUsuario,
  restaurarUsuarioParaAguardando,
  excluirUsuario,
  aprovarAlteracaoCadastral,
  recusarAlteracaoCadastral,
} from "@/services/bancodados";
import { Usuario } from "@/types/usuario";
import { useAuth } from "@/contexts/AuthContext";

const GestaoUsuarios = () => {
  const { toast } = useToast();
  const { sessionData } = useAuth();
  const isAdmin = sessionData?.ehAdmin === true;
  const [usuariosAguardando, setUsuariosAguardando] = useState<Usuario[]>([]);
  const [usuariosAprovados, setUsuariosAprovados] = useState<Usuario[]>([]);
  const [usuariosRecusados, setUsuariosRecusados] = useState<Usuario[]>([]);
  const [usuariosAlteracao, setUsuariosAlteracao] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [textoBusca, setTextoBusca] = useState("");
  const [filtroFormacao, setFiltroFormacao] = useState("todos");
  const [filtroLotacao, setFiltroLotacao] = useState("todos");
  const [filtroCidade, setFiltroCidade] = useState("todos");
  const [filtroAtuaSms, setFiltroAtuaSms] = useState("todos");

  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(
    null,
  );
  const [modalAprovacaoAberto, setModalAprovacaoAberto] = useState(false);
  const [modalEdicaoPrivilegiosAberto, setModalEdicaoPrivilegiosAberto] =
    useState(false);
  const [modalRecusaAberto, setModalRecusaAberto] = useState(false);
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [modalRevisaoAberto, setModalRevisaoAberto] = useState(false);
  const [processandoRevisao, setProcessandoRevisao] = useState(false);

  const responsavelAnalise = {
    uid: sessionData?.uid || "",
    nome: sessionData?.nomeCompleto || "Responsável não identificado",
  };

  const carregarUsuarios = useCallback(async () => {
    setCarregando(true);
    try {
      const [aguardando, aprovados, recusados, alteracoes] = await Promise.all([
        buscarUsuariosAguardando(),
        buscarUsuariosAprovados(),
        buscarUsuariosRecusados(),
        buscarUsuariosRevisaoCadastral(),
      ]);
      setUsuariosAguardando(aguardando);
      setUsuariosAprovados(aprovados);
      setUsuariosRecusados(recusados);
      setUsuariosAlteracao(alteracoes);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  }, [toast]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const filtrarUsuarios = useCallback(
    (usuarios: Usuario[]) => {
      return usuarios.filter((usuario) => {
        const dadosProfissionais =
          usuario.alteracaoProfissionalPendente?.dadosNovos ||
          usuario.dadosProfissionais;
        const nomeCompleto =
          usuario.dadosPessoais?.nomeCompleto?.toLowerCase() || "";
        const matricula = dadosProfissionais?.matricula?.toLowerCase() || "";
        const numeroCoren =
          dadosProfissionais?.numeroCoren?.toLowerCase() || "";
        const email = usuario.email?.toLowerCase() || "";
        const cpf = usuario.dadosPessoais?.cpf?.toLowerCase() || "";
        const rg = usuario.dadosPessoais?.rg?.toLowerCase() || "";
        const cidade = usuario.dadosPessoais?.cidade?.toLowerCase() || "";
        const bairro = usuario.dadosPessoais?.bairro?.toLowerCase() || "";
        const lotacao = dadosProfissionais?.lotacao?.toLowerCase() || "";
        const buscaLower = textoBusca.toLowerCase();

        const matchBusca =
          textoBusca === "" ||
          nomeCompleto.includes(buscaLower) ||
          matricula.includes(buscaLower) ||
          numeroCoren.includes(buscaLower) ||
          email.includes(buscaLower) ||
          cpf.includes(buscaLower) ||
          rg.includes(buscaLower) ||
          cidade.includes(buscaLower) ||
          bairro.includes(buscaLower) ||
          lotacao.includes(buscaLower);

        const matchFormacao =
          filtroFormacao === "todos" ||
          dadosProfissionais?.formacao === filtroFormacao;
        const matchLotacao =
          filtroLotacao === "todos" ||
          dadosProfissionais?.lotacao === filtroLotacao;
        const matchCidade =
          filtroCidade === "todos" ||
          usuario.dadosPessoais?.cidade === filtroCidade;
        const matchAtuaSms =
          filtroAtuaSms === "todos" ||
          String(dadosProfissionais?.atuaSMS) === filtroAtuaSms;

        return (
          matchBusca &&
          matchFormacao &&
          matchLotacao &&
          matchCidade &&
          matchAtuaSms
        );
      });
    },
    [textoBusca, filtroFormacao, filtroLotacao, filtroCidade, filtroAtuaSms],
  );

  const aguardandoFiltrados = useMemo(
    () => filtrarUsuarios(usuariosAguardando),
    [usuariosAguardando, filtrarUsuarios],
  );
  const aprovadosFiltrados = useMemo(
    () => filtrarUsuarios(usuariosAprovados),
    [usuariosAprovados, filtrarUsuarios],
  );
  const recusadosFiltrados = useMemo(
    () => filtrarUsuarios(usuariosRecusados),
    [usuariosRecusados, filtrarUsuarios],
  );
  const alteracoesFiltradas = useMemo(
    () => filtrarUsuarios(usuariosAlteracao),
    [usuariosAlteracao, filtrarUsuarios],
  );
  const todosUsuarios = [
    ...usuariosAguardando,
    ...usuariosAprovados,
    ...usuariosRecusados,
    ...usuariosAlteracao,
  ];
  const lotacoes = [
    ...new Set(
      todosUsuarios
        .map(
          (usuario) =>
            usuario.alteracaoProfissionalPendente?.dadosNovos.lotacao ||
            usuario.dadosProfissionais?.lotacao,
        )
        .filter(Boolean),
    ),
  ] as string[];
  const cidades = [
    ...new Set(
      todosUsuarios
        .map((usuario) => usuario.dadosPessoais?.cidade)
        .filter(Boolean),
    ),
  ] as string[];

  const limparFiltros = () => {
    setTextoBusca("");
    setFiltroFormacao("todos");
    setFiltroLotacao("todos");
    setFiltroCidade("todos");
    setFiltroAtuaSms("todos");
  };

  const handleDetalhes = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalDetalhesAberto(true);
  };
  const handleAprovar = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalAprovacaoAberto(true);
  };
  const handleEditarPrivilegios = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalEdicaoPrivilegiosAberto(true);
  };
  const handleRecusar = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalRecusaAberto(true);
  };
  const handleExcluir = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalExclusaoAberto(true);
  };
  const handleRevisarAlteracao = (usuario: Usuario) => {
    setUsuarioSelecionado(usuario);
    setModalRevisaoAberto(true);
  };

  const handleRestaurar = async (usuario: Usuario) => {
    if (!usuario.id) return;
    try {
      await restaurarUsuarioParaAguardando(usuario.id, responsavelAnalise);
      toast({
        title: "Usuário restaurado",
        description: `${usuario.dadosPessoais?.nomeCompleto} voltou para análise.`,
      });
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao restaurar usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível restaurar o usuário.",
        variant: "destructive",
      });
    }
  };

  const confirmarAprovacao = async (
    isAdmin: boolean,
    paginasPermitidas: string[],
  ) => {
    if (!usuarioSelecionado?.id) return;
    try {
      await aprovarUsuario(
        usuarioSelecionado.id,
        isAdmin,
        paginasPermitidas,
        responsavelAnalise,
      );
      toast({
        title: "Usuário aprovado!",
        description: `${usuarioSelecionado.dadosPessoais?.nomeCompleto} foi aprovado.`,
      });
      setModalAprovacaoAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao aprovar usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o usuário.",
        variant: "destructive",
      });
    }
  };

  const confirmarEdicaoPrivilegios = async (
    isAdmin: boolean,
    paginasPermitidas: string[],
  ) => {
    if (!usuarioSelecionado?.id) return;
    try {
      await editarPrivilegiosUsuario(
        usuarioSelecionado.id,
        isAdmin,
        paginasPermitidas,
      );
      toast({
        title: "Privilégios atualizados!",
        description: `Os privilégios de ${usuarioSelecionado.dadosPessoais?.nomeCompleto} foram atualizados.`,
      });
      setModalEdicaoPrivilegiosAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao editar privilégios:", error);
      toast({
        title: "Erro",
        description: "Não foi possível editar os privilégios.",
        variant: "destructive",
      });
    }
  };

  const confirmarRecusa = async (motivo: string) => {
    if (!usuarioSelecionado?.id) return;
    try {
      await recusarUsuario(usuarioSelecionado.id, motivo, responsavelAnalise);
      toast({
        title: "Usuário recusado",
        description: `${usuarioSelecionado.dadosPessoais?.nomeCompleto} foi recusado.`,
      });
      setModalRecusaAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao recusar usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível recusar o usuário.",
        variant: "destructive",
      });
    }
  };

  const confirmarAprovacaoAlteracao = async () => {
    if (!usuarioSelecionado?.id) return;
    setProcessandoRevisao(true);
    try {
      await aprovarAlteracaoCadastral(
        usuarioSelecionado.id,
        responsavelAnalise,
      );
      toast({
        title: "Alterações aprovadas",
        description: "Os novos dados profissionais já estão ativos.",
      });
      setModalRevisaoAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar as alterações.",
        variant: "destructive",
      });
    } finally {
      setProcessandoRevisao(false);
    }
  };

  const confirmarRecusaAlteracao = async (motivo: string) => {
    if (!usuarioSelecionado?.id) return;
    setProcessandoRevisao(true);
    try {
      await recusarAlteracaoCadastral(
        usuarioSelecionado.id,
        motivo,
        responsavelAnalise,
      );
      toast({
        title: "Alterações recusadas",
        description:
          "O usuário poderá acessar com os dados anteriores e verá a justificativa.",
      });
      setModalRevisaoAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível recusar as alterações.",
        variant: "destructive",
      });
    } finally {
      setProcessandoRevisao(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!usuarioSelecionado?.id || !usuarioSelecionado?.uid) return;
    try {
      await excluirUsuario(usuarioSelecionado.id, usuarioSelecionado.uid);
      toast({
        title: "Usuário excluído",
        description: `${usuarioSelecionado.dadosPessoais?.nomeCompleto} foi excluído.`,
      });
      setModalExclusaoAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-3xl font-bold text-csae-green-800">
            Gestão de Usuários
          </h1>
          <p className="text-gray-600 font-medium">
            Controle de acessos e permissões administrativas.
          </p>
        </div>

        {carregando ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600 mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium anim-pulse">
                Buscando dados no servidor...
              </p>
            </div>
          </div>
        ) : (
          <>
            <Card className="border-none shadow-sm h-fit">
              <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-700">
                  <Search className="h-5 w-5 text-csae-green-600" />
                  Localizar Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 pt-6">
                <div className="md:col-span-2 xl:col-span-2">
                  <Input
                    placeholder="Nome, e-mail, CPF, RG, matrícula, COREN, cidade..."
                    value={textoBusca}
                    onChange={(e) => setTextoBusca(e.target.value)}
                    className="focus-visible:ring-csae-green-600"
                  />
                </div>
                <Select
                  value={filtroFormacao}
                  onValueChange={setFiltroFormacao}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Formação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas Formações</SelectItem>
                    <SelectItem value="Enfermeiro">Enfermeiro</SelectItem>
                    <SelectItem value="Técnico de Enfermagem">
                      Técnico
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filtroLotacao} onValueChange={setFiltroLotacao}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lotação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as lotações</SelectItem>
                    {lotacoes.sort().map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroCidade} onValueChange={setFiltroCidade}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as cidades</SelectItem>
                    {cidades.sort().map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroAtuaSms} onValueChange={setFiltroAtuaSms}>
                  <SelectTrigger>
                    <SelectValue placeholder="Atuação SMS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Atuação SMS: todos</SelectItem>
                    <SelectItem value="true">Atua na SMS</SelectItem>
                    <SelectItem value="false">Não atua na SMS</SelectItem>
                  </SelectContent>
                </Select>
                <div className="xl:col-span-5">
                  <Button
                    variant="outline"
                    onClick={limparFiltros}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Limpar filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="aguardando" className="space-y-6">
              <TabsList className="bg-slate-100 p-1 rounded-lg w-full max-w-4xl grid grid-cols-4 h-12">
                <TabsTrigger
                  value="aguardando"
                  className="rounded-md flex items-center gap-2 font-semibold"
                >
                  <UserMinus className="w-4 h-4" />
                  Aguardando
                  <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full border border-amber-200">
                    {usuariosAguardando.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="aprovados"
                  className="rounded-md flex items-center gap-2 font-semibold"
                >
                  <UserCheck className="w-4 h-4" />
                  Aprovados
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200">
                    {usuariosAprovados.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="recusados"
                  className="rounded-md flex items-center gap-2 font-semibold"
                >
                  <UserX className="w-4 h-4" />
                  Recusados
                  <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full border border-red-200">
                    {usuariosRecusados.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="alteracoes"
                  className="rounded-md flex items-center gap-2 font-semibold"
                >
                  <UserRoundCog className="w-4 h-4" />
                  Alteração cadastral
                  <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full border border-blue-200">
                    {usuariosAlteracao.length}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="aguardando" className="anim-fade-in">
                <TabelaUsuarios
                  usuarios={aguardandoFiltrados}
                  tipo="aguardando"
                  onDetalhes={handleDetalhes}
                  onAprovar={handleAprovar}
                  onRecusar={handleRecusar}
                  onExcluir={handleExcluir}
                />
              </TabsContent>
              <TabsContent value="aprovados" className="anim-fade-in">
                <TabelaUsuarios
                  usuarios={aprovadosFiltrados}
                  tipo="aprovados"
                  onDetalhes={handleDetalhes}
                  onExcluir={isAdmin ? handleExcluir : undefined}
                  onEditarPrivilegios={
                    isAdmin ? handleEditarPrivilegios : undefined
                  }
                />
              </TabsContent>
              <TabsContent value="recusados" className="anim-fade-in">
                <TabelaUsuarios
                  usuarios={recusadosFiltrados}
                  tipo="recusados"
                  onDetalhes={handleDetalhes}
                  onExcluir={handleExcluir}
                  onRestaurar={handleRestaurar}
                />
              </TabsContent>
              <TabsContent value="alteracoes" className="anim-fade-in">
                <TabelaUsuarios
                  usuarios={alteracoesFiltradas}
                  tipo="alteracoes"
                  onDetalhes={handleRevisarAlteracao}
                />
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Modais */}
        <ModalDetalhesUsuario
          isOpen={modalDetalhesAberto}
          onClose={() => {
            setModalDetalhesAberto(false);
            setUsuarioSelecionado(null);
          }}
          usuario={usuarioSelecionado}
        />
        <ModalConfirmacaoAprovacao
          isOpen={modalAprovacaoAberto}
          onClose={() => {
            setModalAprovacaoAberto(false);
            setUsuarioSelecionado(null);
          }}
          onConfirm={confirmarAprovacao}
          usuario={usuarioSelecionado}
          nomeUsuario={usuarioSelecionado?.dadosPessoais?.nomeCompleto || ""}
        />
        <ModalEdicaoPrivilegios
          isOpen={modalEdicaoPrivilegiosAberto}
          onClose={() => {
            setModalEdicaoPrivilegiosAberto(false);
            setUsuarioSelecionado(null);
          }}
          onConfirm={confirmarEdicaoPrivilegios}
          usuario={usuarioSelecionado}
          isNewApproval={false}
        />
        <ModalConfirmacaoExclusao
          isOpen={modalExclusaoAberto}
          onClose={() => {
            setModalExclusaoAberto(false);
            setUsuarioSelecionado(null);
          }}
          onConfirm={confirmarExclusao}
          nomeUsuario={usuarioSelecionado?.dadosPessoais?.nomeCompleto || ""}
        />

        <ModalMotivoRecusa
          isOpen={modalRecusaAberto}
          onClose={() => {
            setModalRecusaAberto(false);
            setUsuarioSelecionado(null);
          }}
          onConfirm={confirmarRecusa}
          usuario={usuarioSelecionado}
        />
        <ModalRevisaoCadastral
          aberto={modalRevisaoAberto}
          usuario={usuarioSelecionado}
          processando={processandoRevisao}
          onClose={() => {
            setModalRevisaoAberto(false);
            setUsuarioSelecionado(null);
          }}
          onAprovar={confirmarAprovacaoAlteracao}
          onRecusar={confirmarRecusaAlteracao}
        />
      </div>
    </AuthenticatedLayout>
  );
};

export default GestaoUsuarios;
