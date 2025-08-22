import React, { useState, useEffect, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Trash2, Play, History } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from '@/contexts/AuthContext';
import { Paciente, StatusPaciente, determinarStatusPaciente } from '@/types/paciente';
import ProcessoEnfermagemModal from './ProcessoEnfermagemModal';
import ModalEditarPaciente from './ModalEditarPaciente';
import { excluirPaciente, buscarPacientesUsuario } from '@/services/bancodados/pacientesDB';
import HistoricoProcessosModal from './HistoricoProcessosModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase';

const ListaPacientes: React.FC = () => {
  const [tableData, setTableData] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [processoModalOpen, setProcessoModalOpen] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pacienteParaEditar, setPacienteParaEditar] = useState<Paciente | null>(null);
  const [excluirLoading, setExcluirLoading] = useState(false);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const [pacienteSelecionadoHistorico, setPacienteSelecionadoHistorico] = useState<Paciente | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Função para carregar pacientes em tempo real
  useEffect(() => {
    if (!user?.uid) {
      setTableData([]);
      setLoading(false);
      return;
    }

    console.log('Configurando listener para pacientes do usuário:', user.uid);
    
    const q = query(
      collection(db, 'pacientesProcessoEnfermagem'),
      where('uidUsuario', '==', user.uid),
      orderBy('dataCadastro', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        console.log('Snapshot recebido, documentos encontrados:', querySnapshot.size);
        const pacientes: Paciente[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Documento encontrado:', doc.id, data);
          pacientes.push({
            id: doc.id,
            ...data
          } as Paciente);
        });
        setTableData(pacientes);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao escutar mudanças nos pacientes:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar pacientes. Tente recarregar a página.",
          variant: "destructive",
        });
        setLoading(false);
      }
    );

    return () => {
      console.log('Removendo listener de pacientes');
      unsubscribe();
    };
  }, [user?.uid, toast]);

  const handleAbrirProcesso = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setProcessoModalOpen(true);
  };

  const handleEditarPaciente = (paciente: Paciente) => {
    setPacienteParaEditar(paciente);
    setEditModalOpen(true);
  };

  const handleExcluirClick = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setShowDeleteAlert(true);
  };

  const handleDeleteConfirm = async () => {
    if (!pacienteSelecionado?.id) return;

    setExcluirLoading(true);
    try {
      await excluirPaciente(pacienteSelecionado.id);
      toast({
        title: "Sucesso",
        description: "Paciente excluído com sucesso!",
      });
      setShowDeleteAlert(false);
      setPacienteSelecionado(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir paciente.",
        variant: "destructive",
      });
    } finally {
      setExcluirLoading(false);
    }
  };

  const handleVisualizarHistorico = (paciente: Paciente) => {
    setPacienteSelecionadoHistorico(paciente);
    setHistoricoModalOpen(true);
  };

  const [columnVisibility, setColumnVisibility] = React.useState({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<Paciente>[] = useMemo(
    () => [
      {
        accessorKey: "nomeCompleto",
        header: "Nome",
      },
      {
        accessorKey: "dataNascimento",
        header: "Nascimento",
        cell: ({ row }) => {
          const dataNascimento = row.original.dataNascimento;
          if (dataNascimento && typeof (dataNascimento as any).toDate === 'function') {
            const data = (dataNascimento as any).toDate();
            return data.toLocaleDateString('pt-BR');
          }
          return 'Data Inválida';
        },
      },
      {
        accessorKey: "sexo",
        header: "Sexo",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const paciente = row.original;
          const status = determinarStatusPaciente(paciente);
          return (
            <div className="w-fit">
              {status}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const paciente = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => handleAbrirProcesso(paciente)}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {determinarStatusPaciente(paciente) === 'Em andamento' ? 'Continuar Processo' : 'Iniciar Processo'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleVisualizarHistorico(paciente)}
                >
                  <History className="mr-2 h-4 w-4" />
                  Visualizar Histórico
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleEditarPaciente(paciente)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExcluirClick(paciente)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      columnVisibility,
      rowSelection,
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-muted-foreground">Carregando pacientes...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum paciente cadastrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} de {tableData.length} pacientes
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>

      {/* Processo Modal */}
      {pacienteSelecionado && (
        <ProcessoEnfermagemModal
          isOpen={processoModalOpen}
          onClose={() => setProcessoModalOpen(false)}
          paciente={pacienteSelecionado}
          onProcessoUpdated={() => {}} // Os dados já são atualizados em tempo real
        />
      )}

      {/* Edit Modal */}
      {pacienteParaEditar && (
        <ModalEditarPaciente
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          paciente={pacienteParaEditar}
          onPacienteAtualizado={() => {}} // Os dados já são atualizados em tempo real
        />
      )}
      
      {/* Delete Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este paciente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteAlert(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={excluirLoading}>
              {excluirLoading ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Histórico Modal */}
      {pacienteSelecionadoHistorico && (
        <HistoricoProcessosModal
          isOpen={historicoModalOpen}
          onClose={() => {
            setHistoricoModalOpen(false);
            setPacienteSelecionadoHistorico(null);
          }}
          paciente={pacienteSelecionadoHistorico}
        />
      )}
    </div>
  );
};

export default ListaPacientes;
