import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle, Plus, Trash2, Edit, X } from "lucide-react";
import { SistemaCorporal, RevisaoSistema, ValorReferenciaSistema } from "@/types/sinais-vitais";
import { useToast } from "@/hooks/use-toast";
import {
  createRevisaoSistema,
  updateRevisaoSistema,
  deleteRevisaoSistema,
  fetchSistemasCorporais,
  fetchRevisoesSistema,
  createSistemaCorporal,
  updateSistemaCorporal,
  deleteSistemaCorporal,
  fetchSubconjuntos,
  fetchDiagnosticos
} from "@/services/bancodados";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import ValorReferenciaCard from "@/components/gerenciamento-enfermagem/sinais-vitais/ValorReferenciaCard";
import ValorReferenciaSistemaCard from "@/components/gerenciamento-enfermagem/revisao-sistemas/ValorReferenciaSistemaCard";
import { SubconjuntoDiagnostico, DiagnosticoCompleto } from "@/types/diagnosticos";

const GerenciadorRevisaoSistemas = () => {
  const [sistemasCorporais, setSistemasCorporais] = useState<SistemaCorporal[]>([]);
  const [revisoesSistema, setRevisoesSistema] = useState<RevisaoSistema[]>([]);
  const [selectedSistema, setSelectedSistema] = useState<string | null>(null);
  const [isSistemaModalOpen, setIsSistemaModalOpen] = useState(false);
  const [isRevisaoModalOpen, setIsRevisaoModalOpen] = useState(false);
  const [sistemaEmEdicao, setSistemaEmEdicao] = useState<SistemaCorporal | null>(null);
  const [revisaoEmEdicao, setRevisaoEmEdicao] = useState<RevisaoSistema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [valoresReferencia, setValoresReferencia] = useState<ValorReferenciaSistema[]>([]);
  const [subconjuntos, setSubconjuntos] = useState<SubconjuntoDiagnostico[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const sistemas = await fetchSistemasCorporais();
        setSistemasCorporais(sistemas);
        if (sistemas.length > 0) {
          setSelectedSistema(sistemas[0].id || null);
        }
        const revisoes = await fetchRevisoesSistema();
        setRevisoesSistema(revisoes);
        const subconjuntosData = await fetchSubconjuntos();
        setSubconjuntos(subconjuntosData);
        const diagnosticosData = await fetchDiagnosticos();
        setDiagnosticos(diagnosticosData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [toast]);

  // Load revisões when selectedSistema changes
  useEffect(() => {
    if (selectedSistema) {
      setValoresReferencia(revisoesSistema.find(r => r.sistemaId === selectedSistema)?.valoresReferencia || []);
    }
  }, [selectedSistema, revisoesSistema]);

  // Handlers for Sistema Corporal
  const handleOpenSistemaModal = () => {
    setSistemaEmEdicao(null);
    setIsSistemaModalOpen(true);
  };

  const handleEditSistema = (sistema: SistemaCorporal) => {
    setSistemaEmEdicao(sistema);
    setIsSistemaModalOpen(true);
  };

  const handleCloseSistemaModal = () => {
    setIsSistemaModalOpen(false);
    setSistemaEmEdicao(null);
  };

  const handleSaveSistema = async (sistema: SistemaCorporal) => {
    setIsLoading(true);
    try {
      if (sistema.id) {
        await updateSistemaCorporal(sistema.id, sistema);
        setSistemasCorporais(prev => prev.map(s => s.id === sistema.id ? sistema : s));
        toast({ title: "Sistema atualizado com sucesso!" });
      } else {
        const novoSistema = await createSistemaCorporal(sistema);
        setSistemasCorporais(prev => [...prev, novoSistema]);
        toast({ title: "Sistema criado com sucesso!" });
      }
      handleCloseSistemaModal();
    } catch (error) {
      console.error("Erro ao salvar sistema:", error);
      toast({
        title: "Erro ao salvar sistema",
        description: "Ocorreu um erro ao salvar o sistema. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSistema = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteSistemaCorporal(id);
      setSistemasCorporais(prev => prev.filter(s => s.id !== id));
      toast({ title: "Sistema excluído com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir sistema:", error);
      toast({
        title: "Erro ao excluir sistema",
        description: "Ocorreu um erro ao excluir o sistema. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for Revisao Sistema
  const handleOpenRevisaoModal = () => {
    setRevisaoEmEdicao(null);
    setIsRevisaoModalOpen(true);
  };

  const handleEditRevisao = (revisao: RevisaoSistema) => {
    setRevisaoEmEdicao(revisao);
    setIsRevisaoModalOpen(true);
    setValoresReferencia(revisao.valoresReferencia || []);
  };

  const handleCloseRevisaoModal = () => {
    setIsRevisaoModalOpen(false);
    setRevisaoEmEdicao(null);
    setValoresReferencia([]);
  };

  const handleSaveRevisao = async (revisao: RevisaoSistema) => {
    setIsLoading(true);
    try {
      const revisaoToSave = { ...revisao, sistemaId: selectedSistema || '', valoresReferencia };
      if (revisao.id) {
        await updateRevisaoSistema(revisao.id, revisaoToSave);
        setRevisoesSistema(prev => prev.map(r => r.id === revisao.id ? revisaoToSave : r));
        toast({ title: "Revisão atualizada com sucesso!" });
      } else {
        const novaRevisao = await createRevisaoSistema(revisaoToSave);
        setRevisoesSistema(prev => [...prev, novaRevisao]);
        toast({ title: "Revisão criada com sucesso!" });
      }
      handleCloseRevisaoModal();
    } catch (error) {
      console.error("Erro ao salvar revisão:", error);
      toast({
        title: "Erro ao salvar revisão",
        description: "Ocorreu um erro ao salvar a revisão. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRevisao = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteRevisaoSistema(id);
      setRevisoesSistema(prev => prev.filter(r => r.id !== id));
      toast({ title: "Revisão excluída com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir revisão:", error);
      toast({
        title: "Erro ao excluir revisão",
        description: "Ocorreu um erro ao excluir a revisão. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Valor Referencia Handlers
  const adicionarValorReferencia = () => {
    setValoresReferencia(prev => [...prev, {
      titulo: '',
      unidade: '',
      representaAlteracao: false,
      variacaoPor: 'Nenhum',
      tipoValor: 'Texto',
      nhbIds: [],
      diagnosticoIds: [],
    }]);
  };

  const removerValorReferencia = (index: number) => {
    setValoresReferencia(prev => prev.filter((_, i) => i !== index));
  };

  const atualizarValorReferencia = (index: number, campo: keyof ValorReferenciaSistema, valor: unknown) => {
    const novosValoresReferencia = [...valoresReferencia];
    (novosValoresReferencia[index] as any)[campo] = valor;
    setValoresReferencia(novosValoresReferencia);
  };

  // Replace these functions with updated versions accepting arrays
  const handleNhbChange = (index: number, nhbIds: string[]) => {
    const novosValoresReferencia = [...valoresReferencia];
    novosValoresReferencia[index].nhbIds = nhbIds;
    setValoresReferencia(novosValoresReferencia);
  };

  const handleDiagnosticoChange = (index: number, diagnosticoIds: string[]) => {
    const novosValoresReferencia = [...valoresReferencia];
    novosValoresReferencia[index].diagnosticoIds = diagnosticoIds;
    setValoresReferencia(novosValoresReferencia);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold text-csae-green-700 mb-4">Gerenciador de Revisão de Sistemas</h1>

      {/* Sistemas Corporais Section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-csae-green-600">Sistemas Corporais</h2>
          <Button variant="outline" size="sm" onClick={handleOpenSistemaModal}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Sistema
          </Button>
        </div>
        <ScrollArea className="h-[200px] w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sistemasCorporais.map(sistema => (
                <TableRow key={sistema.id} className="cursor-pointer hover:bg-gray-100">
                  <TableCell className="font-medium">{sistema.nome}</TableCell>
                  <TableCell>{sistema.descricao}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditSistema(sistema)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteSistema(sistema.id || '')}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </section>

      {/* Revisões de Sistemas Section */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-csae-green-600">Revisões de Sistemas</h2>
          <div className="flex gap-2">
            <Select value={selectedSistema} onValueChange={setSelectedSistema}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Selecione um Sistema" />
              </SelectTrigger>
              <SelectContent>
                {sistemasCorporais.map(sistema => (
                  <SelectItem key={sistema.id} value={sistema.id || ''}>
                    {sistema.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleOpenRevisaoModal} disabled={!selectedSistema}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Revisão
            </Button>
          </div>
        </div>
        <ScrollArea className="h-[300px] w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Título</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revisoesSistema
                .filter(revisao => revisao.sistemaId === selectedSistema)
                .map(revisao => (
                  <TableRow key={revisao.id} className="cursor-pointer hover:bg-gray-100">
                    <TableCell className="font-medium">{revisao.titulo}</TableCell>
                    <TableCell>{revisao.descricao}</TableCell>
                    <TableCell>{revisao.tipoAlteracao}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRevisao(revisao)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteRevisao(revisao.id || '')}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </section>

      {/* Modals */}
      <SistemaCorporalModal
        isOpen={isSistemaModalOpen}
        onClose={handleCloseSistemaModal}
        onSave={handleSaveSistema}
        sistema={sistemaEmEdicao}
      />
      <RevisaoSistemaModal
        isOpen={isRevisaoModalOpen}
        onClose={handleCloseRevisaoModal}
        onSave={handleSaveRevisao}
        revisao={revisaoEmEdicao}
        sistemasCorporais={sistemasCorporais}
        selectedSistema={selectedSistema}
        valoresReferencia={valoresReferencia}
        adicionarValorReferencia={adicionarValorReferencia}
        removerValorReferencia={removerValorReferencia}
        atualizarValorReferencia={atualizarValorReferencia}
        handleNhbChange={handleNhbChange}
        handleDiagnosticoChange={handleDiagnosticoChange}
        subconjuntos={subconjuntos}
        diagnosticos={diagnosticos}
      />
    </div>
  );
};

interface SistemaCorporalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sistema: SistemaCorporal) => void;
  sistema?: SistemaCorporal | null;
}

const SistemaCorporalModal: React.FC<SistemaCorporalModalProps> = ({ isOpen, onClose, onSave, sistema }) => {
  const [nome, setNome] = useState(sistema?.nome || '');
  const [descricao, setDescricao] = useState(sistema?.descricao || '');
  const [ativo, setAtivo] = useState(sistema?.ativo !== false);

  useEffect(() => {
    setNome(sistema?.nome || '');
    setDescricao(sistema?.descricao || '');
    setAtivo(sistema?.ativo !== false);
  }, [sistema]);

  const handleSubmit = () => {
    const sistemaToSave = {
      id: sistema?.id,
      nome,
      descricao,
      ativo,
    };
    onSave(sistemaToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{sistema ? "Editar Sistema Corporal" : "Novo Sistema Corporal"}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {sistema ? "editar" : "criar"} um sistema corporal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input type="text" id="name" value={nome} onChange={(e) => setNome(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Textarea id="description" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="active" className="text-right">
              Ativo
            </Label>
            <div className="col-span-3 flex items-center">
              <Switch id="active" checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface RevisaoSistemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (revisao: RevisaoSistema) => void;
  revisao?: RevisaoSistema | null;
  sistemasCorporais: SistemaCorporal[];
  selectedSistema: string | null;
  valoresReferencia: ValorReferenciaSistema[];
  adicionarValorReferencia: () => void;
  removerValorReferencia: (index: number) => void;
  atualizarValorReferencia: (index: number, campo: keyof ValorReferenciaSistema, valor: any) => void;
  handleNhbChange: (index: number, nhbIds: string[]) => void;
  handleDiagnosticoChange: (index: number, diagnosticoIds: string[]) => void;
  subconjuntos: SubconjuntoDiagnostico[];
  diagnosticos: DiagnosticoCompleto[];
}

const RevisaoSistemaModal: React.FC<RevisaoSistemaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  revisao,
  sistemasCorporais,
  selectedSistema,
  valoresReferencia,
  adicionarValorReferencia,
  removerValorReferencia,
  atualizarValorReferencia,
  handleNhbChange,
  handleDiagnosticoChange,
  subconjuntos,
  diagnosticos
}) => {
  const [sistemaId, setSistemaId] = useState(selectedSistema || '');
  const [titulo, setTitulo] = useState(revisao?.titulo || '');
  const [descricao, setDescricao] = useState(revisao?.descricao || '');
  const [tipoAlteracao, setTipoAlteracao] = useState<"Objetiva" | "Subjetiva" | "Ambas">(revisao?.tipoAlteracao || "Objetiva");
  const [padrao, setPadrao] = useState(revisao?.padrao || '');
  const [ativo, setAtivo] = useState(revisao?.ativo !== false);
  const [diferencaSexoIdade, setDiferencaSexoIdade] = useState(revisao?.diferencaSexoIdade || false);

  useEffect(() => {
    setSistemaId(selectedSistema || '');
    setTitulo(revisao?.titulo || '');
    setDescricao(revisao?.descricao || '');
    setTipoAlteracao(revisao?.tipoAlteracao || "Objetiva");
    setPadrao(revisao?.padrao || '');
    setAtivo(revisao?.ativo !== false);
    setDiferencaSexoIdade(revisao?.diferencaSexoIdade || false);
  }, [revisao, selectedSistema]);

  const handleSubmit = () => {
    const revisaoToSave = {
      id: revisao?.id,
      sistemaId,
      titulo,
      descricao,
      tipoAlteracao,
      padrao,
      ativo,
      diferencaSexoIdade,
    };
    onSave(revisaoToSave as RevisaoSistema);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{revisao ? "Editar Revisão de Sistema" : "Nova Revisão de Sistema"}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {revisao ? "editar" : "criar"} uma revisão de sistema.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sistema" className="text-right">
              Sistema
            </Label>
            <Select value={sistemaId} onValueChange={setSistemaId} disabled>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um Sistema" />
              </SelectTrigger>
              <SelectContent>
                {sistemasCorporais.map(sistema => (
                  <SelectItem key={sistema.id} value={sistema.id || ''}>
                    {sistema.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="titulo" className="text-right">
              Propedêutica
            </Label>
            <Input type="text" id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="descricao" className="text-right">
              Descrição
            </Label>
            <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tipoAlteracao" className="text-right">
              Tipo de Alteração
            </Label>
            <Select 
              value={tipoAlteracao} 
              onValueChange={(value: "Objetiva" | "Subjetiva" | "Ambas") => setTipoAlteracao(value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione o Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Objetiva">Objetiva</SelectItem>
                <SelectItem value="Subjetiva">Subjetiva</SelectItem>
                <SelectItem value="Ambas">Ambas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="padrao" className="text-right">
              Padrão
            </Label>
            <Input type="text" id="padrao" value={padrao} onChange={(e) => setPadrao(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="ativo" className="text-right">
              Ativo
            </Label>
            <div className="col-span-3 flex items-center">
              <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="diferencaSexoIdade" className="text-right">
              Difere por Sexo/Idade
            </Label>
            <div className="col-span-3 flex items-center">
              <Switch id="diferencaSexoIdade" checked={diferencaSexoIdade} onCheckedChange={setDiferencaSexoIdade} />
            </div>
          </div>
        </div>

        {/* Valores de Referência Section */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-semibold text-csae-green-600">Achados do Exame Físico</h3>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Adicione os achados e, se representarem uma alteração, vincule a um diagnóstico.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={adicionarValorReferencia}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Achado
            </Button>
          </div>

            <div className="space-y-4">
              {valoresReferencia.map((valor, index) => (
                <ValorReferenciaSistemaCard
                  key={index}
                  valor={valor}
                  index={index}
                  removerValorReferencia={removerValorReferencia}
                  atualizarValorReferencia={atualizarValorReferencia}
                  handleNhbChange={handleNhbChange}
                  handleDiagnosticoChange={handleDiagnosticoChange}
                  subconjuntos={subconjuntos}
                  diagnosticos={diagnosticos}
                />
              ))}
            </div>
        </div>
        </ScrollArea>
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GerenciadorRevisaoSistemas;
