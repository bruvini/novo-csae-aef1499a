
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, Filter, Plus } from 'lucide-react';
import { Subconjunto } from '@/types/diagnosticos';

interface SubconjuntoTabProps {
  filtroTipoSubconjunto: 'todos' | 'Protocolo' | 'NHB';
  setFiltroTipoSubconjunto: React.Dispatch<React.SetStateAction<'todos' | 'Protocolo' | 'NHB'>>;
  carregando: boolean;
  subconjuntos: Subconjunto[];
  diagnosticos: any[];
  abrirModalCriarSubconjunto: () => void;
  abrirModalEditarSubconjunto: (subconjunto: Subconjunto) => void;
  excluirSubconjunto: (id: string) => void;
}

const SubconjuntoTab = ({
  filtroTipoSubconjunto,
  setFiltroTipoSubconjunto,
  carregando,
  subconjuntos = [], // Provide default empty array
  diagnosticos = [], // Provide default empty array
  abrirModalCriarSubconjunto,
  abrirModalEditarSubconjunto,
  excluirSubconjunto,
}: SubconjuntoTabProps) => {
  
  // Filtrar subconjuntos baseado no tipo selecionado
  const getSubconjuntosFiltrados = () => {
    if (!Array.isArray(subconjuntos)) {
      return [];
    }
    
    if (filtroTipoSubconjunto === 'todos') {
      return subconjuntos;
    } else {
      return subconjuntos.filter(s => s.tipo === filtroTipoSubconjunto);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gerenciamento de Subconjuntos</span>
          <Button onClick={abrirModalCriarSubconjunto} className="bg-csae-green-600 hover:bg-csae-green-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Subconjunto
          </Button>
        </CardTitle>
        <CardDescription>
          Cadastre os subconjuntos (Protocolos e NHBs) para organizar os diagnósticos de enfermagem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Label>Filtrar por tipo:</Label>
          <Select value={filtroTipoSubconjunto} onValueChange={(v) => setFiltroTipoSubconjunto(v as 'todos' | 'Protocolo' | 'NHB')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione um tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Protocolo">Protocolo</SelectItem>
              <SelectItem value="NHB">NHB</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
          </div>
        ) : getSubconjuntosFiltrados().length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            {filtroTipoSubconjunto !== 'todos' 
              ? `Nenhum subconjunto do tipo ${filtroTipoSubconjunto} cadastrado.` 
              : 'Nenhum subconjunto cadastrado. Clique em "Novo Subconjunto" para começar.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Subconjunto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Diagnósticos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getSubconjuntosFiltrados().map((subconjunto) => {
                const diagnosticosDoSubconjunto = Array.isArray(diagnosticos) 
                  ? diagnosticos.filter(d => d.subconjuntoId === subconjunto.id)
                  : [];
                return (
                  <TableRow key={subconjunto.id}>
                    <TableCell className="font-medium">{subconjunto.nome}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        subconjunto.tipo === 'Protocolo' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {subconjunto.tipo}
                      </span>
                    </TableCell>
                    <TableCell>{subconjunto.descricao || '-'}</TableCell>
                    <TableCell>{diagnosticosDoSubconjunto.length}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => abrirModalEditarSubconjunto(subconjunto)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => excluirSubconjunto(subconjunto.id!)}
                        disabled={diagnosticosDoSubconjunto.length > 0}
                        title={diagnosticosDoSubconjunto.length > 0 ? "Não é possível excluir subconjuntos com diagnósticos vinculados" : ""}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default SubconjuntoTab;
