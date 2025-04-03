
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Paciente, Evolucao, iniciarEvolucao, salvarProgressoEvolucao, finalizarEvolucao } from '@/services/bancodados';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InfoIcon, Save, ArrowLeft, Home, ArrowRight, Copy, CheckCircle } from 'lucide-react';

// Componentes para cada etapa do processo
import { AvaliacaoEnfermagem } from './etapas/AvaliacaoEnfermagem';
import { DiagnosticoEnfermagem } from './etapas/DiagnosticoEnfermagem';
import { PlanejamentoEnfermagem } from './etapas/PlanejamentoEnfermagem';
import { ImplementacaoEnfermagem } from './etapas/ImplementacaoEnfermagem';
import { EvolucaoEnfermagem } from './etapas/EvolucaoEnfermagem';

import { Timestamp } from 'firebase/firestore';

interface EnfermageWizardProps {
  paciente: Paciente;
  evolucaoId: string | null;
  isRetomando: boolean;
  onVoltarAoPainel: () => void;
  onFinalizarEvolucao: () => void;
}

export function EnfermageWizard({ 
  paciente, 
  evolucaoId, 
  isRetomando, 
  onVoltarAoPainel,
  onFinalizarEvolucao
}: EnfermageWizardProps) {
  const { toast } = useToast();
  const [etapaAtual, setEtapaAtual] = useState('avaliacao');
  const [evolucaoAtual, setEvolucaoAtual] = useState<Evolucao | null>(null);
  const [confirmacaoSairAberta, setConfirmacaoSairAberta] = useState(false);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  // Estado para os dados de cada etapa
  const [avaliacao, setAvaliacao] = useState('');
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [planejamento, setPlanejamento] = useState<any[]>([]);
  const [implementacao, setImplementacao] = useState<any[]>([]);
  const [evolucaoFinal, setEvolucaoFinal] = useState('');

  // Verificar se existe evolução para retomar
  useEffect(() => {
    const buscarEvolucao = async () => {
      if (isRetomando && evolucaoId && paciente.evolucoes) {
        const evolucao = paciente.evolucoes.find(e => e.id === evolucaoId);
        
        if (evolucao) {
          setEvolucaoAtual(evolucao);
          
          // Preencher dados das etapas
          setAvaliacao(evolucao.avaliacao || '');
          setDiagnosticos(evolucao.diagnosticos || []);
          setPlanejamento(evolucao.planejamento || []);
          setImplementacao(evolucao.implementacao || []);
          setEvolucaoFinal(evolucao.evolucaoFinal || '');
          
          // Atualizar status para 'Em andamento'
          if (evolucao.statusConclusao === 'Interrompido') {
            try {
              await salvarProgressoEvolucao(
                paciente.id!,
                evolucaoId,
                { statusConclusao: 'Em andamento' as const }
              );
            } catch (error) {
              console.error("Erro ao retomar evolução:", error);
            }
          }
        }
      } else if (!isRetomando) {
        // Iniciar nova evolução
        try {
          if (paciente.id) {
            const novaEvolucao: Omit<Evolucao, 'dataInicio' | 'dataAtualizacao' | 'statusConclusao'> = {
              avaliacao: '',
              diagnosticos: [],
              planejamento: [],
              implementacao: [],
              evolucaoFinal: '',
            };
            
            const sucesso = await iniciarEvolucao(paciente.id, novaEvolucao);
            
            if (sucesso) {
              // Buscar o paciente atualizado para obter o ID da evolução criada
              const evolucoesCriadas = paciente.evolucoes || [];
              const novaEvolucaoCriada = evolucoesCriadas[evolucoesCriadas.length - 1];
              
              if (novaEvolucaoCriada) {
                setEvolucaoAtual(novaEvolucaoCriada);
                // Removida a linha que causava o erro, pois evolucaoId é somente leitura na props
              }
            }
          }
        } catch (error) {
          console.error("Erro ao iniciar evolução:", error);
          toast({
            title: "Erro ao iniciar",
            description: "Não foi possível iniciar uma nova evolução. Tente novamente.",
            variant: "destructive"
          });
        }
      }
    };
    
    buscarEvolucao();
  }, [isRetomando, evolucaoId, paciente.evolucoes, paciente.id, toast]);

  const handleAvancarEtapa = () => {
    let proximaEtapa = '';
    
    switch (etapaAtual) {
      case 'avaliacao':
        proximaEtapa = 'diagnostico';
        break;
      case 'diagnostico':
        // Verificar se pelo menos um diagnóstico foi selecionado
        if (!diagnosticos.some(d => d.selecionado)) {
          toast({
            title: "Selecione pelo menos um diagnóstico",
            description: "É necessário selecionar pelo menos um diagnóstico para continuar.",
            variant: "destructive"
          });
          return;
        }
        proximaEtapa = 'planejamento';
        break;
      case 'planejamento':
        // Verificar se todos os diagnósticos selecionados têm resultados e intervenções
        const diagnosticosSelecionados = diagnosticos.filter(d => d.selecionado);
        const planejamentoCompleto = diagnosticosSelecionados.every(d => {
          const plano = planejamento.find(p => p.diagnosticoId === d.id);
          return plano && plano.resultadoEsperado && plano.intervencoes.length > 0;
        });
        
        if (!planejamentoCompleto) {
          toast({
            title: "Planejamento incompleto",
            description: "Todos os diagnósticos selecionados devem ter um resultado esperado e pelo menos uma intervenção.",
            variant: "destructive"
          });
          return;
        }
        proximaEtapa = 'implementacao';
        break;
      case 'implementacao':
        // Verificar se pelo menos uma intervenção tem um responsável definido
        if (!implementacao.some(i => i.responsavel)) {
          toast({
            title: "Definir responsável",
            description: "É necessário definir pelo menos um responsável para as intervenções.",
            variant: "destructive"
          });
          return;
        }
        proximaEtapa = 'evolucao';
        break;
      default:
        return;
    }
    
    // Atualizar etapa atual
    setEtapaAtual(proximaEtapa);
  };

  const handleSalvarProgresso = async () => {
    if (!paciente.id || !evolucaoAtual?.id) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível identificar a evolução atual.",
        variant: "destructive"
      });
      return;
    }
    
    setSalvando(true);
    
    try {
      const dadosAtualizados: Partial<Evolucao> = {
        avaliacao,
        diagnosticos,
        planejamento,
        implementacao,
        evolucaoFinal,
      };
      
      const sucesso = await salvarProgressoEvolucao(
        paciente.id,
        evolucaoAtual.id,
        dadosAtualizados
      );
      
      if (sucesso) {
        toast({
          title: "Progresso salvo",
          description: "O progresso da evolução foi salvo com sucesso.",
        });
      } else {
        throw new Error("Falha ao salvar progresso");
      }
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o progresso. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };

  const handleFinalizar = async () => {
    if (!paciente.id || !evolucaoAtual?.id) {
      toast({
        title: "Erro ao finalizar",
        description: "Não foi possível identificar a evolução atual.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const dadosFinais: Partial<Evolucao> = {
        avaliacao,
        diagnosticos,
        planejamento,
        implementacao,
        evolucaoFinal,
      };
      
      const sucesso = await finalizarEvolucao(
        paciente.id,
        evolucaoAtual.id,
        dadosFinais
      );
      
      if (sucesso) {
        toast({
          title: "Evolução finalizada",
          description: "O processo de enfermagem foi concluído com sucesso.",
        });
        onFinalizarEvolucao();
      } else {
        throw new Error("Falha ao finalizar evolução");
      }
    } catch (error) {
      console.error("Erro ao finalizar evolução:", error);
      toast({
        title: "Erro ao finalizar",
        description: "Não foi possível finalizar a evolução. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copiarParaAreaDeTransferencia = () => {
    let conteudo = `EVOLUÇÃO DE ENFERMAGEM - ${paciente.nomeCompleto}\n`;
    conteudo += `Data/Hora: ${new Date().toLocaleString()}\n\n`;
    
    if (avaliacao) {
      conteudo += `AVALIAÇÃO:\n${avaliacao}\n\n`;
    }
    
    if (diagnosticos && diagnosticos.length > 0) {
      conteudo += `DIAGNÓSTICOS DE ENFERMAGEM:\n`;
      diagnosticos
        .filter(d => d.selecionado)
        .forEach(d => {
          conteudo += `- ${d.descricao}\n`;
        });
      conteudo += '\n';
    }
    
    if (planejamento && planejamento.length > 0) {
      conteudo += `PLANEJAMENTO:\n`;
      planejamento.forEach(p => {
        const diagnostico = diagnosticos?.find(d => d.id === p.diagnosticoId);
        if (diagnostico) {
          conteudo += `Diagnóstico: ${diagnostico.descricao}\n`;
          conteudo += `Resultado Esperado: ${p.resultadoEsperado}\n`;
          conteudo += `Intervenções:\n`;
          p.intervencoes.forEach((i: string) => conteudo += `- ${i}\n`);
          conteudo += '\n';
        }
      });
    }
    
    if (implementacao && implementacao.length > 0) {
      conteudo += `IMPLEMENTAÇÃO:\n`;
      implementacao.forEach(i => {
        conteudo += `Intervenção: ${i.intervencaoId}\n`;
        conteudo += `Responsável: ${i.responsavel}\n`;
        conteudo += `Status: ${i.status}\n`;
        if (i.observacoes) conteudo += `Observações: ${i.observacoes}\n`;
        conteudo += '\n';
      });
    }
    
    if (evolucaoFinal) {
      conteudo += `EVOLUÇÃO FINAL:\n${evolucaoFinal}\n`;
    }
    
    navigator.clipboard.writeText(conteudo)
      .then(() => {
        toast({
          title: "Copiado com sucesso",
          description: "A evolução foi copiada para a área de transferência.",
        });
      })
      .catch(err => {
        console.error('Erro ao copiar: ', err);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar a evolução. Tente novamente.",
          variant: "destructive"
        });
      });
  };

  // Conteúdo das tooltips para cada etapa
  const tooltips = {
    avaliacao: "Compreende a coleta de dados subjetivos (entrevista) e objetivos (exame físico) inicial e contínua pertinentes à saúde da pessoa, da família, coletividade e grupos especiais, realizada mediante auxílio de técnicas (laboratorial e de imagem, testes clínicos, escalas de avaliação validadas, protocolos institucionais e outros) para a obtenção de informações sobre as necessidades do cuidado de Enfermagem e saúde relevantes para a prática;",
    diagnostico: "Compreende a identificação de problemas existentes, condições de vulnerabilidades ou disposições para melhorar comportamentos de saúde. Estes representam o julgamento clínico das informações obtidas sobre as necessidades do cuidado de Enfermagem e saúde da pessoa, família, coletividade ou grupos especiais;",
    planejamento: "Compreende o desenvolvimento de um plano assistencial direcionado para à pessoa, família, coletividade, grupos especiais, e compartilhado com os sujeitos do cuidado e equipe de Enfermagem e saúde. Deverá envolver a Priorização de Diagnósticos de Enfermagem, Determinação de resultados (quantitativos e/ou qualitativos) esperados e exequíveis de enfermagem e de saúde e a Tomada de decisão terapêutica, declarada pela prescrição de enfermagem das intervenções, ações/atividades e protocolos assistenciais.",
    implementacao: "Compreende a realização das intervenções, ações e atividades previstas no planejamento assistencial, pela equipe de enfermagem, respeitando as resoluções/pareceres do Conselho Federal e Conselhos Regionais de Enfermagem quanto a competência técnica de cada profissional, por meio da colaboração e comunicação contínua, inclusive com a checagem quanto à execução da prescrição de enfermagem, e apoiados nos seguintes padrões: I – Padrões de cuidados de Enfermagem: cuidados autônomos do Enfermeiro, ou seja, prescritos pelo enfermeiro de forma independente, e realizados pelo Enfermeiro, por Técnico de enfermagem ou por Auxiliar de Enfermagem, observadas as competências técnicas de cada profissional e os preceitos legais da profissão; II – Padrões de cuidados Interprofissionais: cuidados colaborativos com as demais profissões de saúde; III – Padrões de cuidados em Programas de Saúde: cuidados advindos de protocolos assistenciais, tais como prescrição de medicamentos padronizados nos programas de saúde pública e em rotina aprovada pela instituição, bem como a solicitação de exames de rotina e complementares.",
    evolucao: "Compreende a avaliação dos resultados alcançados de enfermagem e saúde da pessoa, família, coletividade e grupos especiais. Esta etapa permite a análise e a revisão de todo o Processo de Enfermagem."
  };

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-csae-green-700">
              Processo de Enfermagem - {paciente.nomeCompleto}
            </h2>
            <p className="text-sm text-gray-500">
              {isRetomando ? 'Retomando evolução' : 'Nova evolução'} - {new Date().toLocaleDateString()}
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setConfirmacaoSairAberta(true)}
          >
            <Home className="mr-2 h-4 w-4" />
            Voltar ao início
          </Button>
        </div>
        
        <Tabs value={etapaAtual} className="w-full">
          <TabsList className="w-full justify-between bg-gray-50 border-b rounded-none h-auto p-0">
            {Object.entries(tooltips).map(([key, tooltip], index) => (
              <TabsTrigger 
                key={key}
                value={key}
                disabled={etapaAtual !== key}
                className={`data-[state=active]:bg-csae-green-50 data-[state=active]:text-csae-green-700 flex-1 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-csae-green-600 ${
                  index + 1 <= Object.keys(tooltips).indexOf(etapaAtual) + 1 
                    ? 'text-gray-700' 
                    : 'text-gray-400'
                }`}
              >
                <span className="mr-2">{index + 1}.</span>
                <span className="mr-1">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <InfoIcon className="h-4 w-4 opacity-60" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm text-xs">
                      {tooltip}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="avaliacao" className="p-6">
            <AvaliacaoEnfermagem 
              valor={avaliacao} 
              onChange={setAvaliacao} 
            />
          </TabsContent>
          
          <TabsContent value="diagnostico" className="p-6">
            <DiagnosticoEnfermagem 
              diagnosticos={diagnosticos} 
              setDiagnosticos={setDiagnosticos} 
            />
          </TabsContent>
          
          <TabsContent value="planejamento" className="p-6">
            <PlanejamentoEnfermagem 
              diagnosticos={diagnosticos.filter(d => d.selecionado)} 
              planejamento={planejamento}
              setPlanejamento={setPlanejamento}
            />
          </TabsContent>
          
          <TabsContent value="implementacao" className="p-6">
            <ImplementacaoEnfermagem 
              planejamento={planejamento}
              implementacao={implementacao}
              setImplementacao={setImplementacao}
            />
          </TabsContent>
          
          <TabsContent value="evolucao" className="p-6">
            <EvolucaoEnfermagem 
              valor={evolucaoFinal} 
              onChange={setEvolucaoFinal}
              diagnosticos={diagnosticos.filter(d => d.selecionado)}
              planejamento={planejamento}
              implementacao={implementacao}
            />
          </TabsContent>
        </Tabs>
        
        <div className="p-4 border-t bg-gray-50 flex justify-between">
          {etapaAtual === 'evolucao' ? (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleSalvarProgresso}
                disabled={salvando}
              >
                <Save className="mr-2 h-4 w-4" />
                {salvando ? "Salvando..." : "Salvar Progresso"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={copiarParaAreaDeTransferencia}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              
              <Button 
                className="bg-csae-green-600 hover:bg-csae-green-700"
                onClick={handleFinalizar}
                disabled={loading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {loading ? "Finalizando..." : "Finalizar"}
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleSalvarProgresso}
              disabled={salvando}
            >
              <Save className="mr-2 h-4 w-4" />
              {salvando ? "Salvando..." : "Salvar Progresso"}
            </Button>
          )}
          
          {etapaAtual !== 'evolucao' && (
            <Button 
              className="bg-csae-green-600 hover:bg-csae-green-700"
              onClick={handleAvancarEtapa}
            >
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Modal de confirmação para sair */}
      <Dialog open={confirmacaoSairAberta} onOpenChange={setConfirmacaoSairAberta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar saída</DialogTitle>
            <DialogDescription>
              Se sair agora, você perderá todo o progresso não salvo. Deseja salvar antes de sair?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmacaoSairAberta(false);
                onVoltarAoPainel();
              }}
            >
              Sair sem salvar
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="default"
                className="bg-csae-green-600 hover:bg-csae-green-700"
                onClick={async () => {
                  await handleSalvarProgresso();
                  setConfirmacaoSairAberta(false);
                  onVoltarAoPainel();
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar e sair
              </Button>
              <Button 
                variant="outline"
                onClick={() => setConfirmacaoSairAberta(false)}
              >
                Continuar editando
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
