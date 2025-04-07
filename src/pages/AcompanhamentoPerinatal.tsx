
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import MainFooter from '@/components/MainFooter';
import NavigationMenuComponent from '@/components/NavigationMenu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  UserRound, 
  Baby, 
  Calendar, 
  ClipboardList, 
  Plus, 
  UserPlus, 
  ListFilter, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useAutenticacao } from '@/services/autenticacao';
import GerenciarPacientesPerinatal from '@/components/acompanhamento-perinatal/GerenciarPacientesPerinatal';
import DashboardPerinatal from '@/components/acompanhamento-perinatal/DashboardPerinatal';
import VigilanciaPerinatal from '@/components/acompanhamento-perinatal/VigilanciaPerinatal';
import { PacientePerinatal } from '@/services/bancodados/tipos';

const AcompanhamentoPerinatal: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { obterSessao } = useAutenticacao();
  const [openGerenciarPacientes, setOpenGerenciarPacientes] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [pacienteEmVigilancia, setPacienteEmVigilancia] = useState<PacientePerinatal | null>(null);

  useEffect(() => {
    const sessao = obterSessao();
    if (!sessao || sessao.statusAcesso !== "Aprovado") {
      toast({
        title: "Acesso restrito",
        description: "É necessário fazer login para acessar esta página.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [obterSessao, navigate, toast]);  

  const iniciarVigilancia = (paciente: PacientePerinatal) => {
    setPacienteEmVigilancia(paciente);
    setSelectedTab('vigilancia');
  };

  const voltarDashboard = () => {
    setPacienteEmVigilancia(null);
    setSelectedTab('dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-csae-light">
      <Header />
      <NavigationMenuComponent activeItem="perinatal" />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="mb-6 border-csae-green-200">
          <CardHeader className="bg-gradient-to-r from-csae-green-50 to-white">
            <CardTitle className="text-2xl md:text-3xl text-csae-green-800">
              Acompanhamento Perinatal
            </CardTitle>
            <CardDescription className="text-base text-csae-green-700">
              Ferramenta para acompanhamento clínico completo da gestante, puérpera e criança, oferecendo uma interface interativa, segura e eficiente para a condução do cuidado integral.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <Button 
                variant="outline" 
                className="border-csae-green-300 text-csae-green-700 hover:bg-csae-green-50"
                onClick={() => setOpenGerenciarPacientes(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Gerenciar Pacientes
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-csae-green-300 text-csae-green-700 hover:bg-csae-green-50"
                >
                  <ListFilter className="w-4 h-4 mr-1" />
                  Filtros
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-csae-green-300 text-csae-green-700 hover:bg-csae-green-50"
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Estatísticas
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-csae-green-300 text-csae-green-700 hover:bg-csae-green-50"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Alertas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <GerenciarPacientesPerinatal 
          open={openGerenciarPacientes} 
          onOpenChange={setOpenGerenciarPacientes}
          onIniciarVigilancia={iniciarVigilancia}
        />
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dashboard" disabled={!!pacienteEmVigilancia}>
              <ClipboardList className="w-4 h-4 mr-2" />
              Dashboard Geral
            </TabsTrigger>
            <TabsTrigger value="vigilancia" disabled={!pacienteEmVigilancia}>
              <UserRound className="w-4 h-4 mr-2" />
              {pacienteEmVigilancia ? `Vigilância: ${pacienteEmVigilancia.nome}` : 'Vigilância'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <DashboardPerinatal onIniciarVigilancia={iniciarVigilancia} />
          </TabsContent>
          
          <TabsContent value="vigilancia">
            {pacienteEmVigilancia && (
              <VigilanciaPerinatal 
                paciente={pacienteEmVigilancia} 
                onVoltar={voltarDashboard}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <MainFooter />
    </div>
  );
};

export default AcompanhamentoPerinatal;
