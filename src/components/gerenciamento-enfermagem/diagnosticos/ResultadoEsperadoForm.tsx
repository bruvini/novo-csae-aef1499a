
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { ResultadoEsperado, Intervencao } from '@/services/bancodados/tipos';
import IntervencaoForm from './IntervencaoForm';

interface ResultadoEsperadoFormProps {
  resultado: ResultadoEsperado;
  resultadoIndex: number;
  onAtualizarResultado: (index: number, campo: keyof ResultadoEsperado, valor: any) => void;
  onRemoverResultado: (index: number) => void;
  onAdicionarIntervencao: (resultadoIndex: number) => void;
  onRemoverIntervencao: (resultadoIndex: number, intervencaoIndex: number) => void;
  onAtualizarIntervencao: (resultadoIndex: number, intervencaoIndex: number, campo: keyof Intervencao, valor: string) => void;
  showRemoveButton: boolean;
}

const ResultadoEsperadoForm = ({
  resultado,
  resultadoIndex,
  onAtualizarResultado,
  onRemoverResultado,
  onAdicionarIntervencao,
  onRemoverIntervencao,
  onAtualizarIntervencao,
  showRemoveButton
}: ResultadoEsperadoFormProps) => {
  return (
    <Card key={resultadoIndex} className="p-4">
      <div className="grid gap-3">
        <div className="flex justify-between">
          <h4 className="font-medium">Resultado Esperado #{resultadoIndex + 1}</h4>
          {showRemoveButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoverResultado(resultadoIndex)}
              className="h-7 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="grid gap-2">
          <Label>Descrição do Resultado</Label>
          <Input
            value={resultado.descricao}
            onChange={(e) => onAtualizarResultado(resultadoIndex, 'descricao', e.target.value)}
            placeholder="Ex: Controle da dor"
            required
          />
        </div>
        
        <div className="grid gap-2">
          <div className="flex justify-between items-center">
            <Label>Intervenções de Enfermagem</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => onAdicionarIntervencao(resultadoIndex)}
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar Intervenção
            </Button>
          </div>
          
          {resultado.intervencoes.map((intervencao, intervencaoIndex) => (
            <IntervencaoForm
              key={intervencaoIndex}
              intervencao={intervencao}
              intervencaoIndex={intervencaoIndex}
              resultadoIndex={resultadoIndex}
              onRemoverIntervencao={onRemoverIntervencao}
              onAtualizarIntervencao={onAtualizarIntervencao}
              showRemoveButton={resultado.intervencoes.length > 1}
            />
          ))}
        </div>
      </div>
    </Card>
  );
};

export default ResultadoEsperadoForm;
