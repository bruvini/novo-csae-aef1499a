
import { Timestamp } from "firebase/firestore";

// Registro de Evolução
export interface Evolucao {
  id: string;
  pacienteId: string;
  profissionalUid: string;
  dataInicio: Timestamp;
  statusEvolucao: 'EM_ANDAMENTO' | 'FINALIZADO';
  dataFim?: Timestamp;
  dadosAvaliacao?: {
    queixaPrincipal?: string;
  };
  dataAtualizacao?: Timestamp;
}
