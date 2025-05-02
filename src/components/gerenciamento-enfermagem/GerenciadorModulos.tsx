
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ModuloDisponivel } from '@/types/modulos';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';

// Dummy function to create a module, replace with real implementation
const criarModulo = async (modulo: Omit<ModuloDisponivel, "id">) => {
  console.log("Creating module:", modulo);
  return { ...modulo, id: Math.random().toString(36).substring(2, 9) };
};

// Dummy function to update a module, replace with real implementation
const atualizarModulo = async (id: string, modulo: Partial<ModuloDisponivel>) => {
  console.log("Updating module:", id, modulo);
  return true;
};

// Dummy function to delete a module, replace with real implementation
const excluirModulo = async (id: string) => {
  console.log("Deleting module:", id);
  return true;
};

const GerenciadorModulos = () => {
  const { toast } = useToast();
  const [moduloSelecionado, setModuloSelecionado] = useState<ModuloDisponivel | null>(null);
  const [novoModulo, setNovoModulo] = useState<Partial<ModuloDisponivel>>({
    titulo: '',
    descricao: '',
    nome: '',
    link: '',
    icone: 'Box',
    ativo: true,
    visibilidade: 'todos',
    ordem: 0,
    categoria: 'clinico',
    exibirDashboard: true,
    exibirNavbar: true
  });
  const [modulos, setModulos] = useState<ModuloDisponivel[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [filtro, setFiltro] = useState('todos');
  const [buscaTexto, setBuscaTexto] = useState('');

  useEffect(() => {
    carregarModulos();
  }, []);

  const carregarModulos = async () => {
    try {
      // Replace with actual loading from Firebase
      const modulosCarregados = [
        {
          id: '1',
          titulo: 'Processo de Enfermagem',
          descricao: 'Registrar e monitorar o processo de enfermagem',
          nome: 'Processo',
          link: '/processo-enfermagem',
          icone: 'Clipboard',
          ativo: true,
          visibilidade: 'todos' as 'todos',
          ordem: 1,
          categoria: 'clinico' as 'clinico',
          exibirDashboard: true,
          exibirNavbar: true,
        },
        {
          id: '2',
          titulo: 'Protocolos de Enfermagem',
          descricao: 'Consultar protocolos de enfermagem',
          nome: 'Protocolos',
          link: '/protocolos',
          icone: 'FileText',
          ativo: true,
          visibilidade: 'todos' as 'todos',
          ordem: 2,
          categoria: 'clinico' as 'clinico',
          exibirDashboard: true,
          exibirNavbar: true,
        }
      ];
      setModulos(modulosCarregados);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os módulos',
        variant: 'destructive',
      });
    }
  };

  const handleNovoModulo = () => {
    setNovoModulo({
      titulo: '',
      descricao: '',
      nome: '',
      link: '',
      icone: 'Box',
      ativo: true,
      visibilidade: 'todos',
      ordem: modulos.length + 1,
      categoria: 'clinico',
      exibirDashboard: true,
      exibirNavbar: true
    });
    setModoEdicao(false);
    setModalAberto(true);
  };

  const handleEditarModulo = (modulo: ModuloDisponivel) => {
    setNovoModulo({ ...modulo });
    setModuloSelecionado(modulo);
    setModoEdicao(true);
    setModalAberto(true);
  };

  const handleExcluirModulo = (modulo: ModuloDisponivel) => {
    setModuloSelecionado(modulo);
    setModalConfirmacao(true);
  };

  const confirmarExclusao = async () => {
    if (!moduloSelecionado) return;

    try {
      await excluirModulo(moduloSelecionado.id || '');
      setModulos(modulos.filter((m) => m.id !== moduloSelecionado.id));
      toast({
        title: 'Módulo excluído',
        description: 'O módulo foi excluído com sucesso',
      });
      setModalConfirmacao(false);
    } catch (error) {
      console.error('Erro ao excluir módulo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o módulo',
        variant: 'destructive',
      });
    }
  };

  const salvarModulo = async () => {
    // Validate required fields
    if (!novoModulo.titulo || !novoModulo.nome || !novoModulo.link) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (modoEdicao && moduloSelecionado) {
        await atualizarModulo(moduloSelecionado.id || '', novoModulo);
        setModulos(
          modulos.map((m) => (m.id === moduloSelecionado.id ? { ...m, ...novoModulo } as ModuloDisponivel : m))
        );
        toast({
          title: 'Módulo atualizado',
          description: 'O módulo foi atualizado com sucesso',
        });
      } else {
        const moduloCriado = await criarModulo(novoModulo as Required<Omit<ModuloDisponivel, 'id'>>);
        setModulos([...modulos, moduloCriado]);
        toast({
          title: 'Módulo criado',
          description: 'O novo módulo foi criado com sucesso',
        });
      }
      setModalAberto(false);
    } catch (error) {
      console.error('Erro ao salvar módulo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o módulo',
        variant: 'destructive',
      });
    }
  };

  const alternarAtivoModulo = async (modulo: ModuloDisponivel) => {
    try {
      await atualizarModulo(modulo.id || '', { ativo: !modulo.ativo });
      setModulos(
        modulos.map((m) => (m.id === modulo.id ? { ...m, ativo: !m.ativo } as ModuloDisponivel : m))
      );
      toast({
        title: modulo.ativo ? 'Módulo desativado' : 'Módulo ativado',
        description: `O módulo foi ${modulo.ativo ? 'desativado' : 'ativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao alterar status do módulo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status do módulo',
        variant: 'destructive',
      });
    }
  };

  const alterarOrdem = async (modulo: ModuloDisponivel, direcao: 'up' | 'down') => {
    const novaOrdem = [...modulos];
    const index = novaOrdem.findIndex((m) => m.id === modulo.id);
    
    if (
      (direcao === 'up' && index === 0) ||
      (direcao === 'down' && index === novaOrdem.length - 1)
    ) {
      return;
    }

    const novoIndex = direcao === 'up' ? index - 1 : index + 1;
    const temp = novaOrdem[novoIndex];
    novaOrdem[novoIndex] = novaOrdem[index];
    novaOrdem[index] = temp;

    // Update ordem values
    novaOrdem.forEach((m, i) => {
      m.ordem = i + 1;
    });

    try {
      // Update all modules with new ordem
      await Promise.all(
        novaOrdem.map((m) => atualizarModulo(m.id || '', { ordem: m.ordem }))
      );
      setModulos(novaOrdem);
    } catch (error) {
      console.error('Erro ao alterar ordem dos módulos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a ordem dos módulos',
        variant: 'destructive',
      });
    }
  };

  const modulosFiltrados = modulos
    .filter((modulo) => {
      if (filtro === 'todos') return true;
      if (filtro === 'ativos') return modulo.ativo;
      if (filtro === 'inativos') return !modulo.ativo;
      if (filtro === 'clinico') return modulo.categoria === 'clinico';
      if (filtro === 'educacional') return modulo.categoria === 'educacional';
      if (filtro === 'gestao') return modulo.categoria === 'gestao';
      return true;
    })
    .filter((modulo) => {
      if (!buscaTexto) return true;
      return (
        modulo.titulo.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        modulo.descricao.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        modulo.nome.toLowerCase().includes(buscaTexto.toLowerCase())
      );
    })
    .sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Buscar módulos..."
            value={buscaTexto}
            onChange={(e) => setBuscaTexto(e.target.value)}
            className="w-64"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filtrar módulos</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => setFiltro('todos')}>
                  {filtro === 'todos' && <Check className="h-4 w-4 mr-2" />}
                  Todos os módulos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFiltro('ativos')}>
                  {filtro === 'ativos' && <Check className="h-4 w-4 mr-2" />}
                  Módulos ativos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFiltro('inativos')}>
                  {filtro === 'inativos' && <Check className="h-4 w-4 mr-2" />}
                  Módulos inativos
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Por categoria</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFiltro('clinico')}>
                {filtro === 'clinico' && <Check className="h-4 w-4 mr-2" />}
                Clínico
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFiltro('educacional')}>
                {filtro === 'educacional' && <Check className="h-4 w-4 mr-2" />}
                Educacional
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFiltro('gestao')}>
                {filtro === 'gestao' && <Check className="h-4 w-4 mr-2" />}
                Gestão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button onClick={handleNovoModulo}>
          <Plus className="h-4 w-4 mr-1" />
          Novo Módulo
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {modulosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum módulo encontrado com os filtros aplicados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visibilidade</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modulosFiltrados.map((modulo) => (
                  <TableRow key={modulo.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="w-6 text-center">{modulo.ordem}</span>
                        <div className="flex flex-col ml-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => alterarOrdem(modulo, 'up')}
                            disabled={modulo.ordem === 1}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => alterarOrdem(modulo, 'down')}
                            disabled={modulo.ordem === modulosFiltrados.length}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{modulo.titulo}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {modulo.descricao}
                    </TableCell>
                    <TableCell className="text-blue-600">
                      <a href={modulo.link} target="_blank" rel="noreferrer">
                        {modulo.link}
                      </a>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          modulo.ativo
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {modulo.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>{modulo.visibilidade}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditarModulo(modulo)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => alternarAtivoModulo(modulo)}
                          >
                            {modulo.ativo ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleExcluirModulo(modulo)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {modoEdicao ? 'Editar Módulo' : 'Novo Módulo'}
            </DialogTitle>
            <DialogDescription>
              {modoEdicao
                ? 'Edite as informações do módulo existente.'
                : 'Preencha os dados para criar um novo módulo.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titulo">Título*</Label>
                <Input
                  id="titulo"
                  value={novoModulo.titulo || ''}
                  onChange={(e) =>
                    setNovoModulo({ ...novoModulo, titulo: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="nome">Nome Interno*</Label>
                <Input
                  id="nome"
                  value={novoModulo.nome || ''}
                  onChange={(e) =>
                    setNovoModulo({ ...novoModulo, nome: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Descrição*</Label>
              <Input
                id="descricao"
                value={novoModulo.descricao || ''}
                onChange={(e) =>
                  setNovoModulo({ ...novoModulo, descricao: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="link">Link*</Label>
              <Input
                id="link"
                value={novoModulo.link || ''}
                onChange={(e) =>
                  setNovoModulo({ ...novoModulo, link: e.target.value })
                }
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={novoModulo.categoria || 'clinico'}
                  onValueChange={(value) =>
                    setNovoModulo({
                      ...novoModulo,
                      categoria: value as 'clinico' | 'educacional' | 'gestao',
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinico">Clínico</SelectItem>
                    <SelectItem value="educacional">Educacional</SelectItem>
                    <SelectItem value="gestao">Gestão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="visibilidade">Visibilidade</Label>
                <Select
                  value={novoModulo.visibilidade || 'todos'}
                  onValueChange={(value) =>
                    setNovoModulo({
                      ...novoModulo,
                      visibilidade: value as 'admin' | 'sms' | 'todos',
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione a visibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os usuários</SelectItem>
                    <SelectItem value="admin">
                      Apenas administradores
                    </SelectItem>
                    <SelectItem value="sms">
                      Apenas usuários da SMS
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="icone">Ícone</Label>
                <Select
                  value={novoModulo.icone || 'Box'}
                  onValueChange={(value) =>
                    setNovoModulo({
                      ...novoModulo,
                      icone: value,
                    })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o ícone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="FileText">FileText</SelectItem>
                    <SelectItem value="Clipboard">Clipboard</SelectItem>
                    <SelectItem value="Users">Users</SelectItem>
                    <SelectItem value="Calendar">Calendar</SelectItem>
                    <SelectItem value="BarChart">BarChart</SelectItem>
                    <SelectItem value="BookOpen">BookOpen</SelectItem>
                    <SelectItem value="FileType">FileType</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="ordem">Ordem</Label>
                <Input
                  id="ordem"
                  type="number"
                  min="1"
                  value={novoModulo.ordem || 1}
                  onChange={(e) =>
                    setNovoModulo({
                      ...novoModulo,
                      ordem: parseInt(e.target.value) || 1,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="exibirDashboard"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={novoModulo.exibirDashboard || false}
                  onChange={(e) =>
                    setNovoModulo({
                      ...novoModulo,
                      exibirDashboard: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="exibirDashboard">
                  Exibir no Dashboard
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="exibirNavbar"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={novoModulo.exibirNavbar || false}
                  onChange={(e) =>
                    setNovoModulo({
                      ...novoModulo,
                      exibirNavbar: e.target.checked,
                    })
                  }
                />
                <Label htmlFor="exibirNavbar">
                  Exibir na Barra de Navegação
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ativo"
                className="h-4 w-4 rounded border-gray-300"
                checked={novoModulo.ativo}
                onChange={(e) =>
                  setNovoModulo({
                    ...novoModulo,
                    ativo: e.target.checked,
                  })
                }
              />
              <Label htmlFor="ativo">Módulo ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarModulo}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modalConfirmacao} onOpenChange={setModalConfirmacao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmação de exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o módulo{' '}
              <strong>{moduloSelecionado?.titulo}</strong>? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalConfirmacao(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarExclusao}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciadorModulos;
