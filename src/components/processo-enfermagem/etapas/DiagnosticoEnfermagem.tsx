
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, AlertCircle } from 'lucide-react';

// Lista de diagnósticos NANDA de exemplo
const diagnosticosNANDA = [
  { id: "1", descricao: "Ansiedade relacionada à situação atual de saúde" },
  { id: "2", descricao: "Risco de infecção relacionado a procedimentos invasivos" },
  { id: "3", descricao: "Dor aguda relacionada a agentes lesivos" },
  { id: "4", descricao: "Mobilidade física prejudicada relacionada a desconforto" },
  { id: "5", descricao: "Déficit no autocuidado para banho relacionado a dor" },
  { id: "6", descricao: "Padrão respiratório ineficaz relacionado a dor" },
  { id: "7", descricao: "Integridade da pele prejudicada relacionada a fatores externos" },
  { id: "8", descricao: "Nutrição desequilibrada: menor do que as necessidades corporais" },
  { id: "9", descricao: "Risco de quedas relacionado a fatores ambientais" },
  { id: "10", descricao: "Conhecimento deficiente relacionado a processo de doença" },
  { id: "11", descricao: "Medo relacionado a tratamentos" },
  { id: "12", descricao: "Distúrbio na imagem corporal relacionado a alterações físicas" },
  { id: "13", descricao: "Processos familiares interrompidos relacionados à crise situacional" },
  { id: "14", descricao: "Risco de constipação relacionado a atividade física insuficiente" },
  { id: "15", descricao: "Desesperança relacionada a deterioração da condição fisiológica" },
];

interface DiagnosticoEnfermagemProps {
  diagnosticos: Array<{
    id: string;
    descricao: string;
    selecionado: boolean;
  }>;
  setDiagnosticos: React.Dispatch<React.SetStateAction<any[]>>;
}

export function DiagnosticoEnfermagem({ diagnosticos, setDiagnosticos }: DiagnosticoEnfermagemProps) {
  const [busca, setBusca] = React.useState('');
  const [novoDiagnostico, setNovoDiagnostico] = React.useState('');
  
  // Inicializar os diagnósticos se ainda não existirem
  useEffect(() => {
    if (diagnosticos.length === 0) {
      setDiagnosticos(diagnosticosNANDA.map(d => ({
        ...d,
        selecionado: false
      })));
    }
  }, [diagnosticos.length, setDiagnosticos]);

  const handleToggleDiagnostico = (id: string) => {
    setDiagnosticos(prev => 
      prev.map(d => 
        d.id === id ? { ...d, selecionado: !d.selecionado } : d
      )
    );
  };

  const handleAdicionarDiagnostico = () => {
    if (novoDiagnostico.trim()) {
      const novoId = `custom-${Date.now()}`;
      setDiagnosticos(prev => [
        ...prev,
        {
          id: novoId,
          descricao: novoDiagnostico.trim(),
          selecionado: true
        }
      ]);
      setNovoDiagnostico('');
    }
  };

  const diagnosticosFiltrados = diagnosticos.filter(d => 
    d.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  const diagnosticosSelecionados = diagnosticos.filter(d => d.selecionado);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnósticos de Enfermagem</CardTitle>
          <CardDescription>
            Identifique os diagnósticos de enfermagem relevantes para este paciente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar diagnósticos..."
                className="pl-9"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <Input
                placeholder="Adicionar diagnóstico personalizado..."
                value={novoDiagnostico}
                onChange={(e) => setNovoDiagnostico(e.target.value)}
                className="w-64"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleAdicionarDiagnostico}
                disabled={!novoDiagnostico.trim()}
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-4">
            {diagnosticosFiltrados.map((diagnostico) => (
              <div
                key={diagnostico.id}
                className={`
                  flex items-start space-x-2 p-3 rounded-md border
                  ${diagnostico.selecionado 
                    ? 'bg-csae-green-50 border-csae-green-200' 
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                  }
                  transition-colors cursor-pointer
                `}
                onClick={() => handleToggleDiagnostico(diagnostico.id)}
              >
                <Checkbox
                  id={`diagnostico-${diagnostico.id}`}
                  checked={diagnostico.selecionado}
                  onCheckedChange={() => handleToggleDiagnostico(diagnostico.id)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`diagnostico-${diagnostico.id}`}
                  className={`cursor-pointer ${diagnostico.selecionado ? 'font-medium text-csae-green-700' : ''}`}
                >
                  {diagnostico.descricao}
                </Label>
              </div>
            ))}
            
            {diagnosticosFiltrados.length === 0 && (
              <div className="w-full text-center py-8 text-gray-500 bg-gray-50 rounded-md">
                Nenhum diagnóstico encontrado para "{busca}".
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="p-4 bg-blue-50 rounded-md border border-blue-100 flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-700">Diagnósticos selecionados: {diagnosticosSelecionados.length}</h4>
          {diagnosticosSelecionados.length === 0 ? (
            <p className="mt-1 text-sm text-blue-700">
              Selecione pelo menos um diagnóstico para continuar para a próxima etapa.
            </p>
          ) : (
            <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
              {diagnosticosSelecionados.map(d => (
                <li key={d.id}>{d.descricao}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
