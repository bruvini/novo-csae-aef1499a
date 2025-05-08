
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Trash2, HelpCircle } from "lucide-react";
import { ValorReferencia, SubconjuntoDiagnostico, DiagnosticoCompleto } from "@/types/sinais-vitais";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ValorReferenciaCardProps {
  valor: ValorReferencia;
  index: number;
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

const ValorReferenciaCard: React.FC<ValorReferenciaCardProps> = ({
  valor,
  index,
  removerValorReferencia,
  atualizarValorReferencia,
  handleNhbChange,
  handleDiagnosticoChange,
  subconjuntos,
  diagnosticosFiltrados,
}) => {
  return (
    <Card key={index} className="p-4">
      <div className="grid gap-3">
        <div className="flex justify-between">
          <h4 className="font-medium">
            Valor de Referência #{index + 1}
          </h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removerValorReferencia(index)}
            className="h-7 text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
                      value={valor.diagnosticoId ?? ""}
                      onValueChange={(v) =>
                        handleDiagnosticoChange(index, v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um diagnóstico" />
                      </SelectTrigger>
                      <SelectContent>
                        {diagnosticosFiltrados.map((diag) => (
                          <SelectItem
                            key={diag.id}
                            value={diag.id!}
                          >
                            {diag.nome || diag.descricao}
                          </SelectItem>
                        ))}
                        {diagnosticosFiltrados.length === 0 && (
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
  );
};

export default ValorReferenciaCard;
