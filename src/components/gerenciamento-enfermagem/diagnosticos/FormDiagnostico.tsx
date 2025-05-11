
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DiagnosticoCompleto, ResultadoEsperado, Subconjunto, Intervencao } from "@/types";
import ResultadoEsperadoForm from "./ResultadoEsperadoForm";
import { Checkbox } from "@/components/ui/checkbox";

interface FormDiagnosticoProps {
  formDiagnostico: DiagnosticoCompleto;
  setFormDiagnostico: React.Dispatch<React.SetStateAction<DiagnosticoCompleto>>;
  subconjuntos: Subconjunto[];
  onSalvar: () => Promise<void>;
  onCancel: () => void;
  editando: boolean;
  onAdicionarResultadoEsperado: () => void;
  onRemoverResultadoEsperado: (index: number) => void;
  onAtualizarResultadoEsperado: (
    index: number,
    campo: keyof ResultadoEsperado,
    valor: any
  ) => void;
  onAdicionarIntervencao: (resultadoIndex: number) => void;
  onRemoverIntervencao: (
    resultadoIndex: number,
    intervencaoIndex: number
  ) => void;
  onAtualizarIntervencao: (
    resultadoIndex: number,
    intervencaoIndex: number,
    campo: keyof Intervencao,
    valor: string
  ) => void;
}

const FormDiagnostico = ({
  formDiagnostico,
  setFormDiagnostico,
  subconjuntos,
  onSalvar,
  onCancel,
  editando,
  onAdicionarResultadoEsperado,
  onRemoverResultadoEsperado,
  onAtualizarResultadoEsperado,
  onAdicionarIntervencao,
  onRemoverIntervencao,
  onAtualizarIntervencao,
}: FormDiagnosticoProps) => {
  const [subconjuntoNHB, setSubconjuntoNHB] = useState<string>("");
  const [subconjuntoProtocolo, setSubconjuntoProtocolo] = useState<string>("");
  
  // Filter subconjuntos by type
  const subconjuntosNHB = subconjuntos.filter(s => s.tipo === "NHB");
  const subconjuntosProtocolo = subconjuntos.filter(s => s.tipo === "Protocolo");
  
  // Add subconjunto to the form
  const adicionarSubconjunto = (id: string) => {
    if (id && !formDiagnostico.subconjuntoIds.includes(id)) {
      setFormDiagnostico({
        ...formDiagnostico,
        subconjuntoIds: [...formDiagnostico.subconjuntoIds, id]
      });
    }
  };
  
  // Remove subconjunto from the form
  const removerSubconjunto = (id: string) => {
    setFormDiagnostico({
      ...formDiagnostico,
      subconjuntoIds: formDiagnostico.subconjuntoIds.filter(sid => sid !== id)
    });
  };
  
  // Handle NHB subconjunto selection
  const handleSubconjuntoNHBChange = (value: string) => {
    setSubconjuntoNHB(value);
    if (value !== "placeholder") {
      adicionarSubconjunto(value);
      setSubconjuntoNHB("placeholder");
    }
  };
  
  // Handle Protocolo subconjunto selection
  const handleSubconjuntoProtocoloChange = (value: string) => {
    setSubconjuntoProtocolo(value);
    if (value !== "placeholder") {
      adicionarSubconjunto(value);
      setSubconjuntoProtocolo("placeholder");
    }
  };
  
  // Get subconjunto name by ID
  const getSubconjuntoNome = (id: string) => {
    const subconjunto = subconjuntos.find(s => s.id === id);
    return subconjunto ? subconjunto.nome : "Desconhecido";
  };
  
  // Get subconjunto type by ID
  const getSubconjuntoTipo = (id: string) => {
    const subconjunto = subconjuntos.find(s => s.id === id);
    return subconjunto ? subconjunto.tipo : "Desconhecido";
  };
  
  // Check if form is valid
  const isFormValid = () => {
    return formDiagnostico.subconjuntoIds.length > 0 && formDiagnostico.nome.trim() !== "";
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="nome">Nome do Diagnóstico</Label>
        <Input
          id="nome"
          value={formDiagnostico.nome}
          onChange={(e) =>
            setFormDiagnostico({ ...formDiagnostico, nome: e.target.value })
          }
          placeholder="Ex: Dor aguda"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="explicacao">Explicação do Diagnóstico (opcional)</Label>
        <Textarea
          id="explicacao"
          value={formDiagnostico.explicacao || ""}
          onChange={(e) =>
            setFormDiagnostico({
              ...formDiagnostico,
              explicacao: e.target.value,
            })
          }
          placeholder="Descreva o diagnóstico de forma clara para os enfermeiros"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* NHB Section */}
        <div className="grid gap-2">
          <Label htmlFor="subconjuntoNHB">Necessidades Humanas Básicas (NHB)</Label>
          <Select
            value={subconjuntoNHB || "placeholder"}
            onValueChange={handleSubconjuntoNHBChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma NHB" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder" disabled>
                Selecione uma NHB
              </SelectItem>
              {subconjuntosNHB.map((subconjunto) => (
                <SelectItem key={subconjunto.id} value={subconjunto.id!}>
                  {subconjunto.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Protocolos Section */}
        <div className="grid gap-2">
          <Label htmlFor="subconjuntoProtocolo">Protocolos</Label>
          <Select
            value={subconjuntoProtocolo || "placeholder"}
            onValueChange={handleSubconjuntoProtocoloChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um protocolo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder" disabled>
                Selecione um protocolo
              </SelectItem>
              {subconjuntosProtocolo.map((subconjunto) => (
                <SelectItem key={subconjunto.id} value={subconjunto.id!}>
                  {subconjunto.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Selected Subconjuntos */}
      {formDiagnostico.subconjuntoIds.length > 0 && (
        <div className="grid gap-2">
          <Label>Subconjuntos Selecionados</Label>
          <div className="flex flex-wrap gap-2">
            {formDiagnostico.subconjuntoIds.map((id) => (
              <Badge 
                key={id} 
                variant="outline" 
                className="flex items-center gap-1 p-1"
              >
                <span className="text-xs">{getSubconjuntoNome(id)} ({getSubconjuntoTipo(id)})</span>
                <button 
                  onClick={() => removerSubconjunto(id)}
                  type="button"
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          {formDiagnostico.subconjuntoIds.length === 0 && (
            <p className="text-xs text-red-500">Selecione ao menos um subconjunto</p>
          )}
        </div>
      )}

      <div className="grid gap-2">
        <div className="flex justify-between items-center">
          <Label>Resultados Esperados e Intervenções</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdicionarResultadoEsperado}
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar Resultado Esperado
          </Button>
        </div>

        {formDiagnostico.resultadosEsperados.map(
          (resultado, resultadoIndex) => (
            <ResultadoEsperadoForm
              key={resultadoIndex}
              resultado={resultado}
              resultadoIndex={resultadoIndex}
              onAtualizarResultado={onAtualizarResultadoEsperado}
              onRemoverResultado={onRemoverResultadoEsperado}
              onAdicionarIntervencao={onAdicionarIntervencao}
              onRemoverIntervencao={onRemoverIntervencao}
              onAtualizarIntervencao={onAtualizarIntervencao}
              showRemoveButton={formDiagnostico.resultadosEsperados.length > 1}
            />
          )
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={onSalvar}
          className="bg-csae-green-600 hover:bg-csae-green-700"
          disabled={!isFormValid()}
        >
          {editando ? "Atualizar" : "Cadastrar"} Diagnóstico
        </Button>
      </DialogFooter>
    </div>
  );
};

export default FormDiagnostico;
