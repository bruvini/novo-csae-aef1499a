import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Check, X } from 'lucide-react';
import { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';
import StepperProcesso from './StepperProcesso';
import EtapaAvaliacao from './EtapaAvaliacao';
import EtapaDiagnostico from './EtapaDiagnostico';
import EtapaPlanejamento from './EtapaPlanejamento';
import EtapaImplementacao from './EtapaImplementacao';
import EtapaEvolucao from './EtapaEvolucao';
import {
  criarProcessoEnfermagem,
  salvarProgressoProcesso,
  concluirProcesso,
  buscarProcessoAtivo,
  iniciarNovaSessao
} from '@/services/bancodados/processosEnfermagemDB';
import { salvarIntervencaoAutoral } from '@/services/bancodados/intervencoesAutoraisDB';

interface ProcessoEnfermagemModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente;
  onProcessoUpdated: () => void;
}

// Função para gerar o texto da evolução (extraída para poder ser reutilizada)
const gerarTextoEvolucao = (processo: ProcessoEnfermagem, paciente: Paciente): string => {
  const linhas: string[] = [];
  
  // Cabeçalho
  linhas.push(`EVOLUÇÃO DE ENFERMAGEM`);
  linhas.push(`Paciente: ${paciente.nomeCompleto}`);
  linhas.push(`Gerado no Portal CSAE Floripa`);
  linhas.push(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
  linhas.push('');

  // Avaliação
  if (processo.avaliacao.coletaDeDadosSubjetivos) {
    linhas.push('AVALIAÇÃO DE ENFERMAGEM:');
    linhas.push(processo.avaliacao.coletaDeDadosSubjetivos);
    linhas.push('');
  }

  // Exame Físico
  const exameFisico = processo.avaliacao.exameFisico || {};
  if (Object.keys(exameFisico).length > 0) {
    linhas.push('EXAME FÍSICO:');
    Object.entries(exameFisico).forEach(([parametro, valor]) => {
      if (valor !== null && valor !== undefined && valor !== '') {
        linhas.push(`${parametro}: ${valor}`);
      }
    });
    linhas.push('');
  }

  // Diagnósticos
  if (processo.diagnostico.diagnosticosSelecionados.length > 0) {
    linhas.push('DIAGNÓSTICOS DE ENFERMAGEM:');
    processo.diagnostico.diagnosticosSelecionados.forEach(diag => {
      linhas.push(`• ${diag.tituloDiagnostico}`);
    });
    linhas.push('');
  }

  // Planejamento
  if (processo.planejamento.diagnosticosPlanejados.length > 0) {
    linhas.push('PLANEJAMENTO DE ENFERMAGEM:');
    const diagnosticosOrdenados = [...processo.planejamento.diagnosticosPlanejados]
      .sort((a, b) => a.ordemPrioridade - b.ordemPrioridade);

    diagnosticosOrdenados.forEach((diag, index) => {
      linhas.push(`${index + 1}º) ${diag.tituloDiagnostico}`);
      
      if (diag.resultadoEsperadoSelecionado) {
        linhas.push(`   Resultado Esperado: ${diag.resultadoEsperadoSelecionado}`);
      }
      
      if (diag.intervencoesSelecionadas.length > 0) {
        linhas.push('   Intervenções Planejadas:');
        diag.intervencoesSelecionadas.forEach(int => {
          linhas.push(`   - ${int.acaoPrescrita}`);
        });
      }
      linhas.push('');
    });
  }

  // Implementação
  const implementacao = processo.implementacao || {};
  const intervencoesImplementadas: string[] = [];

  Object.entries(implementacao).forEach(([, diagnostico]) => {
    diagnostico.intervencoes.forEach(intervencao => {
      if (intervencao.implementadoNestaConsulta) {
        let textoIntervencao = intervencao.acaoPrescrita;
        
        // Adicionar informação sobre prazo se existir
        if (intervencao.prazo && intervencao.prazoUnidade) {
          textoIntervencao += ` - Prazo: ${intervencao.prazo} ${intervencao.prazoUnidade}`;
        }
        
        intervencoesImplementadas.push(textoIntervencao);
      }
    });
  });

  if (intervencoesImplementadas.length > 0) {
    linhas.push('IMPLEMENTAÇÃO DE ENFERMAGEM:');
    intervencoesImplementadas.forEach(int => {
      linhas.push(`• ${int}`);
    });
    linhas.push('');
  }

  linhas.push('---');
  linhas.push('Enfermeiro Responsável: [Nome do Enfermeiro]');
  linhas.push('COREN: [Número do COREN]');

  return linhas.join('\n');
};

const ProcessoEnfermagemModal: React.FC<ProcessoEnfermagemModalProps> = ({
  isOpen,
  onClose,
  paciente,
  onProcessoUpdated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processo, setProcesso] = useState<ProcessoEnfermagem | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user && paciente) {
      carregarProcesso();
    }
  }, [isOpen, user, paciente]);

  const carregarProcesso = async () => {
    if (!user || !paciente) return;

    setLoading(true);
    try {
      const processoAtivo = await buscarProcessoAtivo(paciente.id, user.uid);
      
      if (processoAtivo) {
        await iniciarNovaSessao(paciente.id, processoAtivo.id);
        setProcesso(processoAtivo);
      } else {
        // Criar novo processo
        const processoId = await criarProcessoEnfermagem(paciente.id, user.uid);
        const novoProcesso = await buscarProcessoAtivo(paciente.id, user.uid);
        if (novoProcesso) {
          setProcesso(novoProcesso);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar processo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o processo de enfermagem.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProcesso = (novoProcesso: ProcessoEnfermagem) => {
    setProcesso(novoProcesso);
  };

  const handleSalvarProgresso = async () => {
    if (!processo || !user || !paciente) return;

    setSaving(true);
    try {
      await salvarProgressoProcesso(
        paciente.id,
        processo.id,
        processo.etapaAtual,
        {
          avaliacao: processo.avaliacao,
          diagnostico: processo.diagnostico,
          planejamento: processo.planejamento,
          implementacao: processo.implementacao,
          evolucao: processo.evolucao
        }
      );

      toast({
        title: "Sucesso",
        description: "Progresso salvo com sucesso!",
      });

      onProcessoUpdated();
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o progresso.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConcluirProcesso = async () => {
    if (!processo || !user || !paciente) return;

    setSaving(true);
    try {
      // Gerar o texto final da evolução
      const textoFinalDaEvolucao = gerarTextoEvolucao(processo, paciente);

      // Salvar intervenções autorais se existirem
      const intervencoesParaSalvar = [];
      Object.values(processo.implementacao || {}).forEach(diagnostico => {
        diagnostico.intervencoes.forEach(intervencao => {
          if (intervencao.tipo === 'autoral' && intervencao.implementadoNestaConsulta) {
            const intervencaoAutoral = {
              textoIntervencao: intervencao.acaoPrescrita,
              tituloResultadoVinculado: '', // Pode ser preenchido se necessário
              autorId: user.uid,
              autorNome: user.displayName || user.email || 'Usuário não identificado',
              dataCriacao: Timestamp.now()
            };
            intervencoesParaSalvar.push(intervencaoAutoral);
          }
        });
      });

      // Salvar intervenções autorais no Firestore
      for (const intervencao of intervencoesParaSalvar) {
        await salvarIntervencaoAutoral(intervencao);
      }

      // Preparar processo com evolução completa
      const processoCompleto = {
        ...processo,
        evolucao: {
          ...processo.evolucao,
          resumoGerado: textoFinalDaEvolucao
        }
      };

      await concluirProcesso(
        paciente.id,
        processo.id,
        {
          avaliacao: processoCompleto.avaliacao,
          diagnostico: processoCompleto.diagnostico,
          planejamento: processoCompleto.planejamento,
          implementacao: processoCompleto.implementacao,
          evolucao: processoCompleto.evolucao
        }
      );

      toast({
        title: "Sucesso",
        description: "Processo de enfermagem concluído com sucesso!",
      });

      onProcessoUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao concluir processo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir o processo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderEtapaAtual = () => {
    if (!processo) return null;

    switch (processo.etapaAtual) {
      case 1:
        return (
          <EtapaAvaliacao
            processo={processo}
            paciente={paciente}
            onUpdateProcesso={handleUpdateProcesso}
          />
        );
      case 2:
        return (
          <EtapaDiagnostico
            processo={processo}
            paciente={paciente}
            onUpdateDiagnostico={(diagnostico) => {
              const novoProcesso = {
                ...processo,
                diagnostico
              };
              handleUpdateProcesso(novoProcesso);
            }}
          />
        );
      case 3:
        return (
          <EtapaPlanejamento
            processo={processo}
            paciente={paciente}
            onUpdatePlanejamento={(planejamento) => {
              const novoProcesso = {
                ...processo,
                planejamento
              };
              handleUpdateProcesso(novoProcesso);
            }}
          />
        );
      case 4:
        return (
          <EtapaImplementacao
            processo={processo}
            paciente={paciente}
            onUpdateImplementacao={(implementacao) => {
              const novoProcesso = {
                ...processo,
                implementacao
              };
              handleUpdateProcesso(novoProcesso);
            }}
          />
        );
      case 5:
        return (
          <EtapaEvolucao
            processo={processo}
            paciente={paciente}
            onUpdateEvolucao={(evolucao) => {
              const novoProcesso = {
                ...processo,
                evolucao
              };
              handleUpdateProcesso(novoProcesso);
            }}
          />
        );
      default:
        return null;
    }
  };

  const canAdvanceToNextStep = () => {
    if (!processo) return false;

    switch (processo.etapaAtual) {
      case 1: // Avaliação
        return processo.avaliacao.coletaDeDadosSubjetivos.trim() !== '';
      case 2: // Diagnóstico
        return processo.diagnostico.diagnosticosSelecionados.length > 0;
      case 3: // Planejamento
        return processo.planejamento.diagnosticosPlanejados.length > 0;
      case 4: // Implementação
        const implementacao = processo.implementacao || {};
        return Object.values(implementacao).some(diag =>
          diag.intervencoes.some(int => int.implementadoNestaConsulta)
        );
      case 5: // Evolução
        return true;
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (!processo || !canAdvanceToNextStep()) return;

    const novoProcesso = {
      ...processo,
      etapaAtual: Math.min(processo.etapaAtual + 1, 5)
    };
    setProcesso(novoProcesso);
  };

  const handlePreviousStep = () => {
    if (!processo) return;

    const novoProcesso = {
      ...processo,
      etapaAtual: Math.max(processo.etapaAtual - 1, 1)
    };
    setProcesso(novoProcesso);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Carregando processo de enfermagem...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!processo) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <Alert>
            <AlertDescription>
              Não foi possível carregar o processo de enfermagem.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            Processo de Enfermagem - {paciente.nomeCompleto}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 mb-4">
            <StepperProcesso
              etapaAtual={processo.etapaAtual}
              onEtapaChange={(etapa) => {
                const novoProcesso = { ...processo, etapaAtual: etapa };
                setProcesso(novoProcesso);
              }}
              etapasCompletadas={[]}
              processo={processo}
            />
          </div>

          <div className="flex-1 overflow-hidden">
            {renderEtapaAtual()}
          </div>

          <div className="shrink-0 flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={processo.etapaAtual === 1}
              >
                Etapa Anterior
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={processo.etapaAtual === 5 || !canAdvanceToNextStep()}
              >
                Próxima Etapa
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSalvarProgresso}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar Progresso
              </Button>

              {processo.etapaAtual === 5 && (
                <Button
                  onClick={handleConcluirProcesso}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Concluir Processo
                </Button>
              )}

              <Button variant="outline" onClick={onClose}>
                <X className="w-4 h-4 mr-2" />
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessoEnfermagemModal;
