
import React, { useState } from 'react';
import { Edit2, Trash2, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Paciente, excluirPaciente } from '@/services/bancodados';
import { EditarPacienteModal } from './EditarPacienteModal';
import { HistoricoEvolucaoModal } from './HistoricoEvolucaoModal';

interface ListaPacientesProps {
  pacientes: Paciente[];
  setPacientes: React.Dispatch<React.SetStateAction<Paciente[]>>;
  onSelecionarPaciente: (paciente: Paciente, iniciar: boolean, evolucaoId?: string) => void;
}

export function ListaPacientes({ pacientes, setPacientes, onSelecionarPaciente }: ListaPacientesProps) {
  const { toast } = useToast();
  const [filtro, setFiltro] = useState('');
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState<Paciente | null>(null);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [pacienteParaEditar, setPacienteParaEditar] = useState<Paciente | null>(null);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [pacienteParaHistorico, setPacienteParaHistorico] = useState<Paciente | null>(null);

  const pacientesFiltrados = pacientes.filter(p => 
    p.nomeCompleto.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleExcluir = async () => {
    if (!pacienteParaExcluir) return;
    
    try {
      if (pacienteParaExcluir.id) {
        const sucesso = await excluirPaciente(pacienteParaExcluir.id);
        
        if (sucesso) {
          setPacientes(prev => prev.filter(p => p.id !== pacienteParaExcluir.id));
          toast({
            title: "Paciente excluído",
            description: "O paciente foi removido com sucesso.",
          });
        } else {
          throw new Error("Falha ao excluir paciente");
        }
      }
    } catch (error) {
      console.error("Erro ao excluir paciente:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o paciente. Tente novamente.",
        variant: "destructive"
      });
    }
    
    setPacienteParaExcluir(null);
  };

  const handleEditarPaciente = (pacienteAtualizado: Paciente) => {
    setPacientes(prev => 
      prev.map(p => p.id === pacienteAtualizado.id ? pacienteAtualizado : p)
    );
    
    setEditarModalOpen(false);
    toast({
      title: "Paciente atualizado",
      description: "Os dados do paciente foram atualizados com sucesso.",
    });
  };

  const verificarEvolucaoEmAberto = (paciente: Paciente) => {
    if (!paciente.evolucoes || paciente.evolucoes.length === 0) return null;
    
    const evolucaoAberta = paciente.evolucoes.find(e => 
      e.statusConclusao === 'Em andamento' || e.statusConclusao === 'Interrompido'
    );
    
    return evolucaoAberta;
  };

  const contarEvolucoesConcluidas = (paciente: Paciente) => {
    if (!paciente.evolucoes) return 0;
    
    return paciente.evolucoes.filter(e => e.statusConclusao === 'Concluído').length;
  };

  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('pt-BR').format(data);
    } catch (e) {
      return 'Data inválida';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Input 
              placeholder="Buscar paciente por nome..." 
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="max-w-sm"
            />
            {filtro && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setFiltro('')}
              >
                Limpar
              </Button>
            )}
          </div>
          <h2 className="text-lg font-semibold text-csae-green-700">Lista de Pacientes</h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Paciente</TableHead>
                <TableHead>Data de Nascimento</TableHead>
                <TableHead>Evoluções Concluídas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                    {filtro ? 'Nenhum paciente encontrado para o filtro aplicado.' : 'Nenhum paciente cadastrado.'}
                  </TableCell>
                </TableRow>
              ) : (
                pacientesFiltrados.map((paciente) => {
                  const evolucaoAberta = verificarEvolucaoEmAberto(paciente);
                  const evolucoesConcluidas = contarEvolucoesConcluidas(paciente);
                  
                  return (
                    <TableRow key={paciente.id}>
                      <TableCell className="font-medium">{paciente.nomeCompleto}</TableCell>
                      <TableCell>{formatarData(paciente.dataNascimento)} ({paciente.idade} anos)</TableCell>
                      <TableCell>{evolucoesConcluidas}</TableCell>
                      <TableCell>
                        {evolucaoAberta ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {evolucaoAberta.statusConclusao === 'Interrompido' ? 'Interrompido' : 'Em andamento'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Disponível
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setPacienteParaEditar(paciente);
                              setEditarModalOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPacienteParaExcluir(paciente)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          {evolucoesConcluidas > 0 && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setPacienteParaHistorico(paciente);
                                setHistoricoModalOpen(true);
                              }}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {evolucaoAberta ? (
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-csae-green-600 hover:bg-csae-green-700"
                              onClick={() => onSelecionarPaciente(paciente, true, evolucaoAberta.id)}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Retomar
                            </Button>
                          ) : (
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-csae-green-600 hover:bg-csae-green-700"
                              onClick={() => onSelecionarPaciente(paciente, true)}
                            >
                              <ArrowRight className="h-4 w-4" />
                              Iniciar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={!!pacienteParaExcluir} onOpenChange={(open) => !open && setPacienteParaExcluir(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o paciente {pacienteParaExcluir?.nomeCompleto}? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPacienteParaExcluir(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleExcluir}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edição de paciente */}
      {pacienteParaEditar && (
        <EditarPacienteModal 
          isOpen={editarModalOpen}
          onClose={() => setEditarModalOpen(false)}
          paciente={pacienteParaEditar}
          onEditar={handleEditarPaciente}
        />
      )}

      {/* Modal de histórico de evoluções */}
      {pacienteParaHistorico && (
        <HistoricoEvolucaoModal 
          isOpen={historicoModalOpen}
          onClose={() => setHistoricoModalOpen(false)}
          paciente={pacienteParaHistorico}
        />
      )}
    </>
  );
}
