
import { Timestamp } from 'firebase/firestore';

export interface ProcessoEnfermagem {
  idProcesso: string;
  dataInicio: Timestamp;
  dataFim: Timestamp | null;
  statusProcesso: 'Em andamento' | 'Concluído';
  // outros campos serão adicionados futuramente
}

export interface Paciente {
  id?: string; // ID do documento Firestore
  nomeCompleto: string;
  dataNascimento: Timestamp;
  sexo: 'Feminino' | 'Masculino';
  dataCadastro: Timestamp;
  uidUsuario: string; // UID do enfermeiro autenticado
  idUsuario?: string; // ID do documento do usuário na coleção 'usuarios'
  processosEnfermagem: ProcessoEnfermagem[];
}

export type StatusPaciente = 'Sem processo iniciado' | 'Em andamento' | 'Concluído';

export interface IndicadoresPacientes {
  totalPacientes: number;
  processosAtivos: number;
  totalProcessosConcluidos: number;
}

// NOVO: utilitário para determinar o status do paciente com base na lista de processos
export function determinarStatusPaciente(paciente: Paciente): StatusPaciente {
  if (!paciente?.processosEnfermagem || paciente.processosEnfermagem.length === 0) {
    return 'Sem processo iniciado';
  }

  // Se existir algum processo em andamento, prioriza esse status
  const temEmAndamento = paciente.processosEnfermagem.some(
    (p) => p.statusProcesso === 'Em andamento'
  );
  if (temEmAndamento) return 'Em andamento';

  // Caso contrário, se houver algum concluído
  const temConcluido = paciente.processosEnfermagem.some(
    (p) => p.statusProcesso === 'Concluído'
  );
  if (temConcluido) return 'Concluído';

  return 'Sem processo iniciado';
}
