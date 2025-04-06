
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Check, Eye, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Intervencao, ResultadoEsperado, Subconjunto } from '@/services/bancodados/tipos';

interface DiagnosticoEnfermagem {
  id?: string;
  nome: string;
  explicacao?: string;
  subconjuntoId: string;
  resultadosEsperados: ResultadoEsperado[];
  createdAt?: any;
  updatedAt?: any;
}

const GerenciadorDiagnosticos = () => {
  const { toast } = useToast();
  const [subconjuntos, setSubconjuntos] = useState<Subconjunto[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoEnfermagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [activeTab, setActiveTab] = useState("subconjuntos");
  
  // Filtros
  const [filtroTipoSubconjunto, setFiltroTipoSubconjunto] = useState<'todos' | 'Protocolo' | 'NHB'>('todos');
  const [filtroSubconjunto, setFiltroSubconjunto] = useState<string>('');
  const [filtroDiagnostico, setFiltroDiagnostico] = useState<string>('');
  const [termoBusca, setTermoBusca] = useState('');
  
  // Modais e estados de edição
  const [modalSubconjunto, setModalSubconjunto] = useState(false);
  const [modalDiagnostico, setModalDiagnostico] = useState(false);
  const [modalVisualizarDiagnostico, setModalVisualizarDiagnostico] = useState(false);
  const [editandoSubconjuntoId, setEditandoSubconjuntoId] = useState<string | null>(null);
  const [editandoDiagnosticoId, setEditandoDiagnosticoId] = useState<string | null>(null);
  const [diagnosticoParaVisualizar, setDiagnosticoParaVisualizar] = useState<DiagnosticoEnfermagem | null>(null);
  
  // Formulários
  const [formSubconjunto, setFormSubconjunto] = useState<Subconjunto>({
    nome: '',
    tipo: 'Protocolo',
    descricao: ''
  });
  
  const emptyResultado: ResultadoEsperado = {
    descricao: '',
    intervencoes: [{
      verboPrimeiraEnfermeiro: '',
      verboOutraPessoa: '',
      descricaoRestante: '',
      nomeDocumento: '',
      linkDocumento: ''
    }]
  };
  
  const [formDiagnostico, setFormDiagnostico] = useState<DiagnosticoEnfermagem>({
    nome: '',
    explicacao: '',
    subconjuntoId: '',
    resultadosEsperados: [{ ...emptyResultado }]
  });
  
  const [tipoSubconjuntoSelecionado, setTipoSubconjuntoSelecionado] = useState<'Protocolo' | 'NHB'>('Protocolo');
  const [subconjuntosFiltrados, setSubconjuntosFiltrados] = useState<Subconjunto[]>([]);
  
  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar subconjuntos
        const subconjuntosRef = collection(db, 'subconjuntosDiagnosticos');
        const subconjuntosSnapshot = await getDocs(subconjuntosRef);
        const subconjuntosData = subconjuntosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Subconjunto[];
        setSubconjuntos(subconjuntosData);
        
        // Carregar diagnósticos
        const diagnosticosRef = collection(db, 'diagnosticosEnfermagem');
        const diagnosticosSnapshot = await getDocs(diagnosticosRef);
        const diagnosticosData = diagnosticosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DiagnosticoEnfermagem[];
        setDiagnosticos(diagnosticosData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os subconjuntos e diagnósticos.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, [toast]);
  
  // Filtrar subconjuntos baseado no tipo selecionado
  useEffect(() => {
    if (tipoSubconjuntoSelecionado) {
      const filtrados = subconjuntos.filter(s => s.tipo === tipoSubconjuntoSelecionado);
      // Ordenar em ordem alfabética pelo nome
      filtrados.sort((a, b) => a.nome.localeCompare(b.nome));
      setSubconjuntosFiltrados(filtrados);
    } else {
      setSubconjuntosFiltrados([]);
    }
  }, [tipoSubconjuntoSelecionado, subconjuntos]);
  
  // === Funções para gerenciar Subconjuntos ===
  
  // Abrir modal para criar novo subconjunto
  const abrirModalCriarSubconjunto = () => {
    setFormSubconjunto({
      nome: '',
      tipo: 'Protocolo',
      descricao: ''
    });
    setEditandoSubconjuntoId(null);
    setModalSubconjunto(true);
  };
  
  // Abrir modal para editar subconjunto existente
  const abrirModalEditarSubconjunto = (subconjunto: Subconjunto) => {
    setFormSubconjunto({...subconjunto});
    setEditandoSubconjuntoId(subconjunto.id || null);
    setModalSubconjunto(true);
  };
  
  // Salvar subconjunto (criar novo ou atualizar existente)
  const salvarSubconjunto = async () => {
    try {
      if (!formSubconjunto.nome.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Nome do subconjunto é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      
      if (editandoSubconjuntoId) {
        // Atualizar existente
        const subconjuntoRef = doc(db, 'subconjuntosDiagnosticos', editandoSubconjuntoId);
        await updateDoc(subconjuntoRef, {
          ...formSubconjunto,
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "Subconjunto atualizado",
          description: `${formSubconjunto.nome} foi atualizado com sucesso.`
        });
        
        // Atualizar lista
        setSubconjuntos(prev => 
          prev.map(s => s.id === editandoSubconjuntoId ? {...formSubconjunto, id: editandoSubconjuntoId, updatedAt: new Date()} : s)
        );
      } else {
        // Criar novo
        const novoSubconjunto = {
          ...formSubconjunto,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'subconjuntosDiagnosticos'), novoSubconjunto);
        
        toast({
          title: "Subconjunto criado",
          description: `${formSubconjunto.nome} foi criado com sucesso.`
        });
        
        // Adicionar à lista
        setSubconjuntos(prev => [...prev, {...novoSubconjunto, id: docRef.id, createdAt: new Date(), updatedAt: new Date()}]);
      }
      
      setModalSubconjunto(false);
    } catch (error) {
      console.error("Erro ao salvar subconjunto:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o subconjunto.",
        variant: "destructive"
      });
    }
  };
  
  // Excluir subconjunto
  const excluirSubconjunto = async (id: string) => {
    // Verificar se existem diagnósticos vinculados a este subconjunto
    const diagnosticosVinculados = diagnosticos.some(d => d.subconjuntoId === id);
    
    if (diagnosticosVinculados) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir este subconjunto pois existem diagnósticos vinculados a ele.",
        variant: "destructive"
      });
      return;
    }
    
    if (confirm("Tem certeza que deseja excluir este subconjunto? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'subconjuntosDiagnosticos', id));
        
        toast({
          title: "Subconjunto excluído",
          description: "O subconjunto foi excluído com sucesso."
        });
        
        // Remover da lista
        setSubconjuntos(prev => prev.filter(s => s.id !== id));
      } catch (error) {
        console.error("Erro ao excluir subconjunto:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o subconjunto.",
          variant: "destructive"
        });
      }
    }
  };
  
  // === Funções para gerenciar Diagnósticos ===
  
  // Abrir modal para criar novo diagnóstico
  const abrirModalCriarDiagnostico = () => {
    setTipoSubconjuntoSelecionado('Protocolo');
    
    setFormDiagnostico({
      nome: '',
      explicacao: '',
      subconjuntoId: '',
      resultadosEsperados: [{ ...emptyResultado }]
    });
    
    setEditandoDiagnosticoId(null);
    setModalDiagnostico(true);
  };
  
  // Abrir modal para editar diagnóstico existente
  const abrirModalEditarDiagnostico = (diagnostico: DiagnosticoEnfermagem) => {
    // Determinar o tipo do subconjunto selecionado
    const subconjunto = subconjuntos.find(s => s.id === diagnostico.subconjuntoId);
    if (subconjunto) {
      setTipoSubconjuntoSelecionado(subconjunto.tipo);
    }
    
    setFormDiagnostico({...diagnostico});
    setEditandoDiagnosticoId(diagnostico.id || null);
    setModalDiagnostico(true);
  };
  
  // Abrir modal para visualizar diagnóstico
  const abrirModalVisualizarDiagnostico = (diagnostico: DiagnosticoEnfermagem) => {
    setDiagnosticoParaVisualizar(diagnostico);
    setModalVisualizarDiagnostico(true);
  };
  
  // Adicionar resultado esperado
  const adicionarResultadoEsperado = () => {
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: [
        ...formDiagnostico.resultadosEsperados,
        { ...emptyResultado }
      ]
    });
  };
  
  // Remover resultado esperado
  const removerResultadoEsperado = (index: number) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados.splice(index, 1);
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  };
  
  // Atualizar resultado esperado
  const atualizarResultadoEsperado = (index: number, campo: keyof ResultadoEsperado, valor: any) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados[index] = {
      ...novosResultados[index],
      [campo]: valor
    };
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  };
  
  // Adicionar intervenção a um resultado esperado
  const adicionarIntervencao = (resultadoIndex: number) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes.push({
      verboPrimeiraEnfermeiro: '',
      verboOutraPessoa: '',
      descricaoRestante: '',
      nomeDocumento: '',
      linkDocumento: ''
    });
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  };
  
  // Remover intervenção de um resultado esperado
  const removerIntervencao = (resultadoIndex: number, intervencaoIndex: number) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes.splice(intervencaoIndex, 1);
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  };
  
  // Atualizar intervenção
  const atualizarIntervencao = (resultadoIndex: number, intervencaoIndex: number, campo: keyof Intervencao, valor: string) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes[intervencaoIndex] = {
      ...novosResultados[resultadoIndex].intervencoes[intervencaoIndex],
      [campo]: valor
    };
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  };
  
  // Salvar diagnóstico (criar novo ou atualizar existente)
  const salvarDiagnostico = async () => {
    try {
      if (!formDiagnostico.nome.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Nome do diagnóstico é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      
      if (!formDiagnostico.subconjuntoId) {
        toast({
          title: "Campo obrigatório",
          description: "Selecione um subconjunto para o diagnóstico.",
          variant: "destructive"
        });
        return;
      }
      
      // Validar resultados esperados
      for (let i = 0; i < formDiagnostico.resultadosEsperados.length; i++) {
        const resultado = formDiagnostico.resultadosEsperados[i];
        
        if (!resultado.descricao.trim()) {
          toast({
            title: "Campo obrigatório",
            description: `O resultado esperado #${i + 1} não possui descrição.`,
            variant: "destructive"
          });
          return;
        }
        
        // Validar intervenções
        for (let j = 0; j < resultado.intervencoes.length; j++) {
          const intervencao = resultado.intervencoes[j];
          
          if (!intervencao.verboPrimeiraEnfermeiro.trim() || !intervencao.verboOutraPessoa.trim() || !intervencao.descricaoRestante.trim()) {
            toast({
              title: "Campos obrigatórios",
              description: `A intervenção #${j + 1} do resultado esperado #${i + 1} está incompleta.`,
              variant: "destructive"
            });
            return;
          }
          
          // Adicionar os campos concatenados
          intervencao.intervencaoEnfermeiro = `${intervencao.verboPrimeiraEnfermeiro} ${intervencao.descricaoRestante}`;
          intervencao.intervencaoInfinitivo = `${intervencao.verboOutraPessoa} ${intervencao.descricaoRestante}`;
          
          // Remover campos vazios para não salvar no Firestore
          if (!intervencao.nomeDocumento?.trim()) {
            delete intervencao.nomeDocumento;
          }
          if (!intervencao.linkDocumento?.trim()) {
            delete intervencao.linkDocumento;
          }
        }
      }
      
      if (editandoDiagnosticoId) {
        // Atualizar existente
        const diagnosticoRef = doc(db, 'diagnosticosEnfermagem', editandoDiagnosticoId);
        await updateDoc(diagnosticoRef, {
          ...formDiagnostico,
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "Diagnóstico atualizado",
          description: `${formDiagnostico.nome} foi atualizado com sucesso.`
        });
        
        // Atualizar lista
        setDiagnosticos(prev => 
          prev.map(d => d.id === editandoDiagnosticoId ? {...formDiagnostico, id: editandoDiagnosticoId, updatedAt: new Date()} : d)
        );
      } else {
        // Criar novo
        const novoDiagnostico = {
          ...formDiagnostico,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'diagnosticosEnfermagem'), novoDiagnostico);
        
        toast({
          title: "Diagnóstico criado",
          description: `${formDiagnostico.nome} foi criado com sucesso.`
        });
        
        // Adicionar à lista
        setDiagnosticos(prev => [...prev, {...novoDiagnostico, id: docRef.id, createdAt: new Date(), updatedAt: new Date()}]);
      }
      
      setModalDiagnostico(false);
    } catch (error) {
      console.error("Erro ao salvar diagnóstico:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o diagnóstico.",
        variant: "destructive"
      });
    }
  };
  
  // Excluir diagnóstico
  const excluirDiagnostico = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este diagnóstico? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'diagnosticosEnfermagem', id));
        
        toast({
          title: "Diagnóstico excluído",
          description: "O diagnóstico foi excluído com sucesso."
        });
        
        // Remover da lista
        setDiagnosticos(prev => prev.filter(d => d.id !== id));
      } catch (error) {
        console.error("Erro ao excluir diagnóstico:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o diagnóstico.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Obter nome do subconjunto pelo ID
  const getNomeSubconjunto = (id: string) => {
    const subconjunto = subconjuntos.find(s => s.id === id);
    return subconjunto ? subconjunto.nome : 'Subconjunto não encontrado';
  };
  
  // Obter tipo do subconjunto pelo ID
  const getTipoSubconjunto = (id: string) => {
    const subconjunto = subconjuntos.find(s => s.id === id);
    return subconjunto ? subconjunto.tipo : 'Desconhecido';
  };
  
  // Filtrar subconjuntos baseado no tipo selecionado (para exibição na lista)
  const getSubconjuntosFiltrados = () => {
    if (filtroTipoSubconjunto === 'todos') {
      return subconjuntos;
    } else {
      return subconjuntos.filter(s => s.tipo === filtroTipoSubconjunto);
    }
  };
  
  // Filtrar diagnósticos baseado nos filtros selecionados
  const getDiagnosticosFiltrados = () => {
    let filtrados = [...diagnosticos];
    
    // Filtrar por subconjunto
    if (filtroSubconjunto) {
      filtrados = filtrados.filter(d => d.subconjuntoId === filtroSubconjunto);
    }
    
    // Filtrar por ID específico
    if (filtroDiagnostico) {
      filtrados = filtrados.filter(d => d.id === filtroDiagnostico);
    }
    
    // Filtrar por termo de busca
    if (termoBusca.trim()) {
      const termo = termoBusca.toLowerCase().trim();
      filtrados = filtrados.filter(d => d.nome.toLowerCase().includes(termo));
    }
    
    return filtrados;
  };
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="subconjuntos">Subconjuntos</TabsTrigger>
        <TabsTrigger value="diagnosticos">Diagnósticos de Enfermagem</TabsTrigger>
      </TabsList>
      
      <TabsContent value="subconjuntos">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Gerenciamento de Subconjuntos</span>
              <Button onClick={abrirModalCriarSubconjunto} className="bg-csae-green-600 hover:bg-csae-green-700">
                <Plus className="mr-2 h-4 w-4" /> Novo Subconjunto
              </Button>
            </CardTitle>
            <CardDescription>
              Cadastre os subconjuntos (Protocolos e NHBs) para organizar os diagnósticos de enfermagem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Label>Filtrar por tipo:</Label>
              <Select value={filtroTipoSubconjunto} onValueChange={(v) => setFiltroTipoSubconjunto(v as 'todos' | 'Protocolo' | 'NHB')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione um tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="Protocolo">Protocolo</SelectItem>
                  <SelectItem value="NHB">NHB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {carregando ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
              </div>
            ) : getSubconjuntosFiltrados().length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                {filtroTipoSubconjunto !== 'todos' 
                  ? `Nenhum subconjunto do tipo ${filtroTipoSubconjunto} cadastrado.` 
                  : 'Nenhum subconjunto cadastrado. Clique em "Novo Subconjunto" para começar.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Subconjunto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Diagnósticos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSubconjuntosFiltrados().map((subconjunto) => {
                    const diagnosticosDoSubconjunto = diagnosticos.filter(d => d.subconjuntoId === subconjunto.id);
                    return (
                      <TableRow key={subconjunto.id}>
                        <TableCell className="font-medium">{subconjunto.nome}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            subconjunto.tipo === 'Protocolo' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {subconjunto.tipo}
                          </span>
                        </TableCell>
                        <TableCell>{subconjunto.descricao || '-'}</TableCell>
                        <TableCell>{diagnosticosDoSubconjunto.length}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-2" onClick={() => abrirModalEditarSubconjunto(subconjunto)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => excluirSubconjunto(subconjunto.id!)}
                            disabled={diagnosticosDoSubconjunto.length > 0}
                            title={diagnosticosDoSubconjunto.length > 0 ? "Não é possível excluir subconjuntos com diagnósticos vinculados" : ""}
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
      
      <TabsContent value="diagnosticos">
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
              Cadastre os diagnósticos de enfermagem com seus resultados esperados e intervenções.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="filtroSubconjunto" className="mb-2 block">Filtrar por Subconjunto</Label>
                  <Select value={filtroSubconjunto} onValueChange={setFiltroSubconjunto}>
                    <SelectTrigger id="filtroSubconjunto">
                      <SelectValue placeholder="Todos os subconjuntos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os subconjuntos</SelectItem>
                      {subconjuntos.map((subconjunto) => (
                        <SelectItem key={subconjunto.id} value={subconjunto.id!}>
                          {subconjunto.nome} ({subconjunto.tipo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Label htmlFor="filtroDiagnostico" className="mb-2 block">Filtrar por Diagnóstico</Label>
                  <Select value={filtroDiagnostico} onValueChange={setFiltroDiagnostico} disabled={filtroSubconjunto === ''}>
                    <SelectTrigger id="filtroDiagnostico">
                      <SelectValue placeholder="Todos os diagnósticos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os diagnósticos</SelectItem>
                      {diagnosticos
                        .filter(d => filtroSubconjunto === '' || d.subconjuntoId === filtroSubconjunto)
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
                Nenhum subconjunto cadastrado. Cadastre subconjuntos primeiro antes de adicionar diagnósticos.
              </div>
            ) : getDiagnosticosFiltrados().length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                {(filtroSubconjunto || filtroDiagnostico || termoBusca) 
                  ? 'Nenhum diagnóstico encontrado com os filtros aplicados.' 
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
                    const totalIntervencoes = diagnostico.resultadosEsperados.reduce(
                      (total, resultado) => total + resultado.intervencoes.length, 0
                    );
                    
                    return (
                      <TableRow key={diagnostico.id}>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            getTipoSubconjunto(diagnostico.subconjuntoId) === 'Protocolo' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {getNomeSubconjunto(diagnostico.subconjuntoId)}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{diagnostico.nome}</TableCell>
                        <TableCell>{diagnostico.resultadosEsperados.length}</TableCell>
                        <TableCell>{totalIntervencoes}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="mr-1" onClick={() => abrirModalVisualizarDiagnostico(diagnostico)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="mr-1" onClick={() => abrirModalEditarDiagnostico(diagnostico)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => excluirDiagnostico(diagnostico.id!)}>
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
      
      {/* Modal para criar/editar subconjunto */}
      <Dialog open={modalSubconjunto} onOpenChange={setModalSubconjunto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editandoSubconjuntoId ? 'Editar' : 'Novo'} Subconjunto</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editandoSubconjuntoId ? 'atualizar o' : 'cadastrar um novo'} subconjunto.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Subconjunto</Label>
              <Input
                id="nome"
                value={formSubconjunto.nome}
                onChange={(e) => setFormSubconjunto({...formSubconjunto, nome: e.target.value})}
                placeholder="Ex: Necessidades Psicobiológicas"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Subconjunto</Label>
              <Select
                value={formSubconjunto.tipo}
                onValueChange={(v) => setFormSubconjunto({...formSubconjunto, tipo: v as 'Protocolo' | 'NHB'})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Protocolo">Protocolo</SelectItem>
                  <SelectItem value="NHB">Necessidade Humana Básica (NHB)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={formSubconjunto.descricao || ''}
                onChange={(e) => setFormSubconjunto({...formSubconjunto, descricao: e.target.value})}
                placeholder="Descreva brevemente este subconjunto"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalSubconjunto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarSubconjunto} className="bg-csae-green-600 hover:bg-csae-green-700">
              {editandoSubconjuntoId ? 'Atualizar' : 'Cadastrar'} Subconjunto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para criar/editar diagnóstico */}
      <Dialog open={modalDiagnostico} onOpenChange={setModalDiagnostico}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoDiagnosticoId ? 'Editar' : 'Novo'} Diagnóstico de Enfermagem</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editandoDiagnosticoId ? 'atualizar o' : 'cadastrar um novo'} diagnóstico.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tipoSubconjunto">Tipo de Subconjunto</Label>
                <Select
                  value={tipoSubconjuntoSelecionado}
                  onValueChange={(v) => setTipoSubconjuntoSelecionado(v as 'Protocolo' | 'NHB')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Protocolo">Protocolo</SelectItem>
                    <SelectItem value="NHB">Necessidade Humana Básica (NHB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="subconjunto">Subconjunto</Label>
                <Select
                  value={formDiagnostico.subconjuntoId}
                  onValueChange={(v) => setFormDiagnostico({...formDiagnostico, subconjuntoId: v})}
                  disabled={subconjuntosFiltrados.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um subconjunto" />
                  </SelectTrigger>
                  <SelectContent>
                    {subconjuntosFiltrados.map((subconjunto) => (
                      <SelectItem key={subconjunto.id} value={subconjunto.id!}>
                        {subconjunto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Diagnóstico</Label>
              <Input
                id="nome"
                value={formDiagnostico.nome}
                onChange={(e) => setFormDiagnostico({...formDiagnostico, nome: e.target.value})}
                placeholder="Ex: Dor aguda"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="explicacao">Explicação do Diagnóstico (opcional)</Label>
              <Textarea
                id="explicacao"
                value={formDiagnostico.explicacao || ''}
                onChange={(e) => setFormDiagnostico({...formDiagnostico, explicacao: e.target.value})}
                placeholder="Descreva o diagnóstico de forma clara para os enfermeiros"
                rows={2}
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Resultados Esperados e Intervenções</Label>
                <Button type="button" variant="outline" size="sm" onClick={adicionarResultadoEsperado}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Resultado Esperado
                </Button>
              </div>
              
              {formDiagnostico.resultadosEsperados.map((resultado, resultadoIndex) => (
                <Card key={resultadoIndex} className="p-4">
                  <div className="grid gap-3">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Resultado Esperado #{resultadoIndex + 1}</h4>
                      {formDiagnostico.resultadosEsperados.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerResultadoEsperado(resultadoIndex)}
                          className="h-7 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Descrição do Resultado</Label>
                      <Input
                        value={resultado.descricao}
                        onChange={(e) => atualizarResultadoEsperado(resultadoIndex, 'descricao', e.target.value)}
                        placeholder="Ex: Controle da dor"
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <div className="flex justify-between items-center">
                        <Label>Intervenções de Enfermagem</Label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => adicionarIntervencao(resultadoIndex)}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Adicionar Intervenção
                        </Button>
                      </div>
                      
                      {resultado.intervencoes.map((intervencao, intervencaoIndex) => (
                        <Card key={intervencaoIndex} className="p-3 border-dashed">
                          <div className="grid gap-3">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm">Intervenção #{intervencaoIndex + 1}</Label>
                              {resultado.intervencoes.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removerIntervencao(resultadoIndex, intervencaoIndex)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="grid gap-1">
                                <Label className="text-xs">Verbo em 1ª pessoa (Enfermeiro)</Label>
                                <Input
                                  value={intervencao.verboPrimeiraEnfermeiro}
                                  onChange={(e) => atualizarIntervencao(resultadoIndex, intervencaoIndex, 'verboPrimeiraEnfermeiro', e.target.value)}
                                  placeholder="Ex: Avalio"
                                  required
                                />
                              </div>
                              <div className="grid gap-1">
                                <Label className="text-xs">Verbo infinitivo (3ª pessoa)</Label>
                                <Input
                                  value={intervencao.verboOutraPessoa}
                                  onChange={(e) => atualizarIntervencao(resultadoIndex, intervencaoIndex, 'verboOutraPessoa', e.target.value)}
                                  placeholder="Ex: Avaliar"
                                  required
                                />
                              </div>
                            </div>
                            
                            <div className="grid gap-1">
                              <Label className="text-xs">Restante da intervenção</Label>
                              <Input
                                value={intervencao.descricaoRestante}
                                onChange={(e) => atualizarIntervencao(resultadoIndex, intervencaoIndex, 'descricaoRestante', e.target.value)}
                                placeholder="Ex: a intensidade da dor periodicamente"
                                required
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed">
                              <div className="grid gap-1">
                                <Label className="text-xs">Documento de apoio (opcional)</Label>
                                <Input
                                  value={intervencao.nomeDocumento || ''}
                                  onChange={(e) => atualizarIntervencao(resultadoIndex, intervencaoIndex, 'nomeDocumento', e.target.value)}
                                  placeholder="Ex: Protocolo de avaliação da dor"
                                />
                              </div>
                              <div className="grid gap-1">
                                <Label className="text-xs">Link do documento (opcional)</Label>
                                <Input
                                  value={intervencao.linkDocumento || ''}
                                  onChange={(e) => atualizarIntervencao(resultadoIndex, intervencaoIndex, 'linkDocumento', e.target.value)}
                                  placeholder="Ex: https://exemplo.com/documento.pdf"
                                />
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              <span className="font-medium">Prévia:</span><br />
                              Enfermeiro: <span className="text-green-700">{intervencao.verboPrimeiraEnfermeiro}</span> {intervencao.descricaoRestante}<br />
                              Outra pessoa: <span className="text-blue-700">{intervencao.verboOutraPessoa}</span> {intervencao.descricaoRestante}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalDiagnostico(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarDiagnostico} className="bg-csae-green-600 hover:bg-csae-green-700">
              {editandoDiagnosticoId ? 'Atualizar' : 'Cadastrar'} Diagnóstico
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para visualizar diagnóstico completo */}
      <Dialog open={modalVisualizarDiagnostico} onOpenChange={setModalVisualizarDiagnostico}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização Completa do Diagnóstico</DialogTitle>
            <DialogDescription>
              Detalhes completos do diagnóstico de enfermagem selecionado.
            </DialogDescription>
          </DialogHeader>
          
          {diagnosticoParaVisualizar && (
            <div className="space-y-4 py-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  getTipoSubconjunto(diagnosticoParaVisualizar.subconjuntoId) === 'Protocolo' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {getNomeSubconjunto(diagnosticoParaVisualizar.subconjuntoId)}
                </span>
                <h3 className="text-lg font-semibold">{diagnosticoParaVisualizar.nome}</h3>
              </div>
              
              {diagnosticoParaVisualizar.explicacao && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-gray-700">{diagnosticoParaVisualizar.explicacao}</p>
                </div>
              )}
              
              <div className="space-y-4 mt-4">
                <h4 className="font-semibold text-csae-green-700">Resultados Esperados e Intervenções</h4>
                
                <Accordion type="single" collapsible className="w-full">
                  {diagnosticoParaVisualizar.resultadosEsperados.map((resultado, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="hover:bg-gray-50 px-3 rounded-md">
                        <span className="text-left">{resultado.descricao}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-4 pt-2 space-y-2">
                          <h5 className="text-sm font-medium text-gray-700">Intervenções:</h5>
                          
                          <div className="space-y-1 pl-2">
                            {resultado.intervencoes.map((intervencao, i) => (
                              <div key={i} className="bg-gray-50 p-2 rounded">
                                <div className="text-sm">
                                  <span className="font-medium">Enfermeiro:</span> 
                                  <span className="text-green-700"> {intervencao.verboPrimeiraEnfermeiro}</span> {intervencao.descricaoRestante}
                                </div>
                                <div className="text-sm">
                                  <span className="font-medium">Outra pessoa:</span> 
                                  <span className="text-blue-700"> {intervencao.verboOutraPessoa}</span> {intervencao.descricaoRestante}
                                </div>
                                {(intervencao.nomeDocumento || intervencao.linkDocumento) && (
                                  <div className="text-sm mt-1 pt-1 border-t border-gray-200">
                                    <span className="font-medium">Documento de apoio:</span> 
                                    {intervencao.linkDocumento ? (
                                      <a 
                                        href={intervencao.linkDocumento} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        {intervencao.nomeDocumento || intervencao.linkDocumento}
                                      </a>
                                    ) : (
                                      <span> {intervencao.nomeDocumento}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setModalVisualizarDiagnostico(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default GerenciadorDiagnosticos;
