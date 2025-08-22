import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, Users, FileText, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProcessoEnfermagemExplicacao from '@/components/ProcessoEnfermagemExplicacao';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import ModalCadastroPaciente from '@/components/processo-enfermagem/ModalCadastroPaciente';
import ListaPacientes from '@/components/processo-enfermagem/ListaPacientes';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Paciente, StatusPaciente, IndicadoresPacientes } from '@/types/paciente';
import { buscarPacientesUsuario, calcularIndicadores, determinarStatusPaciente, calcularIndicadoresExpandidos } from '@/services/bancodados/pacientesDB';

const ProcessoEnfermagem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [modalCadastroOpen, setModalCadastroOpen] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [indicadoresExpandidos, setIndicadoresExpandidos] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Buscar pacientes do usuário logado
  const carregarPacientes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const pacientesData = await buscarPacientesUsuario(user.uid);
      setPacientes(pacientesData);
      console.log(`Carregados ${pacientesData.length} pacientes para o usuário ${user.uid}`);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast({
        title: "Erro ao carregar pacientes",
        description: "Ocorreu um erro ao buscar seus pacientes. Tente recarregar a página.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Nova função para carregar indicadores expandidos
  const carregarIndicadoresExpandidos = async () => {
    if (!user || pacientes.length === 0) return;
    
    try {
      const indicadores = await calcularIndicadoresExpandidos(pacientes, user.uid);
      setIndicadoresExpandidos(indicadores);
    } catch (error) {
      console.error('Erro ao carregar indicadores expandidos:', error);
    }
  };

  useEffect(() => {
    carregarPacientes();
  }, [user]);

  useEffect(() => {
    if (pacientes.length > 0) {
      carregarIndicadoresExpandidos();
    }
  }, [pacientes, user]);

  // Filtrar e buscar pacientes
  const pacientesFiltrados = useMemo(() => {
    let resultado = pacientes;

    // Filtro por nome
    if (searchTerm.trim()) {
      resultado = resultado.filter(paciente =>
        paciente.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'todos') {
      resultado = resultado.filter(paciente => {
        const status = determinarStatusPaciente(paciente);
        
        switch (statusFilter) {
          case 'sem-processo':
            return status === 'Sem processo iniciado';
          case 'em-andamento':
            return status === 'Em andamento';
          case 'concluido':
            return status === 'Concluído';
          default:
            return true;
        }
      });
    }

    return resultado;
  }, [pacientes, searchTerm, statusFilter]);

  // Calcular indicadores
  const indicadores: IndicadoresPacientes = useMemo(() => {
    return calcularIndicadores(pacientes);
  }, [pacientes]);

  const handlePacienteCadastrado = () => {
    carregarPacientes();
  };

  const handlePacienteAtualizado = () => {
    carregarPacientes();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 bg-gray-50">
            {/* Seção Explicativa */}
            <ProcessoEnfermagemExplicacao />

            {/* Dashboard e Área Funcional */}
            <section className="py-8">
              <div className="container mx-auto px-4">
                {/* Dashboard Expandido */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-csae-green-800 mb-6">Dashboard</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <Card className="bg-gradient-to-r from-csae-green-50 to-csae-green-100 border-csae-green-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-csae-green-600">Total de Pacientes</p>
                            <p className="text-2xl font-bold text-csae-green-800">
                              {loading ? '-' : indicadores.totalPacientes}
                            </p>
                          </div>
                          <Users className="w-8 h-8 text-csae-green-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">Processos Ativos</p>
                            <p className="text-2xl font-bold text-blue-800">
                              {loading ? '-' : indicadoresExpandidos?.processosAtivos || 0}
                            </p>
                          </div>
                          <Clock className="w-8 h-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-600">Processos Concluídos</p>
                            <p className="text-2xl font-bold text-purple-800">
                              {loading ? '-' : indicadoresExpandidos?.processosConcluidos || 0}
                            </p>
                          </div>
                          <FileText className="w-8 h-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-600">Média por Paciente</p>
                            <p className="text-2xl font-bold text-orange-800">
                              {loading ? '-' : indicadoresExpandidos?.mediaProcessosPorPaciente || '0.0'}
                            </p>
                          </div>
                          <FileText className="w-8 h-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-emerald-600">Taxa de Conclusão</p>
                            <p className="text-2xl font-bold text-emerald-800">
                              {loading ? '-' : 
                                indicadoresExpandidos ? 
                                  Math.round(
                                    (indicadoresExpandidos.processosConcluidos / 
                                    (indicadoresExpandidos.processosConcluidos + indicadoresExpandidos.processosAtivos)) * 100
                                  ) + '%' : '0%'
                              }
                            </p>
                          </div>
                          <FileText className="w-8 h-8 text-emerald-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Área de Ações */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-csae-green-800">Gerenciar Pacientes</h2>
                    <Button 
                      className="csae-btn-primary" 
                      onClick={() => setModalCadastroOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Paciente
                    </Button>
                  </div>

                  {/* Filtros e Busca */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="text"
                          placeholder="Buscar paciente pelo nome..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="sm:w-48">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os Status</SelectItem>
                          <SelectItem value="sem-processo">Sem Processo</SelectItem>
                          <SelectItem value="em-andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Lista de Pacientes */}
                  <ListaPacientes />
                </div>
              </div>
            </section>
          </main>
          
          <Footer />
        </div>
      </div>

      {/* Modal de Cadastro */}
      <ModalCadastroPaciente
        open={modalCadastroOpen}
        onOpenChange={setModalCadastroOpen}
        onPacienteCadastrado={handlePacienteCadastrado}
      />
    </SidebarProvider>
  );
};

export default ProcessoEnfermagem;
