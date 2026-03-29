
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { SistemaCorporal } from '@/services/bancodados/revisaoSistemasDB';

interface ModalVisualizarSistemaProps {
  sistema: SistemaCorporal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModalVisualizarSistema: React.FC<ModalVisualizarSistemaProps> = ({
  sistema,
  open,
  onOpenChange
}) => {
  if (!sistema) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-csae-green-700">
            {sistema.nomeSistema}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2">Descrição do Sistema</h4>
            <p className="text-gray-600">{sistema.descricaoSistema}</p>
          </div>

          {sistema.exames && sistema.exames.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-4">Exames Propedêuticos</h4>
              <Accordion type="multiple" className="w-full">
                {sistema.exames.map((exame, index) => (
                  <AccordionItem value={`exame-${index}`} key={index}>
                    <AccordionTrigger className="text-left">
                      <span className="font-medium">
                        {exame.nomeExame} - {exame.propedeutica}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      {exame.achados && exame.achados.length > 0 ? (
                        <div className="space-y-4">
                          {exame.achados.map((achado, achadoIndex) => (
                            <div key={achadoIndex} className="border border-gray-200 rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">Descrição do Achado</h6>
                                  <p className="text-sm text-gray-600">{achado.descricaoAchado}</p>
                                </div>
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">Nome da Alteração</h6>
                                  <p className="text-sm text-gray-600">{achado.nomeAlteracao}</p>
                                </div>
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">Critério de Sexo</h6>
                                  <Badge variant="outline">{achado.criterioSexo}</Badge>
                                </div>
                                <div>
                                  <h6 className="font-medium text-gray-700 mb-1">Faixa Etária</h6>
                                  <p className="text-sm text-gray-600">
                                    {achado.idadeMinima !== null || achado.idadeMaxima !== null
                                      ? `${achado.idadeMinima || 0} - ${achado.idadeMaxima || '∞'} ${achado.idadeUnidade}`
                                      : 'Todas as idades'
                                    }
                                  </p>
                                </div>
                                <div className="md:col-span-2">
                                  <h6 className="font-medium text-gray-700 mb-1">NHB Vinculada</h6>
                                  <Badge variant="secondary">{achado.subconjuntoNHBVinculado}</Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">Nenhum achado cadastrado para este exame.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalVisualizarSistema;
