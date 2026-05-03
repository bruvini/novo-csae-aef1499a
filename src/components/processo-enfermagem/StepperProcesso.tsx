import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Search, FileText, Target, Play, TrendingUp } from 'lucide-react';
import { ETAPAS_PROCESSO } from '@/types/processoEnfermagem';
import { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import { cn } from '@/lib/utils';
import { isEtapaAcessivel, getMotivoBloqueio } from '@/utils/processoUtils';

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
  TrendingUp,
  CheckCircle
};

const StepperProcesso: React.FC<StepperProcessoProps> = ({
  etapaAtual,
  onEtapaChange,
  etapasCompletadas,
  processo
}) => {
  const progressoAtual = (etapaAtual / 6) * 100;



  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-csae-green-800">
            Progresso do Processo de Enfermagem
          </h3>
          <span className="text-sm text-gray-600">
            Etapa {etapaAtual} de 6
          </span>
        </div>

        <Progress value={progressoAtual} className="h-2" />

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          {ETAPAS_PROCESSO.map((etapa) => {
            const IconeComponent = ICONES_ETAPAS[etapa.icone as keyof typeof ICONES_ETAPAS];
            const isAtual = etapa.numero === etapaAtual;
            const isCompletada = etapasCompletadas.includes(etapa.numero);
            const isAcessivel = isEtapaAcessivel(etapa.numero, etapaAtual, etapasCompletadas, processo!);
            const motivoBloqueio = getMotivoBloqueio(etapa.numero, etapaAtual, etapasCompletadas, processo!);

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
                <TooltipContent side="bottom" className="max-w-sm p-3">
                  <div className="space-y-1">
                    <p className="font-bold text-sm flex items-center gap-2">
                       {etapa.numero}. {etapa.nome}
                       {!isAcessivel && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase">Bloqueado</span>}
                    </p>
                    {motivoBloqueio ? (
                      <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded border border-red-100 italic">
                        {motivoBloqueio}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-600">{etapa.descricao}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default StepperProcesso;
