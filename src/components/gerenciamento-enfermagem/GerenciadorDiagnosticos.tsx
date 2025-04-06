import React, { useState, useEffect } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ResultadoEsperado, Intervencao, Subconjunto, DiagnosticoCompleto } from '@/services/bancodados/tipos';
import SubconjuntoTab from './diagnosticos/SubconjuntoTab';
import DiagnosticosTab from './diagnosticos/DiagnosticosTab';
import FormSubconjunto from './diagnosticos/FormSubconjunto';
import FormDiagnostico from './diagnosticos/FormDiagnostico';
import DiagnosticoVisualizer from './diagnosticos/DiagnosticoVisualizer';

const GerenciadorDiagnosticos = () => {
  const { toast } = useToast();
  const [subconjuntos, setSubconjuntos] = useState<Subconjunto[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);
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
  const [diagnosticoParaVisualizar, setDiagnosticoParaVisualizar] = useState<DiagnosticoCompleto | null>(null);
  
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
  
  const [formDiagnostico, setFormDiagnostico] = useState<DiagnosticoCompleto>({
    nome: '',
    explicacao: '',
    subconjuntoId: '',
    subconjunto: 'Protocolo de Enfermagem',
    subitemNome: '',
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
        })) as DiagnosticoCompleto[];
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
        const firestoreTimestamp = serverTimestamp();
        
        await updateDoc(subconjuntoRef, {
          ...formSubconjunto,
          updatedAt: firestoreTimestamp
        });
        
        toast({
          title: "Subconjunto atualizado",
          description: `${formSubconjunto.nome} foi atualizado com sucesso.`
        });
        
        // Atualizar lista - garantindo tipagem correta
        setSubconjuntos(prevSubconjuntos => {
          return prevSubconjuntos.map(s => {
            if (s.id === editandoSubconjuntoId) {
              return { 
                ...formSubconjunto, 
                id: editandoSubconjuntoId,
                updatedAt: firestoreTimestamp
              } as Subconjunto;
            }
            return s;
          });
        });
      } else {
        // Criar novo
        const firestoreTimestamp = serverTimestamp();
        const novoSubconjunto = {
          ...formSubconjunto,
          createdAt: firestoreTimestamp,
          updatedAt: firestoreTimestamp
        };
        
        const docRef = await addDoc(collection(db, 'subconjuntosDiagnosticos'), novoSubconjunto);
        
        toast({
          title: "Subconjunto criado",
          description: `${formSubconjunto.nome} foi criado com sucesso.`
        });
        
        // Adicionar à lista com a tipagem correta
        setSubconjuntos(prevSubconjuntos => [
          ...prevSubconjuntos, 
          {
            ...novoSubconjunto, 
            id: docRef.id
          } as Subconjunto
        ]);
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
      subconjunto: 'Protocolo de Enfermagem',
      subitemNome: '',
      resultadosEsperados: [{ ...emptyResultado }]
    });
    
    setEditandoDiagnosticoId(null);
    setModalDiagnostico(true);
  };
  
  // Abrir modal para editar diagnóstico existente
  const abrirModalEditarDiagnostico = (diagnostico: DiagnosticoCompleto) => {
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
  const abrirModalVisualizarDiagnostico = (diagnostico: DiagnosticoCompleto) => {
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
      
      // Obter o nome do subconjunto selecionado
      const subconjuntoSelecionado = subconjuntos.find(s => s.id === formDiagnostico.subconjuntoId);
      if (subconjuntoSelecionado) {
        formDiagnostico.subitemNome = subconjuntoSelecionado.nome;
        formDiagnostico.subconjunto = subconjuntoSelecionado.tipo === 'Protocolo' 
          ? 'Protocolo de Enfermagem' 
          : 'Necessidades Humanas Básicas';
      }
      
      const firestoreTimestamp = serverTimestamp();
      
      if (editandoDiagnosticoId) {
        // Atualizar existente
        const diagnosticoRef = doc(db, 'diagnosticosEnfermagem', editandoDiagnosticoId);
        await updateDoc(diagnosticoRef, {
          ...formDiagnostico,
          updatedAt: firestoreTimestamp
        });
        
        toast({
          title: "Diagnóstico atualizado",
          description: `${formDiagnostico.nome} foi atualizado com sucesso.`
        });
        
        // Atualizar lista com tipagem correta
        setDiagnosticos(prev => 
          prev.map(d => d.id === editandoDiagnosticoId ? 
            {...formDiagnostico, id: editandoDiagnosticoId, updatedAt: firestoreTimestamp} as DiagnosticoCompleto : d)
        );
      } else {
        // Criar novo
        const novoDiagnostico = {
          ...formDiagnostico,
          createdAt: firestoreTimestamp,
          updatedAt: firestoreTimestamp
        };
        
        const docRef = await addDoc(collection(db, 'diagnosticosEnfermagem'), novoDiagnostico);
        
        toast({
          title: "Diagnóstico criado",
          description: `${formDiagnostico.nome} foi criado com sucesso.`
        });
        
        // Adicionar à lista com tipagem correta
        setDiagnosticos(prev => [...prev, {
          ...novoDiagnostico, 
          id: docRef.id
        } as DiagnosticoCompleto]);
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
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="subconjuntos">Subconjuntos</TabsTrigger>
        <TabsTrigger value="diagnosticos">Diagnósticos de Enfermagem</TabsTrigger>
      </TabsList>
      
      <TabsContent value="subconjuntos">
        <SubconjuntoTab 
          filtroTipoSubconjunto={filtroTipoSubconjunto}
          setFiltroTipoSubconjunto={setFiltroTipoSubconjunto}
          carregando={carregando}
          subconjuntos={subconjuntos}
          diagnosticos={diagnosticos}
          abrirModalCriarSubconjunto={abrirModalCriarSubconjunto}
          abrirModalEditarSubconjunto={abrirModalEditarSubconjunto}
          excluirSubconjunto={excluirSubconjunto}
        />
      </TabsContent>
      
      <TabsContent value="diagnosticos">
        <DiagnosticosTab 
          subconjuntos={subconjuntos}
          diagnosticos={diagnosticos}
          filtroSubconjunto={filtroSubconjunto}
          filtroDiagnostico={filtroDiagnostico}
          termoBusca={termoBusca}
          setFiltroSubconjunto={setFiltroSubconjunto}
          setFiltroDiagnostico={setFiltroDiagnostico}
          setTermoBusca={setTermoBusca}
          carregando={carregando}
          abrirModalCriarDiagnostico={abrirModalCriarDiagnostico}
          abrirModalEditarDiagnostico={abrirModalEditarDiagnostico}
          abrirModalVisualizarDiagnostico={abrirModalVisualizarDiagnostico}
          excluirDiagnostico={excluirDiagnostico}
          getNomeSubconjunto={getNomeSubconjunto}
          getTipoSubconjunto={getTipoSubconjunto}
        />
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
          
          <FormSubconjunto 
            formSubconjunto={formSubconjunto}
            setFormSubconjunto={setFormSubconjunto}
            onSalvar={salvarSubconjunto}
            onCancel={() => setModalSubconjunto(false)}
            editando={!!editandoSubconjuntoId}
          />
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
          
          <FormDiagnostico 
            formDiagnostico={formDiagnostico}
            setFormDiagnostico={setFormDiagnostico}
            tipoSubconjuntoSelecionado={tipoSubconjuntoSelecionado}
            setTipoSubconjuntoSelecionado={setTipoSubconjuntoSelecionado}
            subconjuntosFiltrados={subconjuntosFiltrados}
            onSalvar={salvarDiagnostico}
            onCancel={() => setModalDiagnostico(false)}
            editando={!!editandoDiagnosticoId}
            onAdicionarResultadoEsperado={adicionarResultadoEsperado}
            onRemoverResultadoEsperado={removerResultadoEsperado}
            onAtualizarResultadoEsperado={atualizarResultadoEsperado}
            onAdicionarIntervencao={adicionarIntervencao}
            onRemoverIntervencao={removerIntervencao}
            onAtualizarIntervencao={atualizarIntervencao}
          />
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
            <DiagnosticoVisualizer 
              diagnostico={diagnosticoParaVisualizar}
              onClose={() => setModalVisualizarDiagnostico(false)}
              getNomeSubconjunto={getNomeSubconjunto}
              getTipoSubconjunto={getTipoSubconjunto}
            />
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default GerenciadorDiagnosticos;
