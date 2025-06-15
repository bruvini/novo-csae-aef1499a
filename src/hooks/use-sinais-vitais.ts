
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  SinalVital,
  ValorReferencia,
  SubconjuntoDiagnostico,
  DiagnosticoCompleto,
} from "@/types/sinais-vitais";
import {
  fetchSinaisVitais,
  fetchSubconjuntos,
  fetchDiagnosticos,
  createSinalVital,
  updateSinalVital,
  deleteSinalVital,
} from "@/services/bancodados/sinaisVitaisDB";
import { validarFormularioSinalVital } from "@/utils/sinais-vitais-validator";

const initialFormState: SinalVital = {
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
      tipoValor: "Numérico",
    },
  ],
};

export const useSinaisVitais = () => {
  const { toast } = useToast();
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [subconjuntos, setSubconjuntos] = useState<SubconjuntoDiagnostico[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nhbSelecionadas, setNhbSelecionadas] = useState<string[]>([]);
  const [diagnosticosFiltrados, setDiagnosticosFiltrados] = useState<DiagnosticoCompleto[]>([]);
  const [formSinal, setFormSinal] = useState<SinalVital>(initialFormState);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sinaisData, subconjuntosData, diagnosticosData] = await Promise.all([
        fetchSinaisVitais(),
        fetchSubconjuntos(),
        fetchDiagnosticos(),
      ]);
      setSinaisVitais(sinaisData);
      setSubconjuntos(subconjuntosData);
      setDiagnosticos(diagnosticosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados da página.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (nhbSelecionadas.length > 0) {
      const filtrados = diagnosticos.filter(
        (d) => d.subconjuntoIds?.some((id) => nhbSelecionadas.includes(id)) || false
      );
      setDiagnosticosFiltrados(filtrados);
    } else {
      setDiagnosticosFiltrados([]);
    }
  }, [nhbSelecionadas, diagnosticos]);

  const abrirModalCriar = () => {
    setFormSinal(initialFormState);
    setEditandoId(null);
    setModalAberto(true);
    setNhbSelecionadas([]);
    setDiagnosticosFiltrados([]);
  };

  const abrirModalEditar = (sinal: SinalVital) => {
    const valoresAtualizados = (sinal.valoresReferencia || []).map((valor) => {
      const nhbIds = valor.nhbIds || (valor.nhbId ? [valor.nhbId] : []);
      const diagnosticoIds = valor.diagnosticoIds || (valor.diagnosticoId ? [valor.diagnosticoId] : []);
      return {
        ...valor,
        representaAlteracao: valor.representaAlteracao !== undefined ? valor.representaAlteracao : false,
        variacaoPor: valor.variacaoPor || "Nenhum",
        tipoValor: valor.tipoValor || "Numérico",
        nhbIds,
        diagnosticoIds,
      };
    });

    setFormSinal({ ...sinal, valoresReferencia: valoresAtualizados });
    setEditandoId(sinal.id || null);
    setModalAberto(true);
    
    const allNhbIds = valoresAtualizados.reduce((ids: string[], valor) => {
      if (valor.nhbIds) return [...ids, ...valor.nhbIds];
      return ids;
    }, []);
    
    const uniqueNhbIds = [...new Set(allNhbIds)];
    setNhbSelecionadas(uniqueNhbIds);
    
    if (uniqueNhbIds.length > 0) {
      const relevantDiagnosticos = diagnosticos.filter((d) =>
        d.subconjuntoIds?.some((id) => uniqueNhbIds.includes(id))
      );
      setDiagnosticosFiltrados(relevantDiagnosticos);
    }
  };

  const adicionarValorReferencia = () => {
    setFormSinal((prev) => ({
      ...prev,
      valoresReferencia: [
        ...(prev.valoresReferencia || []),
        { 
          titulo: "Novo Valor",
          condicao: "entre",
          unidade: "",
          representaAlteracao: false,
          variacaoPor: "Nenhum",
          tipoValor: "Numérico"
        }
      ]
    }));
  };

  const removerValorReferencia = (index: number) => {
    setFormSinal((prev) => {
      if (!prev.valoresReferencia) return prev;
      const novosValores = [...prev.valoresReferencia];
      novosValores.splice(index, 1);
      return { ...prev, valoresReferencia: novosValores };
    });
  };

  const atualizarValorReferencia = (index: number, campo: keyof ValorReferencia, valor: any) => {
    setFormSinal((prev) => {
      if (!prev.valoresReferencia) return prev;
      const novosValores = [...prev.valoresReferencia];
      novosValores[index] = { ...novosValores[index], [campo]: valor };

      if (campo === "tipoValor") {
        if (valor === "Texto") {
          novosValores[index].valorTexto = "";
          delete novosValores[index].valorMinimo;
          delete novosValores[index].valorMaximo;
        } else {
          delete novosValores[index].valorTexto;
        }
      }

      if (campo === "variacaoPor") {
        delete novosValores[index].idadeMinima;
        delete novosValores[index].idadeMaxima;
        delete novosValores[index].sexo;
        if (valor === "Sexo") novosValores[index].sexo = "Todos";
        else if (valor === "Idade") {
          novosValores[index].idadeMinima = 0;
          novosValores[index].idadeMaxima = 100;
        } else if (valor === "Ambos") {
          novosValores[index].sexo = "Todos";
          novosValores[index].idadeMinima = 0;
          novosValores[index].idadeMaxima = 100;
        }
      }

      if (campo === "representaAlteracao" && valor === false) {
        delete novosValores[index].tituloAlteracao;
        novosValores[index].nhbIds = [];
        novosValores[index].diagnosticoIds = [];
        setNhbSelecionadas([]);
        setDiagnosticosFiltrados([]);
      }

      return { ...prev, valoresReferencia: novosValores };
    });
  };

  const handleNhbChange = (index: number, nhbIds: string[]) => {
    atualizarValorReferencia(index, "nhbIds", nhbIds);
    setNhbSelecionadas(nhbIds);
  };

  const handleDiagnosticoChange = (index: number, diagnosticoIds: string[]) => {
    atualizarValorReferencia(index, "diagnosticoIds", diagnosticoIds);
  };
  
  const salvarSinalVital = async () => {
    const validacao = validarFormularioSinalVital(formSinal);
    if (!validacao.valido) {
      toast({ title: "Erro de validação", description: validacao.mensagem, variant: "destructive" });
      return;
    }

    try {
      if (editandoId) {
        const sinalAtualizado = await updateSinalVital(editandoId, formSinal);
        setSinaisVitais((prev) => prev.map((s) => (s.id === editandoId ? sinalAtualizado : s)));
        toast({ title: "Sinal vital atualizado", description: `${formSinal.nome} foi atualizado com sucesso.` });
      } else {
        const novoSinal = await createSinalVital(formSinal);
        setSinaisVitais((prev) => [...prev, novoSinal]);
        toast({ title: "Sinal vital criado", description: `${formSinal.nome} foi criado com sucesso.` });
      }
      setModalAberto(false);
    } catch (error) {
      console.error("Erro ao salvar sinal vital:", error);
      toast({ title: "Erro ao salvar", description: "Ocorreu um erro ao salvar o sinal vital.", variant: "destructive" });
    }
  };

  const excluirSinalVital = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este sinal vital? Esta ação não pode ser desfeita.")) {
      try {
        await deleteSinalVital(id);
        setSinaisVitais((prev) => prev.filter((s) => s.id !== id));
        toast({ title: "Sinal vital excluído", description: "O sinal vital foi excluído com sucesso." });
      } catch (error) {
        console.error("Erro ao excluir sinal vital:", error);
        toast({ title: "Erro ao excluir", description: "Ocorreu um erro ao excluir o sinal vital.", variant: "destructive" });
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
    isLoading,
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
