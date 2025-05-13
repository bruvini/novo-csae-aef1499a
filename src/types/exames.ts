
import { Timestamp } from "firebase/firestore";
import type { SubconjuntoDiagnostico, DiagnosticoCompleto } from "./diagnosticos";

// Exames Laboratoriais
export interface ExameLaboratorial {
  id?: string;
  nome: string;
  tipoExame: 'Laboratorial' | 'Imagem';
  diferencaSexoIdade: boolean;
  valoresReferencia: ValorReferenciaExame[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ValorReferenciaExame {
  id?: string;
  unidade: string;
  representaAlteracao: boolean;
  variacaoPor: 'Nenhum' | 'Sexo' | 'Idade' | 'Ambos';
  tipoValor: 'Numérico' | 'Texto';
  valorMinimo?: number;
  valorMaximo?: number;
  valorTexto?: string;
  idadeMinima?: number;
  idadeMaxima?: number;
  sexo?: 'Todos' | 'Masculino' | 'Feminino';
  tituloAlteracao?: string;
  nhbIds?: string[];
  diagnosticoIds?: string[];
  tipoExame?: 'Laboratorial' | 'Imagem';
  // Legacy fields for backward compatibility
  nhbId?: string;
  diagnosticoId?: string;
}

// Re-export types from diagnosticos.ts to fix import errors using 'export type'
export type { SubconjuntoDiagnostico, DiagnosticoCompleto } from "./diagnosticos";
