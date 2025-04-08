
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CalendarIcon, Clock, FileText, Plus, Save, Trash2, X } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ProtocoloOperacionalPadrao } from '@/types/pop';
import { adicionarProtocoloOperacional, atualizarProtocoloOperacional, buscarProtocolosOperacionais, removerProtocoloOperacional } from '@/services/bancodados/popsDB';
import { Timestamp } from 'firebase/firestore';

const GerenciadorPOPs = () => {
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(true);
  const [protocolos, setProtocolos] = useState<ProtocoloOperacionalPadrao[]>([]);
  const [protocoloSelecionado, setProtocoloSelecionado] = useState<ProtocoloOperacionalPadrao | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [excluirDialogoAberto, setExcluirDialogoAberto] = useState(false);
  const [dataImplantacao, setDataImplantacao] = useState<Date | undefined>(undefined);
  const [dataRevisao, setDataRevisao] = useState<Date | undefined>(undefined);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);

  // Protocolo padrão para novo cadastro
  const protocoloPadrao = {
    titulo: '',
    conceito: '',
    dataImplantacao: Timestamp.now(),
    numeroEdicao: '',
    codificacao: '',
    validade: 'Indeterminado',
    dataRevisao: null,
    quantidadePaginas: 1,
    elaboradoPor: '',
    corenElaborador: '',
    revisadoPor: '',
    corenRevisor: '',
    aprovadoPor: '',
    corenAprovador: '',
    imagemCapa: '',
    linkPdf: '',
    ativo: true
  };

  // Carregar protocolos
  const carregarProtocolos = async () => {
    setCarregando(true);
    try {
      const protocolosData = await buscarProtocolosOperacionais();
      setProtocolos(protocolosData);
    } catch (error) {
      console.error('Erro ao carregar protocolos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os protocolos operacionais.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarProtocolos();
  }, []);

  // Abrir formulário para edição ou criação
  const abrirForm = (protocolo?: ProtocoloOperacionalPadrao) => {
    if (protocolo) {
      setProtocoloSelecionado(protocolo);
      setDataImplantacao(protocolo.dataImplantacao.toDate());
      setDataRevisao(protocolo.dataRevisao ? protocolo.dataRevisao.toDate() : undefined);
      setPreviewImagem(protocolo.imagemCapa);
    } else {
      setProtocoloSelecionado(protocoloPadrao);
      setDataImplantacao(new Date());
      setDataRevisao(undefined);
      setPreviewImagem(null);
    }
    setFormAberto(true);
  };

  // Fechar formulário
  const fecharForm = () => {
    setFormAberto(false);
    setProtocoloSelecionado(null);
    setDataImplantacao(undefined);
    setDataRevisao(undefined);
    setPreviewImagem(null);
  };

  // Atualizar campo do protocolo
  const atualizarCampoProtocolo = (campo: keyof ProtocoloOperacionalPadrao, valor: any) => {
    if (protocoloSelecionado) {
      setProtocoloSelecionado({
        ...protocoloSelecionado,
        [campo]: valor,
      });

      // Atualizar preview da imagem quando o URL mudar
      if (campo === 'imagemCapa') {
        setPreviewImagem(valor);
      }
    }
  };

  // Salvar protocolo
  const salvarProtocolo = async () => {
    if (!protocoloSelecionado) return;
    
    // Validação básica
    if (!protocoloSelecionado.titulo || !protocoloSelecionado.numeroEdicao || !protocoloSelecionado.linkPdf) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o título, número da edição e link do PDF.',
        variant: 'destructive',
      });
      return;
    }

    setCarregando(true);
    
    try {
      // Atualizar datas
      const protocoloAtualizado = {
        ...protocoloSelecionado,
        dataImplantacao: dataImplantacao ? Timestamp.fromDate(dataImplantacao) : Timestamp.now(),
        dataRevisao: dataRevisao ? Timestamp.fromDate(dataRevisao) : null
      };

      // Se tem ID, atualiza
      if (protocoloAtualizado.id) {
        const { id, ...dadosAtualizados } = protocoloAtualizado;
        const sucesso = await atualizarProtocoloOperacional(id, dadosAtualizados);
        
        if (sucesso) {
          toast({
            title: 'Protocolo atualizado',
            description: `O protocolo "${protocoloAtualizado.titulo}" foi atualizado com sucesso.`,
          });
          
          // Atualiza a lista localmente
          setProtocolos(protocolos.map(p => 
            p.id === protocoloAtualizado.id ? protocoloAtualizado : p
          ));
        } else {
          throw new Error('Falha ao atualizar protocolo');
        }
      } 
      // Caso contrário, adiciona novo
      else {
        const novoId = await adicionarProtocoloOperacional(protocoloAtualizado);
        
        if (novoId) {
          toast({
            title: 'Protocolo adicionado',
            description: `O protocolo "${protocoloAtualizado.titulo}" foi adicionado com sucesso.`,
          });
          
          // Adiciona à lista local
          setProtocolos([{ ...protocoloAtualizado, id: novoId }, ...protocolos]);
        } else {
          throw new Error('Falha ao adicionar protocolo');
        }
      }
      
      fecharForm();
    } catch (error) {
      console.error('Erro ao salvar protocolo:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao salvar o protocolo.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  // Alternar estado do protocolo (ativo/inativo)
  const alternarEstadoProtocolo = async (protocolo: ProtocoloOperacionalPadrao) => {
    setCarregando(true);
    
    try {
      const novoEstado = !protocolo.ativo;
      const sucesso = await atualizarProtocoloOperacional(protocolo.id!, { ativo: novoEstado });
      
      if (sucesso) {
        // Atualiza a lista local
        setProtocolos(protocolos.map(p => 
          p.id === protocolo.id ? { ...p, ativo: novoEstado } : p
        ));
        
        toast({
          title: novoEstado ? 'Protocolo ativado' : 'Protocolo desativado',
          description: `O protocolo "${protocolo.titulo}" foi ${novoEstado ? 'ativado' : 'desativado'} com sucesso.`,
        });
      } else {
        throw new Error('Falha ao atualizar estado do protocolo');
      }
    } catch (error) {
      console.error('Erro ao alternar estado do protocolo:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao alterar o estado do protocolo.',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };

  // Confirmar exclusão
  const confirmarExclusao = (protocolo: ProtocoloOperacionalPadrao) => {
    setProtocoloSelecionado(protocolo);
    setExcluirDialogoAberto(true);
  };

  // Excluir protocolo
  const excluirProtocolo = async () => {
    if (!protocoloSelecionado?.id) return;
    
    setCarregando(true);
    
    try {
      const sucesso = await removerProtocoloOperacional(protocoloSelecionado.id);
      
      if (sucesso) {
        // Remove da lista local
        setProtocolos(protocolos.filter(p => p.id !== protocoloSelecionado.id));
        
        toast({
          title: 'Protocolo excluído',
          description: `O protocolo "${protocoloSelecionado.titulo}" foi excluído com sucesso.`,
        });
      } else {
        throw new Error('Falha ao excluir protocolo');
      }
    } catch (error) {
      console.error('Erro ao excluir protocolo:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir o protocolo.',
        variant: 'destructive',
      });
    } finally {
      setExcluirDialogoAberto(false);
      setProtocoloSelecionado(null);
      setCarregando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-csae-green-700">
          Gerenciamento de Protocolos Operacionais Padrão (POPs)
        </h2>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => abrirForm()} className="bg-csae-green-600 hover:bg-csae-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar POP
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {protocolos.map((protocolo) => (
          <Card 
            key={protocolo.id} 
            className={`hover:shadow-md transition-shadow border-l-4 ${
              protocolo.ativo ? 'border-l-blue-500' : 'border-l-gray-300'
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {protocolo.numeroEdicao} - {protocolo.titulo}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <div className="flex items-center gap-1 text-xs">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      Implantação: {format(protocolo.dataImplantacao.toDate(), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </CardDescription>
                </div>
                <Switch 
                  checked={protocolo.ativo} 
                  onCheckedChange={() => alternarEstadoProtocolo(protocolo)}
                  disabled={carregando}
                  className="ml-2"
                />
              </div>
            </CardHeader>
            <CardContent>
              {protocolo.imagemCapa && (
                <div className="w-full h-32 mb-3 overflow-hidden rounded">
                  <img
                    src={protocolo.imagemCapa}
                    alt={`Capa do POP ${protocolo.titulo}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/300x200/e3e3e3/888?text=Imagem+indispon%C3%ADvel";
                    }}
                  />
                </div>
              )}
              
              <p className="text-sm mb-3 line-clamp-2">{protocolo.conceito}</p>
              
              <div className="text-xs text-gray-600 mb-3">
                <p>Elaborado por: {protocolo.elaboradoPor} - {protocolo.corenElaborador}</p>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => abrirForm(protocolo)}
                  disabled={carregando}
                >
                  Editar
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => confirmarExclusao(protocolo)}
                  disabled={carregando}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {protocolos.length === 0 && !carregando && (
          <div className="col-span-full p-8 text-center border rounded-lg border-dashed">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <h3 className="text-lg font-medium mb-1">Nenhum protocolo cadastrado</h3>
            <p className="text-gray-500 mb-4">
              Adicione protocolos operacionais padrão para disponibilizar no sistema.
            </p>
            <Button onClick={() => abrirForm()} className="bg-csae-green-600 hover:bg-csae-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro POP
            </Button>
          </div>
        )}
      </div>
      
      {/* Formulário de Edição/Criação */}
      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{protocoloSelecionado?.id ? 'Editar Protocolo Operacional' : 'Adicionar Protocolo Operacional'}</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {protocoloSelecionado?.id ? 'editar o' : 'adicionar um novo'} protocolo operacional padrão.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={protocoloSelecionado?.titulo || ''}
                onChange={(e) => atualizarCampoProtocolo('titulo', e.target.value)}
                placeholder="Ex: Administração de Medicamentos"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numeroEdicao">Número da Edição</Label>
              <Input
                id="numeroEdicao"
                value={protocoloSelecionado?.numeroEdicao || ''}
                onChange={(e) => atualizarCampoProtocolo('numeroEdicao', e.target.value)}
                placeholder="Ex: 01"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="codificacao">Codificação</Label>
              <Input
                id="codificacao"
                value={protocoloSelecionado?.codificacao || ''}
                onChange={(e) => atualizarCampoProtocolo('codificacao', e.target.value)}
                placeholder="Ex: POP.ENF.001"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data de Implantação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataImplantacao ? (
                      format(dataImplantacao, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataImplantacao}
                    onSelect={setDataImplantacao}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="validade">Validade</Label>
              <Input
                id="validade"
                value={protocoloSelecionado?.validade || ''}
                onChange={(e) => atualizarCampoProtocolo('validade', e.target.value)}
                placeholder="Ex: Indeterminado ou 1 ano"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data de Revisão</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {dataRevisao ? (
                      format(dataRevisao, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Sem data de revisão</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataRevisao}
                    onSelect={setDataRevisao}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantidadePaginas">Quantidade de Páginas</Label>
              <Input
                id="quantidadePaginas"
                type="number"
                min="1"
                value={protocoloSelecionado?.quantidadePaginas || 1}
                onChange={(e) => atualizarCampoProtocolo('quantidadePaginas', parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="conceito">Conceito/Descrição</Label>
              <Textarea
                id="conceito"
                value={protocoloSelecionado?.conceito || ''}
                onChange={(e) => atualizarCampoProtocolo('conceito', e.target.value)}
                placeholder="Descrição do protocolo operacional padrão"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="elaboradoPor">Elaborado por</Label>
              <Input
                id="elaboradoPor"
                value={protocoloSelecionado?.elaboradoPor || ''}
                onChange={(e) => atualizarCampoProtocolo('elaboradoPor', e.target.value)}
                placeholder="Nome do profissional"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="corenElaborador">COREN do Elaborador</Label>
              <Input
                id="corenElaborador"
                value={protocoloSelecionado?.corenElaborador || ''}
                onChange={(e) => atualizarCampoProtocolo('corenElaborador', e.target.value)}
                placeholder="Ex: 123456-SC"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="revisadoPor">Revisado por</Label>
              <Input
                id="revisadoPor"
                value={protocoloSelecionado?.revisadoPor || ''}
                onChange={(e) => atualizarCampoProtocolo('revisadoPor', e.target.value)}
                placeholder="Nome do revisor"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="corenRevisor">COREN do Revisor</Label>
              <Input
                id="corenRevisor"
                value={protocoloSelecionado?.corenRevisor || ''}
                onChange={(e) => atualizarCampoProtocolo('corenRevisor', e.target.value)}
                placeholder="Ex: 123456-SC"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="aprovadoPor">Aprovado por</Label>
              <Input
                id="aprovadoPor"
                value={protocoloSelecionado?.aprovadoPor || ''}
                onChange={(e) => atualizarCampoProtocolo('aprovadoPor', e.target.value)}
                placeholder="Nome do aprovador"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="corenAprovador">COREN do Aprovador</Label>
              <Input
                id="corenAprovador"
                value={protocoloSelecionado?.corenAprovador || ''}
                onChange={(e) => atualizarCampoProtocolo('corenAprovador', e.target.value)}
                placeholder="Ex: 123456-SC"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imagemCapa">Link da Imagem de Capa</Label>
              <Input
                id="imagemCapa"
                value={protocoloSelecionado?.imagemCapa || ''}
                onChange={(e) => atualizarCampoProtocolo('imagemCapa', e.target.value)}
                placeholder="URL da imagem"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="linkPdf">Link do PDF</Label>
              <Input
                id="linkPdf"
                value={protocoloSelecionado?.linkPdf || ''}
                onChange={(e) => atualizarCampoProtocolo('linkPdf', e.target.value)}
                placeholder="URL do arquivo PDF"
              />
            </div>
            
            {previewImagem && (
              <div className="md:col-span-2">
                <Label htmlFor="previewImagem">Preview da Capa</Label>
                <div className="mt-2 h-40 overflow-hidden rounded border">
                  <img
                    src={previewImagem}
                    alt="Preview da capa"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/300x200/e3e3e3/888?text=Imagem+indispon%C3%ADvel";
                    }}
                  />
                </div>
              </div>
            )}
            
            <div className="md:col-span-2 flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={protocoloSelecionado?.ativo}
                onCheckedChange={(checked) => atualizarCampoProtocolo('ativo', checked)}
              />
              <Label htmlFor="ativo">Protocolo ativo</Label>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={fecharForm} disabled={carregando}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={salvarProtocolo} disabled={carregando} className="bg-csae-green-600 hover:bg-csae-green-700">
              <Save className="mr-2 h-4 w-4" />
              {carregando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={excluirDialogoAberto} onOpenChange={setExcluirDialogoAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o protocolo "{protocoloSelecionado?.titulo}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={excluirProtocolo}
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

export default GerenciadorPOPs;
