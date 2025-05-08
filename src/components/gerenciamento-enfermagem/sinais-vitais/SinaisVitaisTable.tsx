
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { SinalVital } from "@/types/sinais-vitais";

interface SinaisVitaisTableProps {
  sinaisVitais: SinalVital[];
  abrirModalEditar: (sinal: SinalVital) => void;
  excluirSinalVital: (id: string) => void;
}

const SinaisVitaisTable: React.FC<SinaisVitaisTableProps> = ({
  sinaisVitais,
  abrirModalEditar,
  excluirSinalVital,
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome do Sinal Vital</TableHead>
          <TableHead>Valores de Referência</TableHead>
          <TableHead>Valores com Alteração</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sinaisVitais.map((sinal) => (
          <TableRow key={sinal.id}>
            <TableCell className="font-medium">{sinal.nome}</TableCell>
            <TableCell>
              {sinal.valoresReferencia ? sinal.valoresReferencia.length : 0} valores configurados
            </TableCell>
            <TableCell>
              {sinal.valoresReferencia
                ? sinal.valoresReferencia.filter(
                    (v) => v.representaAlteracao
                  ).length
                : 0}{" "}
              valores
            </TableCell>
            <TableCell className="text-right">
              <Button
                variant="outline"
                size="sm"
                className="mr-2"
                onClick={() => abrirModalEditar(sinal)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => excluirSinalVital(sinal.id!)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SinaisVitaisTable;
