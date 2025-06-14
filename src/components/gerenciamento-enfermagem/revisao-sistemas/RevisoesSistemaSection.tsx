
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { SistemaCorporal, RevisaoSistema } from '@/types/sistemas';

interface RevisoesSistemaSectionProps {
  revisoesSistema: RevisaoSistema[];
  sistemasCorporais: SistemaCorporal[];
  selectedSistema: string | null;
  setSelectedSistema: (value: string) => void;
  handleOpenRevisaoModal: () => void;
  handleEditRevisao: (revisao: RevisaoSistema) => void;
  handleDeleteRevisao: (id: string) => void;
}

const RevisoesSistemaSection: React.FC<RevisoesSistemaSectionProps> = ({
  revisoesSistema,
  sistemasCorporais,
  selectedSistema,
  setSelectedSistema,
  handleOpenRevisaoModal,
  handleEditRevisao,
  handleDeleteRevisao
}) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-csae-green-600">Revisões de Sistemas</h2>
        <div className="flex gap-2">
          <Select value={selectedSistema || ''} onValueChange={setSelectedSistema}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecione um Sistema" />
            </SelectTrigger>
            <SelectContent>
              {sistemasCorporais.map(sistema => (
                <SelectItem key={sistema.id} value={sistema.id || ''}>
                  {sistema.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleOpenRevisaoModal} disabled={!selectedSistema}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Revisão
          </Button>
        </div>
      </div>
      <ScrollArea className="h-[300px] w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Título</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revisoesSistema
              .filter(revisao => revisao.sistemaId === selectedSistema)
              .map(revisao => (
                <TableRow key={revisao.id} className="cursor-pointer hover:bg-gray-100">
                  <TableCell className="font-medium">{revisao.titulo}</TableCell>
                  <TableCell>{revisao.descricao}</TableCell>
                  <TableCell>{revisao.tipoAlteracao}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditRevisao(revisao)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteRevisao(revisao.id || '')}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </section>
  );
};

export default RevisoesSistemaSection;
