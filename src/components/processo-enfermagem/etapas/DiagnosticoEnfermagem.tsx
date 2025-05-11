import React from 'react';
import { DiagnosticoEnfermagemInterface } from '@/types/evolucao';

interface DiagnosticoEnfermagemProps {
  diagnosticos: DiagnosticoEnfermagemInterface[];
  setDiagnosticos: React.Dispatch<React.SetStateAction<DiagnosticoEnfermagemInterface[]>>;
  nhbsAfetadas?: string[];
  diagnosticosSugeridos?: string[];
}

export function DiagnosticoEnfermagem({ 
  diagnosticos, 
  setDiagnosticos,
  nhbsAfetadas = [],
  diagnosticosSugeridos = [] 
}: DiagnosticoEnfermagemProps) {
  
  // Este componente será implementado quando tivermos dados de diagnósticos
  // Por enquanto, vamos apenas exibir as NHBs afetadas e diagnósticos sugeridos
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Diagnóstico de Enfermagem</h2>
      
      {nhbsAfetadas.length > 0 && (
        <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
          <h3 className="font-medium mb-2">NHBs identificadas na Avaliação:</h3>
          <div className="flex flex-wrap gap-2">
            {nhbsAfetadas.map(nhb => (
              <span 
                key={nhb} 
                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                {nhb}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {diagnosticosSugeridos.length > 0 && (
        <div className="p-4 bg-green-50 rounded-md border border-green-100">
          <h3 className="font-medium mb-2">Diagnósticos sugeridos com base na Avaliação:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {diagnosticosSugeridos.map(diagId => (
              <li key={diagId}>{diagId}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Aqui renderizaríamos uma lista de diagnósticos para seleção */}
      <div className="text-center p-8 border border-dashed rounded-md">
        <p className="text-gray-500">
          A interface para seleção de diagnósticos será implementada em breve.
        </p>
      </div>
    </div>
  );
}
