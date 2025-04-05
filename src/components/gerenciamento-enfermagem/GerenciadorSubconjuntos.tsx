
import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { X, Plus, Pencil, Trash2, Save, Loader2, FileText, FilePlus2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Firebase
import { db } from '@/services/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';

// Tipos
import { NHB, ProtocoloEnfermagem } from '@/services/bancodados/tipos';

const GerenciadorSubconjuntos = () => {
  const { toast } = useToast();
  
  // Estado para NHBs
  const [nhbs, setNhbs] = useState<NHB[]>([]);
  const [modalNhbAberto, setModalNhbAberto] = useState(false);
  const [editandoNhb, setEditandoNhb] = useState(false);
  const [formNhb, setFormNhb] = useState<Partial<NHB>>({
    nome: '',
    descricao: '',
  });
  
  // Estado para Protocolos
  const [protocolos, setProtocolos] = useState<ProtocoloEnfermagem[]>([]);
  const [modalProtocoloAberto, setModalProtocoloAberto] = useState(false);
  const [editandoProtocolo, setEditandoProtocolo] = useState(false);
  const [formProtocolo, setFormProtocolo] = useState<Partial<ProtocoloEnfermagem>>({
    nome: '',
    volume: '',
    descricao: '',
    dataPublicacao: Timestamp.now(),
    linkPdf: '',
    linkImagem: '',
  });
  
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        
        // Carregar NHBs
        const nhbsSnapshot = await getDocs(collection(db, 'nhbs'));
        const nhbsData = nhbsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as NHB[];
        setNhbs(nhbsData);
        
        // Carregar Protocolos
        const protocolosSnapshot = await getDocs(collection(db, 'protocolos'));
        const protocolosData = protocolosSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as ProtocoloEnfermagem[];
        setProtocolos(protocolosData);
        
        setCarregando(false);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível obter os subconjuntos cadastrados.",
          variant: "destructive"
        });
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, [toast]);
  
  // Funções para gerenciar NHBs
  const abrirModalNhb = (editar = false, nhb: NHB | null = null) => {
    if (editar && nhb) {
      setEditandoNhb(true);
      setFormNhb({
        id: nhb.id,
        nome: nhb.nome,
        descricao: nhb.descricao,
      });
    } else {
      setEditandoNhb(false);
      setFormNhb({
        nome: '',
        descricao: '',
      });
    }
    
    setModalNhbAberto(true);
  };
  
  const salvarNhb = async () => {
    if (!formNhb.nome?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome da NHB é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSalvando(true);
      
      if (editandoNhb && formNhb.id) {
        // Atualizar NHB existente
        const nhbRef = doc(db, 'nhbs', formNhb.id);
        await updateDoc(nhbRef, {
          nome: formNhb.nome,
          descricao: formNhb.descricao,
          updatedAt: Timestamp.now()
        });
        
        toast({
          title: "NHB atualizada",
          description: `${formNhb.nome} foi atualizada com sucesso.`
        });
      } else {
        // Criar nova NHB
        const novaNhb = {
          nome: formNhb.nome,
          descricao: formNhb.descricao,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        await addDoc(collection(db, 'nhbs'), novaNhb);
        
        toast({
          title: "NHB cadastrada",
          description: `${formNhb.nome} foi cadastrada com sucesso.`
        });
      }
      
      // Recarregar lista
      const nhbsSnapshot = await getDocs(collection(db, 'nhbs'));
      const nhbsData = nhbsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as NHB[];
      setNhbs(nhbsData);
      
      setModalNhbAberto(false);
    } catch (error) {
      console.error("Erro ao salvar NHB:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a NHB. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };
  
  const excluirNhb = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta NHB? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, 'nhbs', id));
        
        setNhbs(nhbs.filter(nhb => nhb.id !== id));
        
        toast({
          title: "NHB excluída",
          description: "A NHB foi excluída com sucesso."
        });
      } catch (error) {
        console.error("Erro ao excluir NHB:", error);
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir a NHB. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Funções para gerenciar Protocolos
  const abrirModalProtocolo = (editar = false, protocolo: ProtocoloEnfermagem | null = null) => {
    if (editar && protocolo) {
      setEditandoProtocolo(true);
      setFormProtocolo({
        id: protocolo.id,
        nome: protocolo.nome,
        volume: protocolo.volume,
        descricao: protocolo.descricao,
        dataPublicacao: protocolo.dataPublicacao,
        linkPdf: protocolo.linkPdf,
        linkImagem: protocolo.linkImagem
      });
    } else {
      setEditandoProtocolo(false);
      setFormProtocolo({
        nome: '',
        volume: '',
        descricao: '',
        dataPublicacao: Timestamp.now(),
        linkPdf: '',
        linkImagem: ''
      });
    }
    
    setModalProtocoloAberto(true);
  };
  
  const salvarProtocolo = async () => {
    if (!formProtocolo.nome?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do protocolo é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formProtocolo.volume?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O volume do protocolo é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formProtocolo.linkPdf?.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O link do PDF é obrigatório.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSalvando(true);
      
      if (editandoProtocolo && formProtocolo.id) {
        // Atualizar Protocolo existente
        const protocoloRef = doc(db, 'protocolos', formProtocolo.id);
        await updateDoc(protocoloRef, {
          nome: formProtocolo.nome,
          volume: formProtocolo.volume,
          descricao: formProtocolo.descricao,
          dataPublicacao: formProtocolo.dataPublicacao,
          linkPdf: formProtocolo.linkPdf,
          linkImagem: formProtocolo.linkImagem,
          updatedAt: Timestamp.now()
        });
        
        toast({
          title: "Protocolo atualizado",
          description: `${formProtocolo.nome} foi atualizado com sucesso.`
        });
      } else {
        // Criar novo Protocolo
        const novoProtocolo = {
          nome: formProtocolo.nome,
          volume: formProtocolo.volume,
          descricao: formProtocolo.descricao,
          dataPublicacao: formProtocolo.dataPublicacao,
          linkPdf: formProtocolo.linkPdf,
          linkImagem: formProtocolo.linkImagem,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        await addDoc(collection(db, 'protocolos'), novoProtocolo);
        
        toast({
          title: "Protocolo cadastrado",
          description: `${formProtocolo.nome} foi cadastrado com sucesso.`
        });
      }
      
      // Recarregar lista
      const protocolosSnapshot = await getDocs(collection(db, 'protocolos'));
      const protocolosData = protocolosSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as ProtocoloEnfermagem[];
      setProtocolos(protocolosData);
      
      setModalProtocoloAberto(false);
    } catch (error) {
      console.error("Erro ao salvar Protocolo:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o protocolo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSalvando(false);
    }
  };
  
  const excluirProtocolo = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este protocolo? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, 'protocolos', id));
        
        setProtocolos(protocolos.filter(protocolo => protocolo.id !== id));
        
        toast({
          title: "Protocolo excluído",
          description: "O protocolo foi excluído com sucesso."
        });
      } catch (error) {
        console.error("Erro ao excluir protocolo:", error);
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o protocolo. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };

  // Formatar data para exibição
  const formatarData = (timestamp: Timestamp) => {
    const data = timestamp.toDate();
    return data.toLocaleDateString('pt-BR');
  };
  
  return (
    <div className="space-y-8">
      {/* Seção das NHBs */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-csae-green-700">Necessidades Humanas Básicas</h3>
            <p className="text-sm text-gray-500">Gerencie as Necessidades Humanas Básicas para diagnósticos</p>
          </div>
          <Button 
            onClick={() => abrirModalNhb(false)} 
            className="bg-csae-green-600 hover:bg-csae-green-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova NHB
          </Button>
        </div>
        
        {carregando ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-10 w-10 animate-spin text-csae-green-600" />
          </div>
        ) : nhbs.length === 0 ? (
          <div className="text-center py-6 border rounded-md">
            <p className="text-gray-500">Nenhuma Necessidade Humana Básica cadastrada.</p>
            <p className="text-gray-500 mt-2">Clique em "Nova NHB" para começar.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nhbs.map((nhb) => (
                <TableRow key={nhb.id}>
                  <TableCell className="font-medium">{nhb.nome}</TableCell>
                  <TableCell>{nhb.descricao || "—"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => abrirModalNhb(true, nhb)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500" 
                        onClick={() => excluirNhb(nhb.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="border-t my-8"></div>
      
      {/* Seção dos Protocolos */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-csae-green-700">Protocolos de Enfermagem</h3>
            <p className="text-sm text-gray-500">Gerencie os protocolos de enfermagem para diagnósticos</p>
          </div>
          <Button 
            onClick={() => abrirModalProtocolo(false)} 
            className="bg-csae-green-600 hover:bg-csae-green-700"
          >
            <FilePlus2 className="mr-2 h-4 w-4" />
            Novo Protocolo
          </Button>
        </div>
        
        {carregando ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-10 w-10 animate-spin text-csae-green-600" />
          </div>
        ) : protocolos.length === 0 ? (
          <div className="text-center py-6 border rounded-md">
            <p className="text-gray-500">Nenhum protocolo de enfermagem cadastrado.</p>
            <p className="text-gray-500 mt-2">Clique em "Novo Protocolo" para começar.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Volume</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Publicação</TableHead>
                <TableHead>PDF</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {protocolos.map((protocolo) => (
                <TableRow key={protocolo.id}>
                  <TableCell>{protocolo.volume}</TableCell>
                  <TableCell className="font-medium">{protocolo.nome}</TableCell>
                  <TableCell>{protocolo.descricao ? protocolo.descricao.substring(0, 50) + '...' : "—"}</TableCell>
                  <TableCell>{protocolo.dataPublicacao ? formatarData(protocolo.dataPublicacao) : "—"}</TableCell>
                  <TableCell>
                    {protocolo.linkPdf && (
                      <a 
                        href={protocolo.linkPdf} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver PDF
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => abrirModalProtocolo(true, protocolo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500" 
                        onClick={() => excluirProtocolo(protocolo.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      
      {/* Modal para adicionar/editar NHB */}
      <Dialog open={modalNhbAberto} onOpenChange={setModalNhbAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editandoNhb ? 'Editar NHB' : 'Nova NHB'}</DialogTitle>
            <DialogDescription>
              {editandoNhb 
                ? 'Atualize as informações da Necessidade Humana Básica.' 
                : 'Cadastre uma nova Necessidade Humana Básica.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome da NHB</Label>
              <Input 
                id="nome" 
                value={formNhb.nome || ''} 
                onChange={(e) => setFormNhb({...formNhb, nome: e.target.value})} 
                placeholder="Ex: Oxigenação, Hidratação"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea 
                id="descricao" 
                value={formNhb.descricao || ''} 
                onChange={(e) => setFormNhb({...formNhb, descricao: e.target.value})} 
                placeholder="Descreva esta NHB..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalNhbAberto(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={salvarNhb} 
              disabled={salvando}
              className="bg-csae-green-600 hover:bg-csae-green-700"
            >
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para adicionar/editar Protocolo */}
      <Dialog open={modalProtocoloAberto} onOpenChange={setModalProtocoloAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editandoProtocolo ? 'Editar Protocolo' : 'Novo Protocolo'}</DialogTitle>
            <DialogDescription>
              {editandoProtocolo 
                ? 'Atualize as informações do protocolo de enfermagem.' 
                : 'Cadastre um novo protocolo de enfermagem.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="volume">Volume</Label>
                <Input 
                  id="volume" 
                  value={formProtocolo.volume || ''} 
                  onChange={(e) => setFormProtocolo({...formProtocolo, volume: e.target.value})} 
                  placeholder="Ex: V1, V2"
                />
              </div>
              
              <div className="grid gap-2 col-span-2">
                <Label htmlFor="nome">Nome do Protocolo</Label>
                <Input 
                  id="nome" 
                  value={formProtocolo.nome || ''} 
                  onChange={(e) => setFormProtocolo({...formProtocolo, nome: e.target.value})} 
                  placeholder="Nome do protocolo"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea 
                id="descricao" 
                value={formProtocolo.descricao || ''} 
                onChange={(e) => setFormProtocolo({...formProtocolo, descricao: e.target.value})} 
                placeholder="Descrição do protocolo"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="linkPdf">Link do PDF</Label>
              <Input 
                id="linkPdf" 
                value={formProtocolo.linkPdf || ''} 
                onChange={(e) => setFormProtocolo({...formProtocolo, linkPdf: e.target.value})} 
                placeholder="URL do PDF"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="linkImagem">Link da Imagem (opcional)</Label>
              <Input 
                id="linkImagem" 
                value={formProtocolo.linkImagem || ''} 
                onChange={(e) => setFormProtocolo({...formProtocolo, linkImagem: e.target.value})} 
                placeholder="URL da imagem de capa"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalProtocoloAberto(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={salvarProtocolo} 
              disabled={salvando}
              className="bg-csae-green-600 hover:bg-csae-green-700"
            >
              {salvando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciadorSubconjuntos;
