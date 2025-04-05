import React, { useState, useEffect } from 'react';
import { Play, User, Edit2, Trash2, Clock, ArrowRight, UserPlus, ArrowLeft, Copy, Save, Home } from 'lucide-react';
import { useAutenticacao } from '@/services/autenticacao';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import { Card, CardContent } from '@/components/ui/card';
import { EnfermageWizard } from '@/components/processo-enfermagem/EnfermagemWizard';
import { ListaPacientes } from '@/components/processo-enfermagem/ListaPacientes';
import { CadastrarPacienteModal } from '@/components/processo-enfermagem/CadastrarPacienteModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { buscarPacientesPorProfissional } from '@/services/bancodados';
import { Paciente } from '@/services/bancodados/tipos';

const ProcessoEnfermagem = () => {
  const { usuario, obterSessao } = useAutenticacao();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [showPacientes, setShowPacientes] = useState(false);
  const [cadastrarModalOpen, setCadastrarModalOpen] = useState(false);
  const [modoEvolucao, setModoEvolucao] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [evolucaoId, setEvolucaoId] = useState<string | null>(null);
  const [isModoRetomar, setIsModoRetomar] = useState(false);

  useEffect(() => {
    const carregarPacientes = async () => {
      setLoading(true);
      const sessao = obterSessao();
      
      if (sessao && sessao.uid) {
        try {
          const listaPacientes = await buscarPacientesPorProfissional(sessao.uid);
          setPacientes(listaPacientes);
        } catch (error) {
          console.error("Erro ao carregar pacientes:", error);
          toast({
            title: "Erro ao carregar pacientes",
            description: "Não foi possível carregar seus pacientes. Tente novamente mais tarde.",
            variant: "destructive"
          });
        }
      }
      
      setLoading(false);
    };

    carregarPacientes();
  }, [obterSessao, toast]);

  const handleIniciarEvolucao = () => {
    if (pacientes.length === 0) {
      toast({
        title: "Nenhum paciente cadastrado",
        description: "Registre um paciente para iniciar o processo de enfermagem.",
      });
      setCadastrarModalOpen(true);
      return;
    }
    
    setShowPacientes(true);
  };

  const handleSelecionarPaciente = (paciente: Paciente, iniciar: boolean, idEvolucao?: string) => {
    setPacienteSelecionado(paciente);
    
    if (iniciar) {
      setIsModoRetomar(!!idEvolucao);
      setEvolucaoId(idEvolucao || null);
      setModoEvolucao(true);
      setShowPacientes(false);
    }
  };

  const handleVoltarAoPainel = () => {
    setModoEvolucao(false);
    setPacienteSelecionado(null);
    setEvolucaoId(null);
    setShowPacientes(false);
  };

  const handleCadastrarPaciente = async (novoPaciente: Paciente) => {
    setPacientes(prev => [...prev, novoPaciente]);
    setCadastrarModalOpen(false);
    
    toast({
      title: "Paciente cadastrado",
      description: `${novoPaciente.nomeCompleto} foi adicionado com sucesso.`,
    });
  };

  const handleFinalizarEvolucao = () => {
    handleVoltarAoPainel();
    toast({
      title: "Evolução concluída",
      description: "O processo de enfermagem foi finalizado com sucesso.",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <NavigationMenu activeItem="processo-enfermagem" />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-csae-green-700 mb-6">
          Processo de Enfermagem
        </h1>

        {!showPacientes && !modoEvolucao && (
          <div className="flex flex-col items-center justify-center mt-12">
            <Card className="w-full max-w-lg transition-all hover:shadow-md">
              <CardContent className="p-10 flex flex-col items-center">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-24 h-24 rounded-full bg-csae-green-50 hover:bg-csae-green-100 text-csae-green-700 border-csae-green-200 mb-6"
                  onClick={handleIniciarEvolucao}
                >
                  <Play size={48} />
                </Button>
                <h2 className="text-xl font-semibold text-center text-csae-green-700 mb-4">
                  Iniciar uma evolução ou dar continuidade
                </h2>
                <p className="text-gray-600 text-center mb-6">
                  Clique no botão acima para iniciar uma nova evolução ou continuar uma já existente.
                </p>
                <Button
                  onClick={() => setCadastrarModalOpen(true)}
                  className="bg-csae-green-600 hover:bg-csae-green-700"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Cadastrar paciente
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {showPacientes && !modoEvolucao && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                onClick={() => setShowPacientes(false)}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              
              <Button
                onClick={() => setCadastrarModalOpen(true)}
                className="bg-csae-green-600 hover:bg-csae-green-700"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Cadastrar paciente
              </Button>
            </div>
            
            <ListaPacientes 
              pacientes={pacientes} 
              setPacientes={setPacientes}
              onSelecionarPaciente={handleSelecionarPaciente}
            />
          </div>
        )}

        {modoEvolucao && pacienteSelecionado && (
          <EnfermageWizard 
            paciente={pacienteSelecionado} 
            evolucaoId={evolucaoId}
            isRetomando={isModoRetomar}
            onVoltarAoPainel={handleVoltarAoPainel}
            onFinalizarEvolucao={handleFinalizarEvolucao}
          />
        )}

        <CadastrarPacienteModal 
          isOpen={cadastrarModalOpen} 
          onClose={() => setCadastrarModalOpen(false)}
          onCadastrar={handleCadastrarPaciente}
        />
      </main>
    </div>
  );
};

export default ProcessoEnfermagem;
