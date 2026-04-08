import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
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

  const isEtapaAcessivel = (numeroEtapa: number) => {
    if (numeroEtapa <= etapaAtual || etapasCompletadas.includes(numeroEtapa)) {
      return true;
    }

    // Lógica específica para etapa de Diagnóstico (etapa 2)
    if (numeroEtapa === 2 && processo) {
      const temColeta = !!(processo.avaliacao.coletaDeDadosSubjetivos && 
                processo.avaliacao.coletaDeDadosSubjetivos.trim() !== '');
      const temExameFisico = Object.keys(processo.avaliacao.exameFisico || {}).length > 0;
      return temColeta && temExameFisico;
    }

    // Lógica específica para etapa de Planejamento (etapa 3)
    if (numeroEtapa === 3 && processo) {
      return !!(processo.diagnostico.diagnosticosSelecionados && 
                processo.diagnostico.diagnosticosSelecionados.length > 0);
    }

    // Lógica específica para etapa de Implementação (etapa 4)
    if (numeroEtapa === 4 && processo) {
      const diagnosticosPlanjados = processo.planejamento?.diagnosticosPlanejados || [];
      
      if (diagnosticosPlanjados.length === 0) return false;

      // Verificar se todos têm resultado esperado e pelo menos uma intervenção
      return diagnosticosPlanjados.every(diag => {
        if (diag.isPositivo) return true;
        const temIntervencoes = diag.intervencoesSelecionadas && diag.intervencoesSelecionadas.length > 0;
        const temResultado = !!(diag.resultadoEsperadoSelecionado && diag.resultadoEsperadoSelecionado.trim() !== '');
        return temIntervencoes && temResultado;
      });
    }

    // Lógica específica para etapa de Evolução (etapa 5)
    if (numeroEtapa === 5 && processo) {
      const implementacao = processo.implementacao || {};
      
      // Pelo menos uma intervenção marcada como implementada na consulta
      let peloMenosUmaImplementada = false;
      Object.values(implementacao).forEach(diagnostico => {
        diagnostico.intervencoes.forEach(intervencao => {
          if (intervencao.implementadoNestaConsulta) {
            peloMenosUmaImplementada = true;
          }
        });
      });

      return peloMenosUmaImplementada;
    }

    if (numeroEtapa === 6 && processo) {
      // Para acessar o resumo, a evolução (etapa 5) já precisa estar liberada.
      const implementacao = processo.implementacao || {};
      let peloMenosUmaImplementada = false;
      Object.values(implementacao).forEach(diagnostico => {
        diagnostico.intervencoes.forEach(intervencao => {
          if (intervencao.implementadoNestaConsulta) { peloMenosUmaImplementada = true; }
        });
      });
      return peloMenosUmaImplementada;
    }

    return false;
  };

  const getMotivoBloqueio = (numeroEtapa: number) => {
    if (isEtapaAcessivel(numeroEtapa)) return null;

    if (numeroEtapa === 2) {
      return "Para liberar esta etapa, preencha a coleta de dados subjetivos e pelo menos um item do exame físico.";
    }
    if (numeroEtapa === 3) {
      return "Para liberar esta etapa, selecione pelo menos um diagnóstico de enfermagem na etapa anterior.";
    }
    if (numeroEtapa === 4) {
      return "Para liberar esta etapa, todos os diagnósticos precisam ter um resultado esperado e pelo menos uma intervenção definida no planejamento.";
    }
    if (numeroEtapa === 5 || numeroEtapa === 6) {
      return "Para liberar esta etapa, marque pelo menos uma intervenção como implementada na Etapa 4.";
    }
    return "Complete as etapas anteriores para liberar.";
  };

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
            const isAcessivel = isEtapaAcessivel(etapa.numero);
            const motivoBloqueio = getMotivoBloqueio(etapa.numero);

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
