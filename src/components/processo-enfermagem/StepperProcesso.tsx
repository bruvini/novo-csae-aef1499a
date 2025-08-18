
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Search, FileText, Target, Play, TrendingUp } from 'lucide-react';
import { ETAPAS_PROCESSO } from '@/types/processoEnfermagem';
import { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import { cn } from '@/lib/utils';

interface StepperProcessoProps {
  etapaAtual: number;
  onEtapaChange: (etapa: number) => void;
  etapasCompletadas: number[];
  processo?: ProcessoEnfermagem;
}

const ICONES_ETAPAS = {
  Search,
  FileText,
  Target,
  Play,
  TrendingUp
};

const StepperProcesso: React.FC<StepperProcessoProps> = ({
  etapaAtual,
  onEtapaChange,
  etapasCompletadas,
  processo
}) => {
  const progressoAtual = (etapaAtual / 5) * 100;

  const isEtapaAcessivel = (numeroEtapa: number) => {
    if (numeroEtapa <= etapaAtual || etapasCompletadas.includes(numeroEtapa)) {
      return true;
    }

    // Lógica específica para etapa de Diagnóstico (etapa 2)
    if (numeroEtapa === 2 && processo) {
      return !!(processo.avaliacao.coletaDeDadosSubjetivos && 
                processo.avaliacao.coletaDeDadosSubjetivos.trim() !== '');
    }

    // Lógica específica para etapa de Planejamento (etapa 3)
    if (numeroEtapa === 3 && processo) {
      return !!(processo.diagnostico.diagnosticosSelecionados && 
                processo.diagnostico.diagnosticosSelecionados.length > 0);
    }

    // Lógica específica para etapa de Implementação (etapa 4)
    if (numeroEtapa === 4 && processo) {
      const diagnosticosPlanjados = processo.planejamento?.diagnosticosPlanejados || [];
      
      if (diagnosticosPlanjados.length === 0) {
        return false;
      }

      // Verificar se todos têm resultado esperado (quando aplicável) e intervenções
      return diagnosticosPlanjados.every(diag => {
        // Todos devem ter pelo menos uma intervenção
        const temIntervencoes = diag.intervencoesSelecionadas && diag.intervencoesSelecionadas.length > 0;
        
        // Se tem resultado esperado definido no planejamento, deve estar preenchido
        const temResultado = !diag.resultadoEsperadoSelecionado || diag.resultadoEsperadoSelecionado.trim() !== '';
        
        return temIntervencoes && temResultado;
      });
    }

    return false;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-csae-green-800">
          Progresso do Processo de Enfermagem
        </h3>
        <span className="text-sm text-gray-600">
          Etapa {etapaAtual} de 5
        </span>
      </div>

      <Progress value={progressoAtual} className="h-2" />

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        {ETAPAS_PROCESSO.map((etapa) => {
          const IconeComponent = ICONES_ETAPAS[etapa.icone as keyof typeof ICONES_ETAPAS];
          const isAtual = etapa.numero === etapaAtual;
          const isCompletada = etapasCompletadas.includes(etapa.numero);
          const isAcessivel = isEtapaAcessivel(etapa.numero);

          return (
            <Tooltip key={etapa.numero}>
              <TooltipTrigger asChild>
                <Button
                  variant={isAtual ? "default" : isCompletada ? "secondary" : "outline"}
                  size="sm"
                  className={cn(
                    "flex-1 sm:flex-none flex items-center gap-2 h-auto py-2 px-3",
                    isAtual && "csae-btn-primary",
                    !isAcessivel && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => isAcessivel && onEtapaChange(etapa.numero)}
                  disabled={!isAcessivel}
                >
                  {isCompletada ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isAtual ? (
                    <IconeComponent className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline text-xs font-medium">
                    {etapa.nome}
                  </span>
                  <span className="sm:hidden text-xs font-medium">
                    {etapa.numero}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm">
                <p className="font-medium">{etapa.nome}</p>
                <p className="text-sm text-gray-600 mt-1">{etapa.descricao}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default StepperProcesso;
