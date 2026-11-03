import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast"
import { Paciente } from '@/types/paciente';
import { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import {
  criarProcessoEnfermagem,
  salvarProgressoProcesso,
  concluirProcesso,
  buscarProcessoAtivo,
  buscarProcessoPorId,
  excluirProcesso,
  iniciarNovaSessao,
  finalizarSessaoAtual,
} from '@/services/bancodados/processosEnfermagemDB';
import { encaminharSugestoes, identificadorSugestao, reprocessarSugestoesPendentes, type IntervencaoAutoral } from '@/services/bancodados/intervencoesAutoraisDB';
import {
  calcularEtapasCompletadas,
  isEtapaAcessivel,
  getMotivoBloqueio,
  executarAvancoAposSalvar,
  RequisitoDescricaoAvaliacao,
} from '@/utils/processoUtils';
import { useAuth } from '@/contexts/AuthContext';
import { conciliarImplementacao, invalidarResumoAoAlterarEntrega } from '@/utils/materiaisApoioProcesso';
import { conciliarEvolucao } from '@/utils/evolucaoProcesso';
import { Loader2, Trash2, History } from 'lucide-react';
import StepperProcesso from './StepperProcesso';
import EtapaAvaliacao from './EtapaAvaliacao';
import EtapaDiagnostico from './EtapaDiagnostico';
import EtapaPlanejamento from './EtapaPlanejamento';
import EtapaImplementacao from './EtapaImplementacao';
import EtapaEvolucao from './EtapaEvolucao';
import EtapaResumo from './EtapaResumo';
import { ImplementacaoEnfermagem, PlanejamentoEnfermagem, AvaliacaoEnfermagem, DiagnosticoEnfermagem, EvolucaoEnfermagem } from '@/types/processoEnfermagem';
import HistoricoProcessosModal from './HistoricoProcessosModal';
import TempoAtivoBadge from './TempoAtivoBadge';

interface ProcessoEnfermagemModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente;
  enfermeiroId: string;
  processoInicial?: ProcessoEnfermagem | null;
  onProcessoDeleted?: () => void;
}

