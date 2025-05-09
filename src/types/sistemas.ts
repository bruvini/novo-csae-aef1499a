
import { Timestamp } from "firebase/firestore";

export interface SistemaCorporal {
  id?: string;
  nome: string;
  descricao?: string;
  criadoPor?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

export interface RevisaoSistema {
  id?: string;
  nome: string;
  sistemaCorporalId: string;
  tipo: 'textual' | 'numerico';
  unidade?: string;
  valorReferencia?: string;
  criadoPor?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}
