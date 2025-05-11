
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
import { Trash2, HelpCircle, X, Plus } from "lucide-react";
import { ValorReferencia, SubconjuntoDiagnostico, DiagnosticoCompleto } from "@/types/sinais-vitais";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface ValorReferenciaCardProps {
  valor: ValorReferencia;
  index: number;
  removerValorReferencia: (index: number) => void;
  atualizarValorReferencia: (
    index: number,
    campo: keyof ValorReferencia,
    valor: any
  ) => void;
  handleNhbChange: (index: number, nhbIds: string[]) => void;
  handleDiagnosticoChange: (index: number, diagnosticoIds: string[]) => void;
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
  // Convert single values to arrays for backwards compatibility
  const nhbIds = valor.nhbIds || (valor.nhbId ? [valor.nhbId] : []);
  const diagnosticoIds = valor.diagnosticoIds || (valor.diagnosticoId ? [valor.diagnosticoId] : []);
  
  // Helper function to add or remove from an array of values
  const toggleValueInArray = (array: string[], value: string): string[] => {
    return array.includes(value) 
      ? array.filter(item => item !== value) 
      : [...array, value];
  };
  
  // Function to handle NHB selection
  const toggleNhb = (nhbId: string) => {
    const newNhbIds = toggleValueInArray(nhbIds, nhbId);
    handleNhbChange(index, newNhbIds);
  };
  
  // Function to handle Diagnostico selection
  const toggleDiagnostico = (diagId: string) => {
    const newDiagnosticoIds = toggleValueInArray(diagnosticoIds, diagId);
    handleDiagnosticoChange(index, newDiagnosticoIds);
  };
  
  // Get NHB names for display
  const getNhbName = (id: string): string => {
    const nhb = subconjuntos.find(s => s.id === id);
    return nhb ? nhb.nome : 'Desconhecido';
  };
  
  // Get Diagnóstico names for display
  const getDiagnosticoName = (id: string): string => {
    const diag = diagnosticosFiltrados.find(d => d.id === id);
    return diag ? (diag.nome || diag.descricao || 'Sem nome') : 'Desconhecido';
  };

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
          <Label>Unidade {valor.tipoValor === "Texto" ? "(opcional)" : "(obrigatório)"}</Label>
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
            required={valor.tipoValor !== "Texto"}
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
                    1. Selecione as Necessidades Humanas Básicas (NHB)
                  </Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {nhbIds.map((id) => (
                      <Badge 
                        key={id} 
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {getNhbName(id)}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => toggleNhb(id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Plus className="h-4 w-4" /> Adicionar NHB
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <ScrollArea className="h-72">
                        <div className="space-y-2">
                          {subconjuntos.map((nhb) => (
                            <div 
                              key={nhb.id} 
                              className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                              onClick={() => toggleNhb(nhb.id!)}
                            >
                              <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${nhbIds.includes(nhb.id!) ? 'bg-primary border-primary' : 'border-input'}`}>
                                {nhbIds.includes(nhb.id!) && <div className="w-2 h-2 bg-white rounded-sm" />}
                              </div>
                              <span>{nhb.nome}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>

                {nhbIds.length > 0 && (
                  <div>
                    <Label className="text-sm text-muted-foreground mb-1 block">
                      2. Selecione os Diagnósticos
                    </Label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {diagnosticoIds.map((id) => (
                        <Badge 
                          key={id} 
                          variant="secondary"
                          className="flex items-center gap-1 max-w-full"
                        >
                          <span className="truncate">{getDiagnosticoName(id)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 flex-shrink-0"
                            onClick={() => toggleDiagnostico(id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <Plus className="h-4 w-4" /> Adicionar Diagnóstico
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        {diagnosticosFiltrados.length > 0 ? (
                          <ScrollArea className="h-72">
                            <div className="space-y-2">
                              {diagnosticosFiltrados.map((diag) => (
                                <div 
                                  key={diag.id} 
                                  className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                                  onClick={() => toggleDiagnostico(diag.id!)}
                                >
                                  <div className={`w-4 h-4 border rounded-sm flex items-center justify-center ${diagnosticoIds.includes(diag.id!) ? 'bg-primary border-primary' : 'border-input'}`}>
                                    {diagnosticoIds.includes(diag.id!) && <div className="w-2 h-2 bg-white rounded-sm" />}
                                  </div>
                                  <span className="truncate">{diag.nome || diag.descricao}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-sm text-muted-foreground p-2">
                            Selecione pelo menos uma NHB para ver os diagnósticos disponíveis
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
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