const ProcessoEnfermagemModal: React.FC<ProcessoEnfermagemModalProps> = ({
  isOpen,
  onClose,
  paciente,
  enfermeiroId,
  processoInicial,
  onProcessoDeleted
}) => {
  const [processo, setProcesso] = useState<ProcessoEnfermagem>(
    processoInicial || {
      id: '',
      pacienteId: paciente.id || '',
      enfermeiroId: enfermeiroId,
      status: 'em_andamento',
      etapaAtual: 1,
      dataInicio: null,
      sessoesDeTrabalho: [],
      avaliacao: {
        coletaDeDadosSubjetivos: '',
        exameFisico: {},
        nhbsAfetadas: []
      },
      diagnostico: { diagnosticosSelecionados: [] },
      planejamento: { diagnosticosPlanejados: [] },
      implementacao: {},
      evolucao: { resumoGerado: '' }
    }
  );
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [requisitosDescricao, setRequisitosDescricao] = useState<RequisitoDescricaoAvaliacao[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => { if (!isOpen) setIsInitializing(true); }, [isOpen]);
  const conteudoRef = useRef<HTMLDivElement>(null);
  const exclusaoEmAndamentoRef = useRef(false);
  useLayoutEffect(() => { if (conteudoRef.current) conteudoRef.current.scrollTop = 0; }, [etapaAtual]);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const { toast } = useToast();
  const { user, sessionData } = useAuth();
  useEffect(() => { if (user?.uid) void reprocessarSugestoesPendentes(user.uid).catch(console.error); }, [user?.uid]);
  const processoAtualRef = useRef(processo);
  processoAtualRef.current = processo;
  // Não duplicar as etapas concluídas em state: elas sempre refletem as
  // escolhas atuais, inclusive antes do primeiro salvamento no Firestore.
  const etapasCompletadas = calcularEtapasCompletadas(processo, requisitosDescricao);

  const atualizarRequisitosDescricao = useCallback((requisitos: RequisitoDescricaoAvaliacao[]) => {
    setRequisitosDescricao(requisitos);
  }, []);

  // Timer para atualizar o tempo ativo a cada segundo - REMOVIDO para TempoAtivoBadge

  // Carregar processo ativo ao abrir, ou criar um novo se não existir
  useEffect(() => {
    if (!isOpen || !paciente.id) return;
    let ativo = true;
    setIsInitializing(true);
    setLoadFailed(false);

    const carregarOuCriarProcesso = async () => {
      try {
        let processoAtual: ProcessoEnfermagem | null = null;

        if (processoInicial) {
          processoAtual = processoInicial;
        } else {
          // Tentar buscar processo ativo
          processoAtual = await buscarProcessoAtivo(paciente.id, enfermeiroId);
        }

        if (processoAtual) {
          // Iniciar nova sessão de trabalho para monitorar tempo ativo
          await iniciarNovaSessao(paciente.id, processoAtual.id);
          
          // Re-buscar para obter a sessão iniciada e garantir o contador em tempo real
          const atualizado = await buscarProcessoPorId(paciente.id, processoAtual.id);
          if (!atualizado) throw new Error('Processo não encontrado após iniciar sessão.');
          if (ativo) {
            processoAtualRef.current = atualizado;
            setProcesso(atualizado);
            setEtapaAtual(atualizado.etapaAtual);
          }
          return;
        }

        // Se não existir, cria novo (já inicia sessão internamente)
        if (ativo) await criarNovoProcesso(() => ativo);
      } catch (error) {
        console.error('Erro ao carregar ou criar processo:', error);
        if (ativo) setLoadFailed(true);
        toast({
          title: "Erro",
          description: "Não foi possível carregar ou iniciar o processo.",
          variant: "destructive",
        });
      } finally {
        if (ativo) setIsInitializing(false);
      }
    };

    carregarOuCriarProcesso();
    return () => { ativo = false; };
  }, [isOpen, processoInicial, paciente.id, enfermeiroId]);

  const criarNovoProcesso = async (isActive: () => boolean) => {
    if (!paciente.id) return;

    // O Stepper será recalculado quando o novo processo for carregado.
    setEtapaAtual(1);
    
    try {
      const novoId = await criarProcessoEnfermagem(paciente.id, enfermeiroId);
      if (!isActive()) return;

      // Carregar documento completo
      const docCarregado = await buscarProcessoPorId(paciente.id, novoId);
      if (!isActive()) return;
      if (docCarregado) {
        processoAtualRef.current = docCarregado;
        setProcesso(docCarregado);
        setEtapaAtual(docCarregado.etapaAtual || 1);
      } else {
        throw new Error('Processo recém-criado não encontrado.');
      }

      toast({
        title: "Sucesso",
        description: "Novo processo de enfermagem iniciado!",
      })
    } catch (error) {
      console.error('Erro ao criar processo:', error);
      if (isActive()) setLoadFailed(true);
      toast({
        title: "Erro",
        description: "Erro ao iniciar processo de enfermagem.",
        variant: "destructive",
      })
    }
  };

  const handleEtapaChange = async (etapa: number) => {
    if (isInitializing || loadFailed || isSaving) return;
    // Se está tentando avançar (etapa > etapaAtual)
    if (etapa > etapaAtual) {
      const atual = processoAtualRef.current;
      const conclusoes = calcularEtapasCompletadas(atual, requisitosDescricao);
      const isAcessivel = isEtapaAcessivel(
        etapa,
        etapaAtual,
        conclusoes,
        atual,
        requisitosDescricao
      );
      
      if (!isAcessivel) {
        const motivo = getMotivoBloqueio(etapa, etapaAtual, conclusoes, atual, requisitosDescricao);
        toast({
          title: "Etapa Bloqueada",
          description: motivo || "Complete as etapas anteriores para liberar.",
          variant: "destructive"
        });
        return; // Aborta navegação
      }

      await executarAvancoAposSalvar(handleSalvarProgresso, () => {
        const atualizado = { ...processoAtualRef.current, etapaAtual: etapa };
        processoAtualRef.current = atualizado;
        setProcesso(atualizado);
        setEtapaAtual(etapa);
      });
      return;
    }

    const atualizado = { ...processoAtualRef.current, etapaAtual: etapa };
    processoAtualRef.current = atualizado;
    setProcesso(atualizado);
    setEtapaAtual(etapa);
  };

  const handleUpdateAvaliacao = (avaliacao: AvaliacaoEnfermagem) => {
    const atual = processoAtualRef.current;
    const retirados = (atual.avaliacao?.cuidadosAnterioresAbordados || []).filter(cuidado =>
      !(avaliacao.cuidadosAnterioresAbordados || []).some(item => item.acompanhamentoId === cuidado.acompanhamentoId)
    );
    const decisoesRemovidas = (atual.diagnostico?.reavaliacoesAnteriores || []).filter(decisao => retirados.some(cuidado => cuidado.acompanhamentoId === decisao.acompanhamentoId));
    if (decisoesRemovidas.length && !window.confirm('Desmarcar este cuidado também removerá a decisão diagnóstica e o planejamento dependente desta consulta. Deseja continuar?')) return;
    const acompanhamentosRemovidos = new Set(decisoesRemovidas.map(decisao => decisao.acompanhamentoId));
    const idsDiagnosticosRemovidos = new Set((atual.diagnostico?.diagnosticosSelecionados || [])
      .filter(item => item.acompanhamentoId && acompanhamentosRemovidos.has(item.acompanhamentoId)).map(item => item.id));
    const diagnostico = decisoesRemovidas.length ? {
      ...atual.diagnostico,
      diagnosticosSelecionados: atual.diagnostico.diagnosticosSelecionados.filter(item => !idsDiagnosticosRemovidos.has(item.id)),
      reavaliacoesAnteriores: (atual.diagnostico.reavaliacoesAnteriores || []).filter(item => !acompanhamentosRemovidos.has(item.acompanhamentoId)),
    } : atual.diagnostico;
    const planejamento = decisoesRemovidas.length ? {
      ...atual.planejamento,
      diagnosticosPlanejados: atual.planejamento.diagnosticosPlanejados.filter(item => !idsDiagnosticosRemovidos.has(item.diagnosticoId)),
    } : atual.planejamento;
    const base = {
      ...atual,
      avaliacao,
      diagnostico,
      planejamento,
      ...(decisoesRemovidas.length ? { implementacao: conciliarImplementacao(planejamento.diagnosticosPlanejados, atual.implementacao || {}) } : {}),
    };
    const atualizado = decisoesRemovidas.length ? { ...base, evolucao: { ...conciliarEvolucao(base), resumoGerado: '' } } : base;
    processoAtualRef.current = atualizado;
    setProcesso(atualizado);
  };

  const handleUpdateDiagnostico = (diagnostico: DiagnosticoEnfermagem) => {
    const base = { ...processoAtualRef.current, diagnostico };
    const atualizado = { ...base, evolucao: { ...conciliarEvolucao(base), resumoGerado: '' } };
    processoAtualRef.current = atualizado;
    setProcesso(atualizado);
  };

  const handleUpdatePlanejamento = (planejamento: PlanejamentoEnfermagem) => {
    const base = { ...processoAtualRef.current, planejamento, implementacao: conciliarImplementacao(planejamento.diagnosticosPlanejados, processoAtualRef.current.implementacao || {}) };
    const atualizado = { ...base, evolucao: { ...conciliarEvolucao(base), resumoGerado: '' } };
    processoAtualRef.current = atualizado;
    setProcesso(atualizado);
  };

  const handleUpdateImplementacao = (novaImplementacao: ImplementacaoEnfermagem) => {
    const prev = processoAtualRef.current;
      // Recalcular intervencoesExecutadas: remover entradas que não são mais do executor "Enfermeiro"
      const intervencoesExecutadasAtualizadas: { [tituloDiag: string]: string[] } = {
        ...(prev.evolucao?.intervencoesExecutadas || {})
      };

      Object.entries(novaImplementacao).forEach(([tituloDiag, dados]) => {
        dados.intervencoes.forEach(int => {
          const deixouDeSerEnfermeiro =
            !int.implementadoNestaConsulta || int.quemExecuta !== 'Enfermeiro';

          if (deixouDeSerEnfermeiro && intervencoesExecutadasAtualizadas[tituloDiag]) {
            // Remove esta ação específica da lista de executadas
            intervencoesExecutadasAtualizadas[tituloDiag] =
              intervencoesExecutadasAtualizadas[tituloDiag].filter(
                (acaoPrescrita) => acaoPrescrita !== int.acaoPrescrita
              );
            // Se o array ficou vazio, remove a chave do objeto
            if (intervencoesExecutadasAtualizadas[tituloDiag].length === 0) {
              delete intervencoesExecutadasAtualizadas[tituloDiag];
            }
          }
        });
      });

      const base = {
        ...prev,
        implementacao: novaImplementacao,
      };
      const atualizado = {
        ...base,
        evolucao: { ...invalidarResumoAoAlterarEntrega({
          ...conciliarEvolucao(base),
          intervencoesExecutadas: intervencoesExecutadasAtualizadas,
        }, prev.implementacao || {}, novaImplementacao), resumoGerado: '' },
      };
    processoAtualRef.current = atualizado;
    setProcesso(atualizado);
  };

  const handleUpdateEvolucao = (evolucao: EvolucaoEnfermagem) => {
    const atualizado = { ...processoAtualRef.current, evolucao };
    processoAtualRef.current = atualizado;
    setProcesso(atualizado);
  };

  const handleSalvarProgresso = async (): Promise<boolean> => {
    if (!processo.id || !paciente.id) return false;

    setIsSaving(true);
    try {
      const atual = processoAtualRef.current;
      await salvarProgressoProcesso(
        paciente.id,
        atual.id,
        etapaAtual,
        {
          avaliacao: atual.avaliacao,
          diagnostico: atual.diagnostico,
          planejamento: atual.planejamento,
          implementacao: atual.implementacao,
          evolucao: atual.evolucao,
        }
      );

      return true;
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);

      let descricaoErro = 'Não foi possível salvar o progresso. Verifique sua conexão e tente novamente.';
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('permission') || msg.includes('missing or insufficient')) {
          descricaoErro = 'Sem permissão para salvar. Verifique se sua sessão ainda está ativa.';
        } else if (msg.includes('unavailable') || msg.includes('offline') || msg.includes('network')) {
          descricaoErro = 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
        }
      }

      toast({
        title: "Erro ao salvar progresso",
        description: descricaoErro,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    if (isInitializing || loadFailed || !processo.id || !paciente.id || processo.pacienteId !== paciente.id) {
      onClose();
      return;
    }

    const salvo = await handleSalvarProgresso();
    if (!salvo) return;

    setIsSaving(true);
    try {
      await finalizarSessaoAtual(paciente.id, processo.id);
      onClose();
    } catch (error) {
      console.error('Erro ao fechar processo:', error);
      toast({
        title: "Erro ao encerrar sessão",
        description: "O progresso foi salvo, mas não foi possível encerrar a sessão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConcluirProcesso = async () => {
    if (isInitializing || loadFailed || isSaving || !processo.id || !paciente.id || processo.pacienteId !== paciente.id) return;

    const etapasConcluidas = calcularEtapasCompletadas(processo, requisitosDescricao);
    if (![1, 2, 3, 4, 5, 6].every((etapa) => etapasConcluidas.includes(etapa))) {
      toast({
        title: 'Processo incompleto',
        description: getMotivoBloqueio(6, etapaAtual, etapasConcluidas, processo, requisitosDescricao)
          || 'Conclua as cinco etapas do Processo de Enfermagem e gere o resumo final antes de encerrar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      let sugestoesPendentes = false;
      await concluirProcesso(
        paciente.id,
        processo.id,
        {
          avaliacao: processo.avaliacao,
          diagnostico: processo.diagnostico,
          planejamento: processo.planejamento,
          implementacao: processo.implementacao,
          evolucao: processo.evolucao,
        }
      );

      // A conclusão assistencial precede o encaminhamento administrativo. Uma falha
      // deste último mantém a sugestão na fila local para retentativa idempotente.
      try {
        if (user?.uid) {
          const intervencoesAutorais: IntervencaoAutoral[] = await Promise.all(
            processo.planejamento.diagnosticosPlanejados.flatMap(diagnostico =>
              (diagnostico.intervencoesSelecionadas || []).filter(i => i.tipo === 'autoral').map(async intervencao => ({
                textoIntervencao: intervencao.acaoPrescrita,
                tituloResultadoVinculado: diagnostico.resultadoEsperadoSelecionado || '',
                tituloResultadoOrigem: diagnostico.resultadoEsperadoSelecionado || '',
                diagnosticoOrigemId: diagnostico.diagnosticoId,
                tituloDiagnosticoOrigem: diagnostico.tituloDiagnostico,
                autorId: user.uid,
                autorNome: sessionData?.nomeCompleto || user.displayName || user.uid,
                autorNomeResolvido: sessionData?.nomeCompleto || undefined,
                identificadorSugestao: await identificadorSugestao(processo.id, diagnostico.diagnosticoId, diagnostico.resultadoEsperadoSelecionado || '', intervencao.acaoPrescrita, user.uid),
              })))
          );
          if (intervencoesAutorais.length) await encaminharSugestoes(intervencoesAutorais, user.uid);
        }
      } catch (erroAdministrativo) {
        console.error('Processo concluído; sugestão administrativa pendente:', erroAdministrativo);
        sugestoesPendentes = true;
      }

      toast({
        title: "Sucesso",
        description: sugestoesPendentes
          ? 'Processo concluído. O envio de uma sugestão ficou pendente neste navegador.'
          : 'Processo concluído com sucesso!',
      })
      onClose();
    } catch (error) {
      console.error('Erro ao concluir processo:', error);

      let descricaoErro = 'Não foi possível concluir. Tente novamente ou abra um chamado informando o horário e o nome do paciente.';
      if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('permission') || msg.includes('missing or insufficient')) {
          descricaoErro = 'Sem permissão para salvar. Verifique se sua sessão ainda está ativa e tente novamente.';
        } else if (msg.includes('unavailable') || msg.includes('offline') || msg.includes('network')) {
          descricaoErro = 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
        } else if (msg.includes('undefined') || msg.includes('invalid') || msg.includes('unsupported')) {
          descricaoErro = 'Dado inválido no processo. Revise a etapa de Implementação — certifique-se de que todas as intervenções marcadas têm "Quem executa" preenchido.';
        }
      }

      toast({
        title: "Erro ao concluir processo",
        description: descricaoErro,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProcess = async () => {
    if (exclusaoEmAndamentoRef.current || isSaving || !processo.id || !paciente.id || processo.pacienteId !== paciente.id) return;

    exclusaoEmAndamentoRef.current = true;
    setIsSaving(true);
    try {
      await excluirProcesso(paciente.id, processo.id);

      toast({
        title: "Sucesso",
        description: "Processo excluído com sucesso!",
      });

      // Reset visual do Stepper antes de fechar
      setEtapaAtual(1);
      setShowDeleteAlert(false);
      onClose();
      onProcessoDeleted?.();
    } catch (error) {
      console.error('Erro ao excluir processo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir o processo.",
        variant: "destructive",
      });
    } finally {
      exclusaoEmAndamentoRef.current = false;
      setIsSaving(false);
    }
  };

  const renderEtapaAtual = () => {
    switch (etapaAtual) {
      case 1:
        return (
          <EtapaAvaliacao
            processo={processo}
            paciente={paciente}
            onUpdateAvaliacao={handleUpdateAvaliacao}
            onUpdateRequisitosDescricao={atualizarRequisitosDescricao}
          />
        );
      case 2:
        return (
          <EtapaDiagnostico
            processo={processo}
            paciente={paciente}
            onUpdateDiagnostico={handleUpdateDiagnostico}
            onUpdatePlanejamento={handleUpdatePlanejamento}
            onUpdateImplementacao={handleUpdateImplementacao}
          />
        );
      case 3:
        return (
          <EtapaPlanejamento
            processo={processo}
            paciente={paciente}
            onUpdatePlanejamento={handleUpdatePlanejamento}
          />
        );
      case 4:
        return (
          <EtapaImplementacao
            processo={processo}
            paciente={paciente}
            onUpdateImplementacao={handleUpdateImplementacao}
          />
        );
      case 5:
        return (
          <EtapaEvolucao
            processo={processo}
            paciente={paciente}
            onUpdateEvolucao={handleUpdateEvolucao}
          />
        );
      case 6:
        return (
          <EtapaResumo
            processo={processo}
            paciente={paciente}
            onUpdateEvolucao={handleUpdateEvolucao}
          />
        );
      default:
        return null;
    }
  };

  // Calcular tempo ativo se há sessões de trabalho - REMOVIDO para TempoAtivoBadge

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !showDeleteAlert) void handleSaveAndClose(); }}>
        <DialogContent 
          className="w-11/12 max-w-7xl h-[90vh] flex flex-col"
          onInteractOutside={(e) => {
            e.preventDefault();
            if (!showDeleteAlert) void handleSaveAndClose();
          }}
        >
          {/* Header fixo */}
          <DialogHeader className="flex-shrink-0 flex-row items-center justify-between">
            <div className="flex items-center justify-between w-full">
              <DialogTitle>Processo de Enfermagem - {paciente.nomeCompleto}</DialogTitle>
              <div className="flex items-center gap-2">
                <TempoAtivoBadge sessoes={processo.sessoesDeTrabalho || []} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoricoModalOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <History className="h-4 w-4 mr-2" />
                  Histórico
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {/* Stepper fixo */}
          <div className="flex-shrink-0 px-4 pb-4">
            <StepperProcesso
              etapaAtual={etapaAtual}
              onEtapaChange={handleEtapaChange}
              etapasCompletadas={etapasCompletadas}
              processo={processo}
              requisitosDescricao={requisitosDescricao}
            />
          </div>

          {/* Área de conteúdo rolável */}
          <div ref={conteudoRef} className="flex-1 overflow-y-auto px-4">
            {isInitializing ? <div className="flex items-center justify-center gap-2 p-8"><Loader2 className="h-5 w-5 animate-spin" />Carregando processo de enfermagem...</div> : !loadFailed && processo.id && processo.pacienteId === paciente.id ? renderEtapaAtual() : <p className="p-8 text-center">Não foi possível abrir o processo. Feche esta janela e tente novamente.</p>}
          </div>

          {/* Footer fixo */}
          <DialogFooter className="flex-shrink-0">
            <Button 
              variant="destructive" 
              className="mr-auto" 
              onClick={() => setShowDeleteAlert(true)}
              disabled={isSaving || isInitializing || loadFailed}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Processo
            </Button>
            <Button type="button" variant="secondary" onClick={handleSaveAndClose} disabled={isSaving || isInitializing}>
              Cancelar
            </Button>
            
            <div className="flex justify-end gap-2 ml-auto">
              {etapaAtual > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleEtapaChange(etapaAtual - 1)}
                  disabled={isSaving || isInitializing || loadFailed}
                >
                  Voltar
                </Button>
              )}
              
              {etapaAtual < 6 ? (
                <Button 
                  type="button" 
                  onClick={() => handleEtapaChange(etapaAtual + 1)}
                  disabled={isSaving || isInitializing || loadFailed}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Avançar
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleConcluirProcesso}
                  disabled={isSaving || isInitializing || loadFailed || processo.pacienteId !== paciente.id}
                  className="bg-csae-green-600 hover:bg-csae-green-700 font-bold"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Concluir Processo de Enfermagem
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Histórico Modal */}
      <HistoricoProcessosModal
        isOpen={historicoModalOpen}
        onClose={() => setHistoricoModalOpen(false)}
        paciente={paciente}
        enfermeiroId={enfermeiroId}
      />

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este processo de enfermagem? Esta ação não pode ser desfeita e todos os dados inseridos serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              onClick={() => void handleDeleteProcess()}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProcessoEnfermagemModal;
