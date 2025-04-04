
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, ExternalLink, Calendar, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ProtocoloEnfermagem } from '@/services/bancodados/tipos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GerenciadorProtocolos = () => {
  const { toast } = useToast();
  const [protocolos, setProtocolos] = useState<ProtocoloEnfermagem[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  
  // Estado para o formulário
  const [formProtocolo, setFormProtocolo] = useState<ProtocoloEnfermagem>({
    volume: '',
    nome: '',
    dataPublicacao: new Date() as any,
    descricao: '',
    linkPdf: ''
  });

  // Validação de URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  // Carregar os protocolos
  useEffect(() => {
    const carregarProtocolos = async () => {
      try {
        const protocolosRef = collection(db, 'protocolosEnfermagem');
        const protocolosSnapshot = await getDocs(protocolosRef);
        const protocolosData = protocolosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ProtocoloEnfermagem[];
        setProtocolos(protocolosData);
      } catch (error) {
        console.error("Erro ao carregar protocolos:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os protocolos de enfermagem.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarProtocolos();
  }, [toast]);
  
  // Abrir modal para criar novo protocolo
  const abrirModalCriar = () => {
    setFormProtocolo({
      volume: '',
      nome: '',
      dataPublicacao: new Date() as any,
      descricao: '',
      linkPdf: ''
    });
    setEditandoId(null);
    setModalAberto(true);
  };
  
  // Abrir modal para editar protocolo existente
  const abrirModalEditar = (protocolo: ProtocoloEnfermagem) => {
    setFormProtocolo({...protocolo});
    setEditandoId(protocolo.id || null);
    setModalAberto(true);
  };
  
  // Salvar protocolo (criar novo ou atualizar existente)
  const salvarProtocolo = async () => {
    try {
      // Validação dos campos obrigatórios
      if (!formProtocolo.nome.trim() || !formProtocolo.volume.trim() || !formProtocolo.descricao.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Volume, nome e descrição são obrigatórios.",
          variant: "destructive"
        });
        return;
      }

      // Validação dos links
      if (!isValidUrl(formProtocolo.linkPdf)) {
        toast({
          title: "Link inválido",
          description: "O link do PDF deve ser uma URL válida.",
          variant: "destructive"
        });
        return;
      }

      if (formProtocolo.linkImagem && !isValidUrl(formProtocolo.linkImagem)) {
        toast({
          title: "Link inválido",
          description: "O link da imagem deve ser uma URL válida.",
          variant: "destructive"
        });
        return;
      }
      
      if (editandoId) {
        // Atualizar existente
        const protocoloRef = doc(db, 'protocolosEnfermagem', editandoId);
        await updateDoc(protocoloRef, {
          ...formProtocolo,
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "Protocolo atualizado",
          description: `${formProtocolo.nome} foi atualizado com sucesso.`
        });
        
        // Atualizar lista
        setProtocolos(prev => 
          prev.map(p => p.id === editandoId ? {...formProtocolo, id: editandoId, updatedAt: new Date() as any} : p)
        );
      } else {
        // Criar novo
        const novoProtocolo = {
          ...formProtocolo,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'protocolosEnfermagem'), novoProtocolo);
        
        toast({
          title: "Protocolo criado",
          description: `${formProtocolo.nome} foi criado com sucesso.`
        });
        
        // Adicionar à lista
        setProtocolos(prev => [...prev, {
          ...novoProtocolo, 
          id: docRef.id, 
          createdAt: new Date() as any, 
          updatedAt: new Date() as any
        }]);
      }
      
      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar protocolo:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o protocolo.",
        variant: "destructive"
      });
    }
  };
  
  // Excluir protocolo
  const excluirProtocolo = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este protocolo? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'protocolosEnfermagem', id));
        
        toast({
          title: "Protocolo excluído",
          description: "O protocolo foi excluído com sucesso."
        });
        
        // Remover da lista
        setProtocolos(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error("Erro ao excluir protocolo:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o protocolo.",
          variant: "destructive"
        });
      }
    }
  };

  // Formatar data
  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'Data não definida';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return 'Data inválida';
    }
  };
  
  // Handler para mudança de data
  const handleDataChange = (field: 'dataPublicacao' | 'dataAtualizacao', value: string) => {
    if (!value) {
      // Se o campo estiver vazio e for dataAtualizacao, remova-o do objeto
      if (field === 'dataAtualizacao') {
        const { dataAtualizacao, ...rest } = formProtocolo;
        setFormProtocolo(rest);
      } else {
        // Para dataPublicacao, defina para a data atual
        setFormProtocolo({
          ...formProtocolo,
          [field]: new Date()
        });
      }
      return;
    }
    
    try {
      // Tenta converter a string de data para um objeto Date
      const [dia, mes, ano] = value.split('/').map(Number);
      const data = new Date(ano, mes - 1, dia);
      
      if (isNaN(data.getTime())) {
        throw new Error("Data inválida");
      }
      
      setFormProtocolo({
        ...formProtocolo,
        [field]: data
      });
    } catch (error) {
      console.error("Erro ao processar data:", error);
      toast({
        title: "Data inválida",
        description: "Por favor, insira a data no formato DD/MM/AAAA.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gerenciamento de Protocolos de Enfermagem</span>
          <Button onClick={abrirModalCriar} className="bg-csae-green-600 hover:bg-csae-green-700">
            <Plus className="mr-2 h-4 w-4" /> Novo Protocolo
          </Button>
        </CardTitle>
        <CardDescription>
          Cadastre e gerencie os protocolos de enfermagem oficiais da Secretaria Municipal de Saúde.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
          </div>
        ) : protocolos.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Nenhum protocolo cadastrado. Clique em "Novo Protocolo" para começar.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Volume</TableHead>
                <TableHead>Nome do Protocolo</TableHead>
                <TableHead>Data de Publicação</TableHead>
                <TableHead>Atualizado em</TableHead>
                <TableHead>PDF</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {protocolos.map((protocolo) => (
                <TableRow key={protocolo.id}>
                  <TableCell>{protocolo.volume}</TableCell>
                  <TableCell className="font-medium">{protocolo.nome}</TableCell>
                  <TableCell>{formatarData(protocolo.dataPublicacao)}</TableCell>
                  <TableCell>
                    {protocolo.dataAtualizacao ? formatarData(protocolo.dataAtualizacao) : 'Não atualizado'}
                  </TableCell>
                  <TableCell>
                    <a 
                      href={protocolo.linkPdf} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      <span className="underline">PDF</span>
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="mr-2" onClick={() => abrirModalEditar(protocolo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => excluirProtocolo(protocolo.id!)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      
      {/* Modal para criar/editar protocolo */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoId ? 'Editar' : 'Novo'} Protocolo de Enfermagem</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editandoId ? 'atualizar o' : 'cadastrar um novo'} protocolo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="volume">Volume do Protocolo*</Label>
              <Input
                id="volume"
                value={formProtocolo.volume}
                onChange={(e) => setFormProtocolo({...formProtocolo, volume: e.target.value})}
                placeholder="Ex: Volume 1"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Protocolo*</Label>
              <Input
                id="nome"
                value={formProtocolo.nome}
                onChange={(e) => setFormProtocolo({...formProtocolo, nome: e.target.value})}
                placeholder="Ex: Protocolo de Hipertensão Arterial"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dataPublicacao">Data de Publicação*</Label>
                <div className="flex items-center">
                  <Calendar className="absolute ml-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="dataPublicacao"
                    value={formProtocolo.dataPublicacao ? formatarData(formProtocolo.dataPublicacao) : ''}
                    onChange={(e) => handleDataChange('dataPublicacao', e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="dataAtualizacao">Data de Atualização (opcional)</Label>
                <div className="flex items-center">
                  <Calendar className="absolute ml-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="dataAtualizacao"
                    value={formProtocolo.dataAtualizacao ? formatarData(formProtocolo.dataAtualizacao) : ''}
                    onChange={(e) => handleDataChange('dataAtualizacao', e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="linkImagem">Link da Imagem de Capa (opcional)</Label>
              <div className="flex items-center">
                <ExternalLink className="absolute ml-3 h-4 w-4 text-gray-500" />
                <Input
                  id="linkImagem"
                  value={formProtocolo.linkImagem || ''}
                  onChange={(e) => setFormProtocolo({...formProtocolo, linkImagem: e.target.value})}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-gray-500">
                URL da imagem que representa a capa deste protocolo.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição*</Label>
              <Textarea
                id="descricao"
                value={formProtocolo.descricao}
                onChange={(e) => setFormProtocolo({...formProtocolo, descricao: e.target.value})}
                placeholder="Descreva brevemente o conteúdo deste protocolo..."
                rows={4}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="linkPdf">Link do PDF Oficial*</Label>
              <div className="flex items-center">
                <FileText className="absolute ml-3 h-4 w-4 text-gray-500" />
                <Input
                  id="linkPdf"
                  value={formProtocolo.linkPdf}
                  onChange={(e) => setFormProtocolo({...formProtocolo, linkPdf: e.target.value})}
                  placeholder="https://exemplo.com/protocolo.pdf"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-sm text-gray-500">
                URL do documento oficial em formato PDF.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <div className="w-full flex justify-between items-center">
              <p className="text-sm text-gray-500">* Campos obrigatórios</p>
              <div>
                <Button variant="outline" onClick={() => setModalAberto(false)} className="mr-2">
                  Cancelar
                </Button>
                <Button onClick={salvarProtocolo} className="bg-csae-green-600 hover:bg-csae-green-700">
                  {editandoId ? 'Atualizar' : 'Cadastrar'} Protocolo
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GerenciadorProtocolos;
