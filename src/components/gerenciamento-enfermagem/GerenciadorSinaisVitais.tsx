import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Edit, Trash2, Check, X, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ValorReferencia,
  SinalVital,
  SubconjuntoDiagnostico,
  DiagnosticoCompleto,
} from "@/services/bancodados/tipos";
import { useForm } from "react-hook-form";

const GerenciadorSinaisVitais = () => {
  const { toast } = useToast();
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [subconjuntos, setSubconjuntos] = useState<SubconjuntoDiagnostico[]>(
    []
  );
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [nhbSelecionada, setNhbSelecionada] = useState<string | null>(null);
  const [diagnosticosFiltrados, setDiagnosticosFiltrados] = useState<
    DiagnosticoCompleto[]
  >([]);

  // Estado para o formulário
  const [formSinal, setFormSinal] = useState<SinalVital>({
    nome: "",
    sigla: "",  // Add this missing field
    diferencaSexoIdade: false,
    valoresReferencia: [
      {
        unidade: "",
        representaAlteracao: false,
        variacaoPor: "Nenhum",
        tipoValor: "Numérico",
      },
    ],
  });

  // Carregar os dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar sinais vitais
        const sinaisRef = collection(db, "sinaisVitais");
        const sinaisSnapshot = await getDocs(sinaisRef);
        const sinaisData = sinaisSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SinalVital[];
        setSinaisVitais(sinaisData);

        // Carregar subconjuntos (NHBs)
        const subconjuntosRef = query(
          collection(db, "subconjuntosDiagnosticos"),
          where("tipo", "==", "NHB")
        );
        const subconjuntosSnapshot = await getDocs(subconjuntosRef);
        const subconjuntosData = subconjuntosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SubconjuntoDiagnostico[];
        setSubconjuntos(subconjuntosData);

        // Carregar Diagnósticos
        const diagnosticosRef = collection(db, "diagnosticosEnfermagem");
        const diagnosticosSnapshot = await getDocs(diagnosticosRef);
        const diagnosticosData = diagnosticosSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as DiagnosticoCompleto[];
        setDiagnosticos(diagnosticosData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os sinais vitais.",
          variant: "destructive",
        });
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [toast]);

  // Filtrar diagnósticos quando uma NHB é selecionada
  useEffect(() => {
    if (nhbSelecionada) {
      const filtrados = diagnosticos.filter(
        (d) => d.subconjuntoId === nhbSelecionada
      );
      setDiagnosticosFiltrados(filtrados);
    } else {
      setDiagnosticosFiltrados([]);
    }
  }, [nhbSelecionada, diagnosticos]);

  // Abrir modal para criar novo sinal vital
  const abrirModalCriar = () => {
    setFormSinal({
      nome: "",
      sigla: "",  // Add this missing field
      diferencaSexoIdade: false,
      valoresReferencia: [
        {
          unidade: "",
          representaAlteracao: false,
          variacaoPor: "Nenhum",
          tipoValor: "Numérico",
        },
      ],
    });
    setEditandoId(null);
    setModalAberto(true);
  };

  // Abrir modal para editar sinal vital existente
  const abrirModalEditar = (sinal: SinalVital) => {
    // Garantir que todos os valores de referência tenham os novos campos
    const valoresAtualizados = sinal.valoresReferencia.map((valor) => ({
      ...valor,
      representaAlteracao:
        valor.representaAlteracao !== undefined
          ? valor.representaAlteracao
          : false,
      variacaoPor: valor.variacaoPor || "Nenhum",
      tipoValor: valor.tipoValor || "Numérico",
    }));

    setFormSinal({
      ...sinal,
      valoresReferencia: valoresAtualizados,
    });
    setEditandoId(sinal.id || null);
    setModalAberto(true);
  };

  // Adicionar valor de referência
  const adicionarValorReferencia = () => {
    setFormSinal({
      ...formSinal,
      valoresReferencia: [
        ...formSinal.valoresReferencia,
        {
          unidade: "",
          representaAlteracao: false,
          variacaoPor: "Nenhum",
          tipoValor: "Numérico",
        },
      ],
    });
  };

  // Remover valor de referência
  const removerValorReferencia = (index: number) => {
    const novosValores = [...formSinal.valoresReferencia];
    novosValores.splice(index, 1);
    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores,
    });
  };

  // Atualizar valor de referência
  const atualizarValorReferencia = (
    index: number,
    campo: keyof ValorReferencia,
    valor: any
  ) => {
    const novosValores = [...formSinal.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      [campo]: valor,
    };

    // Quando o tipo de valor muda, ajustar os campos correspondentes
    if (campo === "tipoValor") {
      if (valor === "Texto") {
        novosValores[index].valorTexto = "";
        novosValores[index].valorMinimo = undefined;
        novosValores[index].valorMaximo = undefined;
      } else {
        novosValores[index].valorTexto = undefined;
      }
    }

    // Quando a variação muda, ajustamos os campos necessários
    if (campo === "variacaoPor") {
      if (valor === "Nenhum") {
        // Remover campos desnecessários para variação única
        delete novosValores[index].idadeMinima;
        delete novosValores[index].idadeMaxima;
        delete novosValores[index].sexo;
      } else if (valor === "Sexo") {
        // Adicionar campo de sexo e remover idade
        novosValores[index].sexo = "Todos";
        delete novosValores[index].idadeMinima;
        delete novosValores[index].idadeMaxima;
      } else if (valor === "Idade") {
        // Adicionar campos de idade e remover sexo
        novosValores[index].idadeMinima = 0;
        novosValores[index].idadeMaxima = 100;
        delete novosValores[index].sexo;
      }
      // 'Ambos' mantém todos os campos
    }

    // Se desmarcar "representa alteração", limpar os campos relacionados
    if (campo === "representaAlteracao" && valor === false) {
      delete novosValores[index].tituloAlteracao;
      delete novosValores[index].nhbId;
      delete novosValores[index].diagnosticoId;
    }

    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores,
    });
  };

  // Atualizar NHB selecionada
  const handleNhbChange = (index: number, nhbId: string) => {
    setNhbSelecionada(nhbId);

    const novosValores = [...formSinal.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      nhbId: nhbId,
      diagnosticoId: undefined, // Limpar diagnóstico quando mudar a NHB
    };

    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores,
    });
  };

  // Atualizar diagnóstico selecionado
  const handleDiagnosticoChange = (index: number, diagnosticoId: string) => {
    const novosValores = [...formSinal.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      diagnosticoId: diagnosticoId,
    };

    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores,
    });
  };

  // Salvar sinal vital (criar novo ou atualizar existente)
  const salvarSinalVital = async () => {
    try {
      if (!formSinal.nome.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Nome do sinal vital é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      if (formSinal.valoresReferencia.some((vr) => !vr.unidade.trim())) {
        toast({
          title: "Campo obrigatório",
          description:
            "Unidade é obrigatória para todos os valores de referência.",
          variant: "destructive",
        });
        return;
      }

      // Validar campos específicos de acordo com a variação
      for (const valor of formSinal.valoresReferencia) {
        if (valor.variacaoPor === "Sexo" || valor.variacaoPor === "Ambos") {
          if (!valor.sexo) {
            toast({
              title: "Campo obrigatório",
              description: "Sexo é obrigatório quando a variação inclui sexo.",
              variant: "destructive",
            });
            return;
          }
        }

        if (valor.variacaoPor === "Idade" || valor.variacaoPor === "Ambos") {
          if (
            valor.idadeMinima === undefined ||
            valor.idadeMaxima === undefined
          ) {
            toast({
              title: "Campo obrigatório",
              description:
                "Idade mínima e máxima são obrigatórias quando a variação inclui idade.",
              variant: "destructive",
            });
            return;
          }
        }

        // Validar campos do tipo de valor
        if (valor.tipoValor === "Numérico") {
          if (
            valor.valorMinimo === undefined &&
            valor.valorMaximo === undefined
          ) {
            toast({
              title: "Campo obrigatório",
              description:
                "Pelo menos um valor (mínimo ou máximo) é obrigatório para valores numéricos.",
              variant: "destructive",
            });
            return;
          }
        } else if (valor.tipoValor === "Texto") {
          if (!valor.valorTexto?.trim()) {
            toast({
              title: "Campo obrigatório",
              description: "Valor textual é obrigatório quando o tipo é texto.",
              variant: "destructive",
            });
            return;
          }
        }

        if (valor.representaAlteracao) {
          if (!valor.tituloAlteracao?.trim()) {
            toast({
              title: "Campo obrigatório",
              description:
                "Título da alteração é obrigatório quando o valor representa uma alteração.",
              variant: "destructive",
            });
            return;
          }

          if (!valor.nhbId) {
            toast({
              title: "Campo obrigatório",
              description:
                "Necessidade Humana Básica (NHB) é obrigatória para valores que representam alteração.",
              variant: "destructive",
            });
            return;
          }

          if (!valor.diagnosticoId) {
            toast({
              title: "Campo obrigatório",
              description:
                "Diagnóstico de Enfermagem é obrigatório para valores que representam alteração.",
              variant: "destructive",
            });
            return;
          }
        }
      }

      if (editandoId) {
        // Atualizar existente
        const sinalRef = doc(db, "sinaisVitais", editandoId);
        await updateDoc(sinalRef, {
          ...formSinal,
          updatedAt: serverTimestamp(),
        });

        toast({
          title: "Sinal vital atualizado",
          description: `${formSinal.nome} foi atualizado com sucesso.`,
        });

        // Atualizar lista
        setSinaisVitais((prev) =>
          prev.map((s) =>
            s.id === editandoId
              ? { ...formSinal, id: editandoId, updatedAt: new Date() as any }
              : s
          )
        );
      } else {
        // Criar novo
        const novoSinal = {
          ...formSinal,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "sinaisVitais"), novoSinal);

        toast({
          title: "Sinal vital criado",
          description: `${formSinal.nome} foi criado com sucesso.`,
        });

        // Adicionar à lista
        setSinaisVitais((prev) => [
          ...prev,
          {
            ...novoSinal,
            id: docRef.id,
            createdAt: new Date() as any,
            updatedAt: new Date() as any,
          },
        ]);
      }

      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar sinal vital:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o sinal vital.",
        variant: "destructive",
      });
    }
  };

  // Excluir sinal vital
  const excluirSinalVital = async (id: string) => {
    if (
      confirm(
        "Tem certeza que deseja excluir este sinal vital? Esta ação não pode ser desfeita."
      )
    ) {
      try {
        await deleteDoc(doc(db, "sinaisVitais", id));

        toast({
          title: "Sinal vital excluído",
          description: "O sinal vital foi excluído com sucesso.",
        });

        // Remover da lista
        setSinaisVitais((prev) => prev.filter((s) => s.id !== id));
      } catch (error) {
        console.error("Erro ao excluir sinal vital:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o sinal vital.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gerenciamento de Sinais Vitais</span>
          <Button
            onClick={abrirModalCriar}
            className="bg-csae-green-600 hover:bg-csae-green-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Sinal Vital
          </Button>
        </CardTitle>
        <CardDescription>
          Cadastre e gerencie os sinais vitais utilizados no processo de
          enfermagem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
          </div>
        ) : sinaisVitais.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Nenhum sinal vital cadastrado. Clique em "Novo Sinal Vital" para
            começar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Sinal Vital</TableHead>
                <TableHead>Valores de Referência</TableHead>
                <TableHead>Valores com Alteração</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sinaisVitais.map((sinal) => (
                <TableRow key={sinal.id}>
                  <TableCell className="font-medium">{sinal.nome}</TableCell>
                  <TableCell>
                    {sinal.valoresReferencia.length} valores configurados
                  </TableCell>
                  <TableCell>
                    {
                      sinal.valoresReferencia.filter(
                        (v) => v.representaAlteracao
                      ).length
                    }{" "}
                    valores
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => abrirModalEditar(sinal)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => excluirSinalVital(sinal.id!)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Modal para criar/editar sinal vital */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editandoId ? "Editar" : "Novo"} Sinal Vital
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para{" "}
              {editandoId ? "atualizar o" : "cadastrar um novo"} sinal vital.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Sinal Vital</Label>
              <Input
                id="nome"
                value={formSinal.nome}
                onChange={(e) =>
                  setFormSinal({ ...formSinal, nome: e.target.value })
                }
                placeholder="Ex: Pressão Arterial"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Valores de Referência</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={adicionarValorReferencia}
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Valor
                </Button>
              </div>

              {formSinal.valoresReferencia.map((valor, index) => (
                <Card key={index} className="p-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">
                        Valor de Referência #{index + 1}
                      </h4>
                      {formSinal.valoresReferencia.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerValorReferencia(index)}
                          className="h-7 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Tipo de valor: Numérico ou Textual */}
                    <div className="grid gap-2">
                      <Label>O valor é numérico ou textual?</Label>
                      <RadioGroup
                        value={valor.tipoValor || "Numérico"}
                        onValueChange={(v: "Numérico" | "Texto") =>
                          atualizarValorReferencia(index, "tipoValor", v)
                        }
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="Numérico"
                            id={`numerico-${index}`}
                          />
                          <Label htmlFor={`numerico-${index}`}>Numérico</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Texto" id={`texto-${index}`} />
                          <Label htmlFor={`texto-${index}`}>Textual</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Campos condicionais baseados no tipo de valor */}
                    {valor.tipoValor === "Numérico" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Valor Mínimo</Label>
                          <Input
                            type="number"
                            value={
                              valor.valorMinimo !== undefined
                                ? valor.valorMinimo
                                : ""
                            }
                            onChange={(e) =>
                              atualizarValorReferencia(
                                index,
                                "valorMinimo",
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
                            placeholder="Ex: 120"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Valor Máximo</Label>
                          <Input
                            type="number"
                            value={
                              valor.valorMaximo !== undefined
                                ? valor.valorMaximo
                                : ""
                            }
                            onChange={(e) =>
                              atualizarValorReferencia(
                                index,
                                "valorMaximo",
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
                            placeholder="Ex: 139"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label>Valor Textual</Label>
                        <Input
                          value={valor.valorTexto || ""}
                          onChange={(e) =>
                            atualizarValorReferencia(
                              index,
                              "valorTexto",
                              e.target.value
                            )
                          }
                          placeholder="Ex: Normal, Presente, Ausente, etc."
                        />
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label>Varia por</Label>
                      <Select
                        value={valor.variacaoPor}
                        onValueChange={(
                          v: "Sexo" | "Idade" | "Ambos" | "Nenhum"
                        ) => atualizarValorReferencia(index, "variacaoPor", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione como o valor varia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nenhum">
                            Nenhum (valor único)
                          </SelectItem>
                          <SelectItem value="Sexo">Sexo</SelectItem>
                          <SelectItem value="Idade">Idade</SelectItem>
                          <SelectItem value="Ambos">
                            Ambos (Sexo e Idade)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(valor.variacaoPor === "Sexo" ||
                      valor.variacaoPor === "Ambos") && (
                      <div className="grid gap-2">
                        <Label>Sexo</Label>
                        <Select
                          value={valor.sexo || "Todos"}
                          onValueChange={(
                            v: "Masculino" | "Feminino" | "Todos"
                          ) => atualizarValorReferencia(index, "sexo", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Todos">Todos</SelectItem>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(valor.variacaoPor === "Idade" ||
                      valor.variacaoPor === "Ambos") && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Idade Mínima (anos)</Label>
                          <Input
                            type="number"
                            value={
                              valor.idadeMinima !== undefined
                                ? valor.idadeMinima
                                : ""
                            }
                            onChange={(e) =>
                              atualizarValorReferencia(
                                index,
                                "idadeMinima",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Ex: 18"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Idade Máxima (anos)</Label>
                          <Input
                            type="number"
                            value={
                              valor.idadeMaxima !== undefined
                                ? valor.idadeMaxima
                                : ""
                            }
                            onChange={(e) =>
                              atualizarValorReferencia(
                                index,
                                "idadeMaxima",
                                Number(e.target.value)
                              )
                            }
                            placeholder="Ex: 65"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid gap-2">
                      <Label>Unidade</Label>
                      <Input
                        value={valor.unidade}
                        onChange={(e) =>
                          atualizarValorReferencia(
                            index,
                            "unidade",
                            e.target.value
                          )
                        }
                        placeholder="Ex: mmHg"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={valor.representaAlteracao || false}
                        onCheckedChange={(checked) =>
                          atualizarValorReferencia(
                            index,
                            "representaAlteracao",
                            checked
                          )
                        }
                        id={`alteracao-${index}`}
                      />
                      <Label htmlFor={`alteracao-${index}`}>
                        Este valor representa uma alteração
                      </Label>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0 ml-1"
                            >
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Marque se este valor representa uma condição
                              alterada (ex: hipertensão, hipotensão).
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {valor.representaAlteracao && (
                      <>
                        <div className="grid gap-2">
                          <Label>Título da Alteração</Label>
                          <Input
                            value={valor.tituloAlteracao || ""}
                            onChange={(e) =>
                              atualizarValorReferencia(
                                index,
                                "tituloAlteracao",
                                e.target.value
                              )
                            }
                            placeholder="Ex: Hipertensão, Hipotensão, etc."
                          />
                        </div>

                        <div className="grid gap-2 border-t pt-3 mt-2">
                          <Label>Vínculo com Diagnóstico</Label>

                          <div className="grid gap-3">
                            <div>
                              <Label className="text-sm text-muted-foreground mb-1 block">
                                1. Selecione uma Necessidade Humana Básica (NHB)
                              </Label>
                              <Select
                                value={valor.nhbId || ""}
                                onValueChange={(v) => handleNhbChange(index, v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma NHB" />
                                </SelectTrigger>
                                <SelectContent>
                                  {subconjuntos.map((nhb) => (
                                    <SelectItem key={nhb.id} value={nhb.id!}>
                                      {nhb.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {valor.nhbId && (
                              <div>
                                <Label className="text-sm text-muted-foreground mb-1 block">
                                  2. Selecione um Diagnóstico
                                </Label>
                                <Select
                                  value={valor.diagnosticoId ?? undefined}
                                  onValueChange={(v) =>
                                    handleDiagnosticoChange(index, v)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um diagnóstico" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {diagnosticos
                                      .filter(
                                        (d) => d.subconjuntoId === valor.nhbId
                                      )
                                      .map((diag) => (
                                        <SelectItem
                                          key={diag.id}
                                          value={diag.id!}
                                        >
                                          {diag.descricao}
                                        </SelectItem>
                                      ))}
                                    {diagnosticos.filter(
                                      (d) => d.subconjuntoId === valor.nhbId
                                    ).length === 0 && (
                                      <div className="text-sm text-muted-foreground px-2 py-1">
                                        Nenhum diagnóstico disponível para esta
                                        NHB
                                      </div>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={salvarSinalVital}
              className="bg-csae-green-600 hover:bg-csae-green-700"
            >
              {editandoId ? "Atualizar" : "Cadastrar"} Sinal Vital
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GerenciadorSinaisVitais;
