
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
import { PacientePerinatal } from '@/services/bancodados/tipos';

interface PreNatalVigilanciaProps {
  paciente: PacientePerinatal;
}

const PreNatalVigilancia: React.FC<PreNatalVigilanciaProps> = ({ paciente }) => {
  const [etapaAtiva, setEtapaAtiva] = useState<string>('primeira-consulta');
  
  // Determinar quais etapas estão disponíveis com base na idade gestacional
  const idadeGestacional = paciente.idadeGestacional || 0;
  
  const primeiraConsultaConcluida = true; // Placeholder, será baseado nos dados do Firebase
  const primeiroTrimestreConcluido = true; // Placeholder, será baseado nos dados do Firebase
  const segundoTrimestreConcluido = false; // Placeholder, será baseado nos dados do Firebase
  const terceiroTrimestreConcluido = false; // Placeholder, será baseado nos dados do Firebase
  
  const primeiroTrimestreDisponivel = primeiraConsultaConcluida;
  const segundoTrimestreDisponivel = primeiroTrimestreConcluido && idadeGestacional >= 14;
  const terceiroTrimestreDisponivel = segundoTrimestreConcluido && idadeGestacional >= 28;
  const encerramentoDisponivel = terceiroTrimestreConcluido && idadeGestacional >= 37;
  
  const etapas = [
    { 
      id: 'primeira-consulta', 
      titulo: '1ª Consulta', 
      concluido: primeiraConsultaConcluida, 
      disponivel: true,
      descricao: 'Cadastro e primeira avaliação da gestante'
    },
    { 
      id: 'primeiro-trimestre', 
      titulo: '1º Trimestre', 
      concluido: primeiroTrimestreConcluido, 
      disponivel: primeiroTrimestreDisponivel,
      descricao: 'Até 13 semanas e 6 dias'
    },
    { 
      id: 'segundo-trimestre', 
      titulo: '2º Trimestre', 
      concluido: segundoTrimestreConcluido, 
      disponivel: segundoTrimestreDisponivel,
      descricao: '14 a 27 semanas e 6 dias'
    },
    { 
      id: 'terceiro-trimestre', 
      titulo: '3º Trimestre', 
      concluido: terceiroTrimestreConcluido, 
      disponivel: terceiroTrimestreDisponivel,
      descricao: '28 semanas até o parto'
    },
    { 
      id: 'encerramento', 
      titulo: 'Encerramento', 
      concluido: false, 
      disponivel: encerramentoDisponivel,
      descricao: 'Registro do parto ou encerramento da vigilância'
    }
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg text-purple-800">Vigilância Pré-Natal</CardTitle>
              <CardDescription>
                Acompanhamento da gestante conforme idade gestacional
              </CardDescription>
            </div>
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
              {paciente.idadeGestacional} semanas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs value={etapaAtiva} onValueChange={setEtapaAtiva} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
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
            
            <TabsContent value="primeira-consulta" className="mt-4 space-y-4">
              <Alert className="bg-blue-50">
                <AlertDescription className="text-sm">
                  <ClipboardList className="h-4 w-4 inline mr-2" />
                  A primeira consulta é fundamental para o estabelecimento de vínculo e coleta completa do histórico da gestante.
                </AlertDescription>
              </Alert>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Primeira Consulta Pré-Natal</CardTitle>
                  <CardDescription>
                    Implementação do conteúdo da primeira consulta será feita aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Esta seção conterá o formulário completo da primeira consulta.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="primeiro-trimestre" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consultas do Primeiro Trimestre</CardTitle>
                  <CardDescription>
                    Implementação do conteúdo das consultas do primeiro trimestre será feita aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Esta seção conterá o formulário para consultas do primeiro trimestre.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="segundo-trimestre" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consultas do Segundo Trimestre</CardTitle>
                  <CardDescription>
                    Implementação do conteúdo das consultas do segundo trimestre será feita aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Esta seção conterá o formulário para consultas do segundo trimestre.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="terceiro-trimestre" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consultas do Terceiro Trimestre</CardTitle>
                  <CardDescription>
                    Implementação do conteúdo das consultas do terceiro trimestre será feita aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Esta seção conterá o formulário para consultas do terceiro trimestre.</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="encerramento" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Encerramento do Pré-Natal</CardTitle>
                  <CardDescription>
                    Implementação do conteúdo de encerramento será feita aqui.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Esta seção conterá as opções para registrar o parto ou encerrar a vigilância por outros motivos.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreNatalVigilancia;
