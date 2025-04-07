
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckSquare,
  AlertCircle,
  Calendar,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PacientePerinatal } from '@/services/bancodados/tipos';

interface PuerperioVigilanciaProps {
  paciente: PacientePerinatal;
}

const PuerperioVigilancia: React.FC<PuerperioVigilanciaProps> = ({ paciente }) => {
  const [etapaAtiva, setEtapaAtiva] = useState<string>('puerperio-imediato');
  
  // Calcular dias após o parto
  const diasPosParto = paciente.dataParto ? 
    Math.floor((new Date().getTime() - paciente.dataParto.toDate().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  const puerperioImediatoDisponivel = true;
  const puerperioTardioDisponivel = diasPosParto > 10;
  
  const etapas = [
    { 
      id: 'puerperio-imediato', 
      titulo: 'Puerpério Imediato', 
      concluido: false, 
      disponivel: puerperioImediatoDisponivel,
      descricao: '1º ao 10º dia'
    },
    { 
      id: 'puerperio-tardio', 
      titulo: 'Puerpério Tardio', 
      concluido: false, 
      disponivel: puerperioTardioDisponivel,
      descricao: '11º ao 42º dia'
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="bg-gradient-to-r from-pink-50 to-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg text-pink-800">Vigilância Puerperal</CardTitle>
              <CardDescription>
                Acompanhamento da puérpera no período pós-parto
              </CardDescription>
            </div>
            <Badge className="bg-pink-100 text-pink-800 hover:bg-pink-200">
              {diasPosParto} {diasPosParto === 1 ? 'dia' : 'dias'} pós-parto
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Alert className="mb-4">
            <AlertDescription className="text-sm flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {paciente.dataParto && (
                <span>Parto realizado em {format(paciente.dataParto.toDate(), "dd/MM/yyyy")}</span>
              )}
            </AlertDescription>
          </Alert>

          <Tabs value={etapaAtiva} onValueChange={setEtapaAtiva} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {etapas.map(etapa => (
                <TabsTrigger 
                  key={etapa.id}
                  value={etapa.id}
                  disabled={!etapa.disponivel}
                  className="flex flex-col items-center px-1 py-1"
                >
                  <div className="flex items-center justify-center">
                    {etapa.concluido ? (
                      <CheckSquare className="h-4 w-4 text-green-500 mr-1" />
                    ) : etapa.disponivel ? (
                      <Calendar className="h-4 w-4 mr-1" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-400 mr-1" />
                    )}
                    <span className="text-xs whitespace-nowrap">{etapa.titulo}</span>
                  </div>
                  <div className="hidden md:block text-[10px] mt-1 opacity-70">
                    {etapa.descricao}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="puerperio-imediato" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Puerpério Imediato (1º ao 10º dia)</CardTitle>
                  <CardDescription>
                    Implementação do conteúdo da consulta de puerpério imediato será feita aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Esta seção conterá o formulário para consulta de puerpério imediato.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="puerperio-tardio" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Puerpério Tardio (11º ao 42º dia)</CardTitle>
                  <CardDescription>
                    Implementação do conteúdo da consulta de puerpério tardio será feita aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Esta seção conterá o formulário para consulta de puerpério tardio.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PuerperioVigilancia;
