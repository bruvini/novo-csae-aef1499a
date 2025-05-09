
import React from "react";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { SinalVital, ValorReferencia, SubconjuntoDiagnostico, DiagnosticoCompleto } from "@/types/sinais-vitais";
import ValorReferenciaCard from "./ValorReferenciaCard";

interface SinalVitalFormProps {
  formSinal: SinalVital;
  setFormSinal: React.Dispatch<React.SetStateAction<SinalVital>>;
  editandoId: string | null;
  setModalAberto: React.Dispatch<React.SetStateAction<boolean>>;
  salvarSinalVital: () => void;
  adicionarValorReferencia: () => void;
  removerValorReferencia: (index: number) => void;
  atualizarValorReferencia: (
    index: number,
    campo: keyof ValorReferencia,
    valor: any
  ) => void;
  handleNhbChange: (index: number, nhbId: string) => void;
  handleDiagnosticoChange: (index: number, diagnosticoId: string) => void;
  subconjuntos: SubconjuntoDiagnostico[];
  diagnosticosFiltrados: DiagnosticoCompleto[];
}

const SinalVitalForm: React.FC<SinalVitalFormProps> = ({
  formSinal,
  setFormSinal,
  editandoId,
  setModalAberto,
  salvarSinalVital,
  adicionarValorReferencia,
  removerValorReferencia,
  atualizarValorReferencia,
  handleNhbChange,
  handleDiagnosticoChange,
  subconjuntos,
  diagnosticosFiltrados,
}) => {
  return (
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

          {formSinal.valoresReferencia && formSinal.valoresReferencia.map((valor, index) => (
            <ValorReferenciaCard
              key={index}
              valor={valor}
              index={index}
              removerValorReferencia={removerValorReferencia}
              atualizarValorReferencia={atualizarValorReferencia}
              handleNhbChange={handleNhbChange}
              handleDiagnosticoChange={handleDiagnosticoChange}
              subconjuntos={subconjuntos}
              diagnosticosFiltrados={diagnosticosFiltrados}
            />
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
  );
};

export default SinalVitalForm;
