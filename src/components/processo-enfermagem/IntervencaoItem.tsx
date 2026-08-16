
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Combobox } from '@/components/ui/combobox';
import {
  IntervencaoImplementada,
  normalizarExecutores,
} from '@/types/processoEnfermagem';

interface IntervencaoItemProps {
  intervencao: IntervencaoImplementada;
  onUpdate: (intervencao: IntervencaoImplementada) => void;
}

const OPCOES_APRAZAMENTO = [
  { value: 'A cada consulta', label: 'A cada consulta' },
  { value: 'A critério clínico', label: 'A critério clínico' },
  { value: 'Visita Domiciliar', label: 'Visita Domiciliar' },
  { value: 'Diário', label: 'Diário' },
  { value: 'Semanal', label: 'Semanal' },
  { value: 'Quinzenal', label: 'Quinzenal' },
  { value: 'Mensal', label: 'Mensal' },
  { value: 'Trimestral', label: 'Trimestral' },
  { value: 'Semestral', label: 'Semestral' },
  { value: 'Anual', label: 'Anual' },
];

const IntervencaoItem: React.FC<IntervencaoItemProps> = ({ intervencao, onUpdate }) => {
  const executoresAtuais = normalizarExecutores(intervencao.quemExecuta);
  const semExecutor = intervencao.implementadoNestaConsulta && executoresAtuais.length === 0;

  const handleImplementadoChange = (checked: boolean) => {
    if (checked) {
      onUpdate({ ...intervencao, implementadoNestaConsulta: true });
    } else {
      // Remove campos de execução ao desmarcar — undefined não pode ir ao Firestore
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { quemExecuta: _q, aprazamento: _a, prazo: _p, prazoUnidade: _u, ...resto } = intervencao;
      onUpdate({ ...resto, implementadoNestaConsulta: false });
    }
  };

  const handleExecutorChange = (vals: string[]) => {
    onUpdate({ ...intervencao, quemExecuta: vals });
  };

  const handleAprazamentoChange = (valor: string) => {
    onUpdate({ ...intervencao, aprazamento: valor });
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
        <div className="flex-1 space-y-3">
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

          {/* Multi-select executores */}
          <div className={cn('space-y-1', !intervencao.implementadoNestaConsulta && 'opacity-40 pointer-events-none select-none')}>
            <Label className={cn('text-xs font-medium', semExecutor ? 'text-red-500 font-bold' : 'text-muted-foreground')}>
              Quem executa (Obrigatório)*:
            </Label>
            <ToggleGroup
              type="multiple"
              value={executoresAtuais}
              onValueChange={handleExecutorChange}
              size="sm"
              className={cn('flex flex-wrap gap-1.5 justify-start', semExecutor && 'border border-red-500 rounded-md p-1')}
              disabled={!intervencao.implementadoNestaConsulta}
            >
              <ToggleGroupItem value="Enfermeiro" className="text-xs">
                Enfermeiro
              </ToggleGroupItem>
              <ToggleGroupItem value="Técnico/Auxiliar de Enfermagem" className="text-xs">
                Téc/Aux Enfermagem
              </ToggleGroupItem>
              <ToggleGroupItem value="Equipe de Saúde da Família (eSF)" className="text-xs">
                eSF
              </ToggleGroupItem>
              <ToggleGroupItem value="Equipe Multiprofissional" className="text-xs">
                Equipe Multi
              </ToggleGroupItem>
              <ToggleGroupItem value="Cuidador/Familiar" className="text-xs">
                Cuidador/Familiar
              </ToggleGroupItem>
              <ToggleGroupItem value="Paciente (Autocuidado)" className="text-xs">
                Paciente
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Aprazamento híbrido */}
          <div className={cn('space-y-1', !intervencao.implementadoNestaConsulta && 'opacity-40 pointer-events-none select-none')}>
            <Label className="text-xs font-medium text-muted-foreground">
              Aprazamento:
            </Label>
            <Combobox
              options={OPCOES_APRAZAMENTO}
              value={intervencao.aprazamento || ''}
              onValueChange={handleAprazamentoChange}
              placeholder="Selecione ou digite..."
              searchPlaceholder="Buscar ou digitar..."
              emptyText="Nenhuma opção — pressione Enter para usar o texto digitado"
              className="text-sm h-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntervencaoItem;
