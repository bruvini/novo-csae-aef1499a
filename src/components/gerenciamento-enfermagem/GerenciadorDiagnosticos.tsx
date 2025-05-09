
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiagnosticosTab from './diagnosticos/DiagnosticosTab';
import SubconjuntoTab from './diagnosticos/SubconjuntoTab';
import LoadingOverlay from '@/components/LoadingOverlay';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DiagnosticoCompleto, Subconjunto } from '@/types/diagnosticos';
import FormSubconjunto from './diagnosticos/FormSubconjunto';
import FormDiagnostico from './diagnosticos/FormDiagnostico';
import DiagnosticoVisualizer from './diagnosticos/DiagnosticoVisualizer';

const GerenciadorDiagnosticos = () => {
  const [carregando, setCarregando] = useState<boolean>(true);
  const [subconjuntos, setSubconjuntos] = useState<Subconjunto[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);
  const [filtroTipoSubconjunto, setFiltroTipoSubconjunto] = useState<'todos' | 'Protocolo' | 'NHB'>('todos');
  const [filtroSubconjunto, setFiltroSubconjunto] = useState<string>("");
  const [filtroDiagnostico, setFiltroDiagnostico] = useState<string>("");
  const [termoBusca, setTermoBusca] = useState<string>("");
  const [tipoSubconjuntoSelecionado, setTipoSubconjuntoSelecionado] = useState<'NHB' | 'Protocolo'>('NHB');
  
  // Modal states
  const [modalSubconjuntoAberto, setModalSubconjuntoAberto] = useState<boolean>(false);
  const [modalDiagnosticoAberto, setModalDiagnosticoAberto] = useState<boolean>(false);
  const [modalVisualizarDiagnosticoAberto, setModalVisualizarDiagnosticoAberto] = useState<boolean>(false);
  const [editandoSubconjunto, setEditandoSubconjunto] = useState<boolean>(false);
  const [editandoDiagnostico, setEditandoDiagnostico] = useState<boolean>(false);
  const [formSubconjunto, setFormSubconjunto] = useState<Subconjunto>({
    nome: "",
    tipo: "NHB",
    descricao: "",
    ativo: true
  });
  const [formDiagnostico, setFormDiagnostico] = useState<DiagnosticoCompleto>({
    nome: "",
    subconjuntoId: "",
    resultadosEsperados: [{
      titulo: "",
      descricao: "", // Adding the required descricao field
      intervencoes: [{
        titulo: "",
        descricao: ""
      }]
    }]
  });
  const [diagnosticoVisualizar, setDiagnosticoVisualizar] = useState<DiagnosticoCompleto | null>(null);

  // Fetch data on load
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setCarregando(true);
    try {
      // Fetch subconjuntos
      const subconjuntosSnapshot = await getDocs(collection(db, "subconjuntosDiagnosticos"));
      const subconjuntosData = subconjuntosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subconjunto[];
      
      // Fetch diagnósticos
      const diagnosticosSnapshot = await getDocs(collection(db, "diagnosticosEnfermagem"));
      const diagnosticosData = diagnosticosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DiagnosticoCompleto[];
      
      setSubconjuntos(subconjuntosData);
      setDiagnosticos(diagnosticosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar os dados. Por favor, tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  // Utility functions
  const getNomeSubconjunto = (id: string) => {
    const subconjunto = subconjuntos.find(s => s.id === id);
    return subconjunto ? subconjunto.nome : "Desconhecido";
  };

  const getTipoSubconjunto = (id: string) => {
    const subconjunto = subconjuntos.find(s => s.id === id);
    return subconjunto ? subconjunto.tipo : "Desconhecido";
  };

  // Modal handlers for Subconjuntos
  const abrirModalCriarSubconjunto = () => {
    setFormSubconjunto({
      nome: "",
      tipo: tipoSubconjuntoSelecionado,
      descricao: "",
      ativo: true
    });
    setEditandoSubconjunto(false);
    setModalSubconjuntoAberto(true);
  };

  const abrirModalEditarSubconjunto = (subconjunto: Subconjunto) => {
    setFormSubconjunto({...subconjunto});
    setEditandoSubconjunto(true);
    setModalSubconjuntoAberto(true);
  };

  const salvarSubconjunto = async () => {
    if (!formSubconjunto.nome.trim()) {
      toast.error("O nome do subconjunto é obrigatório.");
      return;
    }

    setCarregando(true);
    try {
      if (editandoSubconjunto && formSubconjunto.id) {
        // Update existing
        await updateDoc(doc(db, "subconjuntosDiagnosticos", formSubconjunto.id), {
          ...formSubconjunto,
          updatedAt: Timestamp.now()
        });
        toast.success("Subconjunto atualizado com sucesso!");
      } else {
        // Create new
        await addDoc(collection(db, "subconjuntosDiagnosticos"), {
          ...formSubconjunto,
          createdAt: Timestamp.now(),
          ativo: true
        });
        toast.success("Subconjunto cadastrado com sucesso!");
      }
      
      setModalSubconjuntoAberto(false);
      await carregarDados();
      
    } catch (error) {
      console.error("Erro ao salvar subconjunto:", error);
      toast.error("Erro ao salvar o subconjunto. Por favor, tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const excluirSubconjunto = async (id: string) => {
    // Check if there are any diagnostics linked to this subconjunto
    const diagnosticosVinculados = diagnosticos.filter(d => d.subconjuntoId === id);
    if (diagnosticosVinculados.length > 0) {
      toast.error("Não é possível excluir um subconjunto que possui diagnósticos vinculados.");
      return;
    }
    
    if (window.confirm("Tem certeza que deseja excluir este subconjunto?")) {
      setCarregando(true);
      try {
        await deleteDoc(doc(db, "subconjuntosDiagnosticos", id));
        toast.success("Subconjunto excluído com sucesso!");
        await carregarDados();
      } catch (error) {
        console.error("Erro ao excluir subconjunto:", error);
        toast.error("Erro ao excluir o subconjunto. Por favor, tente novamente.");
      } finally {
        setCarregando(false);
      }
    }
  };

  // Modal handlers for Diagnósticos
  const abrirModalCriarDiagnostico = () => {
    setFormDiagnostico({
      nome: "",
      subconjuntoId: "",
      resultadosEsperados: [{
        titulo: "",
        descricao: "", // Adding the required descricao field
        intervencoes: [{
          titulo: "",
          descricao: ""
        }]
      }]
    });
    setEditandoDiagnostico(false);
    setModalDiagnosticoAberto(true);
  };

  const abrirModalEditarDiagnostico = (diagnostico: DiagnosticoCompleto) => {
    const subconjunto = subconjuntos.find(s => s.id === diagnostico.subconjuntoId);
    if (subconjunto) {
      setTipoSubconjuntoSelecionado(subconjunto.tipo as 'NHB' | 'Protocolo');
    }
    setFormDiagnostico({...diagnostico});
    setEditandoDiagnostico(true);
    setModalDiagnosticoAberto(true);
  };

  const abrirModalVisualizarDiagnostico = (diagnostico: DiagnosticoCompleto) => {
    setDiagnosticoVisualizar(diagnostico);
    setModalVisualizarDiagnosticoAberto(true);
  };

  const salvarDiagnostico = async () => {
    if (!formDiagnostico.nome.trim()) {
      toast.error("O nome do diagnóstico é obrigatório.");
      return;
    }

    if (!formDiagnostico.subconjuntoId) {
      toast.error("É obrigatório selecionar um subconjunto.");
      return;
    }

    // Validate resultados esperados
    for (let i = 0; i < formDiagnostico.resultadosEsperados.length; i++) {
      const resultado = formDiagnostico.resultadosEsperados[i];
      if (!resultado.titulo.trim()) {
        toast.error(`O título do resultado esperado ${i+1} é obrigatório.`);
        return;
      }

      // Validate intervenções
      for (let j = 0; j < resultado.intervencoes.length; j++) {
        const intervencao = resultado.intervencoes[j];
        if (!intervencao.titulo.trim()) {
          toast.error(`O título da intervenção ${j+1} no resultado esperado ${i+1} é obrigatório.`);
          return;
        }
      }
    }

    setCarregando(true);
    try {
      if (editandoDiagnostico && formDiagnostico.id) {
        // Update existing
        await updateDoc(doc(db, "diagnosticosEnfermagem", formDiagnostico.id), {
          ...formDiagnostico,
          updatedAt: Timestamp.now()
        });
        toast.success("Diagnóstico atualizado com sucesso!");
      } else {
        // Create new
        await addDoc(collection(db, "diagnosticosEnfermagem"), {
          ...formDiagnostico,
          createdAt: Timestamp.now(),
          ativo: true
        });
        toast.success("Diagnóstico cadastrado com sucesso!");
      }
      
      setModalDiagnosticoAberto(false);
      await carregarDados();
      
    } catch (error) {
      console.error("Erro ao salvar diagnóstico:", error);
      toast.error("Erro ao salvar o diagnóstico. Por favor, tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const excluirDiagnostico = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este diagnóstico?")) {
      setCarregando(true);
      try {
        await deleteDoc(doc(db, "diagnosticosEnfermagem", id));
        toast.success("Diagnóstico excluído com sucesso!");
        await carregarDados();
      } catch (error) {
        console.error("Erro ao excluir diagnóstico:", error);
        toast.error("Erro ao excluir o diagnóstico. Por favor, tente novamente.");
      } finally {
        setCarregando(false);
      }
    }
  };

  // ResultadoEsperado handlers
  const adicionarResultadoEsperado = () => {
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: [
        ...formDiagnostico.resultadosEsperados,
        {
          titulo: "",
          descricao: "", // Adding the required descricao field
          intervencoes: [{
            titulo: "",
            descricao: ""
          }]
        }
      ]
    });
  };

  const removerResultadoEsperado = (index: number) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados.splice(index, 1);
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  };

  const atualizarResultadoEsperado = (index: number, campo: any, valor: any) => {
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

  // Intervenção handlers
  const adicionarIntervencao = (resultadoIndex: number) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes.push({
      titulo: "",
      descricao: ""
    });
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  };

  const removerIntervencao = (resultadoIndex: number, intervencaoIndex: number) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes.splice(intervencaoIndex, 1);
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  };

  const atualizarIntervencao = (resultadoIndex: number, intervencaoIndex: number, campo: any, valor: string) => {
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

  // Get subconjuntos filtered by selected type
  const getSubconjuntosFiltrados = () => {
    return subconjuntos.filter(s => s.tipo === tipoSubconjuntoSelecionado);
  };

  return (
    <div>
      {carregando && <LoadingOverlay />}
      
      <h2 className="text-2xl font-bold text-csae-green-700 mb-6">Gerenciador de Diagnósticos</h2>
      
      <Tabs defaultValue="subconjuntos" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="subconjuntos">Subconjuntos</TabsTrigger>
          <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subconjuntos">
          <SubconjuntoTab 
            filtroTipoSubconjunto={filtroTipoSubconjunto}
            setFiltroTipoSubconjunto={setFiltroTipoSubconjunto}
            carregando={false}
            subconjuntos={subconjuntos || []}
            diagnosticos={diagnosticos || []}
            abrirModalCriarSubconjunto={abrirModalCriarSubconjunto}
            abrirModalEditarSubconjunto={abrirModalEditarSubconjunto}
            excluirSubconjunto={excluirSubconjunto}
          />
        </TabsContent>
        
        <TabsContent value="diagnosticos">
          <DiagnosticosTab 
            subconjuntos={subconjuntos || []}
            diagnosticos={diagnosticos || []}
            filtroSubconjunto={filtroSubconjunto}
            filtroDiagnostico={filtroDiagnostico}
            termoBusca={termoBusca}
            setFiltroSubconjunto={setFiltroSubconjunto}
            setFiltroDiagnostico={setFiltroDiagnostico}
            setTermoBusca={setTermoBusca}
            carregando={false}
            abrirModalCriarDiagnostico={abrirModalCriarDiagnostico}
            abrirModalEditarDiagnostico={abrirModalEditarDiagnostico}
            abrirModalVisualizarDiagnostico={abrirModalVisualizarDiagnostico}
            excluirDiagnostico={excluirDiagnostico}
            getNomeSubconjunto={getNomeSubconjunto}
            getTipoSubconjunto={getTipoSubconjunto}
          />
        </TabsContent>
      </Tabs>

      {/* Modal para criar/editar Subconjunto */}
      <Dialog open={modalSubconjuntoAberto} onOpenChange={setModalSubconjuntoAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{editandoSubconjunto ? "Editar" : "Novo"} Subconjunto</DialogTitle>
          <FormSubconjunto
            formSubconjunto={formSubconjunto}
            setFormSubconjunto={setFormSubconjunto}
            onSalvar={salvarSubconjunto}
            onCancel={() => setModalSubconjuntoAberto(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para criar/editar Diagnóstico */}
      <Dialog open={modalDiagnosticoAberto} onOpenChange={setModalDiagnosticoAberto}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>{editandoDiagnostico ? "Editar" : "Novo"} Diagnóstico de Enfermagem</DialogTitle>
          <FormDiagnostico
            formDiagnostico={formDiagnostico}
            setFormDiagnostico={setFormDiagnostico}
            tipoSubconjuntoSelecionado={tipoSubconjuntoSelecionado}
            setTipoSubconjuntoSelecionado={setTipoSubconjuntoSelecionado}
            subconjuntosFiltrados={getSubconjuntosFiltrados()}
            onSalvar={salvarDiagnostico}
            onCancel={() => setModalDiagnosticoAberto(false)}
            editando={editandoDiagnostico}
            onAdicionarResultadoEsperado={adicionarResultadoEsperado}
            onRemoverResultadoEsperado={removerResultadoEsperado}
            onAtualizarResultadoEsperado={atualizarResultadoEsperado}
            onAdicionarIntervencao={adicionarIntervencao}
            onRemoverIntervencao={removerIntervencao}
            onAtualizarIntervencao={atualizarIntervencao}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para visualizar Diagnóstico */}
      <Dialog open={modalVisualizarDiagnosticoAberto} onOpenChange={setModalVisualizarDiagnosticoAberto}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Visualizar Diagnóstico de Enfermagem</DialogTitle>
          {diagnosticoVisualizar && (
            <DiagnosticoVisualizer 
              diagnostico={diagnosticoVisualizar}
              getNomeSubconjunto={(id) => getNomeSubconjunto(id || '')}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciadorDiagnosticos;
