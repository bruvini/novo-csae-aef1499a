
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface AvaliacaoEnfermagemProps {
  valor: string;
  onChange: (valor: string) => void;
}

export function AvaliacaoEnfermagem({ valor, onChange }: AvaliacaoEnfermagemProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Avaliação de Enfermagem</CardTitle>
          <CardDescription>
            Registre a coleta de dados subjetivos (entrevista) e objetivos (exame físico) do paciente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Registre aqui as informações da avaliação do paciente..."
            className="min-h-[300px]"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
          />
        </CardContent>
      </Card>
      
      <div className="flex items-start p-4 bg-blue-50 rounded-md border border-blue-100">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-700">Dicas para uma boa avaliação:</h4>
          <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
            <li>Inicie com os dados de identificação e histórico do paciente</li>
            <li>Registre os sinais vitais e parâmetros avaliados</li>
            <li>Documente as queixas principais e observações objetivas</li>
            <li>Inclua resultados de exames relevantes, quando disponíveis</li>
            <li>Use terminologia técnica apropriada</li>
            <li>Seja claro, conciso e objetivo nos registros</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
