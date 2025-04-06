import React from "react";
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
import { Plus } from "lucide-react";
import {
  DiagnosticoCompleto,
  ResultadoEsperado,
  Subconjunto,
  Intervencao,
} from "@/services/bancodados/tipos";
import ResultadoEsperadoForm from "./ResultadoEsperadoForm";

interface FormDiagnosticoProps {
  formDiagnostico: DiagnosticoCompleto;
  setFormDiagnostico: React.Dispatch<React.SetStateAction<DiagnosticoCompleto>>;
  tipoSubconjuntoSelecionado: "Protocolo" | "NHB";
  setTipoSubconjuntoSelecionado: React.Dispatch<
    React.SetStateAction<"Protocolo" | "NHB">
  >;
  subconjuntosFiltrados: Subconjunto[];
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
  tipoSubconjuntoSelecionado,
  setTipoSubconjuntoSelecionado,
  subconjuntosFiltrados,
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
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="tipoSubconjunto">Tipo de Subconjunto</Label>
          <Select
            value={tipoSubconjuntoSelecionado}
            onValueChange={(v) =>
              setTipoSubconjuntoSelecionado(v as "Protocolo" | "NHB")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Protocolo">Protocolo</SelectItem>
              <SelectItem value="NHB">
                Necessidade Humana Básica (NHB)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2 md:col-span-2">
          <Label htmlFor="subconjunto">Subconjunto</Label>
          <Select
            value={formDiagnostico.subconjuntoId || "placeholder"}
            onValueChange={(v) =>
              setFormDiagnostico({
                ...formDiagnostico,
                subconjuntoId: v === "placeholder" ? "" : v,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um subconjunto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder" disabled>
                Selecione um subconjunto
              </SelectItem>
              {subconjuntosFiltrados.map((subconjunto) => (
                <SelectItem key={subconjunto.id} value={subconjunto.id!}>
                  {subconjunto.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
        >
          {editando ? "Atualizar" : "Cadastrar"} Diagnóstico
        </Button>
      </DialogFooter>
    </div>
  );
};

export default FormDiagnostico;
