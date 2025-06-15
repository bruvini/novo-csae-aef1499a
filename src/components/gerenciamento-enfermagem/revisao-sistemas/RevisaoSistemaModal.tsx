
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { SistemaCorporal, RevisaoSistema, ValorReferenciaSistema } from "@/types/sistemas";
import { SubconjuntoDiagnostico, DiagnosticoCompleto } from "@/types/diagnosticos";
import { fetchSubconjuntos, fetchDiagnosticos } from "@/services/bancodados/diagnosticosDB";
import ValorReferenciaSistemaCard from "@/components/gerenciamento-enfermagem/revisao-sistemas/ValorReferenciaSistemaCard";

interface RevisaoSistemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (revisao: Omit<RevisaoSistema, 'valoresReferencia'>) => void;
  revisao?: RevisaoSistema | null;
  sistemasCorporais: SistemaCorporal[];
  selectedSistema: string | null;
  valoresReferencia: ValorReferenciaSistema[];
  adicionarValorReferencia: () => void;
  removerValorReferencia: (index: number) => void;
  atualizarValorReferencia: (index: number, campo: keyof ValorReferenciaSistema, valor: any) => void;
  handleNhbChange: (index: number, nhbIds: string[]) => void;
  handleDiagnosticoChange: (index: number, diagnosticoIds: string[]) => void;
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
  handleDiagnosticoChange
}) => {
  const [sistemaId, setSistemaId] = useState(selectedSistema || '');
  const [titulo, setTitulo] = useState(revisao?.titulo || '');
  const [descricao, setDescricao] = useState(revisao?.descricao || '');
  const [ativo, setAtivo] = useState(revisao?.ativo !== false);
  const [subconjuntos, setSubconjuntos] = useState<SubconjuntoDiagnostico[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);

  useEffect(() => {
    setSistemaId(selectedSistema || '');
    setTitulo(revisao?.titulo || '');
    setDescricao(revisao?.descricao || '');
    setAtivo(revisao?.ativo !== false);
  }, [revisao, selectedSistema]);

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      const subs = await fetchSubconjuntos();
      setSubconjuntos(subs.filter(s => s.tipo === 'NHB'));
      const diags = await fetchDiagnosticos();
      setDiagnosticos(diags);
    };
    loadData();
  }, [isOpen]);

  const handleSubmit = () => {
    const revisaoToSave = {
      id: revisao?.id,
      sistemaId,
      titulo,
      descricao,
      ativo,
    };
    onSave(revisaoToSave as Omit<RevisaoSistema, 'valoresReferencia'>);
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
            <Label htmlFor="ativo" className="text-right">
              Ativo
            </Label>
            <div className="col-span-3 flex items-center">
              <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
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

export default RevisaoSistemaModal;
