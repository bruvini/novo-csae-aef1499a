
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Loader2, Trash2, Save, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Paciente } from '@/types/paciente';
import { ProcessoEnfermagem, ETAPAS_PROCESSO, AvaliacaoEnfermagem } from '@/types/processoEnfermagem';
import {
  criarProcessoEnfermagem,
  buscarProcessoAtivo,
  salvarProgressoProcesso,
  concluirProcesso,
  excluirProcesso,
  iniciarNovaSessao
} from '@/services/bancodados/processosEnfermagemDB';
import StepperProcesso from './StepperProcesso';
import EtapaAvaliacao from './EtapaAvaliacao';
import { Timestamp } from 'firebase/firestore';

interface ProcessoEnfermagemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: Paciente;
  onProcessoAtualizado: () => void;
}

const ProcessoEnfermagemModal: React.FC<ProcessoEnfermagemModalProps> = ({
  open,
  onOpenChange,
  paciente,
  onProcessoAtualizado
}) => {
  const [processo, setProcesso] = useState<ProcessoEnfermagem | null>(null);
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [etapasCompletadas, setEtapasCompletadas] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Dados das etapas (inicialmente vazios)
  const [dadosEtapas, setDadosEtapas] = useState({
    avaliacao: { 
      coletaDeDadosSubjetivos: '', 
      exameFisico: {},
      nhbsAfetadas: []
    } as AvaliacaoEnfermagem,
    diagnostico: {},
    planejamento: {},
    implementacao: {},
    evolucao: {}
  });

  useEffect(() => {
    if (open && paciente.id && user) {
      inicializarProcesso();
    }
  }, [open, paciente.id, user]);

  const inicializarProcesso = async () => {
    if (!user || !paciente.id) return;

    setLoading(true);
    try {
      // Buscar processo ativo existente
      const processoExistente = await buscarProcessoAtivo(paciente.id, user.uid);

      if (processoExistente) {
        // Iniciar nova sessão para processo existente
        await iniciarNovaSessao(processoExistente.id);
        
        // Carregar processo existente
        setProcesso(processoExistente);
        setEtapaAtual(processoExistente.etapaAtual);
        setDadosEtapas({
          avaliacao: processoExistente.avaliacao || { 
            coletaDeDadosSubjetivos: '', 
            exameFisico: {},
            nhbsAfetadas: []
          },
          diagnostico: processoExistente.diagnostico || {},
          planejamento: processoExistente.planejamento || {},
          implementacao: processoExistente.implementacao || {},
          evolucao: processoExistente.evolucao || {}
        });

        // Marcar etapas anteriores como completadas
        const completadas = [];
        for (let i = 1; i < processoExistente.etapaAtual; i++) {
          completadas.push(i);
        }
        setEtapasCompletadas(completadas);
      } else {
        // Criar novo processo (já inclui a primeira sessão)
        const novoProcessoId = await criarProcessoEnfermagem(paciente.id, user.uid);
        
        const agora = Timestamp.now();
        const novoProcesso: ProcessoEnfermagem = {
          id: novoProcessoId,
          pacienteId: paciente.id,
          enfermeiroId: user.uid,
          status: 'em_andamento',
          etapaAtual: 1,
          dataInicio: agora,
          sessoesDeTrabalho: [{ inicioSessao: agora }],
          avaliacao: { 
            coletaDeDadosSubjetivos: '', 
            exameFisico: {},
            nhbsAfetadas: []
          },
          diagnostico: {},
          planejamento: {},
          implementacao: {},
          evolucao: {}
        };

        setProcesso(novoProcesso);
        setEtapaAtual(1);
        setEtapasCompletadas([]);
        setDadosEtapas({
          avaliacao: { 
            coletaDeDadosSubjetivos: '', 
            exameFisico: {},
            nhbsAfetadas: []
          },
          diagnostico: {},
          planejamento: {},
          implementacao: {},
          evolucao: {}
        });

        toast({
          title: "Processo iniciado",
          description: "Novo processo de enfermagem criado com sucesso!",
        });
      }
    } catch (error) {
      console.error('Erro ao inicializar processo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível inicializar o processo. Tente novamente.",
        variant: "destructive",
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEtapaChange = (novaEtapa: number) => {
    setEtapaAtual(novaEtapa);
  };

  const handleUpdateAvaliacao = (novaAvaliacao: AvaliacaoEnfermagem) => {
    setDadosEtapas(prev => ({
      ...prev,
      avaliacao: novaAvaliacao
    }));
    
    if (processo) {
      setProcesso(prev => prev ? {
        ...prev,
        avaliacao: novaAvaliacao
      } : prev);
    }
  };

  const handleSalvarProgresso = async () => {
    if (!processo) return;

    setSaving(true);
    try {
      await salvarProgressoProcesso(processo.id, etapaAtual, dadosEtapas);
      
      toast({
        title: "Progresso salvo",
        description: "Progresso salvo com sucesso!",
      });
      
      onProcessoAtualizado();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o progresso. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Nova função para save on close
  const handleSaveOnClose = async () => {
    if (!processo) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      await salvarProgressoProcesso(processo.id, etapaAtual, dadosEtapas);
      
      toast({
        title: "Progresso salvo automaticamente",
        description: "Seus dados foram salvos automaticamente.",
      });
      
      onProcessoAtualizado();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar automaticamente:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar automaticamente. Tente salvar manualmente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConcluirProcesso = async () => {
    if (!processo) return;

    setSaving(true);
    try {
      await concluirProcesso(processo.id, dadosEtapas);
      
      toast({
        title: "Processo concluído",
        description: "Processo concluído e arquivado com sucesso!",
      });
      
      onProcessoAtualizado();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao concluir processo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir o processo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExcluirProcesso = async () => {
    if (!processo) return;

    try {
      await excluirProcesso(processo.id);
      
      toast({
        title: "Processo excluído",
        description: "Processo excluído com sucesso!",
      });
      
      onProcessoAtualizado();
      onOpenChange(false);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Erro ao excluir processo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o processo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh]">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>Carregando processo de enfermagem...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(newOpen) => {
          if (!newOpen) {
            // Se está tentando fechar, salvar automaticamente
            handleSaveOnClose();
          } else {
            onOpenChange(newOpen);
          }
        }}
      >
        <DialogContent 
          className="max-w-6xl h-[90vh] flex flex-col"
          onInteractOutside={(e) => {
            // Prevenir fechamento imediato, salvar primeiro
            e.preventDefault();
            handleSaveOnClose();
          }}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl font-bold text-primary">
              {paciente.nomeCompleto}
            </DialogTitle>
            <p className="text-muted-foreground">Processo de Enfermagem</p>
          </DialogHeader>

          <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
            <div className="shrink-0">
              <StepperProcesso
                etapaAtual={etapaAtual}
                onEtapaChange={handleEtapaChange}
                etapasCompletadas={etapasCompletadas}
              />
            </div>

            <div className="flex-1 overflow-auto">
              <Tabs value={etapaAtual.toString()} className="h-full">
                <TabsContent value="1" className="h-full">
                  {processo && (
                    <EtapaAvaliacao
                      processo={processo}
                      paciente={paciente}
                      onUpdateAvaliacao={handleUpdateAvaliacao}
                    />
                  )}
                </TabsContent>

                {ETAPAS_PROCESSO.slice(1).map((etapa) => (
                  <TabsContent key={etapa.numero} value={etapa.numero.toString()} className="h-full">
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          Etapa {etapa.numero}: {etapa.nome}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-muted-foreground">{etapa.descricao}</p>
                          <div className="bg-muted border border-border rounded-lg p-6">
                            <p className="text-center text-muted-foreground">
                              Componentes da etapa "{etapa.nome}" serão implementados aqui.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex justify-between">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Processo
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSalvarProgresso}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Progresso
              </Button>

              <Button
                onClick={handleConcluirProcesso}
                disabled={saving}
                className="flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Concluir Processo
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Processo de Enfermagem</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este processo? Todos os dados preenchidos 
              serão perdidos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExcluirProcesso}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProcessoEnfermagemModal;
