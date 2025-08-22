
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { X } from 'lucide-react';
import { Paciente } from '@/types/paciente';

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
  const processosConcluidos = paciente.processosEnfermagem?.filter(
    processo => processo.status === 'concluido'
  ) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            Histórico de Processos - {paciente.nomeCompleto}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {processosConcluidos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum processo concluído encontrado para este paciente.
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {processosConcluidos.map((processo, index) => (
                <AccordionItem key={processo.idProcesso} value={`processo-${index}`}>
                  <AccordionTrigger>
                    Processo concluído em{' '}
                    {processo.dataConclusao?.toDate().toLocaleDateString('pt-BR') || 
                     processo.dataInicio?.toDate().toLocaleDateString('pt-BR') || 
                     'Data não disponível'}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm">
                        {processo.evolucao?.resumoGerado || 'Resumo não disponível'}
                      </pre>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        <div className="shrink-0 flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricoProcessosModal;
