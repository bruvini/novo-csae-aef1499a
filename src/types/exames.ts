
import { Timestamp } from "firebase/firestore";

export interface ExameLaboratorial {
  id?: string;
  nome: string;
  descricao?: string;
  tipo: 'textual' | 'numerico';
  unidade?: string;
  valorReferencia?: string;
  criadoPor?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}
