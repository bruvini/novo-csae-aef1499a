
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

export const useSinaisVitais = () => {
  const { toast } = useToast();
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [subconjuntos, setSubconjuntos] = useState<SubconjuntoDiagnostico[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [nhbSelecionada, setNhbSelecionada] = useState<string | null>(null);
  const [diagnosticosFiltrados, setDiagnosticosFiltrados] = useState<DiagnosticoCompleto[]>([]);

  // Estado para o formulário
  const [formSinal, setFormSinal] = useState<SinalVital>({
    nome: "",
    unidade: "", // Required property
    ativo: true, // Required property
    diferencaSexoIdade: false,
    valoresReferencia: [
      {
        titulo: "Valor Padrão", // Add required property
        condicao: "entre", // Add required property
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
    if (nhbSelecionada) {
      const filtrados = diagnosticos.filter(
        (d) => d.subconjuntoId === nhbSelecionada
      );
      setDiagnosticosFiltrados(filtrados);
    } else {
      setDiagnosticosFiltrados([]);
    }
  }, [nhbSelecionada, diagnosticos]);

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
      unidade: "", // Required property
      ativo: true, // Required property
      diferencaSexoIdade: false,
      valoresReferencia: [
        {
          titulo: "Valor Padrão", // Add required property
          condicao: "entre", // Add required property
          unidade: "",
          representaAlteracao: false,
          variacaoPor: "Nenhum",
          tipoValor: "Numérico"
        },
      ],
    });
    setEditandoId(null);
    setModalAberto(true);
  };

  // Abrir modal para editar sinal vital existente
  const abrirModalEditar = (sinal: SinalVital) => {
    // Garantir que todos os valores de referência tenham os novos campos
    const valoresAtualizados = (sinal.valoresReferencia || []).map((valor) => ({
      ...valor,
      representaAlteracao:
        valor.representaAlteracao !== undefined
          ? valor.representaAlteracao
          : false,
      variacaoPor: valor.variacaoPor || "Nenhum",
      tipoValor: valor.tipoValor || "Numérico",
    }));

    setFormSinal({
      ...sinal,
      valoresReferencia: valoresAtualizados,
    });
    setEditandoId(sinal.id || null);
    setModalAberto(true);
    
    // Resetar os diagnósticos filtrados quando abre o modal de edição
    setDiagnosticosFiltrados([]);
    setNhbSelecionada(null);
    
    // Para cada valor de referência, se tiver nhbId, precisamos carregar os diagnósticos correspondentes
    valoresAtualizados.forEach(valor => {
      if (valor.nhbId) {
        const diagnosticosDaNhb = diagnosticos.filter(d => d.subconjuntoId === valor.nhbId);
        if (diagnosticosDaNhb.length > 0) {
          setDiagnosticosFiltrados(diagnosticosDaNhb);
          setNhbSelecionada(valor.nhbId);
        }
      }
    });
  };

  // Adicionar valor de referência
  const adicionarValorReferencia = () => {
    setFormSinal({
      ...formSinal,
      valoresReferencia: [
        ...(formSinal.valoresReferencia || []),
        { 
          titulo: "Novo Valor",  // Add required property
          condicao: "entre", // Add required property
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
      delete novosValores[index].nhbId;
      delete novosValores[index].diagnosticoId;
      
      // Resetar os estados relacionados
      setNhbSelecionada(null);
      setDiagnosticosFiltrados([]);
    }

    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores,
    });
  };

  // Atualizar NHB selecionada
  const handleNhbChange = (index: number, nhbId: string) => {
    setNhbSelecionada(nhbId);

    if (!formSinal.valoresReferencia) return;
    const novosValores = [...formSinal.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      nhbId: nhbId,
      diagnosticoId: undefined, // Limpar diagnóstico quando mudar a NHB
    };

    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores,
    });
    
    // Filtrar diagnósticos para a NHB selecionada
    const diagnosticosDaNhb = diagnosticos.filter(d => d.subconjuntoId === nhbId);
    setDiagnosticosFiltrados(diagnosticosDaNhb);
  };

  // Atualizar diagnóstico selecionado
  const handleDiagnosticoChange = (index: number, diagnosticoId: string) => {
    if (!formSinal.valoresReferencia) return;
    const novosValores = [...formSinal.valoresReferencia];
    novosValores[index] = {
      ...novosValores[index],
      diagnosticoId: diagnosticoId,
    };

    setFormSinal({
      ...formSinal,
      valoresReferencia: novosValores,
    });
  };

  // Salvar sinal vital (criar novo ou atualizar existente)
  const salvarSinalVital = async () => {
    try {
      if (!formSinal.nome.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "Nome do sinal vital é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      if (formSinal.valoresReferencia && formSinal.valoresReferencia.some((vr) => !vr.unidade?.trim())) {
        toast({
          title: "Campo obrigatório",
          description: "Unidade é obrigatória para todos os valores de referência.",
          variant: "destructive",
        });
        return;
      }

      // Validar campos específicos de acordo com a variação
      if (formSinal.valoresReferencia) {
        for (const valor of formSinal.valoresReferencia) {
          if (valor.variacaoPor === "Sexo" || valor.variacaoPor === "Ambos") {
            if (!valor.sexo) {
              toast({
                title: "Campo obrigatório",
                description: "Sexo é obrigatório quando a variação inclui sexo.",
                variant: "destructive",
              });
              return;
            }
          }

          if (valor.variacaoPor === "Idade" || valor.variacaoPor === "Ambos") {
            if (
              valor.idadeMinima === undefined ||
              valor.idadeMaxima === undefined
            ) {
              toast({
                title: "Campo obrigatório",
                description:
                  "Idade mínima e máxima são obrigatórias quando a variação inclui idade.",
                variant: "destructive",
              });
              return;
            }
          }

          // Validar campos do tipo de valor
          if (valor.tipoValor === "Numérico") {
            if (
              valor.valorMinimo === undefined &&
              valor.valorMaximo === undefined
            ) {
              toast({
                title: "Campo obrigatório",
                description:
                  "Pelo menos um valor (mínimo ou máximo) é obrigatório para valores numéricos.",
                variant: "destructive",
              });
              return;
            }
          } else if (valor.tipoValor === "Texto") {
            if (!valor.valorTexto?.trim()) {
              toast({
                title: "Campo obrigatório",
                description: "Valor textual é obrigatório quando o tipo é texto.",
                variant: "destructive",
              });
              return;
            }
          }

          if (valor.representaAlteracao) {
            if (!valor.tituloAlteracao?.trim()) {
              toast({
                title: "Campo obrigatório",
                description:
                  "Título da alteração é obrigatório quando o valor representa uma alteração.",
                variant: "destructive",
              });
              return;
            }

            if (!valor.nhbId) {
              toast({
                title: "Campo obrigatório",
                description:
                  "Necessidade Humana Básica (NHB) é obrigatória para valores que representam alteração.",
                variant: "destructive",
              });
              return;
            }

            if (!valor.diagnosticoId) {
              toast({
                title: "Campo obrigatório",
                description:
                  "Diagnóstico de Enfermagem é obrigatório para valores que representam alteração.",
                variant: "destructive",
              });
              return;
            }
          }
        }
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
    nhbSelecionada,
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
