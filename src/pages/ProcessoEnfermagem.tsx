
import React, { useState } from 'react';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import CadastrarPacienteModal from '@/components/processo-enfermagem/CadastrarPacienteModal';
import ListaPacientes from '@/components/processo-enfermagem/ListaPacientes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { Evolucao, Paciente } from '@/types';
import { iniciarEvolucao, salvarProgressoEvolucao } from '@/services/bancodados/evolucoesDB';
import { atualizarPaciente } from '@/services/bancodados/pacientesDB';
import EtapasProcessoEnfermagem from '@/components/processo-enfermagem/EtapasProcessoEnfermagem';

const ProcessoEnfermagem = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pacienteEmConsulta, setPacienteEmConsulta] = useState<Paciente | null>(null);
  const [evolucaoAtivaId, setEvolucaoAtivaId] = useState<string | null>(null);
  const [dadosEvolucao, setDadosEvolucao] = useState<Partial<Evolucao>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { usuario } = useAutenticacao();

  const { mutate: iniciarConsulta, isPending: isStartingConsulta } = useMutation({
    mutationFn: async (paciente: Paciente) => {
      if (!usuario) throw new Error("Usuário não autenticado.");
      const { evolucaoId, sucesso } = await iniciarEvolucao(paciente.id!, usuario.uid);
      if (!sucesso) {
        throw new Error("Não foi possível iniciar a evolução.");
      }
      const atualizado = await atualizarPaciente(paciente.id!, { statusPaciente: 'ESTA_CONSULTANDO' });
      if (!atualizado) {
        throw new Error("Não foi possível atualizar o status do paciente.");
      }
      return { evolucaoId, paciente };
    },
    onSuccess: ({ evolucaoId, paciente }) => {
      toast({
        title: "Consulta iniciada!",
        description: `Consulta para ${paciente.nome} iniciada com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['pacientes', usuario?.uid] });
      setPacienteEmConsulta(paciente);
      setEvolucaoAtivaId(evolucaoId);
      setDadosEvolucao({ id: evolucaoId, statusEvolucao: 'EM_ANDAMENTO' });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Não foi possível iniciar a consulta: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const { mutate: salvarProgresso, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      if (!pacienteEmConsulta?.id || !evolucaoAtivaId) {
        throw new Error("Não foi possível identificar o paciente ou a consulta ativa.");
      }
      const sucesso = await salvarProgressoEvolucao(pacienteEmConsulta.id, evolucaoAtivaId, dadosEvolucao);
      if (!sucesso) {
        throw new Error("Ocorreu um erro ao salvar o progresso no banco de dados.");
      }
    },
    onSuccess: () => {
      toast({
        title: "💾 Progresso salvo com sucesso!",
        description: "Pode continuar sem se preocupar.",
      });
      queryClient.invalidateQueries({ queryKey: ['pacientes', usuario?.uid] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao Salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelecionarPaciente = (paciente: Paciente) => {
    if (paciente.statusPaciente === 'ESTA_CONSULTANDO') {
        const evolucaoAberta = paciente.evolucoes?.find(e => e.statusEvolucao === 'EM_ANDAMENTO');
        if (evolucaoAberta && evolucaoAberta.id) {
            setPacienteEmConsulta(paciente);
            setEvolucaoAtivaId(evolucaoAberta.id);

            const dadosParaAvaliar = { ...evolucaoAberta };
            const oldDadosAvaliacao = (dadosParaAvaliar as any).dadosAvaliacao;

            if (oldDadosAvaliacao && !oldDadosAvaliacao.etapaHistorico) {
                dadosParaAvaliar.dadosAvaliacao = {
                    ...oldDadosAvaliacao,
                    etapaHistorico: {
                        coletaDados: oldDadosAvaliacao.queixaPrincipal || '',
                        exameFisico: {
                            sinaisVitais: oldDadosAvaliacao.sinaisVitais || {},
                            resultadosExames: {},
                            revisaoSistemas: {}
                        },
                        necessidadesHumanasBasicas: oldDadosAvaliacao.nhbsSelecionadasIds || []
                    }
                };
                delete (dadosParaAvaliar.dadosAvaliacao as any).queixaPrincipal;
                delete (dadosParaAvaliar.dadosAvaliacao as any).sinaisVitais;
                delete (dadosParaAvaliar.dadosAvaliacao as any).nhbsSelecionadasIds;
            }
            
            setDadosEvolucao(dadosParaAvaliar);
            toast({ title: 'Continuando consulta', description: `Continuando a consulta para o paciente ${paciente.nome}` });
        } else {
            console.error("Inconsistência: Paciente com status 'ESTA_CONSULTANDO' mas sem evolução aberta.");
            toast({ title: "Erro de dados", description: "Não foi possível encontrar a consulta ativa, iniciando uma nova.", variant: 'destructive' });
            iniciarConsulta(paciente);
        }
    } else {
        iniciarConsulta(paciente);
    }
  };

  const handleSalvarProgresso = () => {
    salvarProgresso();
  };

  const handleDadosEvolucaoChange = (novosDados: Partial<Evolucao>) => {
    setDadosEvolucao(prev => ({
        ...prev,
        ...novosDados,
        dadosAvaliacao: {
            ...(prev.dadosAvaliacao || {}),
            ...(novosDados.dadosAvaliacao || {}),
        },
    }));
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <NavigationMenu activeItem="processo-enfermagem" />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          {pacienteEmConsulta && evolucaoAtivaId ? (
            <EtapasProcessoEnfermagem 
              paciente={pacienteEmConsulta}
              evolucaoId={evolucaoAtivaId}
              onSalvarProgresso={handleSalvarProgresso}
              dadosEvolucao={dadosEvolucao}
              onDadosChange={handleDadosEvolucaoChange}
              isSaving={isSaving}
            />
          ) : (
            <div className="flex flex-col gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-csae-green-700">O que é o Processo de Enfermagem?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-csae-green-700">Gerenciar Pacientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input 
                        type="text" 
                        placeholder="Buscar paciente por nome..."
                        className="pl-10"
                      />
                    </div>
                    <Button 
                      className="w-full sm:w-auto bg-csae-green-600 hover:bg-csae-green-700"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar Paciente
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <ListaPacientes 
                onSelecionarPaciente={handleSelecionarPaciente} 
                isProcessing={isStartingConsulta} 
              />
            </div>
          )}
        </main>
      </div>
      <CadastrarPacienteModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};

export default ProcessoEnfermagem;
