
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Clock } from 'lucide-react';
import { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { buscarProcessosConcluidos } from '@/services/bancodados/processosEnfermagemDB';
import { useAuth } from '@/contexts/AuthContext';

interface HistoricoProcessosModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente;
}

const HistoricoProcessosModal: React.FC<HistoricoProcessosModalProps> = ({
  isOpen,
  onClose,
  paciente
}) => {
  const { user } = useAuth();
  const [processos, setProcessos] = useState<ProcessoEnfermagem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user && paciente) {
      carregarHistorico();
    }
  }, [isOpen, user, paciente]);

  const carregarHistorico = async () => {
    if (!user || !paciente) return;

    setLoading(true);
    try {
      const processosHistorico = await buscarProcessosConcluidos(paciente.id, user.uid);
      setProcessos(processosHistorico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'Data não disponível';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const calcularDuracaoSessoes = (sessoes: any[]) => {
    if (!sessoes || sessoes.length === 0) return 'N/A';

    let duracaoTotal = 0;
    sessoes.forEach(sessao => {
      if (sessao.inicioSessao && sessao.fimSessao) {
        const inicio = sessao.inicioSessao.toDate ? sessao.inicioSessao.toDate() : new Date(sessao.inicioSessao);
        const fim = sessao.fimSessao.toDate ? sessao.fimSessao.toDate() : new Date(sessao.fimSessao);
        duracaoTotal += fim.getTime() - inicio.getTime();
      }
    });

    const horas = Math.floor(duracaoTotal / (1000 * 60 * 60));
    const minutos = Math.floor((duracaoTotal % (1000 * 60 * 60)) / (1000 * 60));

    if (horas > 0) {
      return `${horas}h ${minutos}min`;
    }
    return `${minutos}min`;
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

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p>Carregando histórico...</p>
            </div>
          ) : processos.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">
                Nenhum processo de enfermagem concluído encontrado para este paciente.
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {processos.map((processo, index) => (
                <AccordionItem key={processo.id || index} value={`processo-${index}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          Processo #{index + 1}
                        </Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{formatarData(processo.dataConclusao)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{calcularDuracaoSessoes(processo.sessoesDeTrabalho || [])}</span>
                        <Badge 
                          variant={processo.status === 'concluido' ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {processo.status === 'concluido' ? 'Concluído' : 'Em Andamento'}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {/* Informações Gerais */}
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                        <div>
                          <span className="text-sm font-medium">Data de Início:</span>
                          <p className="text-sm">{formatarData(processo.dataInicio)}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Data de Conclusão:</span>
                          <p className="text-sm">{formatarData(processo.dataConclusao)}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Número de Sessões:</span>
                          <p className="text-sm">{processo.sessoesDeTrabalho?.length || 0}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Duração Total:</span>
                          <p className="text-sm">{calcularDuracaoSessoes(processo.sessoesDeTrabalho || [])}</p>
                        </div>
                      </div>

                      {/* Resumo da Evolução */}
                      <div>
                        <h4 className="font-medium mb-3">Evolução de Enfermagem:</h4>
                        <div className="bg-background border rounded-lg p-4">
                          {processo.evolucao?.resumoGerado ? (
                            <pre className="whitespace-pre-wrap text-sm font-mono">
                              {processo.evolucao.resumoGerado}
                            </pre>
                          ) : (
                            <p className="text-muted-foreground text-sm">
                              Resumo da evolução não disponível para este processo.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Diagnósticos (resumo) */}
                      {processo.diagnostico?.diagnosticosSelecionados?.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Diagnósticos Identificados:</h4>
                          <div className="space-y-1">
                            {processo.diagnostico.diagnosticosSelecionados.map((diag, diagIndex) => (
                              <div key={diagIndex} className="text-sm bg-muted p-2 rounded">
                                • {diag.tituloDiagnostico}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricoProcessosModal;
