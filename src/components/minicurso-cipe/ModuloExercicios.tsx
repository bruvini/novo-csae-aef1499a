import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Check, Calendar, Clock, AlertCircle } from 'lucide-react';
import { CasoClinico, TermoCipe } from '@/services/bancodados/tipos';
import ExercicioCasoClinico from './ExercicioCasoClinico';

export interface ModuloExerciciosProps {
  casos: CasoClinico[];
  termosFoco: TermoCipe[];
  termosJulgamento: TermoCipe[];
  termosMeios: TermoCipe[];
  termosAcao: TermoCipe[];
  termosTempo: TermoCipe[];
  termosLocalizacao: TermoCipe[];
  termosCliente: TermoCipe[];
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
  termosLocalizacao,
  termosCliente,
  termosTempo,
  completado,
  onComplete,
  userId
}) => {
  const [casoAtivo, setCasoAtivo] = useState<CasoClinico | null>(null);
  const [casosVencidos, setCasosVencidos] = useState<string[]>([]);
  
  useEffect(() => {
    if (casos.length > 0) {
      const casosDisponíveis = casos.filter(
        caso => !caso.arrayVencedor?.includes(userId)
      );
      
      if (casosDisponíveis.length > 0) {
        const indexAleatorio = Math.floor(Math.random() * casosDisponíveis.length);
        setCasoAtivo(casosDisponíveis[indexAleatorio]);
      } else if (casos.length > 0) {
        const indexAleatorio = Math.floor(Math.random() * casos.length);
        setCasoAtivo(casos[indexAleatorio]);
      }
      
      const vencidos = casos
        .filter(caso => caso.arrayVencedor?.includes(userId))
        .map(caso => caso.id || '');
      
      setCasosVencidos(vencidos.filter(Boolean));
    }
  }, [casos, userId]);

  const handleCasoCompleto = () => {
    if (casoAtivo && casoAtivo.id) {
      if (!casosVencidos.includes(casoAtivo.id)) {
        setCasosVencidos(prev => [...prev, casoAtivo.id!]);
      }
      
      const minimoParaConcluir = Math.ceil(casos.length / 3);
      if (casosVencidos.length + 1 >= minimoParaConcluir && !completado) {
        onComplete();
      }
    }
  };

  const selecionarNovoCaso = () => {
    if (casos.length > 0) {
      const indexAleatorio = Math.floor(Math.random() * casos.length);
      setCasoAtivo(casos[indexAleatorio]);
    }
  };

  if (casos.length === 0) {
    return (
      <div id="exercicios" className="space-y-6 pb-8">
        <h2 className="text-2xl font-bold text-csae-green-700">Exercícios de Fixação</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Não há casos clínicos disponíveis para praticar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="exercicios" className="space-y-6 pb-8">
      <h2 className="text-2xl font-bold text-csae-green-700">Exercícios de Fixação</h2>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Casos Clínicos para Prática</CardTitle>
          <CardDescription>
            Nos exercícios abaixo, você deve aplicar os conhecimentos sobre os eixos CIPE para formular afirmativas corretas.
            <br/>
            Para concluir este módulo, você precisa acertar pelo menos {Math.ceil(casos.length / 3)} casos diferentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-csae-green-50 p-4 rounded-md mb-4">
            <p className="text-sm text-gray-700">
              <strong>Status atual:</strong> Você completou {casosVencidos.length} de {casos.length} casos disponíveis.
              {completado && <span className="ml-2 text-csae-green-700 font-medium">(Módulo concluído)</span>}
            </p>
          </div>
          
          <div className="flex justify-end mb-4">
            <Button 
              onClick={selecionarNovoCaso} 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Trocar caso clínico
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {casoAtivo && (
        <ExercicioCasoClinico 
          caso={casoAtivo}
          termosFoco={termosFoco}
          termosJulgamento={termosJulgamento}
          termosMeios={termosMeios}
          termosAcao={termosAcao}
          termosLocalizacao={termosLocalizacao}
          termosCliente={termosCliente}
          termosTempo={termosTempo}
          nomeUsuario={userId}
          onCasoCompleto={handleCasoCompleto}
        />
      )}
      
      <div className="flex justify-end">
        {!completado ? (
          <Button 
            onClick={onComplete} 
            className="bg-csae-green-600 hover:bg-csae-green-700"
            disabled={casosVencidos.length < Math.ceil(casos.length / 3)}
          >
            Marcar módulo como concluído
          </Button>
        ) : (
          <Button disabled className="bg-csae-green-700 flex items-center gap-2">
            <Check className="h-4 w-4" /> Módulo concluído
          </Button>
        )}
      </div>
    </div>
  );
};

export default ModuloExercicios;
