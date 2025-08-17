import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Play, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Paciente } from '@/types/paciente';
import ProcessoEnfermagemModal from './ProcessoEnfermagemModal';
import { buscarProcessoAtivo } from '@/services/bancodados/processosEnfermagemDB';

interface ListaPacientesProps {
  pacientes: Paciente[];
  loading: boolean;
}

const ListaPacientes: React.FC<ListaPacientesProps> = ({ pacientes, loading }) => {
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusProcesso, setStatusProcesso] = useState<{ [pacienteId: string]: string }>({});
  const { user } = useAuth();

  const handleOpenModal = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedPaciente(null);
  };

  const handleProcessoAtualizado = () => {
    // Lógica para atualizar a lista de pacientes ou o status do processo
    // Pode ser uma chamada para recarregar os dados do paciente
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
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="https://github.com/shadcn.png" alt={paciente.nomeCompleto} />
                      <AvatarFallback>{paciente.nomeCompleto.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold">{paciente.nomeCompleto}</CardTitle>
                      {/* <CardDescription>
                        Paciente desde {new Date(paciente.dataCadastro).toLocaleDateString()}
                      </CardDescription> */}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={statusDisplay.variant} className={statusDisplay.className}>
                      {statusDisplay.label}
                    </Badge>
                    <Button 
                      onClick={() => handleOpenModal(paciente)}
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

      {/* Modal */}
      {selectedPaciente && (
        <ProcessoEnfermagemModal
          open={modalOpen}
          onOpenChange={handleCloseModal}
          paciente={selectedPaciente}
          onProcessoAtualizado={handleProcessoAtualizado}
        />
      )}
    </>
  );
};

export default ListaPacientes;
