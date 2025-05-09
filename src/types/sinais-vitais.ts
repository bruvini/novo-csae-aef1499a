
import { Timestamp } from "firebase/firestore";

export interface ValorReferencia {
  min?: number;
  max?: number;
  descricao?: string;
}

export interface SinalVital {
  id?: string;
  nome: string;
  descricao?: string;
  tipo: 'textual' | 'numerico';
  unidade?: string;
  valorReferencia?: string;
  valoresReferencia?: ValorReferencia[];
  criadoPor?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

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
