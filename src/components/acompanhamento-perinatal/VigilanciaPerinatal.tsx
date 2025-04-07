
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Unlock,
  Baby,
  UserRound,
  Activity,
  PlusCircle
} from 'lucide-react';
import { PacientePerinatal } from '@/services/bancodados/tipos';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PreNatalVigilancia from './vigilancia/PreNatalVigilancia';
import PuerperioVigilancia from './vigilancia/PuerperioVigilancia';
import PuericulturaVigilancia from './vigilancia/PuericulturaVigilancia';

interface VigilanciaPerinatalProps {
  paciente: PacientePerinatal;
  onVoltar: () => void;
}

const VigilanciaPerinatal: React.FC<VigilanciaPerinatalProps> = ({ 
  paciente,
  onVoltar
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [tipoVigilancia, setTipoVigilancia] = useState<'prenatal' | 'puerperio' | 'puericultura'>('prenatal');
  
  useEffect(() => {
    // Determinar tipo de vigilância baseado no tipo de paciente
    if (paciente.tipoPaciente === "bebê") {
      setTipoVigilancia('puericultura');
    } else if (paciente.tipoPaciente === "mulher") {
      if (paciente.situacaoObstetrica === "Puérpera") {
        setTipoVigilancia('puerperio');
      } else {
        setTipoVigilancia('prenatal');
      }
    }
    
    // Por padrão, carrega a aba de vigilância
    setActiveTab('vigilancia');
  }, [paciente]);

  const calcularIdade = (dataNascimento: Date): string => {
    const hoje = new Date();
    const diffAnos = hoje.getFullYear() - dataNascimento.getFullYear();
    const mesAniversarioJaOcorreu = 
      hoje.getMonth() > dataNascimento.getMonth() || 
      (hoje.getMonth() === dataNascimento.getMonth() && hoje.getDate() >= dataNascimento.getDate());
    
    if (diffAnos > 0) {
      return `${mesAniversarioJaOcorreu ? diffAnos : diffAnos - 1} anos`;
    }
    
    // Calcular diferença em meses
    const diffMeses = hoje.getMonth() - dataNascimento.getMonth() + 
      (hoje.getFullYear() - dataNascimento.getFullYear()) * 12;
    
    if (diffMeses > 0) {
      return `${diffMeses} ${diffMeses === 1 ? 'mês' : 'meses'}`;
    }
    
    // Calcular diferença em dias
    const diffDias = Math.floor((hoje.getTime() - dataNascimento.getTime()) / (1000 * 60 * 60 * 24));
    return `${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`;
  };

  const renderCardComInfoPaciente = () => {
    const dataNascimento = paciente.dataNascimento.toDate();
    const idade = calcularIdade(dataNascimento);
    const isGestante = paciente.tipoPaciente === "mulher" && paciente.situacaoObstetrica === "Gestante";
    const isPuerpera = paciente.tipoPaciente === "mulher" && paciente.situacaoObstetrica === "Puérpera";
    const isBebe = paciente.tipoPaciente === "bebê";
    
    return (
      <Card className={`border-l-4 ${
        isGestante
          ? "border-l-purple-400" 
          : isPuerpera
            ? "border-l-pink-400"
            : "border-l-blue-400"
      }`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl flex items-center gap-2">
              {isGestante ? (
                <UserRound className="h-5 w-5 text-purple-600" />
              ) : isPuerpera ? (
                <UserRound className="h-5 w-5 text-pink-600" />
              ) : (
                <Baby className="h-5 w-5 text-blue-600" />
              )}
              {paciente.nome}
            </CardTitle>
            <Badge variant="outline" className={`
              ${isGestante ? "bg-purple-50 text-purple-700 border-purple-200" : 
                isPuerpera ? "bg-pink-50 text-pink-700 border-pink-200" : 
                  "bg-blue-50 text-blue-700 border-blue-200"}
            `}>
              {isGestante ? "Gestante" : isPuerpera ? "Puérpera" : "Bebê"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Data de Nascimento</h3>
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  {format(dataNascimento, "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Idade</h3>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-400" />
                  {idade}
                </p>
              </div>
            </div>
            
            {isGestante && paciente.idadeGestacional && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Idade Gestacional</h3>
                <p className="flex items-center">
                  <Activity className="h-4 w-4 mr-1 text-purple-500" />
                  {paciente.idadeGestacional} semanas
                </p>
              </div>
            )}
            
            {isPuerpera && paciente.dataParto && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Data do Parto</h3>
                <p className="flex items-center">
                  <Baby className="h-4 w-4 mr-1 text-pink-500" />
                  {format(paciente.dataParto.toDate(), "dd/MM/yyyy")}
                </p>
              </div>
            )}
            
            {isBebe && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Mãe</h3>
                <p className="flex items-center">
                  <UserRound className="h-4 w-4 mr-1 text-blue-500" />
                  {paciente.nomeMae}
                </p>
                {paciente.idadeGestacionalNascer && (
                  <div className="mt-2">
                    <h3 className="text-sm font-medium text-gray-500">Idade Gestacional ao Nascer</h3>
                    <p className="flex items-center">
                      <Activity className="h-4 w-4 mr-1 text-blue-500" />
                      {paciente.idadeGestacionalNascer} semanas
                      {paciente.prematuro && (
                        <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                          Prematuro
                        </Badge>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="pt-2">
              <h3 className="text-sm font-medium text-gray-500">{paciente.titulo}</h3>
              <p className="text-sm text-gray-600">{paciente.descricao}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderConteudoVigilancia = () => {
    switch (tipoVigilancia) {
      case 'prenatal':
        return <PreNatalVigilancia paciente={paciente} />;
      case 'puerperio':
        return <PuerperioVigilancia paciente={paciente} />;
      case 'puericultura':
        return <PuericulturaVigilancia paciente={paciente} />;
      default:
        return (
          <Alert>
            <AlertDescription>
              Selecione um tipo de vigilância para continuar.
            </AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={onVoltar}
          className="border-csae-green-300 text-csae-green-700 hover:bg-csae-green-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>
        
        <Button 
          className="bg-csae-green-600 hover:bg-csae-green-700"
          onClick={() => window.print()}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nova Consulta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          {renderCardComInfoPaciente()}
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Consulta
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Histórico
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="vigilancia" className="flex-1">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Vigilância
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex-1">
                <Clock className="mr-2 h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="vigilancia" className="space-y-4 mt-4">
              {renderConteudoVigilancia()}
            </TabsContent>
            
            <TabsContent value="historico" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Histórico de Consultas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Histórico de consultas será implementado aqui.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default VigilanciaPerinatal;
