
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  UserRound, 
  Baby, 
  Calendar, 
  Clock, 
  Eye, 
  AlertCircle,
  Users,
  UserPlus,
  ArrowUpRight
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAutenticacao } from '@/services/autenticacao';
import { PacientePerinatal } from '@/services/bancodados/tipos';

interface DashboardPerinatalProps {
  onIniciarVigilancia: (paciente: PacientePerinatal) => void;
}

const DashboardPerinatal: React.FC<DashboardPerinatalProps> = ({ onIniciarVigilancia }) => {
  const { toast } = useToast();
  const { usuario } = useAutenticacao();
  
  const [pacientes, setPacientes] = useState<PacientePerinatal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"todos" | "gestantes" | "puerperas" | "bebes">("todos");
  
  useEffect(() => {
    carregarPacientes();
  }, []);

  const carregarPacientes = async () => {
    try {
      if (!usuario) return;
      setIsLoading(true);
      
      const q = query(
        collection(db, "cuidadoPerinatal"),
        where("profissionalUid", "==", usuario.uid),
        orderBy("dataAtualizacao", "desc")
      );
      
      const snapshot = await getDocs(q);
      const pacientesData: PacientePerinatal[] = [];
      
      snapshot.forEach((doc) => {
        pacientesData.push({ id: doc.id, ...doc.data() } as PacientePerinatal);
      });
      
      setPacientes(pacientesData);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
      toast({
        title: "Erro ao carregar pacientes",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar pacientes por tipo
  const gestantes = pacientes.filter(p => 
    p.tipoPaciente === "mulher" && p.situacaoObstetrica === "Gestante"
  );
  
  const puerperas = pacientes.filter(p => 
    p.tipoPaciente === "mulher" && p.situacaoObstetrica === "Puérpera"
  );
  
  const bebes = pacientes.filter(p => p.tipoPaciente === "bebê");

  // Funções para estatísticas e alertas
  const calcularIdadeGestacional = (semanas: number): string => {
    if (semanas < 14) return "1º Trimestre";
    if (semanas < 27) return "2º Trimestre";
    return "3º Trimestre";
  };

  const calcularDiferencaDatas = (data: Timestamp): number => {
    const dataAtual = new Date();
    const dataComparacao = data.toDate();
    const diffTime = Math.abs(dataAtual.getTime() - dataComparacao.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const calcularIdade = (dataNascimento: Timestamp): string => {
    const hoje = new Date();
    const dataNasc = dataNascimento.toDate();
    
    const diffAnos = hoje.getFullYear() - dataNasc.getFullYear();
    const diffMeses = hoje.getMonth() - dataNasc.getMonth();
    const diffDias = hoje.getDate() - dataNasc.getDate();
    
    if (diffAnos > 0) {
      return `${diffAnos} ${diffAnos === 1 ? 'ano' : 'anos'}`;
    } else if (diffMeses > 0) {
      return `${diffMeses} ${diffMeses === 1 ? 'mês' : 'meses'}`;
    } else {
      return `${diffDias} ${diffDias === 1 ? 'dia' : 'dias'}`;
    }
  };
  
  const renderCardPaciente = (paciente: PacientePerinatal) => {
    const isPuerpera = paciente.tipoPaciente === "mulher" && paciente.situacaoObstetrica === "Puérpera";
    const isGestante = paciente.tipoPaciente === "mulher" && paciente.situacaoObstetrica === "Gestante";
    const isBebe = paciente.tipoPaciente === "bebê";
    
    let alertMessage = "";
    let isAlert = false;
    
    if (isPuerpera && paciente.dataParto) {
      const diasPosParto = calcularDiferencaDatas(paciente.dataParto);
      if (diasPosParto <= 10) {
        alertMessage = `Puerpério imediato (${diasPosParto} dias pós-parto)`;
        isAlert = true;
      } else if (diasPosParto > 42) {
        alertMessage = "Puerpério encerrado (> 42 dias)";
      } else {
        alertMessage = `Puerpério tardio (${diasPosParto} dias pós-parto)`;
      }
    }
    
    if (isGestante && paciente.idadeGestacional) {
      if (paciente.idadeGestacional >= 37) {
        alertMessage = "Gestação a termo";
        isAlert = true;
      } else if (paciente.idadeGestacional >= 29) {
        alertMessage = `${paciente.idadeGestacional} semanas - ${calcularIdadeGestacional(paciente.idadeGestacional)}`;
      }
    }
    
    if (isBebe) {
      const idadeBebe = calcularIdade(paciente.dataNascimento);
      if (idadeBebe.includes("dia") && parseInt(idadeBebe) <= 28) {
        alertMessage = `Recém-nascido (${idadeBebe})`;
        isAlert = true;
      }
      
      if (paciente.prematuro) {
        alertMessage = `Prematuro - ${idadeBebe}`;
        isAlert = true;
      }
    }
    
    return (
      <Card key={paciente.id} className={`border-l-4 ${
        isGestante
          ? "border-l-purple-400" 
          : isPuerpera
            ? "border-l-pink-400"
            : "border-l-blue-400"
      } hover:shadow-md transition-shadow`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-1">
            {isGestante ? (
              <UserRound className="h-4 w-4 text-purple-600" />
            ) : isPuerpera ? (
              <UserRound className="h-4 w-4 text-pink-600" />
            ) : (
              <Baby className="h-4 w-4 text-blue-600" />
            )}
            {paciente.nome}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <Calendar className="h-3 w-3 mr-1" />
            {format(paciente.dataNascimento.toDate(), "dd/MM/yyyy")} 
            <span className="mx-1">•</span>
            {calcularIdade(paciente.dataNascimento)}
          </div>
          
          {isGestante && paciente.idadeGestacional && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {paciente.idadeGestacional} semanas - {calcularIdadeGestacional(paciente.idadeGestacional)}
            </Badge>
          )}
          
          {isPuerpera && paciente.dataParto && (
            <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
              Parto em {format(paciente.dataParto.toDate(), "dd/MM/yyyy")}
            </Badge>
          )}
          
          {isBebe && paciente.nomeMae && (
            <p className="text-xs mt-1">
              <span className="font-medium">Mãe:</span> {paciente.nomeMae}
            </p>
          )}
          
          {alertMessage && (
            <div className={`mt-2 ${isAlert ? "animate-pulse" : ""}`}>
              <Alert className={`p-2 ${isAlert ? "border-amber-300 bg-amber-50" : ""}`}>
                <AlertDescription className="text-xs flex items-center">
                  {isAlert ? (
                    <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1 text-gray-500" />
                  )}
                  {alertMessage}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-0">
          <Button 
            size="sm"
            className="w-full bg-csae-green-600 hover:bg-csae-green-700"
            onClick={() => onIniciarVigilancia(paciente)}
          >
            <Eye className="mr-2 h-4 w-4" />
            Iniciar Vigilância
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
              <Users className="h-5 w-5" />
              Resumo dos Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center p-2 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-2xl font-bold">{pacientes.length}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-purple-50 rounded-md">
                <span className="text-sm text-purple-700">Gestantes</span>
                <span className="text-2xl font-bold text-purple-700">{gestantes.length}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-pink-50 rounded-md">
                <span className="text-sm text-pink-700">Puérperas</span>
                <span className="text-2xl font-bold text-pink-700">{puerperas.length}</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-blue-50 rounded-md">
                <span className="text-sm text-blue-700">Bebês</span>
                <span className="text-2xl font-bold text-blue-700">{bebes.length}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => window.open("/processo-enfermagem", "_blank")}>
              Ir para Processo de Enfermagem
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-csae-green-700">
              <AlertCircle className="h-5 w-5" />
              Alertas de Acompanhamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pacientes.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Não há pacientes cadastrados. Adicione pacientes para visualizar alertas.
                </AlertDescription>
              </Alert>
            ) : (
              <ul className="space-y-2">
                {gestantes
                  .filter(p => p.idadeGestacional && p.idadeGestacional >= 37)
                  .map(p => (
                    <li key={p.id} className="text-sm flex items-center gap-2 p-2 bg-amber-50 rounded-md">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>
                        <strong>{p.nome}</strong> - Gestação a termo ({p.idadeGestacional} semanas)
                      </span>
                    </li>
                  ))}
                  
                {puerperas
                  .filter(p => p.dataParto && calcularDiferencaDatas(p.dataParto) <= 10)
                  .map(p => (
                    <li key={p.id} className="text-sm flex items-center gap-2 p-2 bg-pink-50 rounded-md">
                      <AlertCircle className="h-4 w-4 text-pink-500" />
                      <span>
                        <strong>{p.nome}</strong> - Puerpério imediato ({calcularDiferencaDatas(p.dataParto!)} dias pós-parto)
                      </span>
                    </li>
                  ))}
                  
                {bebes
                  .filter(p => calcularIdade(p.dataNascimento).includes("dia") && parseInt(calcularIdade(p.dataNascimento)) <= 28)
                  .map(p => (
                    <li key={p.id} className="text-sm flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <span>
                        <strong>{p.nome}</strong> - Recém-nascido ({calcularIdade(p.dataNascimento)})
                      </span>
                    </li>
                  ))}

                {bebes
                  .filter(p => p.prematuro)
                  .map(p => (
                    <li key={p.id + "-prematuro"} className="text-sm flex items-center gap-2 p-2 bg-amber-50 rounded-md">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span>
                        <strong>{p.nome}</strong> - Prematuro ({p.idadeGestacionalNascer} semanas)
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-csae-green-700 flex items-center gap-2">
          <UserRound className="h-5 w-5" />
          Pacientes Cadastrados
        </h2>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="todos">
              Todos ({pacientes.length})
            </TabsTrigger>
            <TabsTrigger value="gestantes">
              Gestantes ({gestantes.length})
            </TabsTrigger>
            <TabsTrigger value="puerperas">
              Puérperas ({puerperas.length})
            </TabsTrigger>
            <TabsTrigger value="bebes">
              Bebês ({bebes.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="todos" className="mt-0">
            {pacientes.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-center text-gray-500 mb-4">
                    Nenhum paciente cadastrado. Adicione seu primeiro paciente para iniciar o acompanhamento.
                  </p>
                  <Button className="bg-csae-green-600 hover:bg-csae-green-700">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Paciente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pacientes.map(paciente => renderCardPaciente(paciente))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="gestantes" className="mt-0">
            {gestantes.length === 0 ? (
              <Alert>
                <AlertDescription>Não há gestantes cadastradas.</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gestantes.map(paciente => renderCardPaciente(paciente))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="puerperas" className="mt-0">
            {puerperas.length === 0 ? (
              <Alert>
                <AlertDescription>Não há puérperas cadastradas.</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {puerperas.map(paciente => renderCardPaciente(paciente))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="bebes" className="mt-0">
            {bebes.length === 0 ? (
              <Alert>
                <AlertDescription>Não há bebês cadastrados.</AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bebes.map(paciente => renderCardPaciente(paciente))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPerinatal;
