
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { SistemaCorporal, Achado } from '@/services/bancodados/revisaoSistemasDB';

interface ModalVisualizarSistemaProps {
  sistema: SistemaCorporal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const inferEhAlteracao = (achado: Achado): boolean =>
  achado.ehAlteracao ?? !!achado.subconjuntoNHBVinculado;

const sortedAchados = (achados: Achado[]): Achado[] =>
  [...achados].sort((a, b) => {
    const aScore = inferEhAlteracao(a) ? 1 : 0;
    const bScore = inferEhAlteracao(b) ? 1 : 0;
    return aScore - bScore;
  });

const ModalVisualizarSistema: React.FC<ModalVisualizarSistemaProps> = ({
  sistema,
  open,
  onOpenChange,
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
          {sistema.descricaoSistema && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Descrição do Sistema</h4>
              <p className="text-gray-600 text-sm">{sistema.descricaoSistema}</p>
            </div>
          )}

          {sistema.exames && sistema.exames.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Exames Propedêuticos</h4>
              <Accordion type="multiple" className="w-full">
                {sistema.exames.map((exame, index) => (
                  <AccordionItem value={`exame-${index}`} key={index}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{exame.nomeExame}</span>
                        <Badge variant="outline" className="text-xs font-normal">
                          {exame.propedeutica}
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {exame.achados?.length || 0} achado{exame.achados?.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {exame.achados && exame.achados.length > 0 ? (
                        <div className="space-y-2 pt-1">
                          {sortedAchados(exame.achados).map((achado, achadoIndex) => {
                            const isAlteracao = inferEhAlteracao(achado);
                            return (
                              <div
                                key={achadoIndex}
                                className="flex items-start justify-between p-3 rounded-md border bg-muted/20"
                              >
                                <div className="flex flex-col flex-1 min-w-0 pr-4">
                                  <span className="text-sm">{achado.descricaoAchado}</span>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {isAlteracao ? (
                                      <Badge className="text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-50">
                                        {achado.nomeAlteracao || 'Alterado'}
                                      </Badge>
                                    ) : (
                                      <Badge className="text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-50">
                                        {achado.nomeAlteracao || 'Normal'}
                                      </Badge>
                                    )}
                                    {achado.criterioSexo && achado.criterioSexo !== 'Ambos' && (
                                      <Badge variant="outline" className="text-xs">
                                        {achado.criterioSexo}
                                      </Badge>
                                    )}
                                    {(achado.idadeMinima !== null || achado.idadeMaxima !== null) && (
                                      <Badge variant="outline" className="text-xs">
                                        {achado.idadeMinima ?? 0}–{achado.idadeMaxima ?? '∞'}{' '}
                                        {achado.idadeUnidade}
                                      </Badge>
                                    )}
                                    {isAlteracao && achado.subconjuntoNHBVinculado && (
                                      <Badge variant="secondary" className="text-xs">
                                        NHB: {achado.subconjuntoNHBVinculado}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic text-sm pt-1">
                          Nenhum achado cadastrado para este exame.
                        </p>
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
