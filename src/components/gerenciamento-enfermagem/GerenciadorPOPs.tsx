
import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileText, Plus, Search, Save, Trash2, X, PlusCircle, Calendar, Pencil, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ProtocoloOperacionalPadrao, ProfissionalSaude } from '@/types/pop';
import { 
  buscarProtocolosOperacionais, 
  adicionarProtocoloOperacional, 
  atualizarProtocoloOperacional, 
  removerProtocoloOperacional 
} from '@/services/bancodados/popsDB';

interface ProfissionalFormProps {
  profissionais: ProfissionalSaude[];
  setProfissionais: React.Dispatch<React.SetStateAction<ProfissionalSaude[]>>;
  titulo: string;
}

const GerenciadorPOPs = () => {
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(true);
  const [pops, setPops] = useState<ProtocoloOperacionalPadrao[]>([]);
  const [popSelecionado, setPopSelecionado] = useState<ProtocoloOperacionalPadrao | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [excluirDialogoAberto, setExcluirDialogoAberto] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [abaSelecionada, setAbaSelecionada] = useState('geral');

  // Valores padrão para novos POPs
  const novoPopPadrao: Omit<ProtocoloOperacionalPadrao, 'id' | 'createdAt' | 'updatedAt'> = {
    titulo: '',
    conceito: '',
    dataImplantacao: '',
    numeroEdicao: '',
    codificacao: '',
    validade: '',
    dataRevisao: '',
    quantidadePaginas: 1,
    elaboradores: [],
    revisores: [],
    aprovadores: [],
    imagemCapa: '',
    linkPdf: '',
    ativo: true
  };

  // Carregar POPs
  useEffect(() => {
    const carregarPOPs = async () => {
      setCarregando(true);
      try {
        const dados = await buscarProtocolosOperacionais();
        setPops(dados);
      } catch (error) {
        console.error('Erro ao carregar POPs:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os protocolos operacionais.',
          variant: 'destructive',
        });
      } finally {
        setCarregando(false);
      }
    };

    carregarPOPs();
  }, [toast]);

  // Abrir formulário para edição ou criação
  const abrirForm = (pop?: ProtocoloOperacionalPadrao) => {
    if (pop) {
      // Converter timestamps para strings se necessário
      const popFormatado = {
        ...pop,
        dataImplantacao: formatarDataParaExibicao(pop.dataImplantacao),
        dataRevisao: formatarDataParaExibicao(pop.dataRevisao)
      };
      setPopSelecionado(popFormatado);
    } else {
      setPopSelecionado(novoPopPadrao);
    }
    setFormAberto(true);
    setAbaSelecionada('geral');
  };

  // Fechar formulário
  const fecharForm = () => {
    setFormAberto(false);
    setPopSelecionado(null);
  };

  // Atualizar campo do POP
  const atualizarCampoPOP = (campo: keyof ProtocoloOperacionalPadrao, valor: any) => {
    if (popSelecionado) {
      setPopSelecionado({
        ...popSelecionado,
        [campo]: valor,
      });
    }
  };

  // Formatar data do Timestamp para string DD/MM/AAAA para exibição no formulário
  const formatarDataParaExibicao = (data: any): string => {
    if (!data) return '';
    
    try {
      // Se for um Timestamp ou objeto com toDate()
      if (data.toDate) {
        return format(data.toDate(), 'dd/MM/yyyy', { locale: ptBR });
      } 
      // Se for uma string, retornar como está (assumindo que já está formatada corretamente)
      else if (typeof data === 'string') {
        return data;
      }
      // Se for um Date
      else if (data instanceof Date) {
        return format(data, 'dd/MM/yyyy', { locale: ptBR });
      }
      return '';
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  // Salvar POP
  const salvarPOP = async () => {
    if (!popSelecionado) return;
    
    // Validação dos campos obrigatórios
    if (!popSelecionado.titulo || !popSelecionado.numeroEdicao || !popSelecionado.dataImplantacao) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    // Validação do formato de data
    const regexData = /^\d{2}\/\d{2}\/\d{4}$/;
    if (!regexData.test(popSelecionado.dataImplantacao.toString())) {
      toast({
        title: 'Formato de data inválido',
        description: 'A data de implantação deve estar no formato DD/MM/AAAA.',
        variant: 'destructive',
      });
      return;
    }

    if (popSelecionado.dataRevisao && !regexData.test(popSelecionado.dataRevisao.toString())) {
      toast({
        title: 'Formato de data inválido',
        description: 'A data de revisão deve estar no formato DD/MM/AAAA.',
        variant: 'destructive',
      });
      return;
    }

    setCarregando(true);
    
    try {
      // Se tem ID, atualiza
      if (popSelecionado.id) {
        const { id, ...dadosAtualizados } = popSelecionado;
        const sucesso = await atualizarProtocoloOperacional(id, dadosAtualizados);
        
        if (sucesso) {
          toast({
            title: 'POP atualizado',
            description: `O POP "${popSelecionado.titulo}" foi atualizado com sucesso.`,
          });
          
          // Atualiza a lista localmente
          setPops(pops.map(p => 
            p.id === popSelecionado.id ? popSelecionado : p
          ));
        } else {
          throw new Error('Falha ao atualizar POP');
        }
      } 
      // Caso contrário, adiciona novo
      else {
        const novoId = await adicionarProtocoloOperacional(popSelecionado);
        
        if (novoId) {
          toast({
            title: 'POP adicionado',
            description: `O POP "${popSelecionado.titulo}" foi adicionado com sucesso.`,
          });
          
          // Adiciona à lista local com o ID gerado
          setPops([...pops, { ...popSelecionado, id: novoId }]);
        } else {
          throw new Error('Falha ao adicionar POP');
        }
      }
      
      fecharForm();
    } catch (error) {
      console.error('Erro ao salvar POP:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o protocolo operacional.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  // Alternar estado de ativo/inativo
  const alternarEstadoPOP = async (pop: ProtocoloOperacionalPadrao) => {
    setCarregando(true);
    
    try {
      const novoEstado = !pop.ativo;
      const sucesso = await atualizarProtocoloOperacional(pop.id!, { ativo: novoEstado });
      
      if (sucesso) {
        // Atualiza a lista local
        setPops(pops.map(p => 
          p.id === pop.id ? { ...p, ativo: novoEstado } : p
        ));
        
        toast({
          title: novoEstado ? 'POP ativado' : 'POP desativado',
          description: `O POP "${pop.titulo}" foi ${novoEstado ? 'ativado' : 'desativado'} com sucesso.`,
        });
      } else {
        throw new Error('Falha ao atualizar estado do POP');
      }
    } catch (error) {
      console.error('Erro ao alternar estado do POP:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao alterar o estado do protocolo operacional.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  // Confirmar exclusão
  const confirmarExclusao = (pop: ProtocoloOperacionalPadrao) => {
    setPopSelecionado(pop);
    setExcluirDialogoAberto(true);
  };

  // Excluir POP
  const excluirPOP = async () => {
    if (!popSelecionado?.id) return;
    
    setCarregando(true);
    
    try {
      const sucesso = await removerProtocoloOperacional(popSelecionado.id);
      
      if (sucesso) {
        // Remove da lista local
        setPops(pops.filter(p => p.id !== popSelecionado.id));
        
        toast({
          title: 'POP excluído',
          description: `O POP "${popSelecionado.titulo}" foi excluído com sucesso.`,
        });
      } else {
        throw new Error('Falha ao excluir POP');
      }
    } catch (error) {
      console.error('Erro ao excluir POP:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir o protocolo operacional.',
        variant: 'destructive',
      });
    } finally {
      setExcluirDialogoAberto(false);
      setPopSelecionado(null);
      setCarregando(false);
    }
  };

  // Filtrar POPs pela busca
  const popsFiltrados = pops.filter(pop =>
    pop.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
    pop.conceito.toLowerCase().includes(termoBusca.toLowerCase()) ||
    pop.numeroEdicao.toLowerCase().includes(termoBusca.toLowerCase()) ||
    pop.codificacao.toLowerCase().includes(termoBusca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-csae-green-700">
          Gerenciamento de Protocolos Operacionais Padrão (POPs)
        </h2>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => abrirForm()} className="bg-csae-green-600 hover:bg-csae-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Novo POP
          </Button>
        </div>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Buscar POPs por título, conteúdo ou edição..."
          className="pl-10"
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {popsFiltrados.map((pop) => (
          <Card 
            key={pop.id} 
            className={`overflow-hidden hover:shadow-md transition-all border-l-4 ${
              pop.ativo ? 'border-l-green-500' : 'border-l-gray-300'
            }`}
          >
            <div className="h-36 bg-gray-100 relative">
              {pop.imagemCapa ? (
                <img 
                  src={pop.imagemCapa} 
                  alt={`Capa do POP ${pop.titulo}`} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/400x200/e2e8f0/64748b?text=Sem+imagem";
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileText className="h-12 w-12 text-gray-300" />
                </div>
              )}
              
              <div className="absolute top-2 right-2">
                <Switch 
                  checked={pop.ativo} 
                  onCheckedChange={() => alternarEstadoPOP(pop)}
                  disabled={carregando}
                />
              </div>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                {pop.numeroEdicao} - {pop.titulo}
              </CardTitle>
              <CardDescription className="text-xs">
                Código: {pop.codificacao || 'Não definido'}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <ScrollArea className="h-16 mb-2">
                <p className="text-sm text-gray-600">
                  {pop.conceito || 'Sem descrição'}
                </p>
              </ScrollArea>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  <span className="font-medium">Implantação:</span> {formatarDataParaExibicao(pop.dataImplantacao)}
                </p>
                <p>
                  <span className="font-medium">Elaborado por:</span> {pop.elaboradores && pop.elaboradores.length > 0
                    ? pop.elaboradores.map(e => `${e.nome} (${e.conselho} ${e.numeroRegistro})`).join(', ')
                    : 'Não informado'
                  }
                </p>
                <p>
                  <span className="font-medium">Páginas:</span> {pop.quantidadePaginas}
                </p>
              </div>
            </CardContent>
            
            <CardFooter>
              <div className="flex justify-between w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => abrirForm(pop)}
                  disabled={carregando}
                >
                  <Edit className="mr-2 h-3 w-3" />
                  Editar
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => confirmarExclusao(pop)}
                  disabled={carregando}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
        
        {popsFiltrados.length === 0 && (
          <div className="col-span-full p-8 text-center border rounded-lg border-dashed">
            {termoBusca ? (
              <>
                <Search className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <h3 className="text-lg font-medium mb-1">Nenhum resultado encontrado</h3>
                <p className="text-gray-500">
                  Não encontramos POPs correspondentes ao termo "{termoBusca}".
                </p>
              </>
            ) : (
              <>
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <h3 className="text-lg font-medium mb-1">Nenhum POP cadastrado</h3>
                <p className="text-gray-500 mb-4">
                  Adicione seu primeiro protocolo operacional padrão.
                </p>
                <Button onClick={() => abrirForm()} className="bg-csae-green-600 hover:bg-csae-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar POP
                </Button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Formulário de Edição/Criação */}
      <Sheet open={formAberto} onOpenChange={setFormAberto}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{popSelecionado?.id ? 'Editar POP' : 'Adicionar POP'}</SheetTitle>
            <SheetDescription>
              Preencha os campos abaixo para {popSelecionado?.id ? 'editar o' : 'adicionar um novo'} protocolo operacional padrão.
            </SheetDescription>
          </SheetHeader>
          
          <Tabs defaultValue="geral" className="mt-6" value={abaSelecionada} onValueChange={setAbaSelecionada}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="elaboradores">Elaboradores</TabsTrigger>
              <TabsTrigger value="revisores">Revisores</TabsTrigger>
              <TabsTrigger value="aprovadores">Aprovadores</TabsTrigger>
            </TabsList>
            
            <TabsContent value="geral" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="titulo">Título do POP <span className="text-red-500">*</span></Label>
                <Input
                  id="titulo"
                  value={popSelecionado?.titulo || ''}
                  onChange={(e) => atualizarCampoPOP('titulo', e.target.value)}
                  placeholder="Ex: Administração de medicamentos via intramuscular"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroEdicao">Número/Edição <span className="text-red-500">*</span></Label>
                  <Input
                    id="numeroEdicao"
                    value={popSelecionado?.numeroEdicao || ''}
                    onChange={(e) => atualizarCampoPOP('numeroEdicao', e.target.value)}
                    placeholder="Ex: POP 01"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="codificacao">Codificação</Label>
                  <Input
                    id="codificacao"
                    value={popSelecionado?.codificacao || ''}
                    onChange={(e) => atualizarCampoPOP('codificacao', e.target.value)}
                    placeholder="Ex: ENF-01"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="conceito">Conceito/Descrição</Label>
                <Textarea
                  id="conceito"
                  value={popSelecionado?.conceito || ''}
                  onChange={(e) => atualizarCampoPOP('conceito', e.target.value)}
                  placeholder="Descreva brevemente o conceito ou objetivo deste POP"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataImplantacao">Data de Implantação <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      id="dataImplantacao"
                      value={popSelecionado?.dataImplantacao || ''}
                      onChange={(e) => atualizarCampoPOP('dataImplantacao', e.target.value)}
                      placeholder="DD/MM/AAAA"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dataRevisao">Data de Revisão</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <Input
                      id="dataRevisao"
                      value={popSelecionado?.dataRevisao || ''}
                      onChange={(e) => atualizarCampoPOP('dataRevisao', e.target.value)}
                      placeholder="DD/MM/AAAA"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validade">Validade</Label>
                  <Input
                    id="validade"
                    value={popSelecionado?.validade || ''}
                    onChange={(e) => atualizarCampoPOP('validade', e.target.value)}
                    placeholder="Ex: 2 anos ou Indeterminado"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quantidadePaginas">Quantidade de Páginas</Label>
                  <Input
                    id="quantidadePaginas"
                    type="number"
                    min="1"
                    value={popSelecionado?.quantidadePaginas || 1}
                    onChange={(e) => atualizarCampoPOP('quantidadePaginas', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imagemCapa">Link da Imagem de Capa</Label>
                <Input
                  id="imagemCapa"
                  value={popSelecionado?.imagemCapa || ''}
                  onChange={(e) => atualizarCampoPOP('imagemCapa', e.target.value)}
                  placeholder="URL da imagem de capa"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkPdf">Link do PDF <span className="text-red-500">*</span></Label>
                <Input
                  id="linkPdf"
                  value={popSelecionado?.linkPdf || ''}
                  onChange={(e) => atualizarCampoPOP('linkPdf', e.target.value)}
                  placeholder="URL do documento PDF"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="ativo"
                  checked={popSelecionado?.ativo}
                  onCheckedChange={(checked) => atualizarCampoPOP('ativo', checked)}
                />
                <Label htmlFor="ativo">POP Ativo</Label>
              </div>
            </TabsContent>
            
            <TabsContent value="elaboradores">
              {popSelecionado && (
                <ProfissionalForm 
                  profissionais={popSelecionado.elaboradores || []} 
                  setProfissionais={(profissionais) => atualizarCampoPOP('elaboradores', profissionais)}
                  titulo="Elaboradores"
                />
              )}
            </TabsContent>
            
            <TabsContent value="revisores">
              {popSelecionado && (
                <ProfissionalForm 
                  profissionais={popSelecionado.revisores || []} 
                  setProfissionais={(profissionais) => atualizarCampoPOP('revisores', profissionais)}
                  titulo="Revisores"
                />
              )}
            </TabsContent>
            
            <TabsContent value="aprovadores">
              {popSelecionado && (
                <ProfissionalForm 
                  profissionais={popSelecionado.aprovadores || []} 
                  setProfissionais={(profissionais) => atualizarCampoPOP('aprovadores', profissionais)}
                  titulo="Aprovadores"
                />
              )}
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-6">
            <Button variant="outline" onClick={fecharForm} disabled={carregando}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={salvarPOP} disabled={carregando} className="bg-csae-green-600 hover:bg-csae-green-700">
              <Save className="mr-2 h-4 w-4" />
              {carregando ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={excluirDialogoAberto} onOpenChange={setExcluirDialogoAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o POP "{popSelecionado?.titulo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={excluirPOP}
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

// Componente para gerenciar profissionais (elaboradores, revisores, aprovadores)
const ProfissionalForm: React.FC<ProfissionalFormProps> = ({ profissionais, setProfissionais, titulo }) => {
  const [novoProfissional, setNovoProfissional] = useState<ProfissionalSaude>({
    nome: '',
    conselho: 'COREN',
    numeroRegistro: ''
  });
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);

  const adicionarProfissional = () => {
    if (!novoProfissional.nome || !novoProfissional.conselho || !novoProfissional.numeroRegistro) {
      return;
    }
    
    if (editandoIndex !== null) {
      // Editar profissional existente
      const novosProfs = [...profissionais];
      novosProfs[editandoIndex] = { ...novoProfissional };
      setProfissionais(novosProfs);
      setEditandoIndex(null);
    } else {
      // Adicionar novo profissional
      setProfissionais([...profissionais, { ...novoProfissional }]);
    }
    
    // Resetar form
    setNovoProfissional({
      nome: '',
      conselho: 'COREN',
      numeroRegistro: ''
    });
  };

  const editarProfissional = (index: number) => {
    setNovoProfissional({ ...profissionais[index] });
    setEditandoIndex(index);
  };

  const removerProfissional = (index: number) => {
    const novosProfs = [...profissionais];
    novosProfs.splice(index, 1);
    setProfissionais(novosProfs);
    
    // Se estava editando o que foi removido, cancelar edição
    if (editandoIndex === index) {
      setEditandoIndex(null);
      setNovoProfissional({
        nome: '',
        conselho: 'COREN',
        numeroRegistro: ''
      });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{titulo}</h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          <div className="col-span-3 space-y-1">
            <Label htmlFor="nome">Nome completo</Label>
            <Input 
              id="nome"
              value={novoProfissional.nome}
              onChange={(e) => setNovoProfissional({...novoProfissional, nome: e.target.value})}
              placeholder="Ex: Maria da Silva"
            />
          </div>
          
          <div className="col-span-2 space-y-1">
            <Label htmlFor="conselho">Conselho</Label>
            <Input 
              id="conselho"
              value={novoProfissional.conselho}
              onChange={(e) => setNovoProfissional({...novoProfissional, conselho: e.target.value})}
              placeholder="Ex: COREN"
            />
          </div>
          
          <div className="col-span-2 space-y-1">
            <Label htmlFor="numeroRegistro">Número</Label>
            <div className="flex">
              <Input 
                id="numeroRegistro"
                value={novoProfissional.numeroRegistro}
                onChange={(e) => setNovoProfissional({...novoProfissional, numeroRegistro: e.target.value})}
                placeholder="Ex: 123456"
                className="flex-1"
              />
              <Button 
                type="button" 
                size="sm" 
                className="ml-2 bg-csae-green-600 hover:bg-csae-green-700"
                onClick={adicionarProfissional}
              >
                {editandoIndex !== null ? <Pencil className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        
        {profissionais.length === 0 ? (
          <div className="text-center p-4 border border-dashed rounded-md">
            <p className="text-gray-500">Nenhum {titulo.toLowerCase().slice(0, -2)} cadastrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {profissionais.map((prof, index) => (
              <div key={index} className="p-2 bg-gray-50 rounded-md flex justify-between items-center">
                <div>
                  <span className="font-medium">{prof.nome}</span>
                  <span className="text-sm text-gray-600"> - {prof.conselho} {prof.numeroRegistro}</span>
                </div>
                <div className="flex gap-1">
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => editarProfissional(index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600"
                    onClick={() => removerProfissional(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GerenciadorPOPs;
