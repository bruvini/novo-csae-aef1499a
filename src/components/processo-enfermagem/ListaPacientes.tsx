
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Play, Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Paciente } from '@/types/paciente';
import ProcessoEnfermagemModal from './ProcessoEnfermagemModal';
import ModalCadastroPaciente from './ModalCadastroPaciente';
import { buscarProcessoAtivo } from '@/services/bancodados/processosEnfermagemDB';
import { excluirPaciente } from '@/services/bancodados/pacientesDB';

interface ListaPacientesProps {
  pacientes: Paciente[];
  loading: boolean;
  onPacienteAtualizado: () => void;
}

const ListaPacientes: React.FC<ListaPacientesProps> = ({ 
  pacientes, 
  loading, 
  onPacienteAtualizado 
}) => {
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [modalProcessoOpen, setModalProcessoOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState<Paciente | null>(null);
  const [statusProcesso, setStatusProcesso] = useState<{ [pacienteId: string]: string }>({});
  const [excluindo, setExcluindo] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleOpenProcessoModal = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setModalProcessoOpen(true);
  };

  const handleCloseProcessoModal = () => {
    setModalProcessoOpen(false);
    setSelectedPaciente(null);
  };

  const handleOpenEditarModal = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setModalEditarOpen(true);
  };

  const handleCloseEditarModal = () => {
    setModalEditarOpen(false);
    setSelectedPaciente(null);
  };

  const handleProcessoAtualizado = () => {
    onPacienteAtualizado();
  };

  const handlePacienteEditado = () => {
    onPacienteAtualizado();
    handleCloseEditarModal();
  };

  const handleExcluirPaciente = async () => {
    if (!pacienteParaExcluir) return;

    setExcluindo(true);
    try {
      await excluirPaciente(pacienteParaExcluir.id);
      
      toast({
        title: "Paciente excluído",
        description: "Paciente e todos os seus processos foram excluídos com sucesso.",
      });
      
      onPacienteAtualizado();
      setPacienteParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o paciente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExcluindo(false);
    }
  };

  const verificarStatusProcesso = useCallback(async (paciente: Paciente) => {
    if (!user || !paciente.id) return 'sem-processo';

    try {
      // Buscar APENAS processos em andamento
      const processoAtivo = await buscarProcessoAtivo(paciente.id, user.uid);
      
      if (processoAtivo) {
        return 'em-andamento';
      }
      
      // Se não há processo em andamento, permitir iniciar novo processo
      return 'sem-processo';
    } catch (error) {
      console.error('Erro ao verificar status do processo:', error);
      return 'sem-processo';
    }
  }, [user]);

  useEffect(() => {
    const verificarStatusTodosPacientes = async () => {
      const statusTemp: { [pacienteId: string]: string } = {};
      for (const paciente of pacientes) {
        statusTemp[paciente.id] = loading ? 'carregando' : await verificarStatusProcesso(paciente);
      }
      setStatusProcesso(statusTemp);
    };

    verificarStatusTodosPacientes();
  }, [pacientes, loading, verificarStatusProcesso]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'em-andamento':
        return {
          label: 'Em andamento',
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-800'
        };
      case 'sem-processo':
        return {
          label: 'Disponível',
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800'
        };
      default:
        return {
          label: 'Carregando...',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-600'
        };
    }
  };

  const getButtonConfig = (status: string) => {
    switch (status) {
      case 'em-andamento':
        return {
          text: 'Continuar Processo',
          icon: <Play className="w-4 h-4" />,
          disabled: false,
          variant: 'default' as const
        };
      case 'sem-processo':
        return {
          text: 'Iniciar Processo',
          icon: <Plus className="w-4 h-4" />,
          disabled: false,
          variant: 'default' as const
        };
      default:
        return {
          text: 'Carregando...',
          icon: <Loader2 className="w-4 h-4 animate-spin" />,
          disabled: true,
          variant: 'outline' as const
        };
    }
  };

  return (
    <>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          // Mostrar skeleton cards enquanto carrega
          [...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col space-y-2 p-6">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : pacientes.length === 0 ? (
          // Mostrar mensagem se não houver pacientes
          <div className="col-span-full text-center">
            Nenhum paciente cadastrado.
          </div>
        ) : (
          // Mostrar lista de pacientes
          pacientes.map((paciente) => {
            const status = statusProcesso[paciente.id] || 'carregando';
            const statusDisplay = getStatusDisplay(status);
            const buttonConfig = getButtonConfig(status);

            return (
              <Card key={paciente.id}>
                <CardContent className="flex flex-col space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" alt={paciente.nomeCompleto} />
                        <AvatarFallback>{paciente.nomeCompleto.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold">{paciente.nomeCompleto}</CardTitle>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditarModal(paciente)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setPacienteParaExcluir(paciente)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={statusDisplay.variant} className={statusDisplay.className}>
                      {statusDisplay.label}
                    </Badge>
                    <Button 
                      onClick={() => handleOpenProcessoModal(paciente)}
                      disabled={buttonConfig.disabled}
                      className="csae-btn-primary flex items-center gap-2"
                    >
                      {buttonConfig.icon}
                      {buttonConfig.text}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal do Processo de Enfermagem */}
      {selectedPaciente && modalProcessoOpen && (
        <ProcessoEnfermagemModal
          open={modalProcessoOpen}
          onOpenChange={handleCloseProcessoModal}
          paciente={selectedPaciente}
          onProcessoAtualizado={handleProcessoAtualizado}
        />
      )}

      {/* Modal de Editar Paciente */}
      {selectedPaciente && modalEditarOpen && (
        <ModalCadastroPaciente
          open={modalEditarOpen}
          onOpenChange={handleCloseEditarModal}
          onPacienteCadastrado={handlePacienteEditado}
          pacienteParaEditar={selectedPaciente}
        />
      )}

      {/* AlertDialog para Confirmação de Exclusão */}
      <AlertDialog open={!!pacienteParaExcluir} onOpenChange={() => setPacienteParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o paciente <strong>'{pacienteParaExcluir?.nomeCompleto}'</strong>? 
              Todos os seus processos de enfermagem associados também serão excluídos permanentemente. 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirPaciente}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ListaPacientes;
