import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalCloseButton,
} from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast"
import { toast } from "@/components/ui/use-toast"
import { Paciente } from '@/types/paciente';
import { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import {
  criarProcessoEnfermagem,
  salvarProgressoProcesso,
  concluirProcesso,
  iniciarNovaSessao
} from '@/services/bancodados/processosEnfermagemDB';
import StepperProcesso from './StepperProcesso';
import EtapaAvaliacao from './EtapaAvaliacao';
import EtapaDiagnostico from './EtapaDiagnostico';
import EtapaPlanejamento from './EtapaPlanejamento';
import EtapaImplementacao from './EtapaImplementacao';
import { ImplementacaoEnfermagem } from '@/types/processoEnfermagem';

interface ProcessoEnfermagemModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente;
  enfermeiroId: string;
  processoInicial?: ProcessoEnfermagem | null;
}

const ProcessoEnfermagemModal: React.FC<ProcessoEnfermagemModalProps> = ({
  isOpen,
  onClose,
  paciente,
  enfermeiroId,
  processoInicial
}) => {
  const [processo, setProcesso] = useState<ProcessoEnfermagem>(
    processoInicial || {
      id: '',
      pacienteId: paciente.id,
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
      evolucao: {}
    }
  );
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [etapasCompletadas, setEtapasCompletadas] = useState<number[]>([]);
  const { toast } = useToast()

  useEffect(() => {
    // Se um processo inicial for fornecido, use-o
    if (processoInicial) {
      setProcesso(processoInicial);
      setEtapaAtual(processoInicial.etapaAtual);
      
      // Lógica para determinar as etapas completadas
      const etapasConcluidas = [];
      if (processoInicial.avaliacao && processoInicial.avaliacao.coletaDeDadosSubjetivos) {
        etapasConcluidas.push(1);
      }
      if (processoInicial.diagnostico && processoInicial.diagnostico.diagnosticosSelecionados.length > 0) {
        etapasConcluidas.push(2);
      }
      if (processoInicial.planejamento && processoInicial.planejamento.diagnosticosPlanejados.length > 0) {
        etapasConcluidas.push(3);
      }
      if (processoInicial.implementacao && Object.keys(processoInicial.implementacao).length > 0) {
        etapasConcluidas.push(4);
      }
      if (processoInicial.evolucao) {
        etapasConcluidas.push(5);
      }
      setEtapasCompletadas(etapasConcluidas);
    } else {
      // Caso contrário, crie um novo processo
      criarNovoProcesso();
    }
  }, [processoInicial]);

  const criarNovoProcesso = async () => {
    try {
      const novoId = await criarProcessoEnfermagem(paciente.id, enfermeiroId);
      setProcesso(prev => ({ ...prev, id: novoId }));
      
      // Iniciar a primeira sessão de trabalho
      await iniciarNovaSessao(novoId);
      
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

  const handleEtapaChange = (etapa: number) => {
    setEtapaAtual(etapa);
  };

  const handleUpdateAvaliacao = (avaliacao: any) => {
    setProcesso(prev => ({
      ...prev,
      avaliacao
    }));
  };

  const handleUpdateDiagnostico = (diagnostico: any) => {
    setProcesso(prev => ({
      ...prev,
      diagnostico
    }));
  };

  const handleUpdatePlanejamento = (planejamento: any) => {
    setProcesso(prev => ({
      ...prev,
      planejamento
    }));
  };

  const handleUpdateImplementacao = (implementacao: ImplementacaoEnfermagem) => {
    setProcesso(prev => ({
      ...prev,
      implementacao
    }));
  };

  const handleSalvarProgresso = async () => {
    try {
      await salvarProgressoProcesso(processo.id, etapaAtual, {
        avaliacao: processo.avaliacao,
        diagnostico: processo.diagnostico,
        planejamento: processo.planejamento,
        implementacao: processo.implementacao,
        evolucao: processo.evolucao
      });
      
      // Adicionar etapa atual às etapas completadas, se ainda não estiver lá
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
    }
  };

  const handleConcluirProcesso = async () => {
    try {
      await concluirProcesso(processo.id, {
        avaliacao: processo.avaliacao,
        diagnostico: processo.diagnostico,
        planejamento: processo.planejamento,
        implementacao: processo.implementacao,
        evolucao: processo.evolucao
      });
      toast({
        title: "Sucesso",
        description: "Processo concluído com sucesso!",
      })
      onClose(); // Fechar o modal após a conclusão
    } catch (error) {
      console.error('Erro ao concluir processo:', error);
      toast({
        title: "Erro",
        description: "Erro ao concluir o processo.",
        variant: "destructive",
      })
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
        return <div>Etapa de Evolução (em desenvolvimento)</div>;
      default:
        return null;
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="overflow-auto">
        <ModalHeader>
          <ModalTitle>Processo de Enfermagem</ModalTitle>
          <ModalCloseButton />
        </ModalHeader>
        
        <div className="p-4">
          <StepperProcesso
            etapaAtual={etapaAtual}
            onEtapaChange={handleEtapaChange}
            etapasCompletadas={etapasCompletadas}
            processo={processo}
          />
          
          <div className="mt-6">{renderEtapaAtual()}</div>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSalvarProgresso}>
            Salvar Progresso
          </Button>
          <Button type="button" onClick={handleConcluirProcesso} disabled={etapaAtual !== 5}>
            Concluir Processo
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProcessoEnfermagemModal;
