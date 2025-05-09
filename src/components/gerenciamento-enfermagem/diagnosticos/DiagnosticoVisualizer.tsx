
import React from 'react';
import { DiagnosticoCompleto } from '@/types/diagnosticos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DiagnosticoVisualizerProps {
  diagnostico: DiagnosticoCompleto;
  getNomeSubconjunto?: (subconjuntoId: string | undefined) => string;
}

const DiagnosticoVisualizer: React.FC<DiagnosticoVisualizerProps> = ({ 
  diagnostico,
  getNomeSubconjunto = () => "Não categorizado"
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg text-csae-green-700">{diagnostico.titulo}</CardTitle>
            <CardDescription className="text-sm mt-1">
              {diagnostico.subconjuntoId ? getNomeSubconjunto(diagnostico.subconjuntoId) : "Não categorizado"}
            </CardDescription>
          </div>
          <Badge className="bg-csae-green-100 text-csae-green-700 hover:bg-csae-green-200">
            {diagnostico.tipoRisco || 'Diagnóstico'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-gray-700 mb-3">{diagnostico.descricao}</p>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <CollapsibleTrigger className="flex items-center justify-center w-full py-2 border-t border-gray-200 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            {isOpen ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Ocultar detalhes
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Ver detalhes
              </>
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-3">
            {diagnostico.caracteristicasDefinidoras?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Características Definidoras:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 pl-2 space-y-1">
                  {diagnostico.caracteristicasDefinidoras.map((caracteristica, index) => (
                    <li key={index}>{caracteristica}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {diagnostico.fatoresRelacionados?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Fatores Relacionados:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 pl-2 space-y-1">
                  {diagnostico.fatoresRelacionados.map((fator, index) => (
                    <li key={index}>{fator}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {diagnostico.fatoresRisco?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Fatores de Risco:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 pl-2 space-y-1">
                  {diagnostico.fatoresRisco.map((fator, index) => (
                    <li key={index}>{fator}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {diagnostico.condicaoAssociada && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Condição Associada:</h4>
                <p className="text-sm text-gray-700 pl-2">{diagnostico.condicaoAssociada}</p>
              </div>
            )}
            
            {diagnostico.populacaoRisco && (
              <div>
                <h4 className="text-sm font-semibold mb-1">População em Risco:</h4>
                <p className="text-sm text-gray-700 pl-2">{diagnostico.populacaoRisco}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default DiagnosticoVisualizer;
