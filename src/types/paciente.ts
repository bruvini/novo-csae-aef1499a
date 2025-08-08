
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
