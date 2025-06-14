
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
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { SistemaCorporal } from '@/types/sistemas';

interface SistemasCorporaisSectionProps {
  sistemasCorporais: SistemaCorporal[];
  handleOpenSistemaModal: () => void;
  handleEditSistema: (sistema: SistemaCorporal) => void;
  handleDeleteSistema: (id: string) => void;
}

const SistemasCorporaisSection: React.FC<SistemasCorporaisSectionProps> = ({
  sistemasCorporais,
  handleOpenSistemaModal,
  handleEditSistema,
  handleDeleteSistema
}) => {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-csae-green-600">Sistemas Corporais</h2>
        <Button variant="outline" size="sm" onClick={handleOpenSistemaModal}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Sistema
        </Button>
      </div>
      <ScrollArea className="h-[200px] w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sistemasCorporais.map(sistema => (
              <TableRow key={sistema.id} className="cursor-pointer hover:bg-gray-100">
                <TableCell className="font-medium">{sistema.nome}</TableCell>
                <TableCell>{sistema.descricao}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEditSistema(sistema)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteSistema(sistema.id || '')}>
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

export default SistemasCorporaisSection;
