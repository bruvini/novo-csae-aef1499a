import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Paciente } from '@/types/paciente';
import { useAuth } from '@/contexts/AuthContext';
import { buscarPacientes } from '@/services/bancodados/pacientesDB';
import { Plus, Clock, User } from 'lucide-react';
import ProcessoEnfermagemModal from './ProcessoEnfermagemModal';
import HistoricoProcessosModal from './HistoricoProcessosModal';

interface ListaPacientesProps {
  onPacienteCreate: () => void;
}

const ListaPacientes: React.FC<ListaPacientesProps> = ({ onPacienteCreate }) => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [search, setSearch] = useState('');
  const [showProcessoModal, setShowProcessoModal] = useState(false);
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);

  useEffect(() => {
    if (user) {
      carregarPacientes();
    }
  }, [user]);

  const carregarPacientes = async () => {
    if (user) {
      const pacientesData = await buscarPacientes(user.uid);
      setPacientes(pacientesData);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const pacientesFiltrados = pacientes.filter(paciente => {
    const nomeCompleto = paciente.nomeCompleto || '';
    return nomeCompleto.toLowerCase().includes(search.toLowerCase());
  });

  const handleProcessoClick = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setShowProcessoModal(true);
  };

  const handleHistoricoClick = (paciente: Paciente) => {
    setPacienteSelecionado(paciente);
    setShowHistoricoModal(true);
  };

  const handleProcessoUpdated = () => {
    carregarPacientes();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Input
          type="search"
          placeholder="Buscar paciente..."
          value={search}
          onChange={handleSearch}
          className="max-w-md"
        />
        <Button onClick={onPacienteCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Paciente
        </Button>
      </div>

      <Table>
        <TableCaption>Lista de pacientes cadastrados.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">CPF</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pacientesFiltrados.map((paciente) => (
            <TableRow key={paciente.id}>
              <TableCell className="font-medium">{paciente.cpf}</TableCell>
              <TableCell>{paciente.nomeCompleto}</TableCell>
              <TableCell>{paciente.email}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleProcessoClick(paciente)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Processo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleHistoricoClick(paciente)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Histórico
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal do Processo de Enfermagem */}
      <ProcessoEnfermagemModal
        isOpen={showProcessoModal}
        onClose={() => {
          setShowProcessoModal(false);
          setPacienteSelecionado(null);
        }}
        paciente={pacienteSelecionado!}
        onProcessoUpdated={handleProcessoUpdated}
      />

      {/* Modal do Histórico de Processos */}
      <HistoricoProcessosModal
        isOpen={showHistoricoModal}
        onClose={() => {
          setShowHistoricoModal(false);
          setPacienteSelecionado(null);
        }}
        paciente={pacienteSelecionado!}
      />
    </div>
  );
};

export default ListaPacientes;
