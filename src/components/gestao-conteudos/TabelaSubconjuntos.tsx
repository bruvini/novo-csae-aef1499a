
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Edit2, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  SubconjuntoEnfermagem, 
  buscarSubconjuntos, 
  buscarTiposSubconjuntos, 
  excluirSubconjunto 
} from '@/services/bancodados/subconjuntosDB';
import ModalDetalhesSubconjunto from './ModalDetalhesSubconjunto';
import ModalConfirmacaoExclusao from './ModalConfirmacaoExclusao';
import ModalCadastroSubconjunto from './ModalCadastroSubconjunto';

const TabelaSubconjuntos = () => {
  const [subconjuntos, setSubconjuntos] = useState<SubconjuntoEnfermagem[]>([]);
  const [tipos, setTipos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  
  // Estados dos modais
  const [modalDetalhes, setModalDetalhes] = useState<{
    open: boolean;
    subconjunto: SubconjuntoEnfermagem | null;
  }>({ open: false, subconjunto: null });
  
  const [modalExclusao, setModalExclusao] = useState<{
    open: boolean;
    subconjunto: SubconjuntoEnfermagem | null;
    loading: boolean;
  }>({ open: false, subconjunto: null, loading: false });
  
  const [modalEdicao, setModalEdicao] = useState<{
    open: boolean;
    subconjunto: SubconjuntoEnfermagem | null;
  }>({ open: false, subconjunto: null });

  const { toast } = useToast();

  // Debounce para busca
  const [debouncedTermoBusca, setDebouncedTermoBusca] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTermoBusca(termoBusca);
    }, 300);

    return () => clearTimeout(timer);
  }, [termoBusca]);

  // Carregar tipos de subconjuntos
  useEffect(() => {
    const carregarTipos = async () => {
      try {
        const tiposEncontrados = await buscarTiposSubconjuntos();
        setTipos(tiposEncontrados);
      } catch (error) {
        console.error('Erro ao carregar tipos:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os tipos de subconjuntos.",
          variant: "destructive",
        });
      }
    };

    carregarTipos();
  }, [toast]);

  // Carregar subconjuntos
  const carregarSubconjuntos = useCallback(async () => {
    try {
      setLoading(true);
      const dados = await buscarSubconjuntos(
        filtroTipo === 'todos' ? undefined : filtroTipo,
        debouncedTermoBusca
      );
      setSubconjuntos(dados);
    } catch (error) {
      console.error('Erro ao carregar subconjuntos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os subconjuntos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, debouncedTermoBusca, toast]);

  useEffect(() => {
    carregarSubconjuntos();
  }, [carregarSubconjuntos]);

  const formatarTipoSubconjunto = (tipo: string) => {
    switch (tipo) {
      case 'nhb':
        return 'NHB';
      case 'Protocolo_Enfermagem':
        return 'Protocolo';
      default:
        return tipo;
    }
  };

  const getCorBadge = (tipo: string) => {
    switch (tipo) {
      case 'nhb':
        return 'bg-blue-100 text-blue-800';
      case 'Protocolo_Enfermagem':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDetalhes = (subconjunto: SubconjuntoEnfermagem) => {
    setModalDetalhes({ open: true, subconjunto });
  };

  const handleEditar = (subconjunto: SubconjuntoEnfermagem) => {
    setModalEdicao({ open: true, subconjunto });
  };

  const handleExcluir = (subconjunto: SubconjuntoEnfermagem) => {
    setModalExclusao({ open: true, subconjunto, loading: false });
  };

  const confirmarExclusao = async () => {
    if (!modalExclusao.subconjunto) return;

    setModalExclusao(prev => ({ ...prev, loading: true }));

    try {
      await excluirSubconjunto(modalExclusao.subconjunto.id);
      
      toast({
        title: "Sucesso",
        description: "Subconjunto excluído com sucesso!",
      });

      // Recarregar lista
      await carregarSubconjuntos();
      
      // Fechar modal
      setModalExclusao({ open: false, subconjunto: null, loading: false });
    } catch (error) {
      console.error('Erro ao excluir subconjunto:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o subconjunto.",
        variant: "destructive",
      });
      setModalExclusao(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSubconjuntoAtualizado = () => {
    carregarSubconjuntos();
    setModalEdicao({ open: false, subconjunto: null });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lista de Subconjuntos</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por título..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {tipos.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>
                      {formatarTipoSubconjunto(tipo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Carregando subconjuntos...</p>
            </div>
          ) : subconjuntos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum subconjunto encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subconjunto</TableHead>
                  <TableHead>Título do Subconjunto</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subconjuntos.map((subconjunto) => (
                  <TableRow key={subconjunto.id}>
                    <TableCell>
                      <Badge className={getCorBadge(subconjunto.tipoSubconjunto)}>
                        {formatarTipoSubconjunto(subconjunto.tipoSubconjunto)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {subconjunto.tituloSubconjunto}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => handleDetalhes(subconjunto)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver detalhes</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8"
                              onClick={() => handleEditar(subconjunto)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleExcluir(subconjunto)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Excluir</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <ModalDetalhesSubconjunto
        subconjunto={modalDetalhes.subconjunto}
        open={modalDetalhes.open}
        onClose={() => setModalDetalhes({ open: false, subconjunto: null })}
      />

      <ModalConfirmacaoExclusao
        open={modalExclusao.open}
        onClose={() => setModalExclusao({ open: false, subconjunto: null, loading: false })}
        onConfirm={confirmarExclusao}
        titulo={modalExclusao.subconjunto?.tituloSubconjunto || ''}
        loading={modalExclusao.loading}
      />

      {modalEdicao.open && modalEdicao.subconjunto && (
        <ModalCadastroSubconjunto
          subconjuntoParaEdicao={modalEdicao.subconjunto}
          onSubconjuntoCadastrado={handleSubconjuntoAtualizado}
          onClose={() => setModalEdicao({ open: false, subconjunto: null })}
        />
      )}
    </>
  );
};

export default TabelaSubconjuntos;
