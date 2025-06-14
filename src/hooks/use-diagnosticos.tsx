
import { useState, useCallback } from 'react';
import { DiagnosticoCompleto, Subconjunto, ResultadoEsperado, Intervencao } from '@/types';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { toast } from 'sonner';

export const useDiagnosticos = () => {
  const [carregando, setCarregando] = useState<boolean>(true);
  const [subconjuntos, setSubconjuntos] = useState<Subconjunto[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);
  const [filtroTipoSubconjunto, setFiltroTipoSubconjunto] = useState<'todos' | 'Protocolo' | 'NHB'>('todos');
  const [filtroSubconjunto, setFiltroSubconjunto] = useState<string>("");
  const [filtroDiagnostico, setFiltroDiagnostico] = useState<string>("");
  const [termoBusca, setTermoBusca] = useState<string>("");

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
    subconjuntoIds: [],
    resultadosEsperados: [
      {
        descricao: "",
        intervencoes: [
          {
            verboPrimeiraEnfermeiro: "",
            verboOutraPessoa: "",
            descricaoRestante: "",
            ativo: true,
            diagnosticoIds: []
          }
        ]
      }
    ]
  });
  const [diagnosticoVisualizar, setDiagnosticoVisualizar] = useState<DiagnosticoCompleto | null>(null);
  
  // Load data
  const carregarDados = useCallback(async () => {
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
      const diagnosticosData = diagnosticosSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure backward compatibility with old structure
          subconjuntoIds: data.subconjuntoIds || (data.subconjuntoId ? [data.subconjuntoId] : [])
        };
      }) as DiagnosticoCompleto[];
      
      setSubconjuntos(subconjuntosData);
      setDiagnosticos(diagnosticosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar os dados. Por favor, tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, []);

  // Utility functions
  const getNomeSubconjunto = useCallback((id: string) => {
    const subconjunto = subconjuntos.find(s => s.id === id);
    return subconjunto ? subconjunto.nome : "Desconhecido";
  }, [subconjuntos]);

  const getTipoSubconjunto = useCallback((id: string) => {
    const subconjunto = subconjuntos.find(s => s.id === id);
    return subconjunto ? subconjunto.tipo : "Desconhecido";
  }, [subconjuntos]);
  
  const getSubconjuntosNomes = useCallback((ids: string[]) => {
    if (!ids || ids.length === 0) return "Nenhum";
    return ids.map(id => getNomeSubconjunto(id)).join(", ");
  }, [getNomeSubconjunto]);

  // Modal handlers for Subconjuntos
  const abrirModalCriarSubconjunto = useCallback(() => {
    setFormSubconjunto({
      nome: "",
      tipo: "NHB",
      descricao: "",
      ativo: true
    });
    setEditandoSubconjunto(false);
    setModalSubconjuntoAberto(true);
  }, []);

  const abrirModalEditarSubconjunto = useCallback((subconjunto: Subconjunto) => {
    setFormSubconjunto({...subconjunto});
    setEditandoSubconjunto(true);
    setModalSubconjuntoAberto(true);
  }, []);

  const salvarSubconjunto = useCallback(async () => {
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
  }, [formSubconjunto, editandoSubconjunto, carregarDados]);

  const excluirSubconjunto = useCallback(async (id: string) => {
    // Check if there are any diagnostics linked to this subconjunto
    const diagnosticosVinculados = diagnosticos.filter(d => 
      d.subconjuntoIds && d.subconjuntoIds.includes(id)
    );
    
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
  }, [diagnosticos, carregarDados]);

  // Modal handlers for Diagnósticos
  const abrirModalCriarDiagnostico = useCallback(() => {
    setFormDiagnostico({
      nome: "",
      subconjuntoIds: [],
      resultadosEsperados: [
        {
          descricao: "",
          intervencoes: [
            {
              verboPrimeiraEnfermeiro: "",
              verboOutraPessoa: "",
              descricaoRestante: "",
              ativo: true,
              diagnosticoIds: []
            }
          ]
        }
      ]
    });
    setEditandoDiagnostico(false);
    setModalDiagnosticoAberto(true);
  }, []);

  const abrirModalEditarDiagnostico = useCallback((diagnostico: DiagnosticoCompleto) => {
    // Ensure diagnostico has the new structure
    const diagnosticoAtualizado = {
      ...diagnostico,
      subconjuntoIds: diagnostico.subconjuntoIds || []
    };
    
    setFormDiagnostico(diagnosticoAtualizado);
    setEditandoDiagnostico(true);
    setModalDiagnosticoAberto(true);
  }, []);

  const abrirModalVisualizarDiagnostico = useCallback((diagnostico: DiagnosticoCompleto) => {
    // Ensure diagnostico has the new structure for visualization
    const diagnosticoAtualizado = {
      ...diagnostico,
      subconjuntoIds: diagnostico.subconjuntoIds || []
    };
    
    setDiagnosticoVisualizar(diagnosticoAtualizado);
    setModalVisualizarDiagnosticoAberto(true);
  }, []);

  const salvarDiagnostico = useCallback(async () => {
    if (!formDiagnostico.nome.trim()) {
      toast.error("O nome do diagnóstico é obrigatório.");
      return;
    }

    if (!formDiagnostico.subconjuntoIds || formDiagnostico.subconjuntoIds.length === 0) {
      toast.error("É obrigatório selecionar pelo menos um subconjunto.");
      return;
    }

    // Validate resultados esperados
    for (let i = 0; i < formDiagnostico.resultadosEsperados.length; i++) {
      const resultado = formDiagnostico.resultadosEsperados[i];
      if (!resultado.descricao || !resultado.descricao.trim()) {
        toast.error(`A descrição do resultado esperado ${i+1} é obrigatória.`);
        return;
      }

      // Validate intervenções
      for (let j = 0; j < resultado.intervencoes.length; j++) {
        const intervencao = resultado.intervencoes[j];

        if (!intervencao.verboPrimeiraEnfermeiro || !intervencao.verboPrimeiraEnfermeiro.trim()) {
          toast.error(`O verbo em 1ª pessoa da intervenção ${j+1} no resultado esperado ${i+1} é obrigatório.`);
          return;
        }

        if (!intervencao.verboOutraPessoa || !intervencao.verboOutraPessoa.trim()) {
          toast.error(`O verbo no infinitivo da intervenção ${j+1} no resultado esperado ${i+1} é obrigatório.`);
          return;
        }

        if (!intervencao.descricaoRestante || !intervencao.descricaoRestante.trim()) {
          toast.error(`A descrição da intervenção ${j+1} no resultado esperado ${i+1} é obrigatória.`);
          return;
        }
      }
    }

    setCarregando(true);
    try {
      // Make a copy of the formDiagnostico to clean it up before saving
      const diagnosticoParaSalvar = {
        ...formDiagnostico,
      };
      
      if (editandoDiagnostico && formDiagnostico.id) {
        // Update existing
        await updateDoc(doc(db, "diagnosticosEnfermagem", formDiagnostico.id), {
          ...diagnosticoParaSalvar,
          updatedAt: Timestamp.now()
        });
        toast.success("Diagnóstico atualizado com sucesso!");
      } else {
        // Create new
        await addDoc(collection(db, "diagnosticosEnfermagem"), {
          ...diagnosticoParaSalvar,
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
  }, [formDiagnostico, editandoDiagnostico, carregarDados]);

  const excluirDiagnostico = useCallback(async (id: string) => {
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
  }, [carregarDados]);

  // ResultadoEsperado handlers
  const adicionarResultadoEsperado = useCallback(() => {
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: [
        ...formDiagnostico.resultadosEsperados,
        {
          descricao: "",
          intervencoes: [
            {
              verboPrimeiraEnfermeiro: "",
              verboOutraPessoa: "",
              descricaoRestante: "",
              ativo: true,
              diagnosticoIds: []
            }
          ]
        }
      ]
    });
  }, [formDiagnostico]);

  const removerResultadoEsperado = useCallback((index: number) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados.splice(index, 1);
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  }, [formDiagnostico]);

  const atualizarResultadoEsperado = useCallback((index: number, campo: keyof ResultadoEsperado, valor: any) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados[index] = {
      ...novosResultados[index],
      [campo]: valor
    };
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  }, [formDiagnostico]);

  // Intervenção handlers
  const adicionarIntervencao = useCallback((resultadoIndex: number) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes.push({
      verboPrimeiraEnfermeiro: "",
      verboOutraPessoa: "",
      descricaoRestante: "",
      ativo: true,
      diagnosticoIds: []
    });
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  }, [formDiagnostico]);

  const removerIntervencao = useCallback((resultadoIndex: number, intervencaoIndex: number) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes.splice(intervencaoIndex, 1);
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  }, [formDiagnostico]);

  const atualizarIntervencao = useCallback((resultadoIndex: number, intervencaoIndex: number, campo: keyof Intervencao, valor: any) => {
    const novosResultados = [...formDiagnostico.resultadosEsperados];
    novosResultados[resultadoIndex].intervencoes[intervencaoIndex] = {
      ...novosResultados[resultadoIndex].intervencoes[intervencaoIndex],
      [campo]: valor
    };
    setFormDiagnostico({
      ...formDiagnostico,
      resultadosEsperados: novosResultados
    });
  }, [formDiagnostico]);

  return {
    // State
    carregando,
    subconjuntos,
    diagnosticos,
    filtroTipoSubconjunto,
    filtroSubconjunto,
    filtroDiagnostico,
    termoBusca,
    modalSubconjuntoAberto,
    modalDiagnosticoAberto,
    modalVisualizarDiagnosticoAberto,
    editandoSubconjunto,
    editandoDiagnostico,
    formSubconjunto,
    formDiagnostico,
    diagnosticoVisualizar,
    
    // Setters
    setFiltroTipoSubconjunto,
    setFiltroSubconjunto,
    setFiltroDiagnostico,
    setTermoBusca,
    setModalSubconjuntoAberto,
    setModalDiagnosticoAberto,
    setModalVisualizarDiagnosticoAberto,
    setFormSubconjunto,
    setFormDiagnostico,
    
    // Actions
    carregarDados,
    getNomeSubconjunto,
    getTipoSubconjunto,
    getSubconjuntosNomes,
    abrirModalCriarSubconjunto,
    abrirModalEditarSubconjunto,
    salvarSubconjunto,
    excluirSubconjunto,
    abrirModalCriarDiagnostico,
    abrirModalEditarDiagnostico,
    abrirModalVisualizarDiagnostico,
    salvarDiagnostico,
    excluirDiagnostico,
    adicionarResultadoEsperado,
    removerResultadoEsperado,
    atualizarResultadoEsperado,
    adicionarIntervencao,
    removerIntervencao,
    atualizarIntervencao
  };
};
