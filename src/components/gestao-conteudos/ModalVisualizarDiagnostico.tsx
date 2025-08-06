
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModalVisualizarDiagnosticoProps {
  diagnostico: Diagnostico | null;
  open: boolean;
  onClose: () => void;
}

const ModalVisualizarDiagnostico = ({ diagnostico, open, onClose }: ModalVisualizarDiagnosticoProps) => {
  if (!diagnostico) return null;

  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'Não informado';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-csae-green-700">
            {diagnostico.tituloDiagnostico}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Descrição */}
          {diagnostico.descricaoDiagnostico && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Descrição</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                {diagnostico.descricaoDiagnostico}
              </p>
            </div>
          )}

          {/* Data de Cadastro */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Data de Cadastro</h3>
            <p className="text-gray-700">
              {formatarData(diagnostico.dataCadastro)}
            </p>
          </div>

          {/* Subconjuntos */}
          {diagnostico.subconjuntos && diagnostico.subconjuntos.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Subconjuntos Vinculados</h3>
              <div className="flex flex-wrap gap-2">
                {diagnostico.subconjuntos.map((subconjunto, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    <span className="font-medium">{subconjunto.tituloSubconjunto}</span>
                    <span className="ml-1 text-xs opacity-75">
                      ({subconjunto.tipoSubconjunto})
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Resultados Esperados */}
          {diagnostico.resultadosEsperados && diagnostico.resultadosEsperados.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Resultados Esperados</h3>
              <Accordion type="multiple" className="w-full">
                {diagnostico.resultadosEsperados.map((resultado, resultadoIndex) => (
                  <AccordionItem key={resultadoIndex} value={`resultado-${resultadoIndex}`}>
                    <AccordionTrigger className="text-left">
                      <span className="font-medium">{resultado.tituloResultado}</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {/* Descrição do Resultado */}
                      {resultado.descricaoResultado && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">Descrição</h4>
                          <p className="text-gray-600 bg-gray-50 p-2 rounded text-sm">
                            {resultado.descricaoResultado}
                          </p>
                        </div>
                      )}

                      {/* Intervenções */}
                      {resultado.intervencoes && resultado.intervencoes.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">
                            Intervenções de Enfermagem ({resultado.intervencoes.length})
                          </h4>
                          <div className="space-y-3">
                            {resultado.intervencoes.map((intervencao, intervencaoIndex) => (
                              <div key={intervencaoIndex} className="border border-gray-200 rounded-lg p-3 bg-white">
                                <div className="space-y-2">
                                  {/* Ação do Enfermeiro */}
                                  {intervencao.acaoEnfermeiro && (
                                    <div>
                                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                                        Ação do Enfermeiro
                                      </span>
                                      <p className="text-sm text-gray-700 mt-1">
                                        {intervencao.acaoEnfermeiro}
                                      </p>
                                    </div>
                                  )}

                                  {/* Ação Prescrita */}
                                  {intervencao.acaoPrescrita && (
                                    <div>
                                      <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                                        Ação Prescrita
                                      </span>
                                      <p className="text-sm text-gray-700 mt-1">
                                        {intervencao.acaoPrescrita}
                                      </p>
                                    </div>
                                  )}

                                  {/* Materiais de Apoio */}
                                  {intervencao.materiaisDeApoio && intervencao.materiaisDeApoio.length > 0 && (
                                    <div>
                                      <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                                        Materiais de Apoio
                                      </span>
                                      <ul className="mt-1 space-y-1">
                                        {intervencao.materiaisDeApoio.map((material, materialIndex) => (
                                          <li key={materialIndex} className="text-sm">
                                            {material.urlMaterialApoio ? (
                                              <a 
                                                href={material.urlMaterialApoio} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                              >
                                                {material.tituloMaterialApoio}
                                              </a>
                                            ) : (
                                              <span className="text-gray-700">
                                                {material.tituloMaterialApoio}
                                              </span>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
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

export default ModalVisualizarDiagnostico;
