import React, { useEffect, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Save,
  UserRound,
} from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { estadosBrasileiros, formacoes, lotacoesSMS } from "@/lib/constants";
import {
  atualizarDadosPessoais,
  buscarMeuPerfil,
  solicitarRevisaoDadosProfissionais,
} from "@/services/bancodados";
import type {
  DadosPessoais,
  DadosProfissionais,
  Usuario,
} from "@/types/usuario";

const Perfil = () => {
  const { user, sessionData, logout, atualizarNomeSessao } = useAuth();
  const { toast } = useToast();
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [pessoais, setPessoais] = useState<DadosPessoais | null>(null);
  const [profissionais, setProfissionais] = useState<DadosProfissionais | null>(
    null,
  );
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");

  useEffect(() => {
    if (!sessionData?.uid) return;
    buscarMeuPerfil(sessionData.uid)
      .then((dados) => {
        setPerfil(dados);
        setPessoais({ ...dados.dadosPessoais });
        setProfissionais({ ...dados.dadosProfissionais });
      })
      .catch(() =>
        toast({
          title: "Erro ao carregar perfil",
          description: "Não foi possível consultar seus dados neste momento.",
          variant: "destructive",
        }),
      )
      .finally(() => setCarregando(false));
  }, [sessionData?.uid, toast]);

  const salvarPessoais = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionData?.uid || !pessoais) return;
    const obrigatorios = Object.values(pessoais).every((valor) =>
      String(valor).trim(),
    );
    if (!obrigatorios) {
      toast({
        title: "Revise os dados",
        description: "Preencha todos os campos pessoais.",
        variant: "destructive",
      });
      return;
    }
    setSalvando(true);
    try {
      await atualizarDadosPessoais(
        sessionData.uid,
        pessoais,
        sessionData.nomeCompleto,
      );
      toast({
        title: "Dados pessoais atualizados!",
        description: "As alterações foram salvas com sucesso.",
      });
      setPerfil((atual) =>
        atual ? { ...atual, dadosPessoais: pessoais } : atual,
      );
      atualizarNomeSessao(pessoais.nomeCompleto);
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados pessoais.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const solicitarRevisao = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionData?.uid || !perfil || !profissionais) return;
    if (
      !profissionais.formacao ||
      (profissionais.atuaSMS &&
        (!profissionais.lotacao || !profissionais.matricula))
    ) {
      toast({
        title: "Revise os dados",
        description: "Informe formação, lotação e matrícula.",
        variant: "destructive",
      });
      return;
    }
    if (
      !window.confirm(
        "Ao confirmar, seu acesso ficará suspenso até a revisão administrativa. Deseja continuar?",
      )
    )
      return;

    setSalvando(true);
    try {
      await solicitarRevisaoDadosProfissionais(
        sessionData.uid,
        perfil.dadosProfissionais,
        profissionais,
        sessionData.nomeCompleto,
      );
      toast({
        title: "Alterações enviadas para revisão",
        description:
          "Seu acesso ficará suspenso até a análise dos novos dados profissionais.",
      });
      await logout();
    } catch (error) {
      toast({
        title: "Não foi possível enviar",
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const alterarSenha = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.email) return;
    if (novaSenha.length < 6 || novaSenha !== confirmacaoSenha) {
      toast({
        title: "Revise a nova senha",
        description: "Use ao menos 6 caracteres e repita a mesma senha.",
        variant: "destructive",
      });
      return;
    }
    setSalvando(true);
    try {
      const credencial = EmailAuthProvider.credential(user.email, senhaAtual);
      await reauthenticateWithCredential(user, credencial);
      await updatePassword(user, novaSenha);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacaoSenha("");
      toast({
        title: "Senha alterada!",
        description: "Sua nova senha já está ativa.",
      });
    } catch {
      toast({
        title: "Não foi possível alterar a senha",
        description: "Confira sua senha atual e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  if (carregando || !pessoais || !profissionais) {
    return (
      <AuthenticatedLayout>
        <div className="py-20 text-center text-gray-500">
          Carregando perfil...
        </div>
      </AuthenticatedLayout>
    );
  }

  const revisao = perfil?.ultimaRevisaoCadastral;
  const atualizarPessoal = (campo: keyof DadosPessoais, valor: string) =>
    setPessoais((atual) => (atual ? { ...atual, [campo]: valor } : atual));
  const atualizarProfissional = (
    campo: keyof DadosProfissionais,
    valor: string | boolean,
  ) =>
    setProfissionais((atual) => (atual ? { ...atual, [campo]: valor } : atual));

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-csae-green-800">Meu Perfil</h1>
          <p className="text-gray-600">
            Consulte e mantenha seus dados atualizados.
          </p>
        </div>

        {revisao && (
          <Alert
            className={
              revisao.status === "Recusada"
                ? "border-red-200 bg-red-50"
                : "border-green-200 bg-green-50"
            }
          >
            {revisao.status === "Recusada" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertTitle>
              Última alteração profissional: {revisao.status}
            </AlertTitle>
            <AlertDescription>
              {revisao.status === "Recusada"
                ? `${revisao.motivo || "A alteração não foi aceita."} Para esclarecimentos: gerenf.sms.pmf@gmail.com ou @portalcsaefloripa.`
                : "Os novos dados profissionais foram aprovados e já estão ativos."}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pessoais" className="space-y-5">
          <TabsList className="grid grid-cols-3 w-full max-w-xl">
            <TabsTrigger value="pessoais">Dados pessoais</TabsTrigger>
            <TabsTrigger value="profissionais">Dados profissionais</TabsTrigger>
            <TabsTrigger value="senha">Senha</TabsTrigger>
          </TabsList>

          <TabsContent value="pessoais">
            <Card>
              <CardHeader>
                <CardTitle className="flex gap-2">
                  <UserRound /> Dados pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={salvarPessoais}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {(
                    [
                      ["nomeCompleto", "Nome completo"],
                      ["cpf", "CPF"],
                      ["rg", "RG"],
                      ["rua", "Endereço"],
                      ["numero", "Número"],
                      ["bairro", "Bairro"],
                      ["cidade", "Cidade"],
                      ["cep", "CEP"],
                    ] as Array<[keyof DadosPessoais, string]>
                  ).map(([campo, rotulo]) => (
                    <div key={campo} className="space-y-2">
                      <Label htmlFor={campo}>{rotulo}</Label>
                      <Input
                        id={campo}
                        value={pessoais[campo]}
                        onChange={(e) =>
                          atualizarPessoal(campo, e.target.value)
                        }
                      />
                    </div>
                  ))}
                  <div className="space-y-2">
                    <Label htmlFor="uf">UF</Label>
                    <select
                      id="uf"
                      value={pessoais.uf}
                      onChange={(e) => atualizarPessoal("uf", e.target.value)}
                      className="w-full h-10 rounded-md border bg-white px-3"
                    >
                      {estadosBrasileiros.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <Button disabled={salvando} className="gap-2">
                      <Save className="h-4 w-4" />
                      Salvar dados pessoais
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profissionais">
            <Card>
              <CardHeader>
                <CardTitle>Dados profissionais</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-5 border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Revisão obrigatória</AlertTitle>
                  <AlertDescription>
                    Qualquer alteração nesta seção suspenderá temporariamente
                    seu acesso até a análise administrativa.
                  </AlertDescription>
                </Alert>
                <form
                  onSubmit={solicitarRevisao}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="space-y-2 md:col-span-2">
                    <Label>Formação</Label>
                    <select
                      value={profissionais.formacao}
                      onChange={(e) =>
                        atualizarProfissional("formacao", e.target.value)
                      }
                      className="w-full h-10 rounded-md border bg-white px-3"
                    >
                      {formacoes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>COREN</Label>
                    <Input
                      value={profissionais.numeroCoren || ""}
                      onChange={(e) =>
                        atualizarProfissional("numeroCoren", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UF do COREN</Label>
                    <select
                      value={profissionais.ufCoren || ""}
                      onChange={(e) =>
                        atualizarProfissional("ufCoren", e.target.value)
                      }
                      className="w-full h-10 rounded-md border bg-white px-3"
                    >
                      <option value="">Selecione</option>
                      {estadosBrasileiros.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="md:col-span-2 flex items-center gap-3 rounded-lg border p-4">
                    <input
                      type="checkbox"
                      checked={profissionais.atuaSMS}
                      onChange={(e) =>
                        atualizarProfissional("atuaSMS", e.target.checked)
                      }
                    />
                    Atuo na SMS Florianópolis
                  </label>
                  <div className="space-y-2">
                    <Label>Lotação</Label>
                    <select
                      value={profissionais.lotacao || ""}
                      onChange={(e) =>
                        atualizarProfissional("lotacao", e.target.value)
                      }
                      className="w-full h-10 rounded-md border bg-white px-3"
                    >
                      <option value="">Selecione</option>
                      {lotacoesSMS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Matrícula</Label>
                    <Input
                      value={profissionais.matricula || ""}
                      onChange={(e) =>
                        atualizarProfissional("matricula", e.target.value)
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button disabled={salvando} className="gap-2">
                      <Save className="h-4 w-4" />
                      Enviar alterações para revisão
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="senha">
            <Card>
              <CardHeader>
                <CardTitle className="flex gap-2">
                  <KeyRound /> Alterar senha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={alterarSenha} className="max-w-lg space-y-4">
                  <div className="space-y-2">
                    <Label>Senha atual</Label>
                    <Input
                      type="password"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nova senha</Label>
                    <Input
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar nova senha</Label>
                    <Input
                      type="password"
                      value={confirmacaoSenha}
                      onChange={(e) => setConfirmacaoSenha(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button disabled={salvando}>Alterar senha</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
};

export default Perfil;
