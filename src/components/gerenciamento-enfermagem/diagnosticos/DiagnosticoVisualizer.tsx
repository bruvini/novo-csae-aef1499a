
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { DiagnosticoCompleto } from '@/services/bancodados/tipos';

interface DiagnosticoVisualizerProps {
  diagnostico: DiagnosticoCompleto;
  onClose: () => void;
  getNomeSubconjunto: (id: string) => string;
  getTipoSubconjunto: (id: string) => string;
}

const DiagnosticoVisualizer = ({
  diagnostico,
  onClose,
  getNomeSubconjunto,
  getTipoSubconjunto
}: DiagnosticoVisualizerProps) => {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded-full text-xs ${
          getTipoSubconjunto(diagnostico.subconjuntoId) === 'Protocolo' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {getNomeSubconjunto(diagnostico.subconjuntoId)}
        </span>
        <h3 className="text-lg font-semibold">{diagnostico.nome}</h3>
      </div>
      
      {diagnostico.explicacao && (
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-gray-700">{diagnostico.explicacao}</p>
        </div>
      )}
      
      <div className="space-y-4 mt-4">
        <h4 className="font-semibold text-csae-green-700">Resultados Esperados e Intervenções</h4>
        
        <Accordion type="single" collapsible className="w-full">
          {diagnostico.resultadosEsperados.map((resultado, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-md">
                <span className="text-left">{resultado.descricao}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 pt-2 space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Intervenções:</h5>
                  
                  <div className="space-y-1 pl-2">
                    {resultado.intervencoes.map((intervencao, i) => (
                      <div key={i} className="bg-gray-50 p-2 rounded">
                        <div className="text-sm">
                          <span className="font-medium">Enfermeiro:</span> 
                          <span className="text-green-700"> {intervencao.verboPrimeiraEnfermeiro}</span> {intervencao.descricaoRestante}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Outra pessoa:</span> 
                          <span className="text-blue-700"> {intervencao.verboOutraPessoa}</span> {intervencao.descricaoRestante}
                        </div>
                        {(intervencao.nomeDocumento || intervencao.linkDocumento) && (
                          <div className="text-sm mt-1 pt-1 border-t border-gray-200">
                            <span className="font-medium">Documento de apoio:</span> 
                            {intervencao.linkDocumento ? (
                              <a 
                                href={intervencao.linkDocumento} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {intervencao.nomeDocumento || intervencao.linkDocumento}
                              </a>
                            ) : (
                              <span> {intervencao.nomeDocumento}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <DialogFooter>
        <Button onClick={onClose}>
          Fechar
        </Button>
      </DialogFooter>
    </div>
  );
};

export default DiagnosticoVisualizer;
