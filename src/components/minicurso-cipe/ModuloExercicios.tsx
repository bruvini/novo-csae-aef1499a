import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface ModuloExerciciosProps {
  casos: any[];
  termosFoco: any[];
  termosJulgamento: any[];
  termosMeios: any[];
  termosAcao: any[];
  termosTempo: any[];
  termosLocalizacao: any[];
  termosCliente: any[];
  completado: boolean;
  onComplete: () => void;
  userId: string;
}

const ModuloExercicios: React.FC<ModuloExerciciosProps> = ({
  casos,
  termosFoco,
  termosJulgamento,
  termosMeios,
  termosAcao,
  termosTempo,
  termosLocalizacao,
  termosCliente,
  completado,
  onComplete,
  userId
}) => {
  const [selectedOptions, setSelectedOptions] = useState<string[][]>(Array(casos.length).fill([]));
  const [showFeedback, setShowFeedback] = useState<boolean[]>(Array(casos.length).fill(false));
  const [allCorrect, setAllCorrect] = useState(false);

  useEffect(() => {
    if (completado) {
      setAllCorrect(true);
    }
  }, [completado]);

  const handleOptionSelect = (casoIndex: number, option: string, tipo: string) => {
    setSelectedOptions(prev => {
      const newOptions = [...prev];
      const existingOptions = newOptions[casoIndex] || [];
      const optionIndex = existingOptions.findIndex(opt => opt.startsWith(tipo));

      if (optionIndex !== -1) {
        existingOptions[optionIndex] = `${tipo}:${option}`;
      } else {
        existingOptions.push(`${tipo}:${option}`);
      }

      newOptions[casoIndex] = existingOptions;
      return newOptions;
    });
  };

  const checkAnswers = () => {
    const isCorrect = casos.every((caso, index) => {
      const selected = selectedOptions[index] || [];
      const correctOptions = caso.arrayVencedor;

      if (selected.length !== correctOptions.length) {
        return false;
      }

      return correctOptions.every(correctOption =>
        selected.some(selectedOption => selectedOption.endsWith(`:${correctOption}`))
      );
    });

    setShowFeedback(Array(casos.length).fill(true));
    setAllCorrect(isCorrect);
  };

  const renderFeedback = (casoIndex: number) => {
    if (!showFeedback[casoIndex]) return null;

    const selected = selectedOptions[casoIndex] || [];
    const correctOptions = casos[casoIndex].arrayVencedor;
    const isCorrect = correctOptions.every(correctOption =>
      selected.some(selectedOption => selectedOption.endsWith(`:${correctOption}`))
    );

    return (
      <div className={`mt-2 p-3 rounded-md ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {isCorrect ? (
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Resposta correta!
          </div>
        ) : (
          <div className="flex items-center">
            <XCircle className="h-4 w-4 mr-2" />
            Resposta incorreta. Tente novamente!
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {casos.map((caso, casoIndex) => (
        <div key={casoIndex} className="space-y-4">
          <h3 className="text-xl font-semibold">Caso Clínico {casoIndex + 1}</h3>
          <p>{caso.casoClinico}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold">Foco</h4>
              <div className="flex flex-wrap gap-2">
                {termosFoco.map((termo, index) => (
                  <button
                    key={index}
                    className={`px-4 py-2 rounded-full text-sm ${selectedOptions[casoIndex]?.some(opt => opt === `foco:${termo}`) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-300'}`}
                    onClick={() => handleOptionSelect(casoIndex, termo, 'foco')}
                  >
                    {termo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Julgamento</h4>
              <div className="flex flex-wrap gap-2">
                {termosJulgamento.map((termo, index) => (
                  <button
                    key={index}
                    className={`px-4 py-2 rounded-full text-sm ${selectedOptions[casoIndex]?.some(opt => opt === `julgamento:${termo}`) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-300'}`}
                    onClick={() => handleOptionSelect(casoIndex, termo, 'julgamento')}
                  >
                    {termo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Meio</h4>
              <div className="flex flex-wrap gap-2">
                {termosMeios.map((termo, index) => (
                  <button
                    key={index}
                    className={`px-4 py-2 rounded-full text-sm ${selectedOptions[casoIndex]?.some(opt => opt === `meio:${termo}`) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-300'}`}
                    onClick={() => handleOptionSelect(casoIndex, termo, 'meio')}
                  >
                    {termo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Ação</h4>
              <div className="flex flex-wrap gap-2">
                {termosAcao.map((termo, index) => (
                  <button
                    key={index}
                    className={`px-4 py-2 rounded-full text-sm ${selectedOptions[casoIndex]?.some(opt => opt === `acao:${termo}`) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-300'}`}
                    onClick={() => handleOptionSelect(casoIndex, termo, 'acao')}
                  >
                    {termo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Tempo</h4>
              <div className="flex flex-wrap gap-2">
                {termosTempo.map((termo, index) => (
                  <button
                    key={index}
                    className={`px-4 py-2 rounded-full text-sm ${selectedOptions[casoIndex]?.some(opt => opt === `tempo:${termo}`) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-300'}`}
                    onClick={() => handleOptionSelect(casoIndex, termo, 'tempo')}
                  >
                    {termo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Localização</h4>
              <div className="flex flex-wrap gap-2">
                {termosLocalizacao.map((termo, index) => (
                  <button
                    key={index}
                    className={`px-4 py-2 rounded-full text-sm ${selectedOptions[casoIndex]?.some(opt => opt === `localizacao:${termo}`) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-300'}`}
                    onClick={() => handleOptionSelect(casoIndex, termo, 'localizacao')}
                  >
                    {termo}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold">Cliente</h4>
              <div className="flex flex-wrap gap-2">
                {termosCliente.map((termo, index) => (
                  <button
                    key={index}
                    className={`px-4 py-2 rounded-full text-sm ${selectedOptions[casoIndex]?.some(opt => opt === `cliente:${termo}`) ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-blue-300'}`}
                    onClick={() => handleOptionSelect(casoIndex, termo, 'cliente')}
                  >
                    {termo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {renderFeedback(casoIndex)}
        </div>
      ))}

      {!allCorrect ? (
        <Button onClick={checkAnswers} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Verificar Respostas
        </Button>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-green-600">Parabéns!</h2>
          <p className="text-gray-700">Você completou este módulo com sucesso.</p>
          {!completado && (
            <Button onClick={onComplete} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4">
              Marcar como Concluído
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuloExercicios;
