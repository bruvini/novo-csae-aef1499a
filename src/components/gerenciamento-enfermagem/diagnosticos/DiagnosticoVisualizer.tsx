
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DiagnosticoCompleto, Subconjunto } from '@/types/diagnosticos';
import { Badge } from "@/components/ui/badge";

interface DiagnosticoVisualizerProps {
  diagnostico: DiagnosticoCompleto;
  subconjuntos: Subconjunto[];
}

const DiagnosticoVisualizer = ({ diagnostico, subconjuntos }: DiagnosticoVisualizerProps) => {
  // Get subconjunto names
  const getSubconjuntoInfo = (ids: string[] = []) => {
    return ids.map(id => {
      const subconjunto = subconjuntos.find(s => s.id === id);
      return {
        nome: subconjunto?.nome || "Desconhecido",
        tipo: subconjunto?.tipo || "Desconhecido"
      };
    });
  };

  const subconjuntosInfo = getSubconjuntoInfo(diagnostico.subconjuntoIds);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="bg-gray-50">
          <CardTitle className="text-csae-green-700">{diagnostico.nome}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {diagnostico.explicacao && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">Explicação:</h4>
              <p className="text-sm">{diagnostico.explicacao}</p>
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-1">Subconjuntos:</h4>
            <div className="flex flex-wrap gap-2">
              {subconjuntosInfo.length > 0 ? (
                subconjuntosInfo.map((info, index) => (
                  <Badge key={index} variant="outline">
                    {info.nome} ({info.tipo})
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">Nenhum subconjunto associado</span>
              )}
            </div>
          </div>
          
          {diagnostico.caracteristicasDefinidoras && diagnostico.caracteristicasDefinidoras.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">Características Definidoras:</h4>
              <ul className="list-disc pl-5 text-sm">
                {diagnostico.caracteristicasDefinidoras.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnostico.fatoresRelacionados && diagnostico.fatoresRelacionados.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">Fatores Relacionados:</h4>
              <ul className="list-disc pl-5 text-sm">
                {diagnostico.fatoresRelacionados.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnostico.populacaoRisco && diagnostico.populacaoRisco.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">População de Risco:</h4>
              <ul className="list-disc pl-5 text-sm">
                {diagnostico.populacaoRisco.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnostico.condicoesAssociadas && diagnostico.condicoesAssociadas.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-1">Condições Associadas:</h4>
              <ul className="list-disc pl-5 text-sm">
                {diagnostico.condicoesAssociadas.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados Esperados e Intervenções */}
      <h3 className="text-lg font-semibold text-csae-green-700 mt-6">Resultados Esperados e Intervenções</h3>
      
      {diagnostico.resultadosEsperados && diagnostico.resultadosEsperados.map((resultado, rIndex) => (
        <Card key={rIndex} className="mb-4">
          <CardHeader className="bg-gray-50 py-3">
            <CardTitle className="text-base">{resultado.descricao}</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <h4 className="text-sm font-semibold mb-2">Intervenções:</h4>
            <ul className="list-disc pl-5 space-y-3">
              {resultado.intervencoes.map((intervencao, iIndex) => (
                <li key={iIndex} className="text-sm">
                  <div>
                    <span className="font-medium">Enfermeiro:</span> {" "}
                    <span className="text-green-700">{intervencao.verboPrimeiraEnfermeiro}</span> {intervencao.descricaoRestante}
                  </div>
                  <div>
                    <span className="font-medium">Outra pessoa:</span> {" "}
                    <span className="text-blue-700">{intervencao.verboOutraPessoa}</span> {intervencao.descricaoRestante}
                  </div>
                  
                  {intervencao.documentosApoio && intervencao.documentosApoio.length > 0 && (
                    <div className="mt-1">
                      <span className="font-medium text-xs">Documentos de apoio:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {intervencao.documentosApoio.map((doc, dIndex) => (
                          <a 
                            key={dIndex}
                            href={doc.arquivo}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="text-xs px-2 py-0.5 bg-gray-100 rounded hover:bg-gray-200 text-blue-600"
                          >
                            {doc.nome}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DiagnosticoVisualizer;
