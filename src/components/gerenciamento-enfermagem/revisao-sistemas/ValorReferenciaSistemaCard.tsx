
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, HelpCircle, X, Plus } from "lucide-react";
import { ValorReferenciaSistema } from "@/types/sistemas";
import { SubconjuntoDiagnostico, DiagnosticoCompleto } from "@/types/diagnosticos";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface ValorReferenciaSistemaCardProps {
  valor: ValorReferenciaSistema;
  index: number;
  removerValorReferencia: (index: number) => void;
  atualizarValorReferencia: (
    index: number,
    campo: keyof ValorReferenciaSistema,
    valor: any
  ) => void;
  handleNhbChange: (index: number, nhbIds: string[]) => void;
  handleDiagnosticoChange: (index: number, diagnosticoIds: string[]) => void;
  subconjuntos: SubconjuntoDiagnostico[];
  diagnosticos: DiagnosticoCompleto[];
}

const ValorReferenciaSistemaCard: React.FC<ValorReferenciaSistemaCardProps> = ({
  valor,
  index,
  removerValorReferencia,
  atualizarValorReferencia,
  handleNhbChange,
  handleDiagnosticoChange,
  subconjuntos,
  diagnosticos,
}) => {
  const nhbIds = valor.nhbIds || [];
  const diagnosticoIds = valor.diagnosticoIds || [];

  const toggleValueInArray = (array: string[], value: string): string[] => {
    return array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
  };

  const toggleNhb = (nhbId: string) => {
    const newNhbIds = toggleValueInArray(nhbIds, nhbId);
    handleNhbChange(index, newNhbIds);
  };

  const toggleDiagnostico = (diagId: string) => {
    const newDiagnosticoIds = toggleValueInArray(diagnosticoIds, diagId);
    handleDiagnosticoChange(index, newDiagnosticoIds);
  };

  const getNhbName = (id: string): string => {
    const nhb = subconjuntos.find(s => s.id === id);
    return nhb ? nhb.nome : 'Desconhecido';
  };
  
  const diagnosticosFiltrados = React.useMemo(() => {
    if (!nhbIds || nhbIds.length === 0) return [];
    return diagnosticos.filter(diag => 
      diag.subconjuntoIds && diag.subconjuntoIds.some(id => nhbIds.includes(id))
    );
  }, [diagnosticos, nhbIds]);

  const getDiagnosticoName = (id: string): string => {
    const diag = diagnosticos.find(d => d.id === id);
    return diag ? (diag.nome || diag.descricao || 'Sem nome') : 'Desconhecido';
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-gray-700">
          Achado do Exame Físico #{index + 1}
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
      
      <div className="grid gap-2">
          <Label htmlFor={`achado-${index}`}>Descrição do Achado</Label>
          <Input
            id={`achado-${index}`}
            value={valor.titulo || ''}
            onChange={(e) =>
              atualizarValorReferencia(
                index,
                "titulo",
                e.target.value
              )
            }
            placeholder="Ex: Murmúrios vesiculares presentes..."
          />
        </div>

      <AlteracaoSection
        valor={valor}
        index={index}
        atualizarValorReferencia={atualizarValorReferencia}
        nhbIds={nhbIds}
        diagnosticoIds={diagnosticoIds}
        toggleNhb={toggleNhb}
        toggleDiagnostico={toggleDiagnostico}
        getNhbName={getNhbName}
        getDiagnosticoName={getDiagnosticoName}
        subconjuntos={subconjuntos}
        diagnosticosFiltrados={diagnosticosFiltrados}
      />
    </Card>
  );
};

const AlteracaoSection: React.FC<{
    valor: ValorReferenciaSistema;
    index: number;
    atualizarValorReferencia: (index: number, campo: keyof ValorReferenciaSistema, valor: any) => void;
    nhbIds: string[];
    diagnosticoIds: string[];
    toggleNhb: (nhbId: string) => void;
    toggleDiagnostico: (diagId: string) => void;
    getNhbName: (id: string) => string;
    getDiagnosticoName: (id: string) => string;
    subconjuntos: SubconjuntoDiagnostico[];
    diagnosticosFiltrados: DiagnosticoCompleto[];
  }> = ({ 
    valor, 
    index, 
    atualizarValorReferencia,
    nhbIds,
    diagnosticoIds,
    toggleNhb,
    toggleDiagnostico,
    getNhbName,
    getDiagnosticoName,
    subconjuntos,
    diagnosticosFiltrados
  }) => {
    return (
      <>
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
            Este valor representa uma alteração?
          </Label>
  
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0 ml-1">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Marque se este achado representa uma condição
                  que pode estar vinculada a um diagnóstico de enfermagem.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
  
        {valor.representaAlteracao && (
          <div className="grid gap-3 border-t pt-3 mt-2">
            <Label>Vínculo com Diagnóstico</Label>
  
            <div className="grid gap-3">
              <NhbSelectionSection
                nhbIds={nhbIds}
                toggleNhb={toggleNhb}
                getNhbName={getNhbName}
                subconjuntos={subconjuntos}
              />
  
              {nhbIds.length > 0 && (
                <DiagnosticoSelectionSection
                  diagnosticoIds={diagnosticoIds}
                  toggleDiagnostico={toggleDiagnostico}
                  getDiagnosticoName={getDiagnosticoName}
                  diagnosticosFiltrados={diagnosticosFiltrados}
                />
              )}
            </div>
          </div>
        )}
      </>
    );
};

const NhbSelectionSection: React.FC<{
    nhbIds: string[];
    toggleNhb: (nhbId: string) => void;
    getNhbName: (id: string) => string;
    subconjuntos: SubconjuntoDiagnostico[];
  }> = ({ nhbIds, toggleNhb, getNhbName, subconjuntos }) => {
    return (
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">
          1. Selecione as Necessidades Humanas Básicas (NHB)
        </Label>
        <div className="flex flex-wrap gap-1 mb-2">
          {nhbIds.map((id) => (
            <Badge key={id} variant="secondary" className="flex items-center gap-1">
              {getNhbName(id)}
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => toggleNhb(id)}>
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
                {subconjuntos.filter(s => s.tipo === 'NHB').map((nhb) => (
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
    );
};
  
const DiagnosticoSelectionSection: React.FC<{
    diagnosticoIds: string[];
    toggleDiagnostico: (diagId: string) => void;
    getDiagnosticoName: (id: string) => string;
    diagnosticosFiltrados: DiagnosticoCompleto[];
  }> = ({ diagnosticoIds, toggleDiagnostico, getDiagnosticoName, diagnosticosFiltrados }) => {
    return (
      <div>
        <Label className="text-sm text-muted-foreground mb-1 block">
          2. Selecione os Diagnósticos
        </Label>
        <div className="flex flex-wrap gap-1 mb-2">
          {diagnosticoIds.map((id) => (
            <Badge key={id} variant="secondary" className="flex items-center gap-1 max-w-full">
              <span className="truncate">{getDiagnosticoName(id)}</span>
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0 flex-shrink-0" onClick={() => toggleDiagnostico(id)}>
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
                Nenhum diagnóstico encontrado para a(s) NHB(s) selecionada(s).
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
};

export default ValorReferenciaSistemaCard;
