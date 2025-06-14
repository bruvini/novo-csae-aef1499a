
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  createRevisaoSistema,
  updateRevisaoSistema,
  deleteRevisaoSistema,
  fetchSistemasCorporais,
  fetchRevisoesSistema,
  createSistemaCorporal,
  updateSistemaCorporal,
  deleteSistemaCorporal,
  fetchSubconjuntos,
  fetchDiagnosticos
} from "@/services/bancodados";

import { SistemaCorporal, RevisaoSistema, ValorReferenciaSistema } from "@/types/sistemas";
import { SubconjuntoDiagnostico, DiagnosticoCompleto } from "@/types/diagnosticos";
import SistemaCorporalModal from "./revisao-sistemas/SistemaCorporalModal";
import RevisaoSistemaModal from "./revisao-sistemas/RevisaoSistemaModal";
import SistemasCorporaisSection from './revisao-sistemas/SistemasCorporaisSection';
import RevisoesSistemaSection from './revisao-sistemas/RevisoesSistemaSection';

const GerenciadorRevisaoSistemas = () => {
  const [sistemasCorporais, setSistemasCorporais] = useState<SistemaCorporal[]>([]);
  const [revisoesSistema, setRevisoesSistema] = useState<RevisaoSistema[]>([]);
  const [selectedSistema, setSelectedSistema] = useState<string | null>(null);
  const [isSistemaModalOpen, setIsSistemaModalOpen] = useState(false);
  const [isRevisaoModalOpen, setIsRevisaoModalOpen] = useState(false);
  const [sistemaEmEdicao, setSistemaEmEdicao] = useState<SistemaCorporal | null>(null);
  const [revisaoEmEdicao, setRevisaoEmEdicao] = useState<RevisaoSistema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [valoresReferencia, setValoresReferencia] = useState<ValorReferenciaSistema[]>([]);
  const [subconjuntos, setSubconjuntos] = useState<SubconjuntoDiagnostico[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoCompleto[]>([]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const sistemas = await fetchSistemasCorporais();
        setSistemasCorporais(sistemas);
        if (sistemas.length > 0) {
          setSelectedSistema(sistemas[0].id || null);
        }
        const revisoes = await fetchRevisoesSistema();
        setRevisoesSistema(revisoes);
        const subconjuntosData = await fetchSubconjuntos();
        setSubconjuntos(subconjuntosData);
        const diagnosticosData = await fetchDiagnosticos();
        setDiagnosticos(diagnosticosData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao carregar os dados. Por favor, tente novamente.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [toast]);

  // Load revisões when selectedSistema changes
  useEffect(() => {
    if (selectedSistema) {
      setValoresReferencia(revisoesSistema.find(r => r.sistemaId === selectedSistema)?.valoresReferencia || []);
    }
  }, [selectedSistema, revisoesSistema]);

  // Handlers for Sistema Corporal
  const handleOpenSistemaModal = () => {
    setSistemaEmEdicao(null);
    setIsSistemaModalOpen(true);
  };

  const handleEditSistema = (sistema: SistemaCorporal) => {
    setSistemaEmEdicao(sistema);
    setIsSistemaModalOpen(true);
  };

  const handleCloseSistemaModal = () => {
    setIsSistemaModalOpen(false);
    setSistemaEmEdicao(null);
  };

  const handleSaveSistema = async (sistema: SistemaCorporal) => {
    setIsLoading(true);
    try {
      if (sistema.id) {
        await updateSistemaCorporal(sistema.id, sistema);
        setSistemasCorporais(prev => prev.map(s => s.id === sistema.id ? sistema : s));
        toast({ title: "Sistema atualizado com sucesso!" });
      } else {
        const novoSistema = await createSistemaCorporal(sistema);
        setSistemasCorporais(prev => [...prev, novoSistema]);
        toast({ title: "Sistema criado com sucesso!" });
      }
      handleCloseSistemaModal();
    } catch (error) {
      console.error("Erro ao salvar sistema:", error);
      toast({
        title: "Erro ao salvar sistema",
        description: "Ocorreu um erro ao salvar o sistema. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSistema = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteSistemaCorporal(id);
      setSistemasCorporais(prev => prev.filter(s => s.id !== id));
      toast({ title: "Sistema excluído com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir sistema:", error);
      toast({
        title: "Erro ao excluir sistema",
        description: "Ocorreu um erro ao excluir o sistema. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for Revisao Sistema
  const handleOpenRevisaoModal = () => {
    setRevisaoEmEdicao(null);
    setValoresReferencia([]);
    setIsRevisaoModalOpen(true);
  };

  const handleEditRevisao = (revisao: RevisaoSistema) => {
    setRevisaoEmEdicao(revisao);
    setValoresReferencia(revisao.valoresReferencia || []);
    setIsRevisaoModalOpen(true);
  };

  const handleCloseRevisaoModal = () => {
    setIsRevisaoModalOpen(false);
    setRevisaoEmEdicao(null);
    setValoresReferencia([]);
  };

  const handleSaveRevisao = async (revisao: RevisaoSistema) => {
    setIsLoading(true);
    try {
      const revisaoToSave = { ...revisao, sistemaId: selectedSistema || '', valoresReferencia };
      if (revisao.id) {
        await updateRevisaoSistema(revisao.id, revisaoToSave);
        setRevisoesSistema(prev => prev.map(r => r.id === revisao.id ? revisaoToSave : r));
        toast({ title: "Revisão atualizada com sucesso!" });
      } else {
        const novaRevisao = await createRevisaoSistema(revisaoToSave);
        setRevisoesSistema(prev => [...prev, novaRevisao]);
        toast({ title: "Revisão criada com sucesso!" });
      }
      handleCloseRevisaoModal();
    } catch (error) {
      console.error("Erro ao salvar revisão:", error);
      toast({
        title: "Erro ao salvar revisão",
        description: "Ocorreu um erro ao salvar a revisão. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRevisao = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteRevisaoSistema(id);
      setRevisoesSistema(prev => prev.filter(r => r.id !== id));
      toast({ title: "Revisão excluída com sucesso!" });
    } catch (error) {
      console.error("Erro ao excluir revisão:", error);
      toast({
        title: "Erro ao excluir revisão",
        description: "Ocorreu um erro ao excluir a revisão. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Valor Referencia Handlers
  const adicionarValorReferencia = () => {
    setValoresReferencia(prev => [...prev, {
      titulo: '',
      unidade: '',
      representaAlteracao: false,
      variacaoPor: 'Nenhum',
      tipoValor: 'Texto',
      nhbIds: [],
      diagnosticoIds: [],
    }]);
  };

  const removerValorReferencia = (index: number) => {
    setValoresReferencia(prev => prev.filter((_, i) => i !== index));
  };

  const atualizarValorReferencia = (index: number, campo: keyof ValorReferenciaSistema, valor: unknown) => {
    const novosValoresReferencia = [...valoresReferencia];
    (novosValoresReferencia[index] as any)[campo] = valor;
    setValoresReferencia(novosValoresReferencia);
  };

  // Replace these functions with updated versions accepting arrays
  const handleNhbChange = (index: number, nhbIds: string[]) => {
    const novosValoresReferencia = [...valoresReferencia];
    novosValoresReferencia[index].nhbIds = nhbIds;
    setValoresReferencia(novosValoresReferencia);
  };

  const handleDiagnosticoChange = (index: number, diagnosticoIds: string[]) => {
    const novosValoresReferencia = [...valoresReferencia];
    novosValoresReferencia[index].diagnosticoIds = diagnosticoIds;
    setValoresReferencia(novosValoresReferencia);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold text-csae-green-700 mb-4">Gerenciador de Revisão de Sistemas</h1>

      <SistemasCorporaisSection
        sistemasCorporais={sistemasCorporais}
        handleOpenSistemaModal={handleOpenSistemaModal}
        handleEditSistema={handleEditSistema}
        handleDeleteSistema={handleDeleteSistema}
      />

      <RevisoesSistemaSection
        revisoesSistema={revisoesSistema}
        sistemasCorporais={sistemasCorporais}
        selectedSistema={selectedSistema}
        setSelectedSistema={setSelectedSistema}
        handleOpenRevisaoModal={handleOpenRevisaoModal}
        handleEditRevisao={handleEditRevisao}
        handleDeleteRevisao={handleDeleteRevisao}
      />

      {/* Modals */}
      <SistemaCorporalModal
        isOpen={isSistemaModalOpen}
        onClose={handleCloseSistemaModal}
        onSave={handleSaveSistema}
        sistema={sistemaEmEdicao}
      />
      <RevisaoSistemaModal
        isOpen={isRevisaoModalOpen}
        onClose={handleCloseRevisaoModal}
        onSave={handleSaveRevisao}
        revisao={revisaoEmEdicao}
        sistemasCorporais={sistemasCorporais}
        selectedSistema={selectedSistema}
        valoresReferencia={valoresReferencia}
        adicionarValorReferencia={adicionarValorReferencia}
        removerValorReferencia={removerValorReferencia}
        atualizarValorReferencia={atualizarValorReferencia}
        handleNhbChange={handleNhbChange}
        handleDiagnosticoChange={handleDiagnosticoChange}
        subconjuntos={subconjuntos}
        diagnosticos={diagnosticos}
      />
    </div>
  );
};

export default GerenciadorRevisaoSistemas;
