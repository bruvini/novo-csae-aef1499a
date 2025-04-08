
import { Timestamp } from "firebase/firestore";

export interface SubconjuntoDiagnostico {
  id?: string;
  nome: string;
  tipo: 'Protocolo' | 'NHB';
  descricao?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
