
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Search, UserPlus, Play, CheckCircle, Calendar, Trash2, Edit, MoreVertical } from 'lucide-react';
import { calcularIdade } from '@/utils/timeUtils';
import { Paciente } from '@/types/paciente';
import { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import { buscarPacientesPorEnfermeiro, excluirPaciente } from '@/services/bancodados/pacientesDB';
import { buscarProcessoAtivo, buscarProcessoConcluido } from '@/services/bancodados/processosEnfermagemDB';
import ProcessoEnfermagemModal from './ProcessoEnfermagemModal';
import ModalCadastroPaciente from './ModalCadastroPaciente';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PacienteComStatus extends Paciente {
  temProcessoAtivo: boolean;
  temProcessoConcluido: boolean;
  processoAtivo?: ProcessoEnfermagem | null;
}

const ListaPacientes: React.FC = () => {
  const [pacientes, setPacientes] = useState<PacienteComStatus[]>([]);
  const [filteredPacientes, setFilteredPacientes] = useState<PacienteComStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [modalProcessoOpen, setModalProcessoOpen] = useState(false);
  const [modalCadastroOpen, setModalCadastroOpen] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [processoSelecionado, setProcessoSelecionado] = useState<ProcessoEnfermagem | null>(null);
  const [pacienteParaEditar, setPacienteParaEditar] = useState<Paciente | null>(null);
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState<Paciente | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const carregarPacientes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const listaPacientes = await buscarPacientesPorEnfermeiro(user.uid);
      
      const pacientesComStatus = await Promise.all(
        listaPacientes.map(async (paciente) => {
          const processoAtivo = await buscarProcessoAtivo(paciente.id, user.uid);
          const temProcessoConcluido = await buscarProcessoConcluido(paciente.id, user.uid);
          
          return {
            ...paciente,
            temProcessoAtivo: !!processoAtivo,
            temProcessoConcluido,
            processoAtivo
          };
        })
      );

      setPacientes(pacientesComStatus);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de pacientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarPacientes();
  }, [user]);

  useEffect(() => {
    let filtered = pacientes;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(paciente =>
        paciente.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'todos') {
      switch (statusFilter) {
        case 'sem_processo':
          filtered = filtered.filter(p => !p.temProcessoAtivo && !p.temProcessoConcluido);
          break;
        case 'em_andamento':
          filtered = filtered.filter(p => p.temProcessoAtivo);
          break;
        case 'concluido':
          filtered = filtered.filter(p => p.temProcessoConcluido && !p.temProcessoAtivo);
          break;
      }
    }

    setFilteredPacientes(filtered);
  }, [pacientes, searchTerm, statusFilter]);

  const handleIniciarProcesso = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setProcessoSelecionado(null);
    setModalProcessoOpen(true);
  };

  const handleContinuarProcesso = (paciente: PacienteComStatus) => {
    setPacienteSelecionado(paciente);
    setProcessoSelecionado(paciente.processoAtivo || null);
    setModalProcessoOpen(true);
  };

  const handleEditarPaciente = (paciente: Paciente) => {
    setPacienteParaEditar(paciente);
    setModalCadastroOpen(true);
  };

  const handleExcluirPaciente = (paciente: Paciente) => {
    setPacienteParaExcluir(paciente);
    setShowDeleteAlert(true);
  };

  const confirmarExclusaoPaciente = async () => {
    if (!pacienteParaExcluir || !user) return;

    try {
      await excluirPaciente(pacienteParaExcluir.id, user.uid);
      toast({
        title: "Sucesso",
        description: "Paciente excluído com sucesso!",
      });
      carregarPacientes();
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir o paciente.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteAlert(false);
      setPacienteParaExcluir(null);
    }
  };

  const handleProcessoDeleted = () => {
    carregarPacientes(); // Recarregar a lista quando um processo for excluído
  };

  const getStatusBadge = (paciente: PacienteComStatus) => {
    if (paciente.temProcessoAtivo) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Em Andamento</Badge>;
    }
    if (paciente.temProcessoConcluido) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Concluído</Badge>;
    }
    return <Badge variant="outline">Sem Processo</Badge>;
  };

  const getActionButton = (paciente: PacienteComStatus) => {
    if (paciente.temProcessoAtivo) {
      return (
        <Button 
          onClick={() => handleContinuarProcesso(paciente)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          Continuar Processo
        </Button>
      );
    }
    
    return (
      <Button 
        onClick={() => handleIniciarProcesso(paciente)}
        size="sm"
        className="flex items-center gap-2"
      >
        <Play className="w-4 h-4" />
        Iniciar Processo
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando pacientes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Meus Pacientes</h2>
        <Button onClick={() => setModalCadastroOpen(true)} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Cadastrar Paciente
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome do paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="sem_processo">Sem Processo</SelectItem>
            <SelectItem value="em_andamento">Em Andamento</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Pacientes */}
      {filteredPacientes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'todos' 
                ? 'Nenhum paciente encontrado' 
                : 'Nenhum paciente cadastrado'
              }
            </h3>
            <p className="text-gray-600 text-center">
              {searchTerm || statusFilter !== 'todos'
                ? 'Tente ajustar os filtros de busca.'
                : 'Cadastre seu primeiro paciente para iniciar um processo de enfermagem.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPacientes.map((paciente) => (
            <Card key={paciente.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{paciente.nomeCompleto}</CardTitle>
                    <CardDescription>
                      {calcularIdade(paciente.dataNascimento.toDate())} anos • {paciente.sexo}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditarPaciente(paciente)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleExcluirPaciente(paciente)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getStatusBadge(paciente)}
                  {paciente.temProcessoConcluido && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Processo de enfermagem concluído
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {getActionButton(paciente)}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modais */}
      {pacienteSelecionado && (
        <ProcessoEnfermagemModal
          isOpen={modalProcessoOpen}
          onClose={() => {
            setModalProcessoOpen(false);
            setPacienteSelecionado(null);
            setProcessoSelecionado(null);
            carregarPacientes();
          }}
          paciente={pacienteSelecionado}
          enfermeiroId={user?.uid || ''}
          processoInicial={processoSelecionado}
          onProcessoDeleted={handleProcessoDeleted}
        />
      )}

      <ModalCadastroPaciente
        open={modalCadastroOpen}
        onOpenChange={(open) => {
          setModalCadastroOpen(open);
          if (!open) {
            setPacienteParaEditar(null);
          }
        }}
        onPacienteCadastrado={carregarPacientes}
        pacienteParaEditar={pacienteParaEditar}
      />

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente "{pacienteParaExcluir?.nomeCompleto}"? 
              Esta ação não pode ser desfeita e todos os dados relacionados, incluindo processos de enfermagem, serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmarExclusaoPaciente}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ListaPacientes;
