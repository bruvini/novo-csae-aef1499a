
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, User, Play, ArrowRight, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Paciente, StatusPaciente } from '@/types/paciente';
import { determinarStatusPaciente } from '@/services/bancodados/pacientesDB';
import { buscarProcessoAtivo, buscarProcessoConcluido } from '@/services/bancodados/processosEnfermagemDB';
import { useAuth } from '@/contexts/AuthContext';
import ProcessoEnfermagemModal from './ProcessoEnfermagemModal';

interface ListaPacientesProps {
  pacientes: Paciente[];
  loading?: boolean;
}

const ListaPacientes: React.FC<ListaPacientesProps> = ({ pacientes, loading }) => {
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusProcessos, setStatusProcessos] = useState<{[key: string]: 'sem_processo' | 'em_andamento' | 'concluido'}>({});
  const { user } = useAuth();

  // Verificar status dos processos para cada paciente
  useEffect(() => {
    const verificarStatusProcessos = async () => {
      if (!user) return;

      const novosStatus: {[key: string]: 'sem_processo' | 'em_andamento' | 'concluido'} = {};

      for (const paciente of pacientes) {
        if (paciente.id) {
          try {
            // Verificar se tem processo ativo
            const processoAtivo = await buscarProcessoAtivo(paciente.id, user.uid);
            if (processoAtivo) {
              novosStatus[paciente.id] = 'em_andamento';
              continue;
            }

            // Verificar se tem processo concluído
            const temProcessoConcluido = await buscarProcessoConcluido(paciente.id, user.uid);
            if (temProcessoConcluido) {
              novosStatus[paciente.id] = 'concluido';
            } else {
              novosStatus[paciente.id] = 'sem_processo';
            }
          } catch (error) {
            console.error('Erro ao verificar status do processo:', error);
            novosStatus[paciente.id] = 'sem_processo';
          }
        }
      }

      setStatusProcessos(novosStatus);
    };

    if (pacientes.length > 0) {
      verificarStatusProcessos();
    }
  }, [pacientes, user]);

  const handleIniciarProcesso = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setModalOpen(true);
  };

  const handleProcessoAtualizado = () => {
    // Recarregar status dos processos
    if (user && pacientes.length > 0) {
      const verificarStatusProcessos = async () => {
        const novosStatus: {[key: string]: 'sem_processo' | 'em_andamento' | 'concluido'} = {};

        for (const paciente of pacientes) {
          if (paciente.id) {
            try {
              const processoAtivo = await buscarProcessoAtivo(paciente.id, user.uid);
              if (processoAtivo) {
                novosStatus[paciente.id] = 'em_andamento';
                continue;
              }

              const temProcessoConcluido = await buscarProcessoConcluido(paciente.id, user.uid);
              if (temProcessoConcluido) {
                novosStatus[paciente.id] = 'concluido';
              } else {
                novosStatus[paciente.id] = 'sem_processo';
              }
            } catch (error) {
              console.error('Erro ao verificar status do processo:', error);
              novosStatus[paciente.id] = 'sem_processo';
            }
          }
        }

        setStatusProcessos(novosStatus);
      };

      verificarStatusProcessos();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-32 ml-4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (pacientes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Nenhum paciente encontrado
          </h3>
          <p className="text-gray-500">
            Os pacientes cadastrados aparecerão aqui.
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (pacienteId: string) => {
    const status = statusProcessos[pacienteId] || 'sem_processo';
    
    const configs = {
      'sem_processo': { 
        className: 'bg-gray-100 text-gray-700 border-gray-200',
        label: 'Sem processo'
      },
      'em_andamento': { 
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        label: 'Em andamento'
      },
      'concluido': { 
        className: 'bg-green-100 text-green-700 border-green-200',
        label: 'Concluído'
      }
    };

    const config = configs[status];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getActionButton = (paciente: Paciente) => {
    if (!paciente.id) return null;
    
    const status = statusProcessos[paciente.id] || 'sem_processo';

    if (status === 'em_andamento') {
      return (
        <Button 
          size="sm" 
          className="csae-btn-primary" 
          onClick={() => handleIniciarProcesso(paciente)}
        >
          <ArrowRight className="w-4 h-4 mr-2" />
          Continuar Processo
        </Button>
      );
    }

    if (status === 'concluido') {
      return (
        <Button size="sm" variant="outline" disabled>
          <CheckCircle className="w-4 h-4 mr-2" />
          Processo Concluído
        </Button>
      );
    }

    return (
      <Button 
        size="sm" 
        variant="outline" 
        onClick={() => handleIniciarProcesso(paciente)}
      >
        <Play className="w-4 h-4 mr-2" />
        Iniciar Processo
      </Button>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {pacientes.map((paciente) => {
          return (
            <Card key={paciente.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-csae-green-600" />
                      <h3 className="font-medium text-gray-900">
                        {paciente.nomeCompleto}
                      </h3>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Nascimento: {format(paciente.dataNascimento.toDate(), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <span>•</span>
                      <span>{paciente.sexo}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {paciente.id && getStatusBadge(paciente.id)}
                    {getActionButton(paciente)}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {pacienteSelecionado && (
        <ProcessoEnfermagemModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          paciente={pacienteSelecionado}
          onProcessoAtualizado={handleProcessoAtualizado}
        />
      )}
    </>
  );
};

export default ListaPacientes;
