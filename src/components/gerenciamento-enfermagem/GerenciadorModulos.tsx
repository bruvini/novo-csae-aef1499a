
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Save, Trash2, X, Eye, EyeOff, Menu, LayoutDashboard } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ModuloDisponivel } from '@/types/modulos';
import { buscarModulosDisponiveis, adicionarModulo, atualizarModulo, removerModulo } from '@/services/bancodados/modulosDB';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';

// Lista de ícones disponíveis do Lucide
const availableIcons = [
  'LayoutDashboard', 'FileText', 'ClipboardCheck', 'BookOpen', 'Newspaper', 'Lightbulb', 
  'Info', 'HelpCircle', 'Users', 'Settings', 'Clock', 'Calendar', 'CheckCircle',
  'AlertCircle', 'AlertTriangle', 'Archive', 'ArrowRight', 'Award', 'BarChart',
  'Bell', 'Bookmark', 'Book', 'Briefcase', 'Calculator', 'Camera', 'Check',
  'Clipboard', 'Code', 'Coffee', 'Cog', 'Command', 'Compass', 'Copy', 'CreditCard',
  'Database', 'Download', 'Edit', 'ExternalLink', 'Eye', 'EyeOff', 'File', 'FileText',
  'Film', 'Filter', 'Flag', 'Folder', 'Gift', 'Globe', 'Grid', 'Hash', 'Heart',
  'Home', 'Image', 'Inbox', 'Link', 'List', 'Lock', 'Mail', 'Map', 'MapPin',
  'Menu', 'MessageCircle', 'MessageSquare', 'Mic', 'Monitor', 'Moon', 'MoreHorizontal',
  'MoreVertical', 'Package', 'Paperclip', 'Pause', 'Phone', 'Play', 'Plus',
  'Power', 'Printer', 'Radio', 'RefreshCw', 'Repeat', 'Save', 'Scissors', 'Search',
  'Send', 'Server', 'Share', 'Shield', 'ShoppingBag', 'ShoppingCart', 'Shuffle',
  'Slash', 'Sliders', 'Smartphone', 'Smile', 'Speaker', 'Star', 'StopCircle', 'Sun',
  'Sunrise', 'Sunset', 'Tablet', 'Tag', 'Target', 'Terminal', 'ThumbsDown', 'ThumbsUp',
  'Toggle', 'Tool', 'Trash', 'Trash2', 'TrendingDown', 'TrendingUp', 'Truck', 'Tv',
  'Type', 'Umbrella', 'Unlock', 'Upload', 'User', 'UserCheck', 'UserMinus', 'UserPlus',
  'UserX', 'Video', 'Voicemail', 'Volume', 'VolumeMute', 'Watch', 'Wifi', 'ZapOff', 'Zap'
];

