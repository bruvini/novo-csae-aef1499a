
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SinaisVitaisForm from '../SinaisVitaisForm';
import { Paciente, Evolucao } from '@/types';

interface AlteredParam {
  id: string;
  titulo: string;
  nhbIds?: string[];
}

interface ExameFisicoTabProps {
  paciente: Paciente;
  dadosEvolucao: Partial<Evolucao>;
  onDadosChange: (novosDados: Partial<Evolucao>) => void;
  alteredParams: AlteredParam[];
  onAlterationsChange: (alterations: AlteredParam[]) => void;
  handleScrollToParam: (id: string) => void;
}

const ExameFisicoTab: React.FC<ExameFisicoTabProps> = ({
  paciente,
  dadosEvolucao,
  onDadosChange,
  alteredParams,
  onAlterationsChange,
  handleScrollToParam,
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Sinais Vitais</CardTitle>
        </CardHeader>
        <CardContent>
          <SinaisVitaisForm
            paciente={paciente}
            dadosEvolucao={dadosEvolucao}
            onDadosChange={onDadosChange}
            onAlterationsChange={onAlterationsChange}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Resultado de Exames</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center text-sm text-gray-500 py-8">
            Em desenvolvimento
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Revisão por Sistemas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center text-sm text-gray-500 py-8">
            Em desenvolvimento
          </div>
        </CardContent>
      </Card>
      {alteredParams.length > 0 && (
        <Card className="border-yellow-400 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-yellow-800">Parâmetros Alterados</CardTitle>
            <CardDescription className="text-yellow-700">Valores que indicam necessidade de atenção.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-yellow-900">
              {alteredParams.map(param => (
                <li key={param.id}>
                  <button
                    onClick={() => handleScrollToParam(param.id)}
                    className="text-left text-blue-600 hover:underline focus:outline-none"
                  >
                    {param.titulo}
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExameFisicoTab;
