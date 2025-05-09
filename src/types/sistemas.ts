
import { Timestamp } from "firebase/firestore";
import { ValorReferencia } from "./exames";

export interface SistemaCorporal {
  id?: string;
  nome: string;
  descricao?: string;
  ativo?: boolean;
  criadoPor?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

export interface RevisaoSistema {
  id?: string;
  nome: string;
  titulo?: string;
  sistemaId: string;
  sistemaNome: string;
  tipo: 'textual' | 'numerico';
  tipoAlteracao?: 'Objetiva' | 'Subjetiva';
  ativo?: boolean;
  diferencaSexoIdade?: boolean;
  unidade?: string;
  valorReferencia?: string;
  valoresReferencia: ValorReferencia[];
  criadoPor?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}
