import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Eye, Search, Plus } from "lucide-react";
import { DiagnosticoCompleto, Subconjunto } from "@/services/bancodados/tipos";

interface DiagnosticosTabProps {
  subconjuntos: Subconjunto[];
  diagnosticos: DiagnosticoCompleto[];
  filtroSubconjunto: string;
  filtroDiagnostico: string;
  termoBusca: string;
  setFiltroSubconjunto: React.Dispatch<React.SetStateAction<string>>;
  setFiltroDiagnostico: React.Dispatch<React.SetStateAction<string>>;
  setTermoBusca: React.Dispatch<React.SetStateAction<string>>;
  carregando: boolean;
  abrirModalCriarDiagnostico: () => void;
  abrirModalEditarDiagnostico: (diagnostico: DiagnosticoCompleto) => void;
  abrirModalVisualizarDiagnostico: (diagnostico: DiagnosticoCompleto) => void;
  excluirDiagnostico: (id: string) => void;
  getNomeSubconjunto: (id: string) => string;
  getTipoSubconjunto: (id: string) => string;
}

const DiagnosticosTab = ({
  subconjuntos,
  diagnosticos,
  filtroSubconjunto,
  filtroDiagnostico,
  termoBusca,
  setFiltroSubconjunto,
  setFiltroDiagnostico,
  setTermoBusca,
  carregando,
  abrirModalCriarDiagnostico,
  abrirModalEditarDiagnostico,
  abrirModalVisualizarDiagnostico,
  excluirDiagnostico,
  getNomeSubconjunto,
  getTipoSubconjunto,
}: DiagnosticosTabProps) => {
  // Filtrar diagnósticos baseado nos filtros selecionados
  const getDiagnosticosFiltrados = () => {
    let filtrados = [...diagnosticos];

    // Filtrar por subconjunto
    if (filtroSubconjunto) {
      filtrados = filtrados.filter(
        (d) => d.subconjuntoId === filtroSubconjunto
      );
    }

    // Filtrar por ID específico
    if (filtroDiagnostico) {
      filtrados = filtrados.filter((d) => d.id === filtroDiagnostico);
    }

    // Filtrar por termo de busca
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase().trim();
      filtrados = filtrados.filter((d) => d.nome.toLowerCase().includes(termo));
    }

    return filtrados;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gerenciamento de Diagnósticos de Enfermagem</span>
          <Button
            onClick={abrirModalCriarDiagnostico}
            className="bg-csae-green-600 hover:bg-csae-green-700"
            disabled={subconjuntos.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Diagnóstico
          </Button>
        </CardTitle>
        <CardDescription>
          Cadastre os diagnósticos de enfermagem com seus resultados esperados e
          intervenções.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="filtroSubconjunto" className="mb-2 block">
                Filtrar por Subconjunto
              </Label>
              <Select
                value={filtroSubconjunto || "placeholder"}
                onValueChange={(v) =>
                  setFiltroSubconjunto(v === "placeholder" ? "" : v)
                }
              >
                <SelectTrigger id="filtroSubconjunto">
                  <SelectValue placeholder="Todos os subconjuntos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>
                    Todos os subconjuntos
                  </SelectItem>
                  {subconjuntos.map((subconjunto) => (
                    <SelectItem key={subconjunto.id} value={subconjunto.id!}>
                      {subconjunto.nome} ({subconjunto.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label htmlFor="filtroDiagnostico" className="mb-2 block">
                Filtrar por Diagnóstico
              </Label>
              <Select
                value={filtroDiagnostico || "placeholder"}
                onValueChange={(v) =>
                  setFiltroDiagnostico(v === "placeholder" ? "" : v)
                }
                disabled={filtroSubconjunto === ""}
              >
                <SelectTrigger id="filtroDiagnostico">
                  <SelectValue placeholder="Todos os diagnósticos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>
                    Todos os diagnósticos
                  </SelectItem>
                  {diagnosticos
                    .filter(
                      (d) =>
                        filtroSubconjunto === "" ||
                        d.subconjuntoId === filtroSubconjunto
                    )
                    .map((diagnostico) => (
                      <SelectItem key={diagnostico.id} value={diagnostico.id!}>
                        {diagnostico.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar diagnósticos..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
          </div>
        ) : subconjuntos.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Nenhum subconjunto cadastrado. Cadastre subconjuntos primeiro antes
            de adicionar diagnósticos.
          </div>
        ) : getDiagnosticosFiltrados().length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            {filtroSubconjunto || filtroDiagnostico || termoBusca
              ? "Nenhum diagnóstico encontrado com os filtros aplicados."
              : 'Nenhum diagnóstico cadastrado. Clique em "Novo Diagnóstico" para começar.'}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subconjunto</TableHead>
                <TableHead>Diagnóstico</TableHead>
                <TableHead>Resultados Esperados</TableHead>
                <TableHead>Intervenções</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getDiagnosticosFiltrados().map((diagnostico) => {
                const totalIntervencoes =
                  diagnostico.resultadosEsperados.reduce(
                    (total, resultado) => total + resultado.intervencoes.length,
                    0
                  );

                return (
                  <TableRow key={diagnostico.id}>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          getTipoSubconjunto(diagnostico.subconjuntoId) ===
                          "Protocolo"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {getNomeSubconjunto(diagnostico.subconjuntoId)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {diagnostico.nome}
                    </TableCell>
                    <TableCell>
                      {diagnostico.resultadosEsperados.length}
                    </TableCell>
                    <TableCell>{totalIntervencoes}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-1"
                        onClick={() =>
                          abrirModalVisualizarDiagnostico(diagnostico)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-1"
                        onClick={() => abrirModalEditarDiagnostico(diagnostico)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => excluirDiagnostico(diagnostico.id!)}
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

export default DiagnosticosTab;
