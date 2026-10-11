
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Paciente } from '@/types/paciente';
import { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import { buscarProcessosConcluidos } from '@/services/bancodados/processosEnfermagemDB';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Exame, getExames } from '@/services/bancodados/examesDB';
import { formatarLinhaResultadoExame, obterRegistrosAvaliacaoClinica } from '@/utils/resultadoExameUtils';

interface HistoricoProcessosModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente;
  enfermeiroId: string;
}

const HistoricoProcessosModal: React.FC<HistoricoProcessosModalProps> = ({
  isOpen,
  onClose,
  paciente,
  enfermeiroId
}) => {
  const [processos, setProcessos] = useState<ProcessoEnfermagem[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => getExames(setExames), []);

  const carregarHistorico = useCallback(async () => {
    if (!paciente.id) return;
    
    setLoading(true);
    try {
      const processosData = await buscarProcessosConcluidos(paciente.id, enfermeiroId);
      setProcessos(processosData);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico de processos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [paciente.id, enfermeiroId, toast]);

  useEffect(() => {
    if (isOpen) {
      carregarHistorico();
    }
  }, [isOpen, carregarHistorico]);

  const gerarTextoResumo = (processo: ProcessoEnfermagem) => {
    const linhas: string[] = [];
    
    // Cabeçalho
    linhas.push(`EVOLUÇÃO DE ENFERMAGEM`);
    linhas.push(`Paciente: ${paciente.nomeCompleto}`);
    linhas.push(`Data: ${format(processo.dataConclusao?.toDate() || new Date(), 'dd/MM/yyyy', { locale: ptBR })}`);
    linhas.push('');

    // Avaliação
    if (processo.avaliacao.coletaDeDadosSubjetivos) {
      linhas.push('AVALIAÇÃO DE ENFERMAGEM:');
      linhas.push(processo.avaliacao.coletaDeDadosSubjetivos);
      linhas.push('');
    }

    // Exame Físico
    const registrosExameFisico = obterRegistrosAvaliacaoClinica(processo.avaliacao);
    if (registrosExameFisico.length > 0) {
      linhas.push('EXAME FÍSICO:');
      const componentes = new Map(exames.flatMap((exame) =>
        exame.componentes.map((componente) => [componente.componenteAnalisado, { exame, componente }] as const)
      ));
      registrosExameFisico.filter((registro) => registro.tipo === 'parametro').forEach((registro) => {
        const cadastro = componentes.get(registro.exame);
        const texto = processo.avaliacao?.examesValoresTexto?.[registro.exame];
        linhas.push(formatarLinhaResultadoExame({
          tipoExame: cadastro?.exame.tipoExame,
          nomeExame: cadastro?.exame.nomeExame,
          componente: registro.exame,
          valor: registro.valor,
          resultadosConfigurados: cadastro?.componente.resultados,
          valorTexto: texto,
        }));
      });
      registrosExameFisico.filter((registro) => registro.tipo === 'achado').forEach(({ exame, valor, descricao }) => {
        linhas.push(`Revisão de Sistemas — ${exame}: ${valor}${descricao ? ` — ${descricao}` : ''}`);
      });
      linhas.push('');
    }

    // Diagnósticos
    if (processo.diagnostico.diagnosticosSelecionados.length > 0) {
      linhas.push('DIAGNÓSTICOS DE ENFERMAGEM:');
      processo.diagnostico.diagnosticosSelecionados.forEach(diag => {
        linhas.push(`• ${diag.tituloDiagnostico}`);
      });
      linhas.push('');
    }

    // Planejamento (Restaurado)
    if (processo.planejamento?.diagnosticosPlanejados?.length > 0) {
      linhas.push('PLANEJAMENTO DE ENFERMAGEM:');
      const diagnosticosOrdenados = [...processo.planejamento.diagnosticosPlanejados]
        .sort((a, b) => a.ordemPrioridade - b.ordemPrioridade);

      diagnosticosOrdenados.forEach((diag, index) => {
        linhas.push(`${index + 1}º) ${diag.tituloDiagnostico}`);
        if (diag.resultadoEsperadoSelecionado) {
          linhas.push(`   Resultado Esperado: ${diag.resultadoEsperadoSelecionado}`);
        }
        if (diag.intervencoesSelecionadas?.length > 0) {
          linhas.push('   Intervenções Planejadas:');
          diag.intervencoesSelecionadas.forEach(int => {
            linhas.push(`   - ${int.acaoPrescrita}`);
          });
        }
      });
      linhas.push('');
    }

    // Implementação
    const implementacao = processo.implementacao || {};
    const possuiImplementacao = Object.values(implementacao).some(d => d.intervencoes?.some(i => i.implementadoNestaConsulta));

    if (possuiImplementacao) {
      linhas.push('IMPLEMENTAÇÃO DE ENFERMAGEM:');
      Object.entries(implementacao).forEach(([tituloDiag, dados]) => {
        const implementadas = dados.intervencoes.filter(i => i.implementadoNestaConsulta);
        if (implementadas.length > 0) {
          linhas.push(`  [${tituloDiag}]`);
          implementadas.forEach(int => {
            let itemStr = `  • ${int.acaoPrescrita}`;
            if (int.prazo && int.prazoUnidade) {
               itemStr += ` - Prazo: ${int.prazo} ${int.prazoUnidade}`;
            }
            if (int.quemExecuta) {
               itemStr += ` (Executor: ${int.quemExecuta})`;
            }
            linhas.push(itemStr);
          });
        }
      });
      linhas.push('');
    }

    linhas.push('-'.repeat(40));
    linhas.push(`Enfermeiro Responsável: [${processo.enfermeiroId || 'Identificado no Sistema'}]`);
    return linhas.join('\n');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico de Processos - {paciente.nomeCompleto}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando histórico...</p>
              </div>
            </div>
          ) : processos.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Nenhum processo concluído</p>
                <p className="text-muted-foreground">Este paciente ainda não possui processos de enfermagem concluídos.</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <Accordion type="single" collapsible className="w-full">
                {processos.map((processo, index) => (
                  <AccordionItem key={processo.id} value={`processo-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            Processo concluído em {format(processo.dataConclusao?.toDate() || new Date(), 'dd/MM/yyyy', { locale: ptBR })} às {format(processo.dataConclusao?.toDate() || new Date(), 'HH:mm', { locale: ptBR })}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {processo.diagnostico.diagnosticosSelecionados.length} diagnósticos
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Duração: {Math.ceil((processo.dataConclusao?.toDate().getTime() - processo.dataInicio.toDate().getTime()) / (1000 * 60 * 60 * 24))} dias
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="mt-4">
                        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md font-mono">
                          {gerarTextoResumo(processo)}
                        </pre>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricoProcessosModal;
