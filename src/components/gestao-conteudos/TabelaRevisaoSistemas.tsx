
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Pencil, Trash2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { SistemaCorporal, escutarSistemas, deleteSistema } from '@/services/bancodados/revisaoSistemasDB';
import ModalVisualizarSistema from './ModalVisualizarSistema';
import FormularioSistema from './FormularioSistema';

const TabelaRevisaoSistemas: React.FC = () => {
  const [sistemas, setSistemas] = useState<SistemaCorporal[]>([]);
  const [sistemasFiltrados, setSistemasFiltrados] = useState<SistemaCorporal[]>([]);
  const [termoBusca, setTermoBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [sistemaVisualizacao, setSistemaVisualizacao] = useState<SistemaCorporal | null>(null);
  const [sistemaEdicao, setSistemaEdicao] = useState<SistemaCorporal | null>(null);
  const [sistemaExclusao, setSistemaExclusao] = useState<SistemaCorporal | null>(null);
  const [modalVisualizacaoOpen, setModalVisualizacaoOpen] = useState(false);
  const [formularioOpen, setFormularioOpen] = useState(false);
  const [alertExclusaoOpen, setAlertExclusaoOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = escutarSistemas((sistemasList) => {
      setSistemas(sistemasList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtrados = sistemas;

    if (termoBusca.trim()) {
      filtrados = filtrados.filter(sistema =>
        sistema.nomeSistema.toLowerCase().includes(termoBusca.toLowerCase())
      );
    }

    setSistemasFiltrados(filtrados);
  }, [sistemas, termoBusca]);

  const handleVisualizar = (sistema: SistemaCorporal) => {
    setSistemaVisualizacao(sistema);
    setModalVisualizacaoOpen(true);
  };

  const handleEditar = (sistema: SistemaCorporal) => {
    setSistemaEdicao(sistema);
    setFormularioOpen(true);
  };

  const handleNovoSistema = () => {
    setSistemaEdicao(null);
    setFormularioOpen(true);
  };

  const handleExcluir = (sistema: SistemaCorporal) => {
    setSistemaExclusao(sistema);
    setAlertExclusaoOpen(true);
  };

  const confirmarExclusao = async () => {
    if (!sistemaExclusao) return;

    try {
      await deleteSistema(sistemaExclusao.id);
      toast.success('Sistema excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir sistema');
    } finally {
      setAlertExclusaoOpen(false);
      setSistemaExclusao(null);
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csae-green-600"></div>
            <span className="ml-2">Carregando sistemas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Revisão de Sistemas</CardTitle>
            <Button onClick={handleNovoSistema}>
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Novo Sistema
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nome do sistema..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Sistema</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Exames</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sistemasFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        {termoBusca ? 'Nenhum sistema encontrado com os filtros aplicados.' : 'Nenhum sistema cadastrado.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    sistemasFiltrados.map((sistema) => (
                      <TableRow key={sistema.id}>
                        <TableCell className="font-medium">
                          {sistema.nomeSistema}
                        </TableCell>
                        <TableCell>
                          <span title={sistema.descricaoSistema}>
                            {truncateText(sistema.descricaoSistema)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {sistema.exames?.length || 0} exames
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleVisualizar(sistema)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditar(sistema)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExcluir(sistema)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <ModalVisualizarSistema
        sistema={sistemaVisualizacao}
        open={modalVisualizacaoOpen}
        onOpenChange={setModalVisualizacaoOpen}
      />

      <FormularioSistema
        sistema={sistemaEdicao}
        open={formularioOpen}
        onOpenChange={setFormularioOpen}
        onSuccess={() => {
          // A lista será atualizada automaticamente pelo listener
        }}
      />

      <AlertDialog open={alertExclusaoOpen} onOpenChange={setAlertExclusaoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o sistema "{sistemaExclusao?.nomeSistema}"? 
              Esta ação não pode ser desfeita e todos os exames e achados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TabelaRevisaoSistemas;
