
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckSquare,
  AlertCircle,
  Calendar,
  ClipboardList,
  Baby,
  Activity
} from 'lucide-react';
import { PacientePerinatal } from '@/services/bancodados/tipos';

interface PuericulturaVigilanciaProps {
  paciente: PacientePerinatal;
}

const PuericulturaVigilancia: React.FC<PuericulturaVigilanciaProps> = ({ paciente }) => {
  const [etapaAtiva, setEtapaAtiva] = useState<string>('5-7-dias');
  
  // Calcular idade em dias
  const idadeDias = Math.floor((new Date().getTime() - paciente.dataNascimento.toDate().getTime()) / (1000 * 60 * 60 * 24));
  const idadeMeses = idadeDias / 30;
  
  // Determinar qual etapa deve estar disponível com base na idade
  const etapas = [
    { 
      id: '5-7-dias', 
      titulo: '5 a 7 dias', 
      concluido: false, 
      disponivel: true,
      descricao: 'Primeira consulta'
    },
    { 
      id: '1-mes', 
      titulo: '1 mês', 
      concluido: false, 
      disponivel: idadeDias >= 30,
      descricao: '30 dias'
    },
    { 
      id: '2-meses', 
      titulo: '2 meses', 
      concluido: false, 
      disponivel: idadeDias >= 60,
      descricao: '60 dias'
    },
    { 
      id: '4-meses', 
      titulo: '4 meses', 
      concluido: false, 
      disponivel: idadeDias >= 120,
      descricao: '120 dias'
    },
    { 
      id: '6-meses', 
      titulo: '6 meses', 
      concluido: false, 
      disponivel: idadeDias >= 180,
      descricao: '180 dias'
    },
    { 
      id: '9-meses', 
      titulo: '9 meses', 
      concluido: false, 
      disponivel: idadeDias >= 270,
      descricao: '270 dias'
    },
    { 
      id: '12-meses', 
      titulo: '12 meses', 
      concluido: false, 
      disponivel: idadeDias >= 365,
      descricao: '1 ano'
    },
    { 
      id: '15-meses', 
      titulo: '15 meses', 
      concluido: false, 
      disponivel: idadeDias >= 450,
      descricao: '1 ano e 3 meses'
    },
    { 
      id: '18-meses', 
      titulo: '18 meses', 
      concluido: false, 
      disponivel: idadeDias >= 540,
      descricao: '1 ano e 6 meses'
    },
    { 
      id: '2-anos', 
      titulo: '2 anos', 
      concluido: false, 
      disponivel: idadeDias >= 730,
      descricao: '2 anos completos'
    }
  ];

  // Escolher a etapa ativa com base na idade
  useEffect(() => {
    let etapaIdeal = etapas[0].id;
    for (let i = etapas.length - 1; i >= 0; i--) {
      if (etapas[i].disponivel) {
        etapaIdeal = etapas[i].id;
        break;
      }
    }
    setEtapaAtiva(etapaIdeal);
  }, [idadeDias]);

  const calcularIdade = () => {
    if (idadeDias < 30) {
      return `${idadeDias} dias`;
    } else if (idadeMeses < 24) {
      return `${Math.floor(idadeMeses)} meses${idadeDias % 30 > 0 ? ` e ${idadeDias % 30} dias` : ''}`;
    } else {
      const anos = Math.floor(idadeMeses / 12);
      const mesesRestantes = Math.floor(idadeMeses % 12);
      return `${anos} ${anos === 1 ? 'ano' : 'anos'}${mesesRestantes > 0 ? ` e ${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}` : ''}`;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg text-blue-800">Vigilância em Puericultura</CardTitle>
              <CardDescription>
                Acompanhamento do crescimento e desenvolvimento da criança
              </CardDescription>
            </div>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              {calcularIdade()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {paciente.prematuro && (
            <Alert className="mb-4 border-amber-300 bg-amber-50">
              <AlertDescription className="text-sm flex items-center text-amber-800">
                <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />
                <span>
                  Criança prematura ({paciente.idadeGestacionalNascer} semanas). 
                  Considere a idade corrigida para avaliações de DNPM.
                </span>
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={etapaAtiva} onValueChange={setEtapaAtiva} className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="flex w-max">
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
                    <div className="text-[10px] mt-1 opacity-70">
                      {etapa.descricao}
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {/* Usamos um template para cada faixa etária, mas na implementação final cada uma terá seu conteúdo específico */}
            {etapas.map(etapa => (
              <TabsContent key={etapa.id} value={etapa.id} className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Consulta - {etapa.titulo}</CardTitle>
                    <CardDescription>
                      Implementação do conteúdo da consulta de {etapa.titulo} será feita aqui.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline">
                        <Activity className="mr-2 h-4 w-4" />
                        Dados Antropométricos
                      </Button>
                      <Button size="sm" variant="outline">
                        <Baby className="mr-2 h-4 w-4" />
                        Desenvolvimento
                      </Button>
                      <Button size="sm" variant="outline">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Avaliação Física
                      </Button>
                    </div>
                    
                    <p>Esta seção conterá o formulário para consulta de puericultura de {etapa.titulo}.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PuericulturaVigilancia;