const GerenciadorModulos = () => {
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(true);
  const [modulos, setModulos] = useState<ModuloDisponivel[]>([]);
  const [moduloSelecionado, setModuloSelecionado] = useState<ModuloDisponivel | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [excluirDialogoAberto, setExcluirDialogoAberto] = useState(false);
  const [barraDeBuscaAberta, setBarraDeBuscaAberta] = useState(false);
  const [termoDeBusca, setTermoDeBusca] = useState('');
  const [selectedIconTab, setSelectedIconTab] = useState('popular');
  const [searchIconTerm, setSearchIconTerm] = useState('');

  // Novo módulo - valores padrão
  const novoModuloPadrao = {
    nome: '',
    titulo: '',
    slug: '',
    descricao: '',
    ativo: true,
    categoria: 'clinico' as const,
    ordem: 1000,
    icone: 'FileText',
    visibilidade: 'todos' as const,
    exibirNoDashboard: true,
    exibirNavbar: true
  };

  // Carregar módulos
  const carregarModulos = async () => {
    setCarregando(true);
    try {
      const modulosData = await buscarModulosDisponiveis();
      setModulos(modulosData);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os módulos.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarModulos();
  }, []);

  // Abrir formulário para edição ou criação
  const abrirForm = (modulo?: ModuloDisponivel) => {
    if (modulo) {
      setModuloSelecionado(modulo);
    } else {
      setModuloSelecionado(novoModuloPadrao);
    }
    setFormAberto(true);
  };

  // Fechar formulário
  const fecharForm = () => {
    setFormAberto(false);
    setModuloSelecionado(null);
  };

  // Atualizar campo do módulo
  const atualizarCampoModulo = (campo: keyof ModuloDisponivel, valor: any) => {
    if (moduloSelecionado) {
      setModuloSelecionado({
        ...moduloSelecionado,
        [campo]: valor,
      });
    }
  };

  // Salvar módulo
  const salvarModulo = async () => {
    if (!moduloSelecionado) return;
    
    if (!moduloSelecionado.nome || !moduloSelecionado.titulo || !moduloSelecionado.slug) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome interno, o título e o slug do módulo.',
        variant: 'destructive',
      });
      return;
    }

    // Garantir que o slug comece com barra
    let slug = moduloSelecionado.slug;
    if (!slug.startsWith('/')) {
      slug = '/' + slug;
    }

    setCarregando(true);
    
    try {
      // Se tem ID, atualiza
      if (moduloSelecionado.id) {
        const { id, ...dadosAtualizados } = moduloSelecionado;
        dadosAtualizados.slug = slug;
        const sucesso = await atualizarModulo(id, dadosAtualizados);
        
        if (sucesso) {
          toast({
            title: 'Módulo atualizado',
            description: `O módulo "${moduloSelecionado.titulo}" foi atualizado com sucesso.`,
          });
          
          // Atualiza a lista localmente
          setModulos(modulos.map(m => 
            m.id === moduloSelecionado.id ? {...moduloSelecionado, slug} : m
          ));
        } else {
          throw new Error('Falha ao atualizar módulo');
        }
      } 
      // Caso contrário, adiciona novo
      else {
        const novoModulo = {
          ...moduloSelecionado,
          slug
        };
        const novoId = await adicionarModulo(novoModulo);
        
        if (novoId) {
          toast({
            title: 'Módulo adicionado',
            description: `O módulo "${moduloSelecionado.titulo}" foi adicionado com sucesso.`,
          });
          
          // Adiciona à lista local
          setModulos([...modulos, { ...novoModulo, id: novoId }]);
        } else {
          throw new Error('Falha ao adicionar módulo');
        }
      }
      
      fecharForm();
    } catch (error) {
      console.error('Erro ao salvar módulo:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o módulo.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  // Alternar estado do módulo (ativo/inativo)
  const alternarEstadoModulo = async (modulo: ModuloDisponivel) => {
    setCarregando(true);
    
    try {
      const novoEstado = !modulo.ativo;
      const sucesso = await atualizarModulo(modulo.id!, { ativo: novoEstado });
      
      if (sucesso) {
        // Atualiza a lista local
        setModulos(modulos.map(m => 
          m.id === modulo.id ? { ...m, ativo: novoEstado } : m
        ));
        
        toast({
          title: novoEstado ? 'Módulo ativado' : 'Módulo desativado',
          description: `O módulo "${modulo.titulo}" foi ${novoEstado ? 'ativado' : 'desativado'} com sucesso.`,
        });
      } else {
        throw new Error('Falha ao atualizar estado do módulo');
      }
    } catch (error) {
      console.error('Erro ao alternar estado do módulo:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao alterar o estado do módulo.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  // Confirmar exclusão
  const confirmarExclusao = (modulo: ModuloDisponivel) => {
    setModuloSelecionado(modulo);
    setExcluirDialogoAberto(true);
  };

  // Excluir módulo
  const excluirModulo = async () => {
    if (!moduloSelecionado?.id) return;
    
    setCarregando(true);
    
    try {
      const sucesso = await removerModulo(moduloSelecionado.id);
      
      if (sucesso) {
        // Remove da lista local
        setModulos(modulos.filter(m => m.id !== moduloSelecionado.id));
        
        toast({
          title: 'Módulo excluído',
          description: `O módulo "${moduloSelecionado.titulo}" foi excluído com sucesso.`,
        });
      } else {
        throw new Error('Falha ao excluir módulo');
      }
    } catch (error) {
      console.error('Erro ao excluir módulo:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir o módulo.',
        variant: 'destructive',
      });
    } finally {
      setExcluirDialogoAberto(false);
      setModuloSelecionado(null);
      setCarregando(false);
    }
  };

  // Filtrar módulos pela busca
  const modulosFiltrados = modulos.filter(modulo =>
    modulo.titulo.toLowerCase().includes(termoDeBusca.toLowerCase()) ||
    modulo.descricao.toLowerCase().includes(termoDeBusca.toLowerCase()) ||
    modulo.nome.toLowerCase().includes(termoDeBusca.toLowerCase())
  );

  // Filtrar ícones pela busca
  const filteredIcons = availableIcons.filter(icon => 
    icon.toLowerCase().includes(searchIconTerm.toLowerCase())
  );

  // Ícones populares para a primeira tab
  const popularIcons = [
    'LayoutDashboard', 'FileText', 'ClipboardCheck', 'BookOpen', 'Newspaper', 
    'Lightbulb', 'Info', 'HelpCircle', 'Users', 'Settings', 'Calendar', 
    'CheckCircle', 'AlertCircle', 'BarChart', 'Search', 'Link', 'Home'
  ];

  // Renderizar ícone dinâmico
  const renderIcon = (iconName: string, size = 16) => {
    // @ts-ignore - Ignorar erro de tipagem para acessar dinamicamente os ícones
    const IconComponent = LucideIcons[iconName];
    return IconComponent ? <IconComponent size={size} /> : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-csae-green-700">
          Gerenciamento de Módulos do Sistema
        </h2>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => abrirForm()} className="bg-csae-green-600 hover:bg-csae-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Módulo
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modulosFiltrados.map((modulo) => (
          <Card 
            key={modulo.id} 
            className={`hover:shadow-md transition-shadow border-l-4 ${
              modulo.ativo ? 'border-l-green-500' : 'border-l-gray-300'
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                  {renderIcon(modulo.icone || 'FileText')}
                  <span className="truncate">{modulo.titulo}</span>
                </div>
                <Switch 
                  checked={modulo.ativo} 
                  onCheckedChange={() => alternarEstadoModulo(modulo)}
                  disabled={carregando}
                  className="ml-2"
                />
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Nome interno: {modulo.nome} | Slug: {modulo.slug}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">{modulo.descricao || 'Sem descrição'}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className={`px-2 py-1 text-xs ${
                  modulo.categoria === 'clinico' ? 'bg-green-100 text-green-700' :
                  modulo.categoria === 'educacional' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {modulo.categoria === 'clinico' ? 'Clínico' :
                   modulo.categoria === 'educacional' ? 'Educacional' :
                   'Gestão'}
                </Badge>
                
                <Badge variant="outline" className="px-2 py-1 text-xs bg-gray-100 text-gray-700">
                  Ordem: {modulo.ordem}
                </Badge>
                
                <Badge variant="outline" className={`px-2 py-1 text-xs ${
                  modulo.visibilidade === 'todos' ? 'bg-green-100 text-green-700' :
                  modulo.visibilidade === 'admin' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {modulo.visibilidade === 'todos' ? 'Todos' :
                   modulo.visibilidade === 'admin' ? 'Somente Admin' :
                   'Somente SMS'}
                </Badge>
              </div>
              
              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-4">
                {modulo.exibirNoDashboard && (
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                    <LayoutDashboard className="h-3 w-3" /> Dashboard
                  </div>
                )}
                
                {modulo.exibirNavbar && (
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                    <Menu className="h-3 w-3" /> Navbar
                  </div>
                )}
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => abrirForm(modulo)}
                  disabled={carregando}
                >
                  Editar
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => confirmarExclusao(modulo)}
                  disabled={carregando}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {modulos.length === 0 && !carregando && (
          <div className="col-span-full p-8 text-center border rounded-lg border-dashed">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <h3 className="text-lg font-medium mb-1">Nenhum módulo cadastrado</h3>
            <p className="text-gray-500 mb-4">
              Adicione módulos para gerenciar a disponibilidade das páginas do sistema.
            </p>
            <Button onClick={() => abrirForm()} className="bg-csae-green-600 hover:bg-csae-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Módulo
            </Button>
          </div>
        )}
      </div>
      
      {/* Formulário de Edição/Criação */}
      <Sheet open={formAberto} onOpenChange={setFormAberto}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{moduloSelecionado?.id ? 'Editar Módulo' : 'Adicionar Módulo'}</SheetTitle>
            <SheetDescription>
              Preencha os campos abaixo para {moduloSelecionado?.id ? 'editar o' : 'adicionar um novo'} módulo.
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="h-[80vh] pr-4">
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome interno*</Label>
                <Input
                  id="nome"
                  value={moduloSelecionado?.nome || ''}
                  onChange={(e) => atualizarCampoModulo('nome', e.target.value)}
                  placeholder="Ex: minicurso-cipe"
                />
                <p className="text-xs text-gray-500">
                  Identificador único usado internamente.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="titulo">Título*</Label>
                <Input
                  id="titulo"
                  value={moduloSelecionado?.titulo || ''}
                  onChange={(e) => atualizarCampoModulo('titulo', e.target.value)}
                  placeholder="Ex: Minicurso CIPE"
                />
                <p className="text-xs text-gray-500">
                  Nome de exibição do módulo.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)*</Label>
                <Input
                  id="slug"
                  value={moduloSelecionado?.slug || ''}
                  onChange={(e) => atualizarCampoModulo('slug', e.target.value)}
                  placeholder="Ex: /minicurso-cipe"
                />
                <p className="text-xs text-gray-500">
                  Caminho da URL para acesso ao módulo. Ex: /pops, /minicurso-cipe
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Ícone</Label>
                
                <div className="border rounded-md p-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Selecionado:</span>
                      {renderIcon(moduloSelecionado?.icone || 'FileText')}
                      <span>{moduloSelecionado?.icone || 'FileText'}</span>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="popular" value={selectedIconTab} onValueChange={setSelectedIconTab}>
                    <TabsList className="mb-2">
                      <TabsTrigger value="popular">Populares</TabsTrigger>
                      <TabsTrigger value="all">Todos</TabsTrigger>
                      <TabsTrigger value="search">Buscar</TabsTrigger>
                    </TabsList>
                    
                    {selectedIconTab === 'search' && (
                      <Input
                        placeholder="Buscar ícones..."
                        value={searchIconTerm}
                        onChange={(e) => setSearchIconTerm(e.target.value)}
                        className="mb-2"
                      />
                    )}
                    
                    <TabsContent value="popular" className="mt-0">
                      <div className="grid grid-cols-6 gap-2">
                        {popularIcons.map((icon) => (
                          <Button
                            key={icon}
                            variant="outline"
                            size="sm"
                            className={`p-2 h-auto flex flex-col items-center gap-1 ${moduloSelecionado?.icone === icon ? 'bg-csae-green-50 border-csae-green-300' : ''}`}
                            onClick={() => atualizarCampoModulo('icone', icon)}
                          >
                            {renderIcon(icon)}
                            <span className="text-[10px] truncate w-full text-center">{icon}</span>
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="all" className="mt-0">
                      <div className="grid grid-cols-6 gap-2">
                        {availableIcons.map((icon) => (
                          <Button
                            key={icon}
                            variant="outline"
                            size="sm"
                            className={`p-2 h-auto flex flex-col items-center gap-1 ${moduloSelecionado?.icone === icon ? 'bg-csae-green-50 border-csae-green-300' : ''}`}
                            onClick={() => atualizarCampoModulo('icone', icon)}
                          >
                            {renderIcon(icon)}
                            <span className="text-[10px] truncate w-full text-center">{icon}</span>
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="search" className="mt-0">
                      {filteredIcons.length > 0 ? (
                        <div className="grid grid-cols-6 gap-2">
                          {filteredIcons.map((icon) => (
                            <Button
                              key={icon}
                              variant="outline"
                              size="sm"
                              className={`p-2 h-auto flex flex-col items-center gap-1 ${moduloSelecionado?.icone === icon ? 'bg-csae-green-50 border-csae-green-300' : ''}`}
                              onClick={() => atualizarCampoModulo('icone', icon)}
                            >
                              {renderIcon(icon)}
                              <span className="text-[10px] truncate w-full text-center">{icon}</span>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">Nenhum ícone encontrado</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria*</Label>
                <Select
                  value={moduloSelecionado?.categoria || 'clinico'}
                  onValueChange={(valor) => atualizarCampoModulo('categoria', valor)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinico">Clínico</SelectItem>
                    <SelectItem value="educacional">Educacional</SelectItem>
                    <SelectItem value="gestao">Gestão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição*</Label>
                <Textarea
                  id="descricao"
                  value={moduloSelecionado?.descricao || ''}
                  onChange={(e) => atualizarCampoModulo('descricao', e.target.value)}
                  placeholder="Breve descrição do módulo"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem de exibição</Label>
                <Input
                  id="ordem"
                  type="number"
                  min="1"
                  value={moduloSelecionado?.ordem || 1000}
                  onChange={(e) => atualizarCampoModulo('ordem', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500">
                  Controla a ordem dos itens no menu e dashboard. Números menores aparecem primeiro.
                </p>
              </div>
              
              <div className="space-y-3 pt-3">
                <Label>Visibilidade do módulo</Label>
                <RadioGroup 
                  value={moduloSelecionado?.visibilidade || 'todos'} 
                  onValueChange={(value) => atualizarCampoModulo('visibilidade', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="todos" id="todos" />
                    <Label htmlFor="todos">Todos os usuários autenticados</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin">Somente administradores</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sms" id="sms" />
                    <Label htmlFor="sms">Somente quem atua na SMS</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={moduloSelecionado?.ativo}
                  onCheckedChange={(checked) => atualizarCampoModulo('ativo', checked)}
                />
                <Label htmlFor="ativo">Módulo ativo</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="exibirDashboard"
                  checked={moduloSelecionado?.exibirNoDashboard}
                  onCheckedChange={(checked) => atualizarCampoModulo('exibirNoDashboard', checked)}
                />
                <Label htmlFor="exibirDashboard">Exibir no Dashboard</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="exibirNavbar"
                  checked={moduloSelecionado?.exibirNavbar}
                  onCheckedChange={(checked) => atualizarCampoModulo('exibirNavbar', checked)}
                />
                <Label htmlFor="exibirNavbar">Exibir na Navbar</Label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={fecharForm} disabled={carregando}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={salvarModulo} disabled={carregando} className="bg-csae-green-600 hover:bg-csae-green-700">
                  <Save className="mr-2 h-4 w-4" />
                  {carregando ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={excluirDialogoAberto} onOpenChange={setExcluirDialogoAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o módulo "{moduloSelecionado?.titulo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={excluirModulo}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GerenciadorModulos;
