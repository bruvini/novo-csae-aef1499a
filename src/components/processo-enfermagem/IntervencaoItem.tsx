
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { IntervencaoImplementada } from '@/types/processoEnfermagem';

interface IntervencaoItemProps {
  intervencao: IntervencaoImplementada;
  onUpdate: (intervencao: IntervencaoImplementada) => void;
}

const IntervencaoItem: React.FC<IntervencaoItemProps> = ({ intervencao, onUpdate }) => {
  const handleImplementadoChange = (checked: boolean) => {
    onUpdate({
      ...intervencao,
      implementadoNestaConsulta: checked,
      // Limpar executor ao desmarcar para evitar dados fantasmas no banco
      quemExecuta: checked ? intervencao.quemExecuta : undefined
    });
  };

  const handleExecutorChange = (executor: string) => {
    onUpdate({
      ...intervencao,
      quemExecuta: executor
    });
  };

  const handlePrazoChange = (prazo: number) => {
    onUpdate({
      ...intervencao,
      prazo: prazo
    });
  };

  const handlePrazoUnidadeChange = (unidade: string) => {
    onUpdate({
      ...intervencao,
      prazoUnidade: unidade as 'segundos' | 'minutos' | 'horas' | 'dias' | 'semanas' | 'meses' | 'anos'
    });
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* Checkbox principal e texto da intervenção */}
      <div className="flex items-start gap-3">
        <Checkbox
          id={`intervencao-${intervencao.acaoPrescrita}`}
          checked={intervencao.implementadoNestaConsulta}
          onCheckedChange={handleImplementadoChange}
          className="mt-1"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-start gap-2">
            <label
              htmlFor={`intervencao-${intervencao.acaoPrescrita}`}
              className="text-sm font-medium leading-relaxed cursor-pointer flex-1"
            >
              {intervencao.acaoPrescrita}
            </label>
            <Badge variant={intervencao.tipo === 'padrao' ? 'secondary' : 'outline'}>
              {intervencao.tipo === 'padrao' ? 'Padrão' : 'Autoral'}
            </Badge>
          </div>

          {/* ToggleGroup para quem executa */}
          <div className="flex items-center gap-4 mt-2">
            <Label className={cn("text-xs font-medium", intervencao.implementadoNestaConsulta && !intervencao.quemExecuta ? "text-red-500 font-bold" : "text-muted-foreground")}>
              Quem executa (Obrigatório)*:
            </Label>
            <ToggleGroup
              type="single"
              value={intervencao.quemExecuta || ''}
              onValueChange={(val) => handleExecutorChange(val)}
              size="sm"
              className={cn("flex flex-wrap gap-2 justify-start", intervencao.implementadoNestaConsulta && !intervencao.quemExecuta && "border border-red-500 rounded-md")}
              disabled={!intervencao.implementadoNestaConsulta}
            >
              <ToggleGroupItem value="Enfermeiro" className="text-xs">
                Enfermeiro
              </ToggleGroupItem>
              <ToggleGroupItem value="Técnico/Auxiliar de Enfermagem" className="text-xs">
                Téc/Aux Enfermagem
              </ToggleGroupItem>
              <ToggleGroupItem value="Equipe Multiprofissional" className="text-xs">
                Equipe Multi
              </ToggleGroupItem>
              <ToggleGroupItem value="Cuidador/Familiar" className="text-xs">
                Cuidador/Familiar
              </ToggleGroupItem>
              <ToggleGroupItem value="Paciente" className="text-xs">
                Paciente
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Campos de prazo */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Prazo:
              </label>
              <Input
                type="number"
                placeholder="Ex: 3"
                value={intervencao.prazo || ''}
                onChange={(e) => handlePrazoChange(Number(e.target.value))}
                className="text-sm"
                min="1"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Unidade:
              </label>
              <Select value={intervencao.prazoUnidade || ''} onValueChange={handlePrazoUnidadeChange}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="segundos">Segundos</SelectItem>
                  <SelectItem value="minutos">Minutos</SelectItem>
                  <SelectItem value="horas">Horas</SelectItem>
                  <SelectItem value="dias">Dias</SelectItem>
                  <SelectItem value="semanas">Semanas</SelectItem>
                  <SelectItem value="meses">Meses</SelectItem>
                  <SelectItem value="anos">Anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntervencaoItem;
