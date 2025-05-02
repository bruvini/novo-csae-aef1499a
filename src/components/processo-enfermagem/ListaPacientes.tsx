
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Paciente {
  id: string;
  nome: string;
  dataNascimento: string;
  prontuario: string;
}

interface ListaPacientesProps {
  onSelectPatient: (patientId: string) => void;
}

export function ListaPacientes({ onSelectPatient }: ListaPacientesProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [ordenacao, setOrdenacao] = useState<{ coluna: string; ordem: 'asc' | 'desc' }>({
    coluna: 'nome',
    ordem: 'asc'
  });
  
  const { toast } = useToast();
  
  useEffect(() => {
    const carregarPacientes = async () => {
      try {
        setCarregando(true);
        // TODO: Implementar busca de pacientes do banco de dados
        // Por enquanto, usaremos dados de exemplo
        const dadosExemplo: Paciente[] = [
          { id: '1', nome: 'Ana Silva', dataNascimento: '1980-05-10', prontuario: '123456' },
          { id: '2', nome: 'João Santos', dataNascimento: '1975-12-15', prontuario: '234567' },
          { id: '3', nome: 'Maria Oliveira', dataNascimento: '1990-03-22', prontuario: '345678' },
        ];
        
        setPacientes(dadosExemplo);
      } catch (error) {
        console.error('Erro ao carregar pacientes:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a lista de pacientes.',
          variant: 'destructive',
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarPacientes();
  }, [toast]);
  
  const handleOrdenar = (coluna: string) => {
    setOrdenacao(prev => ({
      coluna,
      ordem: prev.coluna === coluna && prev.ordem === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const pacientesFiltrados = pacientes
    .filter(paciente =>
      paciente.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      paciente.prontuario.includes(termoBusca)
    )
    .sort((a, b) => {
      const { coluna, ordem } = ordenacao;
      let comparacao = 0;
      
      if (coluna === 'nome') {
        comparacao = a.nome.localeCompare(b.nome);
      } else if (coluna === 'dataNascimento') {
        comparacao = a.dataNascimento.localeCompare(b.dataNascimento);
      } else if (coluna === 'prontuario') {
        comparacao = a.prontuario.localeCompare(b.prontuario);
      }
      
      return ordem === 'asc' ? comparacao : -comparacao;
    });
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar por nome ou prontuário..."
            className="pl-9"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
          />
        </div>
        
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Cadastrar Paciente
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleOrdenar('nome')}
                  >
                    Nome
                    {ordenacao.coluna === 'nome' && (
                      ordenacao.ordem === 'asc' ? 
                        <ArrowUp className="ml-2 h-4 w-4 inline" /> : 
                        <ArrowDown className="ml-2 h-4 w-4 inline" />
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleOrdenar('dataNascimento')}
                  >
                    Data de Nascimento
                    {ordenacao.coluna === 'dataNascimento' && (
                      ordenacao.ordem === 'asc' ? 
                        <ArrowUp className="ml-2 h-4 w-4 inline" /> : 
                        <ArrowDown className="ml-2 h-4 w-4 inline" />
                    )}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleOrdenar('prontuario')}
                  >
                    Prontuário
                    {ordenacao.coluna === 'prontuario' && (
                      ordenacao.ordem === 'asc' ? 
                        <ArrowUp className="ml-2 h-4 w-4 inline" /> : 
                        <ArrowDown className="ml-2 h-4 w-4 inline" />
                    )}
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {carregando ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Carregando pacientes...
                    </TableCell>
                  </TableRow>
                ) : pacientesFiltrados.length > 0 ? (
                  pacientesFiltrados.map((paciente) => (
                    <TableRow key={paciente.id}>
                      <TableCell>{paciente.nome}</TableCell>
                      <TableCell>
                        {new Date(paciente.dataNascimento).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{paciente.prontuario}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          onClick={() => onSelectPatient(paciente.id)}
                          className="bg-csae-green-600 hover:bg-csae-green-700"
                        >
                          Iniciar Processo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      Nenhum paciente encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ListaPacientes;
