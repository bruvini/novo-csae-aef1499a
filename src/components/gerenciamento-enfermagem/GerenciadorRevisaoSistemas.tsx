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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Edit, Trash2, Check, X, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { 
  Subconjunto, 
  DiagnosticoCompleto 
} from '@/services/bancodados/tipos';

const GerenciadorRevisaoSistemas = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sistemas");
  
  // Estado para os dados
  const [sistemas, setSistemas] = useState<SistemaCorporal[]>([]);
  const [parametros, setParametros] = useState<RevisaoSistema[]>([]);
  const [subconjuntos, setSubconjuntos] = useState<Subconjunto[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);
  const [nhbSelecionada, setNhbSelecionada] = useState<string | null>(null);
  const [diagnosticosFiltrados, setDiagnosticosFiltrados] = useState<DiagnosticoCompleto[]>([]);
  
  // Estado para os modais
  const [modalSistemaAberto, setModalSistemaAberto] = useState(false);
  const [modalParametroAberto, setModalParametroAberto] = useState(false);
  const [editandoSistemaId, setEditandoSistemaId] = useState<string | null>(null);
  const [editandoParametroId, setEditandoParametroId] = useState<string | null>(null);
  
  // Estado para carregamento
  const [carregando, setCarregando] = useState(true);
  
  // Estado para os formulários
  const [formSistema, setFormSistema] = useState<SistemaCorporal>({
    nome: '',
    descricao: ''
  });
  
  const [formParametro, setFormParametro] = useState<RevisaoSistema>({
    nome: '',
    sistemaId: '',
    sistemaNome: '',
    diferencaSexoIdade: false,
    valoresReferencia: [{ 
      unidade: '',
      representaAlteracao: false,
      variacaoPor: 'Nenhum',
      tipoValor: 'Numérico'
    }]
  });
  
  // Carregar os dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar sistemas
        const sistemasRef = collection(db, 'sistemasCorporais');
        const sistemasSnapshot = await getDocs(sistemasRef);
        const sistemasData = sistemasSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SistemaCorporal[];
        setSistemas(sistemasData);
        
        // Carregar parâmetros
        const parametrosRef = collection(db, 'revisaoSistemas');
        const parametrosSnapshot = await getDocs(parametrosRef);
        const parametrosData = parametrosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as RevisaoSistema[];
        setParametros(parametrosData);
        
        // Carregar subconjuntos (NHBs)
        const subconjuntosRef = query(
          collection(db, 'subconjuntosDiagnosticos'), 
          where('tipo', '==', 'NHB')
        );
        const subconjuntosSnapshot = await getDocs(subconjuntosRef);
        const subconjuntosData = subconjuntosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Subconjunto[];
        setSubconjuntos(subconjuntosData);

        // Carregar Diagnósticos
        const diagnosticosRef = collection(db, 'diagnosticosEnfermagem');
        const diagnosticosSnapshot = await getDocs(diagnosticosRef);
        const diagnosticosData = diagnosticosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DiagnosticoCompleto[];
        setDiagnosticos(diagnosticosData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados dos sistemas.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarDados();
  }, [toast]);
  
  // Filtrar diagnósticos quando uma NHB é selecionada
  useEffect(() => {
    if (nhbSelecionada) {
      const filtrados = diagnosticos.filter(d => d.subitemId === nhbSelecionada);
      setDiagnosticosFiltrados(filtrados);
    } else {
      setDiagnosticosFiltrados([]);
    }
  }, [nhbSelecionada, diagnosticos]);
  
  // Funções para gerenciar sistemas corporais
  const abrirModalCriarSistema = () => {
    setFormSistema({
      nome: '',
      descricao: ''
    });
    setEditandoSistemaId(null);
    setModalSistemaAberto(true);
  };
  
  const abrirModalEditarSistema = (sistema: SistemaCorporal) => {
    setFormSistema({...sistema});
    setEditandoSistemaId(sistema.id || null);
    setModalSistemaAberto(true);
  };
  
  const salvarSistema = async () => {
    try {
      if (!formSistema.nome.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Nome do sistema corporal é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      
      if (editandoSistemaId) {
        // Atualizar existente
        const sistemaRef = doc(db, 'sistemasCorporais', editandoSistemaId);
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
          prev.map(s => s.id === editandoSistemaId ? {...formSistema, id: editandoSistemaId, updatedAt: new Date() as any} : s)
        );
        
        // Atualizar nome do sistema nos parâmetros relacionados
        if (formSistema.nome !== sistemas.find(s => s.id === editandoSistemaId)?.nome) {
          const parametrosAtualizados = parametros.filter(p => p.sistemaId === editandoSistemaId);
          for (const parametro of parametrosAtualizados) {
            const parametroRef = doc(db, 'revisaoSistemas', parametro.id!);
            await updateDoc(parametroRef, {
              sistemaNome: formSistema.nome
            });
          }
          setParametros(prev => 
            prev.map(p => p.sistemaId === editandoSistemaId ? {...p, sistemaNome: formSistema.nome} : p)
          );
        }
      } else {
        // Criar novo
        const novoSistema = {
          ...formSistema,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'sistemasCorporais'), novoSistema);
        
        toast({
          title: "Sistema criado",
          description: `${formSistema.nome} foi criado com sucesso.`
        });
        
        // Adicionar à lista
        setSistemas(prev => [...prev, {...novoSistema, id: docRef.id, createdAt: new Date() as any, updatedAt: new Date() as any}]);
      }
      
      setModalSistemaAberto(false);
    } catch (error) {
      console.error("Erro ao salvar sistema:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o sistema corporal.",
        variant: "destructive"
      });
    }
  };
  
  const excluirSistema = async (id: string) => {
    // Verificar se há parâmetros vinculados
    const parametrosVinculados = parametros.filter(p => p.sistemaId === id);
    if (parametrosVinculados.length > 0) {
      toast({
        title: "Não é possível excluir",
        description: `Existem ${parametrosVinculados.length} parâmetros vinculados a este sistema. Remova-os primeiro.`,
        variant: "destructive"
      });
      return;
    }
    
    if (confirm("Tem certeza que deseja excluir este sistema? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'sistemasCorporais', id));
        
        toast({
          title: "Sistema excluído",
          description: "O sistema corporal foi excluído com sucesso."
        });
        
        // Remover da lista
        setSistemas(prev => prev.filter(s => s.id !== id));
      } catch (error) {
        console.error("Erro ao excluir sistema:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o sistema corporal.",
          variant: "destructive"
        });
      }
    }
  };
  
  // Funções para gerenciar parâmetros de revisão de sistemas
  const abrirModalCriarParametro = () => {
    setFormParametro({
      nome: '',
      sistemaId: '',
      sistemaNome: '',
      diferencaSexoIdade: false,
      valoresReferencia: [{ 
        unidade: '',
        representaAlteracao: false,
        variacaoPor: 'Nenhum',
        tipoValor: 'Numérico'
      }]
    });
    setEditandoParametroId(null);
    setModalParametroAberto(true);
  };
  
  const abrirModalEditarParametro = (parametro: RevisaoSistema) => {
    // Garantir que todos os valores de referência tenham os novos campos
    const valoresAtualizados = parametro.valoresReferencia.map(valor => ({
      ...valor,
      representaAlteracao: valor.representaAlteracao !== undefined ? valor.representaAlteracao : false,
      variacaoPor: valor.variacaoPor || 'Nenhum',
      tipoValor: valor.tipoValor || 'Numérico'
    }));

    setFormParametro({
      ...parametro,
      valoresReferencia: valoresAtualizados
    });
    setEditandoParametroId(parametro.id || null);
    setModalParametroAberto(true);
  };
  
  // Função para atualizar o sistema selecionado
  const handleSistemaChange = (sistemaId: string) => {
    const sistemaSelecionado = sistemas.find(s => s.id === sistemaId);
    if (sistemaSelecionado) {
      setFormParametro({
        ...formParametro,
        sistemaId: sistemaId,
        sistemaNome: sistemaSelecionado.nome
      });
    }
  };
  
  // Adicionar valor de referência
  const adicionarValorReferencia = () => {
    setFormParametro({
      ...formParametro,
      valoresReferencia: [
        ...formParametro.valoresReferencia,
        { 
          unidade: '',
          representaAlteracao: false,
          variacaoPor: 'Nenhum',
          tipoValor: 'Numérico'
        }
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

    // Quando o tipo de valor muda, ajustar os campos correspondentes
    if (campo === 'tipoValor') {
      if (valor === 'Texto') {
        novosValores[index].valorTexto = '';
        novosValores[index].valorMinimo = undefined;
        novosValores[index].valorMaximo = undefined;
      } else {
        novosValores[index].valorTexto = undefined;
      }
    }

    // Quando a variação muda, ajustamos os campos necessários
    if (campo === 'variacaoPor') {
      if (valor === 'Nenhum') {
        // Remover campos desnecessários para variação única
        delete novosValores[index].idadeMinima;
        delete novosValores[index].idadeMaxima;
        delete novosValores[index].sexo;
      } else if (valor === 'Sexo') {
        // Adicionar campo de sexo e remover idade
        novosValores[index].sexo = 'Todos';
        delete novosValores[index].idadeMinima;
        delete novosValores[index].idadeMaxima;
      } else if (valor === 'Idade') {
        // Adicionar campos de idade e remover sexo
        novosValores[index].idadeMinima = 0;
        novosValores[index].idadeMaxima = 100;
        delete novosValores[index].sexo;
      }
      // 'Ambos' mantém todos os campos
    }

    // Se desmarcar "representa alteração", limpar os campos relacionados
    if (campo === 'representaAlteracao' && valor === false) {
      delete novosValores[index].tituloAlteracao;
      delete novosValores[index].nhbId;
      delete novosValores[index].diagnosticoId;
    }

    setFormParametro({
      ...formParametro,
      valoresReferencia: novosValores
    });
  };

  // Atualizar NHB selecionada
  const handleNhbChange = (index: number, nhbId: string) => {
    setNhbSelecionada(nhbId);
    
    const novosValores = [...formParametro.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      nhbId: nhbId,
      diagnosticoId: undefined // Limpar diagnóstico quando mudar a NHB
    };
    
    setFormParametro({
      ...formParametro,
      valoresReferencia: novosValores
    });
  };

  // Atualizar diagnóstico selecionado
  const handleDiagnosticoChange = (index: number, diagnosticoId: string) => {
    const novosValores = [...formParametro.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      diagnosticoId: diagnosticoId
    };
    
    setFormParametro({
      ...formParametro,
      valoresReferencia: novosValores
    });
  };
  
  // Salvar parâmetro de revisão
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
          description: "Sistema corporal é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      
      if (formParametro.valoresReferencia.some(vr => !vr.unidade.trim())) {
        toast({
          title: "Campo obrigatório",
          description: "Unidade é obrigatória para todos os valores de referência.",
          variant: "destructive"
        });
        return;
      }

      // Validar campos específicos de acordo com a variação
      for (const valor of formParametro.valoresReferencia) {
        if (valor.variacaoPor === 'Sexo' || valor.variacaoPor === 'Ambos') {
          if (!valor.sexo) {
            toast({
              title: "Campo obrigatório",
              description: "Sexo é obrigatório quando a variação inclui sexo.",
              variant: "destructive"
            });
            return;
          }
        }
        
        if (valor.variacaoPor === 'Idade' || valor.variacaoPor === 'Ambos') {
          if (valor.idadeMinima === undefined || valor.idadeMaxima === undefined) {
            toast({
              title: "Campo obrigatório",
              description: "Idade mínima e máxima são obrigatórias quando a variação inclui idade.",
              variant: "destructive"
            });
            return;
          }
        }

        // Validar campos do tipo de valor
        if (valor.tipoValor === 'Numérico') {
          if (valor.valorMinimo === undefined && valor.valorMaximo === undefined) {
            toast({
              title: "Campo obrigatório",
              description: "Pelo menos um valor (mínimo ou máximo) é obrigatório para valores numéricos.",
              variant: "destructive"
            });
            return;
          }
        } else if (valor.tipoValor === 'Texto') {
          if (!valor.valorTexto?.trim()) {
            toast({
              title: "Campo obrigatório",
              description: "Valor textual é obrigatório quando o tipo é texto.",
              variant: "destructive"
            });
            return;
          }
        }

        if (valor.representaAlteracao) {
          if (!valor.tituloAlteracao?.trim()) {
            toast({
              title: "Campo obrigatório",
              description: "Título da alteração é obrigatório quando o valor representa uma alteração.",
              variant: "destructive"
            });
            return;
          }

          if (!valor.nhbId) {
            toast({
              title: "Campo obrigatório",
              description: "Necessidade Humana Básica (NHB) é obrigatória para valores que representam alteração.",
              variant: "destructive"
            });
            return;
          }

          if (!valor.diagnosticoId) {
            toast({
              title: "Campo obrigatório",
              description: "Diagnóstico de Enfermagem é obrigatório para valores que representam alteração.",
              variant: "destructive"
            });
            return;
          }
        }
      }
      
      if (editandoParametroId) {
        // Atualizar existente
        const parametroRef = doc(db, 'revisaoSistemas', editandoParametroId);
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
          prev.map(p => p.id === editandoParametroId ? {...formParametro, id: editandoParametroId, updatedAt: new Date() as any} : p)
        );
      } else {
        // Criar novo
        const novoParametro = {
          ...formParametro,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'revisaoSistemas'), novoParametro);
        
        toast({
          title: "Parâmetro criado",
          description: `${formParametro.nome} foi criado com sucesso.`
        });
        
        // Adicionar à lista
        setParametros(prev => [...prev, {...novoParametro, id: docRef.id, createdAt: new Date() as any, updatedAt: new Date() as any}]);
      }
      
      setModalParametroAberto(false);
    } catch (error) {
      console.error("Erro ao salvar parâmetro:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o parâmetro de revisão.",
        variant: "destructive"
      });
    }
  };
  
  // Excluir parâmetro
  const excluirParametro = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este parâmetro? Esta ação não pode ser desfeita.")) {
      try {
        await deleteDoc(doc(db, 'revisaoSistemas', id));
        
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Revisão de Sistemas</CardTitle>
        <CardDescription>
          Cadastre e gerencie os sistemas corporais e seus parâmetros de avaliação.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="sistemas">Sistemas Corporais</TabsTrigger>
            <TabsTrigger value="parametros">Parâmetros de Avaliação</TabsTrigger>
          </TabsList>
          
          {/* Aba de Sistemas Corporais */}
          <TabsContent value="sistemas">
            <div className="flex justify-end mb-4">
              <Button onClick={abrirModalCriarSistema} className="bg-csae-green-600 hover:bg-csae-green-700">
                <Plus className="mr-2 h-4 w-4" /> Novo Sistema Corporal
              </Button>
            </div>
            
            {carregando ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
              </div>
            ) : sistemas.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Nenhum sistema corporal cadastrado. Clique em "Novo Sistema Corporal" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Sistema</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Parâmetros Vinculados</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sistemas.map((sistema) => (
                    <TableRow key={sistema.id}>
                      <TableCell className="font-medium">{sistema.nome}</TableCell>
                      <TableCell>{sistema.descricao || "-"}</TableCell>
                      <TableCell>
                        {parametros.filter(p => p.sistemaId === sistema.id).length}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => abrirModalEditarSistema(sistema)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => excluirSistema(sistema.id!)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          
          {/* Aba de Parâmetros de Avaliação */}
          <TabsContent value="parametros">
            <div className="flex justify-end mb-4">
              <Button onClick={abrirModalCriarParametro} className="bg-csae-green-600 hover:bg-csae-green-700">
                <Plus className="mr-2 h-4 w-4" /> Novo Parâmetro
              </Button>
            </div>
            
            {carregando ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
              </div>
            ) : parametros.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Nenhum parâmetro de avaliação cadastrado. Clique em "Novo Parâmetro" para começar.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Parâmetro</TableHead>
                    <TableHead>Sistema Corporal</TableHead>
                    <TableHead>Valores de Referência</TableHead>
                    <TableHead>Valores com Alteração</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parametros.map((parametro) => (
                    <TableRow key={parametro.id}>
                      <TableCell className="font-medium">{parametro.nome}</TableCell>
                      <TableCell>{parametro.sistemaNome}</TableCell>
                      <TableCell>{parametro.valoresReferencia.length} valores configurados</TableCell>
                      <TableCell>
                        {parametro.valoresReferencia.filter(v => v.representaAlteracao).length} valores
                      </TableCell>
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
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Modal para criar/editar sistema corporal */}
      <Dialog open={modalSistemaAberto} onOpenChange={setModalSistemaAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editandoSistemaId ? 'Editar' : 'Novo'} Sistema Corporal</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editandoSistemaId ? 'atualizar o' : 'cadastrar um novo'} sistema corporal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome-sistema">Nome do Sistema</Label>
              <Input
                id="nome-sistema"
                value={formSistema.nome}
                onChange={(e) => setFormSistema({...formSistema, nome: e.target.value})}
                placeholder="Ex: Sistema Respiratório"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="descricao-sistema">Descrição (opcional)</Label>
              <Input
                id="descricao-sistema"
                value={formSistema.descricao || ''}
                onChange={(e) => setFormSistema({...formSistema, descricao: e.target.value})}
                placeholder="Descreva brevemente este sistema corporal"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalSistemaAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarSistema} className="bg-csae-green-600 hover:bg-csae-green-700">
              {editandoSistemaId ? 'Atualizar' : 'Cadastrar'} Sistema
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para criar/editar parâmetro de revisão */}
      <Dialog open={modalParametroAberto} onOpenChange={setModalParametroAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editandoParametroId ? 'Editar' : 'Novo'} Parâmetro de Avaliação</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para {editandoParametroId ? 'atualizar o' : 'cadastrar um novo'} parâmetro de avaliação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome-parametro">Nome do Parâmetro</Label>
              <Input
                id="nome-parametro"
                value={formParametro.nome}
                onChange={(e) => setFormParametro({...formParametro, nome: e.target.value})}
                placeholder="Ex: Frequência Respiratória"
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Sistema Corporal</Label>
              <Select
                value={formParametro.sistemaId}
                onValueChange={handleSistemaChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um sistema corporal" />
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
                    
                    {/* Tipo de valor: Numérico ou Textual */}
                    <div className="grid gap-2">
                      <Label>O valor é numérico ou textual?</Label>
                      <RadioGroup 
                        value={valor.tipoValor || 'Numérico'} 
                        onValueChange={(v: 'Numérico' | 'Texto') => atualizarValorReferencia(index, 'tipoValor', v)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Numérico" id={`numerico-${index}`} />
                          <Label htmlFor={`numerico-${index}`}>Numérico</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="Texto" id={`texto-${index}`} />
                          <Label htmlFor={`texto-${index}`}>Textual</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {/* Campos condicionais baseados no tipo de valor */}
                    {valor.tipoValor === 'Numérico' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Valor Mínimo</Label>
                          <Input
                            type="number"
                            value={valor.valorMinimo !== undefined ? valor.valorMinimo : ''}
                            onChange={(e) => atualizarValorReferencia(index, 'valorMinimo', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Ex: 12"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Valor Máximo</Label>
                          <Input
                            type="number"
                            value={valor.valorMaximo !== undefined ? valor.valorMaximo : ''}
                            onChange={(e) => atualizarValorReferencia(index, 'valorMaximo', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="Ex: 20"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label>Valor Textual</Label>
                        <Input
                          value={valor.valorTexto || ''}
                          onChange={(e) => atualizarValorReferencia(index, 'valorTexto', e.target.value)}
                          placeholder="Ex: Normal, Presente, Ausente, etc."
                        />
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label>Varia por</Label>
                      <Select
                        value={valor.variacaoPor}
                        onValueChange={(v: 'Sexo' | 'Idade' | 'Ambos' | 'Nenhum') => atualizarValorReferencia(index, 'variacaoPor', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione como o valor varia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nenhum">Nenhum (valor único)</SelectItem>
                          <SelectItem value="Sexo">Sexo</SelectItem>
                          <SelectItem value="Idade">Idade</SelectItem>
                          <SelectItem value="Ambos">Ambos (Sexo e Idade)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(valor.variacaoPor === 'Sexo' || valor.variacaoPor === 'Ambos') && (
                      <div className="grid gap-2">
                        <Label>Sexo</Label>
                        <Select
                          value={valor.sexo || 'Todos'}
                          onValueChange={(v: 'Masculino' | 'Feminino' | 'Todos') => atualizarValorReferencia(index, 'sexo', v)}
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
                    )}

                    {(valor.variacaoPor === 'Idade' || valor.variacaoPor === 'Ambos') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-2">
                          <Label>Idade Mínima (anos)</Label>
                          <Input
                            type="number"
                            value={valor.idadeMinima !== undefined ? valor.idadeMinima : ''}
                            onChange={(e) => atualizarValorReferencia(index, 'idadeMinima', Number(e.target.value))}
                            placeholder="Ex: 18"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Idade Máxima (anos)</Label>
                          <Input
                            type="number"
                            value={valor.idadeMaxima !== undefined ? valor.idadeMaxima : ''}
                            onChange={(e) => atualizarValorReferencia(index, 'idadeMaxima', Number(e.target.value))}
                            placeholder="Ex: 65"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label>Unidade</Label>
                      <Input
                        value={valor.unidade}
                        onChange={(e) => atualizarValorReferencia(index, 'unidade', e.target.value)}
                        placeholder="Ex: mpm"
                        required
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Switch 
                        checked={valor.representaAlteracao || false}
                        onCheckedChange={(checked) => 
                          atualizarValorReferencia(index, 'representaAlteracao', checked)
                        }
                        id={`alteracao-${index}`}
                      />
                      <Label htmlFor={`alteracao-${index}`}>Este valor representa uma alteração</Label>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 p-0 ml-1">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Marque se este valor representa uma condição alterada.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {valor.representaAlteracao && (
                      <>
                        <div className="grid gap-2">
                          <Label>Título da Alteração</Label>
                          <Input
                            value={valor.tituloAlteracao || ''}
                            onChange={(e) => atualizarValorReferencia(index, 'tituloAlteracao', e.target.value)}
                            placeholder="Ex: Taquipneia, Bradipneia, etc."
                          />
                        </div>
                        
                        <div className="grid gap-2 border-t pt-3 mt-2">
                          <Label>Vínculo com Diagnóstico</Label>
                          
                          <div className="grid gap-3">
                            <div>
                              <Label className="text-sm text-muted-foreground mb-1 block">
                                1. Selecione uma Necessidade Humana Básica (NHB)
                              </Label>
                              <Select
                                value={valor.nhbId || ''}
                                onValueChange={(v) => handleNhbChange(index, v)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma NHB" />
                                </SelectTrigger>
                                <SelectContent>
                                  {subconjuntos.map((nhb) => (
                                    <SelectItem key={nhb.id} value={nhb.id!}>
                                      {nhb.nome}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {valor.nhbId && (
                              <div>
                                <Label className="text-sm text-muted-foreground mb-1 block">
                                  2. Selecione um Diagnóstico
                                </Label>
                                <Select
                                  value={valor.diagnosticoId || ''}
                                  onValueChange={(v) => handleDiagnosticoChange(index, v)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um diagnóstico" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {diagnosticosFiltrados.length > 0 ? (
                                      diagnosticosFiltrados.map((diag) => (
                                        <SelectItem key={diag.id} value={diag.id!}>
                                          {diag.descricao}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <SelectItem value="no-diagnostics" disabled>
                                        Nenhum diagnóstico disponível para esta NHB
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalParametroAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarParametro} className="bg-csae-green-600 hover:bg-csae-green-700">
              {editandoParametroId ? 'Atualizar' : 'Cadastrar'} Parâmetro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default GerenciadorRevisaoSistemas;
