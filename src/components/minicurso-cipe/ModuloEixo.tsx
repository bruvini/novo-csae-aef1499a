
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface ModuloEixoProps {
  id: string;
  titulo: string;
  descricao: string;
  exemplos: string[];
  completado: boolean;
  onComplete: () => void;
}

const ModuloEixo: React.FC<ModuloEixoProps> = ({ 
  id, 
  titulo, 
  descricao, 
  exemplos, 
  completado, 
  onComplete 
}) => {
  return (
    <div id={id} className="space-y-6 pb-8">
      <h3 className="text-xl font-bold text-csae-green-700">{titulo}</h3>
      
      <Card>
        <CardHeader>
          <CardTitle>Definição</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700">{descricao}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Exemplos de Termos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 ml-4">
            {exemplos.map((exemplo, index) => (
              <li key={index} className="text-gray-700">{exemplo}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        {!completado ? (
          <Button onClick={onComplete} className="bg-csae-green-600 hover:bg-csae-green-700">
            Marcar como concluído
          </Button>
        ) : (
          <Button disabled className="bg-csae-green-700 flex items-center gap-2">
            <Check className="h-4 w-4" /> Submódulo concluído
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModuloEixo;
