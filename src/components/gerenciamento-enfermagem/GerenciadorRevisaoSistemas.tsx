
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

interface ValorReferencia {
  idadeMinima?: number;
  idadeMaxima?: number;
  sexo?: 'Masculino' | 'Feminino' | 'Todos';
  valorReferencia: string;
  nhbVinculada?: string;
}

interface ParametroSistema {
  id?: string;
  nome: string;
  sistemaId: string;
  diferencaSexoIdade: boolean;
  valoresReferencia: ValorReferencia[];
  createdAt?: any;
  updatedAt?: any;
}

interface Sistema {
  id?: string;
  nome: string;
  descricao?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface NHB {
  id: string;
  nome: string;
}

const GerenciadorRevisaoSistemas = () => {
  const { toast } = useToast();
  const [sistemas, setSistemas] = useState<Sistema[]>([]);
  const [parametros, setParametros] = useState<ParametroSistema[]>([]);
  const [nhbs, setNhbs] = useState<NHB[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [activeTab, setActiveTab] = useState("sistemas");
  
  // Modais e estados de edição
  const [modalSistema, setModalSistema] = useState(false);
  const [modalParametro, setModalParametro] = useState(false);
  const [editandoSistemaId, setEditandoSistemaId] = useState<string | null>(null);
  const [editandoParametroId, setEditandoParametroId] = useState<string | null>(null);
  
  // Formulários
  const [formSistema, setFormSistema] = useState<Sistema>({
    nome: '',
    descricao: ''
  });
  
  const [formParametro, setFormParametro] = useState<ParametroSistema>({
    nome: '',
    sistemaId: '',
    diferencaSexoIdade: false,
    valoresReferencia: [{ valorReferencia: '' }]
  });
  
  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar sistemas
        const sistemasRef = collection(db, 'sistemasRevisao');
        const sistemasSnapshot = await getDocs(sistemasRef);
        const sistemasData = sistemasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Sistema[];
        setSistemas(sistemasData);
        
        // Carregar parâmetros
        const parametrosRef = collection(db, 'parametrosSistemas');
        const parametrosSnapshot = await getDocs(parametrosRef);
        const parametrosData = parametrosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ParametroSistema[];
        setParametros(parametrosData);
        
        // Carregar NHBs
        const nhbsRef = collection(db, 'nhbs');
        const nhbsSnapshot = await getDocs(nhbsRef);
        const nhbsData = nhbsSnapshot.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome
        })) as NHB[];
        setNhbs(nhbsData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os sistemas e parâmetros.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, [toast]);
  
  // === Funções para gerenciar Sistemas ===
  
  // Abrir modal para criar novo sistema
  const abrirModalCriarSistema = () => {
    setFormSistema({
      nome: '',
      descricao: ''
    });
    setEditandoSistemaId(null);
    setModalSistema(true);
  };
  
  // Abrir modal para editar sistema existente
  const abrirModalEditarSistema = (sistema: Sistema) => {
    setFormSistema({...sistema});
    setEditandoSistemaId(sistema.id || null);
    setModalSistema(true);
  };
  
  // Salvar sistema (criar novo ou atualizar existente)
  const salvarSistema = async () => {
    try {
      if (!formSistema.nome.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Nome do sistema é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      
      if (editandoSistemaId) {
        // Atualizar existente
        const sistemaRef = doc(db, 'sistemasRevisao', editandoSistemaId);
        await updateDoc(sistemaRef, {
          ...formSistema,
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "Sistema atualizado",
          description: `${formSistema.nome} foi atualizado com sucesso.`
        });
        
        // Atualizar lista
        setSistemas(prev => 
          prev.map(s => s.id === editandoSistemaId ? {...formSistema, id: editandoSistemaId, updatedAt: new Date()} : s)
        );
      } else {
        // Criar novo
        const novoSistema = {
          ...formSistema,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'sistemasRevisao'), novoSistema);
        
        toast({
          title: "Sistema criado",
          description: `${formSistema.nome} foi criado com sucesso.`
        });
        
        // Adicionar à lista
        setSistemas(prev => [...prev, {...novoSistema, id: docRef.id, createdAt: new Date(), updatedAt: new Date()}]);
      }
      
      setModalSistema(false);
    } catch (error) {
      console.error("Erro ao salvar sistema:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o sistema.",
        variant: "destructive"
      });
    }
  };
  
  // Excluir sistema
  const excluirSistema = async (id: string) => {
    // Verificar se existem parâmetros vinculados a este sistema
    const parametrosVinculados = parametros.some(p => p.sistemaId === id);
    
    if (parametrosVinculados) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir este sistema pois existem parâmetros vinculados a ele.",
        variant: "destructive"
      });
      return;
    }
    
    if (confirm("Tem certeza que deseja excluir este sistema? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'sistemasRevisao', id));
        
        toast({
          title: "Sistema excluído",
          description: "O sistema foi excluído com sucesso."
        });
        
        // Remover da lista
        setSistemas(prev => prev.filter(s => s.id !== id));
      } catch (error) {
        console.error("Erro ao excluir sistema:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o sistema.",
          variant: "destructive"
        });
      }
    }
  };
  
  // === Funções para gerenciar Parâmetros ===
  
  // Abrir modal para criar novo parâmetro
  const abrirModalCriarParametro = () => {
    setFormParametro({
      nome: '',
      sistemaId: sistemas.length > 0 ? sistemas[0].id! : '',
      diferencaSexoIdade: false,
      valoresReferencia: [{ valorReferencia: '' }]
    });
    setEditandoParametroId(null);
    setModalParametro(true);
  };
  
  // Abrir modal para editar parâmetro existente
  const abrirModalEditarParametro = (parametro: ParametroSistema) => {
    setFormParametro({...parametro});
    setEditandoParametroId(parametro.id || null);
    setModalParametro(true);
  };
  
  // Adicionar valor de referência
  const adicionarValorReferencia = () => {
    setFormParametro({
      ...formParametro,
      valoresReferencia: [
        ...formParametro.valoresReferencia,
        { valorReferencia: '' }
      ]
    });
  };
  
  // Remover valor de referência
  const removerValorReferencia = (index: number) => {
    const novosValores = [...formParametro.valoresReferencia];
    novosValores.splice(index, 1);
    setFormParametro({
      ...formParametro,
      valoresReferencia: novosValores
    });
  };
  
  // Atualizar valor de referência
  const atualizarValorReferencia = (index: number, campo: keyof ValorReferencia, valor: any) => {
    const novosValores = [...formParametro.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      [campo]: valor
    };
    setFormParametro({
      ...formParametro,
      valoresReferencia: novosValores
    });
  };
  
  // Salvar parâmetro (criar novo ou atualizar existente)
  const salvarParametro = async () => {
    try {
      if (!formParametro.nome.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Nome do parâmetro é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      
      if (!formParametro.sistemaId) {
        toast({
          title: "Campo obrigatório",
          description: "Selecione um sistema para o parâmetro.",
          variant: "destructive"
        });
        return;
      }
      
      if (formParametro.valoresReferencia.some(vr => !vr.valorReferencia.trim())) {
        toast({
          title: "Campo obrigatório",
          description: "Valor de referência é obrigatório para todos os itens.",
          variant: "destructive"
        });
        return;
      }
      
      if (editandoParametroId) {
        // Atualizar existente
        const parametroRef = doc(db, 'parametrosSistemas', editandoParametroId);
        await updateDoc(parametroRef, {
          ...formParametro,
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "Parâmetro atualizado",
          description: `${formParametro.nome} foi atualizado com sucesso.`
        });
        
        // Atualizar lista
        setParametros(prev => 
          prev.map(p => p.id === editandoParametroId ? {...formParametro, id: editandoParametroId, updatedAt: new Date()} : p)
        );
      } else {
        // Criar novo
        const novoParametro = {
          ...formParametro,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'parametrosSistemas'), novoParametro);
        
        toast({
          title: "Parâmetro criado",
          description: `${formParametro.nome} foi criado com sucesso.`
        });
        
        // Adicionar à lista
        setParametros(prev => [...prev, {...novoParametro, id: docRef.id, createdAt: new Date(), updatedAt: new Date()}]);
      }
      
      setModalParametro(false);
    } catch (error) {
      console.error("Erro ao salvar parâmetro:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o parâmetro.",
        variant: "destructive"
      });
    }
  };
  
  // Excluir parâmetro
  const excluirParametro = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este parâmetro? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'parametrosSistemas', id));
        
        toast({
          title: "Parâmetro excluído",
          description: "O parâmetro foi excluído com sucesso."
        });
        
        // Remover da lista
        setParametros(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        console.error("Erro ao excluir parâmetro:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o parâmetro.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Obter nome do sistema pelo ID
  const getNomeSistema = (id: string) => {
    const sistema = sistemas.find(s => s.id === id);
    return sistema ? sistema.nome : 'Sistema não encontrado';
  };
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="sistemas">Sistemas do Corpo</TabsTrigger>
        <TabsTrigger value="parametros">Parâmetros de Avaliação</TabsTrigger>
      </TabsList>
      
      <TabsContent value="sistemas">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Gerenciamento de Sistemas do Corpo</span>
              <Button onClick={abrirModalCriarSistema} className="bg-csae-green-600 hover:bg-csae-green-700">
                <Plus className="mr-2 h-4 w-4" /> Novo Sistema
              </Button>
            </CardTitle>
            <CardDescription>
              Cadastre os sistemas do corpo humano que serão avaliados no processo de enfermagem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {carregando ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
              </div>
            ) : sistemas.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Nenhum sistema cadastrado. Clique em "Novo Sistema" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Sistema</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Parâmetros</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sistemas.map((sistema) => {
                    const parametrosDoSistema = parametros.filter(p => p.sistemaId === sistema.id);
                    return (
                      <TableRow key={sistema.id}>
                        <TableCell className="font-medium">{sistema.nome}</TableCell>
                        <TableCell>{sistema.descricao || '-'}</TableCell>
                        <TableCell>{parametrosDoSistema.length}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => abrirModalEditarSistema(sistema)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => excluirSistema(sistema.id!)}
                            disabled={parametrosDoSistema.length > 0}
                            title={parametrosDoSistema.length > 0 ? "Não é possível excluir sistemas com parâmetros vinculados" : ""}
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
      </TabsContent>
      
      <TabsContent value="parametros">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Gerenciamento de Parâmetros de Avaliação</span>
              <Button 
                onClick={abrirModalCriarParametro} 
                className="bg-csae-green-600 hover:bg-csae-green-700"
                disabled={sistemas.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" /> Novo Parâmetro
              </Button>
            </CardTitle>
            <CardDescription>
              Cadastre os parâmetros de avaliação para cada sistema do corpo humano.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {carregando ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
              </div>
            ) : sistemas.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Nenhum sistema cadastrado. Cadastre sistemas primeiro antes de adicionar parâmetros.
              </div>
            ) : parametros.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Nenhum parâmetro cadastrado. Clique em "Novo Parâmetro" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Parâmetro</TableHead>
                    <TableHead>Diferencia por Sexo/Idade</TableHead>
                    <TableHead>Valores de Referência</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parametros.map((parametro) => (
                    <TableRow key={parametro.id}>
                      <TableCell>{getNomeSistema(parametro.sistemaId)}</TableCell>
                      <TableCell className="font-medium">{parametro.nome}</TableCell>
                      <TableCell>
                        {parametro.diferencaSexoIdade ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>{parametro.valoresReferencia.length} valores configurados</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => abrirModalEditarParametro(parametro)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => excluirParametro(parametro.id!)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      {/* Modal para criar/editar sistema */}
      <Dialog open={modalSistema} onOpenChange={setModalSistema}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editandoSistemaId ? 'Editar' : 'Novo'} Sistema do Corpo</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editandoSistemaId ? 'atualizar o' : 'cadastrar um novo'} sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Sistema</Label>
              <Input
                id="nome"
                value={formSistema.nome}
                onChange={(e) => setFormSistema({...formSistema, nome: e.target.value})}
                placeholder="Ex: Sistema Cardiovascular"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={formSistema.descricao || ''}
                onChange={(e) => setFormSistema({...formSistema, descricao: e.target.value})}
                placeholder="Descreva brevemente este sistema"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalSistema(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarSistema} className="bg-csae-green-600 hover:bg-csae-green-700">
              {editandoSistemaId ? 'Atualizar' : 'Cadastrar'} Sistema
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para criar/editar parâmetro */}
      <Dialog open={modalParametro} onOpenChange={setModalParametro}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoParametroId ? 'Editar' : 'Novo'} Parâmetro de Avaliação</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editandoParametroId ? 'atualizar o' : 'cadastrar um novo'} parâmetro.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sistema">Sistema do Corpo</Label>
              <Select
                value={formParametro.sistemaId}
                onValueChange={(v) => setFormParametro({...formParametro, sistemaId: v})}
                disabled={sistemas.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um sistema" />
                </SelectTrigger>
                <SelectContent>
                  {sistemas.map((sistema) => (
                    <SelectItem key={sistema.id} value={sistema.id!}>
                      {sistema.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Parâmetro</Label>
              <Input
                id="nome"
                value={formParametro.nome}
                onChange={(e) => setFormParametro({...formParametro, nome: e.target.value})}
                placeholder="Ex: Frequência Cardíaca"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="diferencaSexoIdade">Diferencia por Sexo/Idade</Label>
              <Switch
                id="diferencaSexoIdade"
                checked={formParametro.diferencaSexoIdade}
                onCheckedChange={(checked) => setFormParametro({...formParametro, diferencaSexoIdade: checked})}
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Valores de Referência</Label>
                <Button type="button" variant="outline" size="sm" onClick={adicionarValorReferencia}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Valor
                </Button>
              </div>
              
              {formParametro.valoresReferencia.map((valor, index) => (
                <Card key={index} className="p-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Valor de Referência #{index + 1}</h4>
                      {formParametro.valoresReferencia.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerValorReferencia(index)}
                          className="h-7 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {formParametro.diferencaSexoIdade && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-2">
                            <Label>Idade Mínima (anos)</Label>
                            <Input
                              type="number"
                              value={valor.idadeMinima || ''}
                              onChange={(e) => atualizarValorReferencia(index, 'idadeMinima', Number(e.target.value))}
                              placeholder="Ex: 18"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label>Idade Máxima (anos)</Label>
                            <Input
                              type="number"
                              value={valor.idadeMaxima || ''}
                              onChange={(e) => atualizarValorReferencia(index, 'idadeMaxima', Number(e.target.value))}
                              placeholder="Ex: 65"
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label>Sexo</Label>
                          <Select
                            value={valor.sexo || 'Todos'}
                            onValueChange={(v) => atualizarValorReferencia(index, 'sexo', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Todos">Todos</SelectItem>
                              <SelectItem value="Masculino">Masculino</SelectItem>
                              <SelectItem value="Feminino">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    <div className="grid gap-2">
                      <Label>Valor de Referência</Label>
                      <Textarea
                        value={valor.valorReferencia}
                        onChange={(e) => atualizarValorReferencia(index, 'valorReferencia', e.target.value)}
                        placeholder="Ex: Normal: ausência de dor, sem alterações de ritmo, frequência entre 60-100 bpm"
                        required
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>NHB Vinculada</Label>
                      <Select
                        value={valor.nhbVinculada || ''}
                        onValueChange={(v) => atualizarValorReferencia(index, 'nhbVinculada', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma NHB" />
                        </SelectTrigger>
                        <SelectContent>
                          {nhbs.map((nhb) => (
                            <SelectItem key={nhb.id} value={nhb.id}>
                              {nhb.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalParametro(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarParametro} className="bg-csae-green-600 hover:bg-csae-green-700">
              {editandoParametroId ? 'Atualizar' : 'Cadastrar'} Parâmetro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default GerenciadorRevisaoSistemas;
