import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, History, Trash2, Play } from 'lucide-react';

import { useAutenticacao } from '@/hooks/useAutenticacao';
import { buscarPacientesPorProfissional, excluirPaciente } from '@/services/bancodados/pacientesDB';
import { Paciente } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface ListaPacientesProps {
  onSelecionarPaciente: (paciente: Paciente) => void;
  isProcessing: boolean;
}

const ListaPacientes: React.FC<ListaPacientesProps> = ({ onSelecionarPaciente, isProcessing }) => {
  const { usuario } = useAutenticacao();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState<Paciente | null>(null);

  const { data: pacientes, isLoading, error } = useQuery({
    queryKey: ['pacientes', usuario?.uid],
    queryFn: () => buscarPacientesPorProfissional(usuario!.uid),
    enabled: !!usuario,
  });

  const { mutate: excluir } = useMutation({
    mutationFn: (id: string) => excluirPaciente(id),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: 'Paciente excluído com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['pacientes', usuario?.uid] });
      setPacienteParaExcluir(null);
    },
    onError: (err) => {
      toast({
        title: 'Erro',
        description: `Não foi possível excluir o paciente: ${err.message}`,
        variant: 'destructive',
      });
      setPacienteParaExcluir(null);
    },
  });

  if (isLoading) {
    return <p>Carregando pacientes...</p>;
  }

  if (error) {
    return <p>Ocorreu um erro ao buscar os pacientes.</p>;
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Paciente</TableHead>
                <TableHead>Evoluções em andamento</TableHead>
                <TableHead>Evoluções Concluídas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pacientes && pacientes.length > 0 ? (
                pacientes.map((paciente) => {
                  const evolucoesEmAndamento = paciente.evolucoes?.filter(e => e.statusEvolucao === 'EM_ANDAMENTO').length || 0;
                  const evolucoesConcluidas = paciente.evolucoes?.filter(e => e.statusEvolucao === 'FINALIZADO').length || 0;

                  return (
                    <TableRow key={paciente.id}>
                      <TableCell className="font-medium">{paciente.nome}</TableCell>
                      <TableCell>{evolucoesEmAndamento}</TableCell>
                      <TableCell>{evolucoesConcluidas}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <Button 
                               size="icon" 
                               onClick={() => onSelecionarPaciente(paciente)}
                               disabled={isProcessing}
                               className={
                                 paciente.statusPaciente === 'NAO_ESTA_CONSULTANDO' 
                                 ? 'bg-green-600 text-white hover:bg-green-700' 
                                 : 'bg-yellow-500 text-white hover:bg-yellow-600'
                               }
                             >
                               {paciente.statusPaciente === 'ESTA_CONSULTANDO' ? (
                                 <Play className="h-4 w-4" />
                               ) : (
                                 <ArrowRight className="h-4 w-4" />
                               )}
                             </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{paciente.statusPaciente === 'ESTA_CONSULTANDO' ? 'Continuar Consulta' : 'Iniciar Consulta'}</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" disabled>
                              <History className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver histórico de consultas</p>
                          </TooltipContent>
                        </Tooltip>
                        <AlertDialog>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="destructive" size="icon" onClick={() => setPacienteParaExcluir(paciente)}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                  <p>Excluir paciente</p>
                              </TooltipContent>
                          </Tooltip>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o paciente "{pacienteParaExcluir?.nome}" e todos os seus dados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setPacienteParaExcluir(null)}>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => pacienteParaExcluir?.id && excluir(pacienteParaExcluir.id)} className="bg-destructive hover:bg-destructive/90">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhum paciente cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};

export default ListaPacientes;
