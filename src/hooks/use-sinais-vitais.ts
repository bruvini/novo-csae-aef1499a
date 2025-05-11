
import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  SinalVital,
  ValorReferencia,
  SubconjuntoDiagnostico,
  DiagnosticoCompleto,
} from "@/types/sinais-vitais";

// Helper functions
const validateNumericValue = (valor: ValorReferencia) => {
  return valor.valorMinimo !== undefined || valor.valorMaximo !== undefined;
};

const validateTextValue = (valor: ValorReferencia) => {
  return !!valor.valorTexto?.trim();
};

const validateSexVariation = (valor: ValorReferencia) => {
  return !!valor.sexo;
};

const validateAgeVariation = (valor: ValorReferencia) => {
  return valor.idadeMinima !== undefined && valor.idadeMaxima !== undefined;
};

const validateAlterationRequirements = (valor: ValorReferencia) => {
  const hasTitle = !!valor.tituloAlteracao?.trim();
  const hasNhbs = valor.nhbIds && valor.nhbIds.length > 0;
  const hasDiagnoses = valor.diagnosticoIds && valor.diagnosticoIds.length > 0;
  
  return { hasTitle, hasNhbs, hasDiagnoses };
};

export const useSinaisVitais = () => {
  const { toast } = useToast();
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [subconjuntos, setSubconjuntos] = useState<SubconjuntoDiagnostico[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [nhbSelecionadas, setNhbSelecionadas] = useState<string[]>([]);
  const [diagnosticosFiltrados, setDiagnosticosFiltrados] = useState<DiagnosticoCompleto[]>([]);

  // Estado para o formulário
  const [formSinal, setFormSinal] = useState<SinalVital>({
    nome: "",
    unidade: "", 
    ativo: true,
    diferencaSexoIdade: false,
    valoresReferencia: [
      {
        titulo: "Valor Padrão",
        condicao: "entre",
        unidade: "",
        representaAlteracao: false,
        variacaoPor: "Nenhum",
        tipoValor: "Numérico"
      },
    ],
  });

  // Carregar os dados iniciais
  useEffect(() => {
    carregarDados();
  }, []);

  // Filtrar diagnósticos quando uma NHB é selecionada
  useEffect(() => {
    if (nhbSelecionadas.length > 0) {
      const filtrados = diagnosticos.filter(
        (d) => {
          return d.subconjuntoIds?.some(id => nhbSelecionadas.includes(id)) || false;
        }
      );
      setDiagnosticosFiltrados(filtrados);
    } else {
      setDiagnosticosFiltrados([]);
    }
  }, [nhbSelecionadas, diagnosticos]);

  const carregarDados = async () => {
    try {
      // Carregar sinais vitais
      const sinaisRef = collection(db, "sinaisVitais");
      const sinaisSnapshot = await getDocs(sinaisRef);
      const sinaisData = sinaisSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SinalVital[];
      setSinaisVitais(sinaisData);

      // Carregar subconjuntos (NHBs)
      const subconjuntosRef = query(
        collection(db, "subconjuntosDiagnosticos"),
        where("tipo", "==", "NHB")
      );
      const subconjuntosSnapshot = await getDocs(subconjuntosRef);
      const subconjuntosData = subconjuntosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SubconjuntoDiagnostico[];
      setSubconjuntos(subconjuntosData);

      // Carregar Diagnósticos
      const diagnosticosRef = collection(db, "diagnosticosEnfermagem");
      const diagnosticosSnapshot = await getDocs(diagnosticosRef);
      const diagnosticosData = diagnosticosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DiagnosticoCompleto[];
      setDiagnosticos(diagnosticosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os sinais vitais.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  // Abrir modal para criar novo sinal vital
  const abrirModalCriar = () => {
    setFormSinal({
      nome: "",
      unidade: "",
      ativo: true,
      diferencaSexoIdade: false,
      valoresReferencia: [
        {
          titulo: "Valor Padrão",
          condicao: "entre",
          unidade: "",
          representaAlteracao: false,
          variacaoPor: "Nenhum",
          tipoValor: "Numérico"
        },
      ],
    });
    setEditandoId(null);
    setModalAberto(true);
    setNhbSelecionadas([]);
    setDiagnosticosFiltrados([]);
  };

  // Abrir modal para editar sinal vital existente
  const abrirModalEditar = (sinal: SinalVital) => {
    // Garantir que todos os valores de referência tenham os novos campos
    const valoresAtualizados = (sinal.valoresReferencia || []).map((valor) => {
      // Migrate nhbId to nhbIds if necessary
      const nhbIds = valor.nhbIds || (valor.nhbId ? [valor.nhbId] : []);
      // Migrate diagnosticoId to diagnosticoIds if necessary
      const diagnosticoIds = valor.diagnosticoIds || (valor.diagnosticoId ? [valor.diagnosticoId] : []);
      
      return {
        ...valor,
        representaAlteracao:
          valor.representaAlteracao !== undefined
            ? valor.representaAlteracao
            : false,
        variacaoPor: valor.variacaoPor || "Nenhum",
        tipoValor: valor.tipoValor || "Numérico",
        nhbIds,
        diagnosticoIds,
      };
    });

    setFormSinal({
      ...sinal,
      valoresReferencia: valoresAtualizados,
    });
    setEditandoId(sinal.id || null);
    setModalAberto(true);
    
    // Collect all NHB IDs from all values
    const allNhbIds = valoresAtualizados.reduce((ids: string[], valor) => {
      if (valor.nhbIds && valor.nhbIds.length > 0) {
        return [...ids, ...valor.nhbIds];
      }
      return ids;
    }, []);
    
    // Set unique NHB IDs
    const uniqueNhbIds = [...new Set(allNhbIds)];
    setNhbSelecionadas(uniqueNhbIds);
    
    // Filter diagnósticos for all selected NHBs
    if (uniqueNhbIds.length > 0) {
      const relevantDiagnosticos = diagnosticos.filter(d => 
        d.subconjuntoIds?.some(id => uniqueNhbIds.includes(id))
      );
      setDiagnosticosFiltrados(relevantDiagnosticos);
    }
  };

  // Adicionar valor de referência
  const adicionarValorReferencia = () => {
    setFormSinal({
      ...formSinal,
      valoresReferencia: [
        ...(formSinal.valoresReferencia || []),
        { 
          titulo: "Novo Valor",
          condicao: "entre",
          unidade: "",
          representaAlteracao: false,
          variacaoPor: "Nenhum",
          tipoValor: "Numérico"
        }
      ]
    });
  };

  // Remover valor de referência
  const removerValorReferencia = (index: number) => {
    if (!formSinal.valoresReferencia) return;
    const novosValores = [...formSinal.valoresReferencia];
    novosValores.splice(index, 1);
    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores,
    });
  };

  // Atualizar valor de referência
  const atualizarValorReferencia = (
    index: number,
    campo: keyof ValorReferencia,
    valor: any
  ) => {
    if (!formSinal.valoresReferencia) return;
    const novosValores = [...formSinal.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      [campo]: valor,
    };

    // Quando o tipo de valor muda, ajustar os campos correspondentes
    if (campo === "tipoValor") {
      if (valor === "Texto") {
        novosValores[index].valorTexto = "";
        novosValores[index].valorMinimo = undefined;
        novosValores[index].valorMaximo = undefined;
      } else {
        novosValores[index].valorTexto = undefined;
      }
    }

    // Quando a variação muda, ajustamos os campos necessários
    if (campo === "variacaoPor") {
      if (valor === "Nenhum") {
        // Remover campos desnecessários para variação única
        delete novosValores[index].idadeMinima;
        delete novosValores[index].idadeMaxima;
        delete novosValores[index].sexo;
      } else if (valor === "Sexo") {
        // Adicionar campo de sexo e remover idade
        novosValores[index].sexo = "Todos";
        delete novosValores[index].idadeMinima;
        delete novosValores[index].idadeMaxima;
      } else if (valor === "Idade") {
        // Adicionar campos de idade e remover sexo
        novosValores[index].idadeMinima = 0;
        novosValores[index].idadeMaxima = 100;
        delete novosValores[index].sexo;
      }
      // 'Ambos' mantém todos os campos
    }

    // Se desmarcar "representa alteração", limpar os campos relacionados
    if (campo === "representaAlteracao" && valor === false) {
      delete novosValores[index].tituloAlteracao;
      novosValores[index].nhbIds = [];
      novosValores[index].diagnosticoIds = [];
      
      // Resetar os estados relacionados
      setNhbSelecionadas([]);
      setDiagnosticosFiltrados([]);
    }

    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores,
    });
  };

  // Atualizar NHBs selecionadas
  const handleNhbChange = (index: number, nhbIds: string[]) => {
    // Atualizar as NHBs no valor de referência específico
    if (!formSinal.valoresReferencia) return;
    const novosValores = [...formSinal.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      nhbIds: nhbIds,
    };

    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores,
    });
    
    // Atualizar o estado global de NHBs selecionadas
    setNhbSelecionadas(nhbIds);
    
    // Filtrar diagnósticos para todas as NHBs selecionadas
    if (nhbIds.length > 0) {
      const diagnosticosDaNhb = diagnosticos.filter(d => 
        d.subconjuntoIds?.some(id => nhbIds.includes(id))
      );
      setDiagnosticosFiltrados(diagnosticosDaNhb);
    } else {
      setDiagnosticosFiltrados([]);
    }
  };

  // Atualizar diagnósticos selecionados
  const handleDiagnosticoChange = (index: number, diagnosticoIds: string[]) => {
    if (!formSinal.valoresReferencia) return;
    const novosValores = [...formSinal.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      diagnosticoIds: diagnosticoIds,
    };

    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores,
    });
  };

  // Validar formulário antes de salvar
  const validarFormulario = (): { valido: boolean; mensagem?: string } => {
    // Verificar nome do sinal vital
    if (!formSinal.nome.trim()) {
      return {
        valido: false,
        mensagem: "Nome do sinal vital é obrigatório.",
      };
    }

    // Validar campos dos valores de referência
    if (formSinal.valoresReferencia) {
      for (const [index, valor] of formSinal.valoresReferencia.entries()) {
        // Unidade é obrigatória apenas para valores numéricos
        if (valor.tipoValor === "Numérico" && !valor.unidade?.trim()) {
          return {
            valido: false,
            mensagem: `Unidade é obrigatória para valores numéricos (valor #${index + 1}).`,
          };
        }

        // Validar campos específicos de acordo com a variação
        if (valor.variacaoPor === "Sexo" || valor.variacaoPor === "Ambos") {
          if (!validateSexVariation(valor)) {
            return {
              valido: false,
              mensagem: `Sexo é obrigatório quando a variação inclui sexo (valor #${index + 1}).`,
            };
          }
        }

        if (valor.variacaoPor === "Idade" || valor.variacaoPor === "Ambos") {
          if (!validateAgeVariation(valor)) {
            return {
              valido: false,
              mensagem: `Idade mínima e máxima são obrigatórias quando a variação inclui idade (valor #${index + 1}).`,
            };
          }
        }

        // Validar campos do tipo de valor
        if (valor.tipoValor === "Numérico") {
          if (!validateNumericValue(valor)) {
            return {
              valido: false,
              mensagem: `Pelo menos um valor (mínimo ou máximo) é obrigatório para valores numéricos (valor #${index + 1}).`,
            };
          }
        } else if (valor.tipoValor === "Texto") {
          if (!validateTextValue(valor)) {
            return {
              valido: false,
              mensagem: `Valor textual é obrigatório quando o tipo é texto (valor #${index + 1}).`,
            };
          }
        }

        if (valor.representaAlteracao) {
          const { hasTitle, hasNhbs, hasDiagnoses } = validateAlterationRequirements(valor);
          
          if (!hasTitle) {
            return {
              valido: false,
              mensagem: `Título da alteração é obrigatório quando o valor representa uma alteração (valor #${index + 1}).`,
            };
          }

          if (!hasNhbs) {
            return {
              valido: false,
              mensagem: `Pelo menos uma Necessidade Humana Básica (NHB) é obrigatória para valores que representam alteração (valor #${index + 1}).`,
            };
          }

          if (!hasDiagnoses) {
            return {
              valido: false,
              mensagem: `Pelo menos um Diagnóstico de Enfermagem é obrigatório para valores que representam alteração (valor #${index + 1}).`,
            };
          }
        }
      }
    }

    return { valido: true };
  };

  // Salvar sinal vital (criar novo ou atualizar existente)
  const salvarSinalVital = async () => {
    try {
      const validacao = validarFormulario();
      if (!validacao.valido) {
        toast({
          title: "Erro de validação",
          description: validacao.mensagem,
          variant: "destructive",
        });
        return;
      }

      if (editandoId) {
        // Atualizar existente
        const sinalRef = doc(db, "sinaisVitais", editandoId);
        await updateDoc(sinalRef, {
          ...formSinal,
          updatedAt: serverTimestamp(),
        });

        toast({
          title: "Sinal vital atualizado",
          description: `${formSinal.nome} foi atualizado com sucesso.`,
        });

        // Atualizar lista
        setSinaisVitais((prev) =>
          prev.map((s) =>
            s.id === editandoId
              ? { ...formSinal, id: editandoId, updatedAt: new Date() as any }
              : s
          )
        );
      } else {
        // Criar novo
        const novoSinal = {
          ...formSinal,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "sinaisVitais"), novoSinal);

        toast({
          title: "Sinal vital criado",
          description: `${formSinal.nome} foi criado com sucesso.`,
        });

        // Adicionar à lista
        setSinaisVitais((prev) => [
          ...prev,
          {
            ...novoSinal,
            id: docRef.id,
            createdAt: new Date() as any,
            updatedAt: new Date() as any,
          },
        ]);
      }

      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar sinal vital:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o sinal vital.",
        variant: "destructive",
      });
    }
  };

  // Excluir sinal vital
  const excluirSinalVital = async (id: string) => {
    if (
      confirm(
        "Tem certeza que deseja excluir este sinal vital? Esta ação não pode ser desfeita."
      )
    ) {
      try {
        await deleteDoc(doc(db, "sinaisVitais", id));

        toast({
          title: "Sinal vital excluído",
          description: "O sinal vital foi excluído com sucesso.",
        });

        // Remover da lista
        setSinaisVitais((prev) => prev.filter((s) => s.id !== id));
      } catch (error) {
        console.error("Erro ao excluir sinal vital:", error);
        toast({
          title: "Erro ao excluir",
          description: "Ocorreu um erro ao excluir o sinal vital.",
          variant: "destructive",
        });
      }
    }
  };

  return {
    sinaisVitais,
    subconjuntos,
    diagnosticos,
    modalAberto,
    setModalAberto,
    editandoId,
    carregando,
    nhbSelecionadas,
    diagnosticosFiltrados,
    formSinal,
    setFormSinal,
    abrirModalCriar,
    abrirModalEditar,
    adicionarValorReferencia,
    removerValorReferencia,
    atualizarValorReferencia,
    handleNhbChange,
    handleDiagnosticoChange,
    salvarSinalVital,
    excluirSinalVital,
  };
};

export default useSinaisVitais;
