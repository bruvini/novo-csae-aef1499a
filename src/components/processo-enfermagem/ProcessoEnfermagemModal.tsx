import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
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
import { salvarIntervencoesAutorais, IntervencaoAutoral } from '@/services/bancodados/intervencoesAutoraisDB';
import { calcularTempoAtivo } from '@/utils/timeUtils';
import { calcularEtapasCompletadas, isEtapaAcessivel, getMotivoBloqueio } from '@/utils/processoUtils';
import { useAuth } from '@/contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { Loader2, Trash2, X, History } from 'lucide-react';
import StepperProcesso from './StepperProcesso';
import EtapaAvaliacao from './EtapaAvaliacao';
import EtapaDiagnostico from './EtapaDiagnostico';
import EtapaPlanejamento from './EtapaPlanejamento';
import EtapaImplementacao from './EtapaImplementacao';
import EtapaEvolucao from './EtapaEvolucao';
import EtapaResumo from './EtapaResumo';
import { ImplementacaoEnfermagem, PlanejamentoEnfermagem, AvaliacaoEnfermagem, DiagnosticoEnfermagem, EvolucaoEnfermagem, IntervencaoImplementada } from '@/types/processoEnfermagem';
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
  const [etapasCompletadas, setEtapasCompletadas] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [historicoModalOpen, setHistoricoModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Timer para atualizar o tempo ativo a cada segundo - REMOVIDO para TempoAtivoBadge

  // Carregar processo ativo ao abrir, ou criar um novo se não existir
  useEffect(() => {
    if (!isOpen || !paciente.id) return;

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
          if (atualizado) {
            setProcesso(atualizado);
            setEtapaAtual(atualizado.etapaAtual);

            const etapasConcluidas = calcularEtapasCompletadas(atualizado);
            setEtapasCompletadas(etapasConcluidas);
          }
          return;
        }

        // Se não existir, cria novo (já inicia sessão internamente)
        await criarNovoProcesso();
      } catch (error) {
        console.error('Erro ao carregar ou criar processo:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar ou iniciar o processo.",
          variant: "destructive",
        });
      }
    };

    carregarOuCriarProcesso();
  }, [isOpen, processoInicial, paciente.id, enfermeiroId]);

  const criarNovoProcesso = async () => {
    if (!paciente.id) return;
    
    try {
      const novoId = await criarProcessoEnfermagem(paciente.id, enfermeiroId);

      // Carregar documento completo
      const docCarregado = await buscarProcessoPorId(paciente.id, novoId);
      if (docCarregado) {
        setProcesso(docCarregado);
        setEtapaAtual(docCarregado.etapaAtual);
      } else {
        setProcesso(prev => ({ ...prev, id: novoId }));
      }

      toast({
        title: "Sucesso",
        description: "Novo processo de enfermagem iniciado!",
      })
    } catch (error) {
      console.error('Erro ao criar processo:', error);
      toast({
        title: "Erro",
        description: "Erro ao iniciar processo de enfermagem.",
        variant: "destructive",
      })
    }
  };

  const handleEtapaChange = async (etapa: number) => {
    // Se está tentando avançar (etapa > etapaAtual)
    if (etapa > etapaAtual) {
      const isAcessivel = isEtapaAcessivel(etapa, etapaAtual, etapasCompletadas, processo);
      
      if (!isAcessivel) {
        const motivo = getMotivoBloqueio(etapa, etapaAtual, etapasCompletadas, processo);
        toast({
          title: "Etapa Bloqueada",
          description: motivo || "Complete as etapas anteriores para liberar.",
          variant: "destructive"
        });
        return; // Aborta navegação
      }
    }

    setEtapaAtual(etapa);
  };

  const handleUpdateAvaliacao = (avaliacao: AvaliacaoEnfermagem) => {
    setProcesso(prev => ({
      ...prev,
      avaliacao
    }));
  };

  const handleUpdateDiagnostico = (diagnostico: DiagnosticoEnfermagem) => {
    setProcesso(prev => ({
      ...prev,
      diagnostico
    }));
  };

  const handleUpdatePlanejamento = (planejamento: PlanejamentoEnfermagem) => {
    setProcesso(prev => ({
      ...prev,
      planejamento
    }));
  };

  const handleUpdateImplementacao = (novaImplementacao: ImplementacaoEnfermagem) => {
    setProcesso(prev => {
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

      return {
        ...prev,
        implementacao: novaImplementacao,
        evolucao: {
          ...(prev.evolucao || { resumoGerado: '' }),
          intervencoesExecutadas: intervencoesExecutadasAtualizadas,
        },
      };
    });
  };

  const handleUpdateEvolucao = (evolucao: EvolucaoEnfermagem) => {
    setProcesso(prev => ({
      ...prev,
      evolucao
    }));
  };

  const handleSalvarProgresso = async () => {
    if (!processo.id || !paciente.id) return;

    setIsSaving(true);
    try {
      await salvarProgressoProcesso(
        paciente.id,
        processo.id,
        etapaAtual,
        {
          avaliacao: processo.avaliacao,
          diagnostico: processo.diagnostico,
          planejamento: processo.planejamento,
          implementacao: processo.implementacao,
          evolucao: processo.evolucao,
        }
      );

      if (!etapasCompletadas.includes(etapaAtual)) {
        setEtapasCompletadas([...etapasCompletadas, etapaAtual]);
      }

      toast({
        title: "Sucesso",
        description: "Progresso salvo com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar o progresso.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false);
    }
  };

  // Salva o progresso em background sem bloquear a UI (sem isSaving, sem toast de sucesso)
  const salvarEmBackground = (etapaParaSalvar: number, processoAtual: ProcessoEnfermagem) => {
    if (!processoAtual.id || !paciente.id) return;

    salvarProgressoProcesso(
      paciente.id,
      processoAtual.id,
      etapaParaSalvar,
      {
        avaliacao: processoAtual.avaliacao,
        diagnostico: processoAtual.diagnostico,
        planejamento: processoAtual.planejamento,
        implementacao: processoAtual.implementacao,
        evolucao: processoAtual.evolucao,
      }
    ).catch((err) => {
      console.error('Erro ao salvar progresso em background:', err);
    });
  };


  const handleSaveAndClose = async () => {
    setIsSaving(true);
    try {
      await handleSalvarProgresso();
      await finalizarSessaoAtual(paciente.id, processo.id);
      onClose();
    } catch (error) {
      console.error('Erro ao fechar processo:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConcluirProcesso = async () => {
    if (!processo.id || !paciente.id) return;

    setIsSaving(true);
    try {
      const intervencoesAutorais: IntervencaoAutoral[] = [];

      processo.planejamento.diagnosticosPlanejados.forEach(diagnostico => {
        diagnostico.intervencoesSelecionadas
          .filter(intervencao => intervencao.tipo === 'autoral')
          .forEach(intervencao => {
            intervencoesAutorais.push({
              textoIntervencao: intervencao.acaoPrescrita,
              tituloResultadoVinculado: diagnostico.resultadoEsperadoSelecionado || '',
              autorId: user?.uid || '',
              autorNome: user?.displayName || user?.email || user?.uid || 'Nome não disponível',
              dataCriacao: Timestamp.now(),
            });
          });
      });

      if (intervencoesAutorais.length > 0) {
        await salvarIntervencoesAutorais(intervencoesAutorais);
      }

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

      toast({
        title: "Sucesso",
        description: "Processo concluído com sucesso!",
      })
      onClose();
    } catch (error) {
      console.error('Erro ao concluir processo:', error);
      toast({
        title: "Erro",
        description: "Erro ao concluir o processo.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProcess = async () => {
    if (!processo.id || !paciente.id) return;

    setIsSaving(true);
    try {
      await excluirProcesso(paciente.id, processo.id);

      toast({
        title: "Sucesso",
        description: "Processo excluído com sucesso!",
      });

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
          />
        );
      case 2:
        return (
          <EtapaDiagnostico
            processo={processo}
            paciente={paciente}
            onUpdateDiagnostico={handleUpdateDiagnostico}
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
      <Dialog open={isOpen} onOpenChange={() => handleSaveAndClose()}>
        <DialogContent 
          className="max-w-6xl h-[90vh] flex flex-col"
          onInteractOutside={(e) => {
            e.preventDefault();
            handleSaveAndClose();
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
            />
          </div>

          {/* Área de conteúdo rolável */}
          <div className="flex-1 overflow-y-auto px-4">
            {renderEtapaAtual()}
          </div>

          {/* Footer fixo */}
          <DialogFooter className="flex-shrink-0">
            <Button 
              variant="destructive" 
              className="mr-auto" 
              onClick={() => setShowDeleteAlert(true)}
              disabled={isSaving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Processo
            </Button>
            <Button type="button" variant="secondary" onClick={handleSaveAndClose} disabled={isSaving}>
              Cancelar
            </Button>
            
            <div className="flex justify-end gap-2 ml-auto">
              {etapaAtual > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleEtapaChange(etapaAtual - 1)}
                  disabled={isSaving}
                >
                  Voltar
                </Button>
              )}
              
              {etapaAtual < 6 ? (
                <Button 
                  type="button" 
                  onClick={async () => {
                    const nextEtapa = etapaAtual + 1;

                    // 1. Validar com estado local — sem Firestore, instantâneo
                    if (!isEtapaAcessivel(nextEtapa, etapaAtual, etapasCompletadas, processo)) {
                      toast({
                        title: "Etapa Bloqueada",
                        description: getMotivoBloqueio(nextEtapa, etapaAtual, etapasCompletadas, processo) 
                          || "Complete as etapas anteriores para liberar.",
                        variant: "destructive"
                      });
                      return;
                    }

                    await handleSalvarProgresso();

                    // 2. Navegar e atualizar stepper
                    setEtapaAtual(nextEtapa);
                    setEtapasCompletadas(calcularEtapasCompletadas(processo));
                  }}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Avançar
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={handleConcluirProcesso}
                  disabled={isSaving}
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
            <AlertDialogAction 
              onClick={handleDeleteProcess}
              disabled={isSaving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProcessoEnfermagemModal;
