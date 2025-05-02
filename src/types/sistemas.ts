
import { Timestamp } from "firebase/firestore";

// Sistemas Corporais e Revisão de Sistemas
export interface SistemaCorporal {
  id?: string;
  nome: string;
  descricao?: string;
  ordem?: number;
  ativo: boolean;
}

export interface RevisaoSistema {
  id?: string;
  sistemaId: string;
  sistemaNome?: string;
  titulo: string;
  nome?: string;
  descricao?: string;
  tipoAlteracao: 'Objetiva' | 'Subjetiva' | 'Ambas';
  padrao?: string;
  diagnosticoId?: string;
  nhbId?: string;
  ativo: boolean;
  ordem?: number;
  valoresReferencia?: any[];
  diferencaSexoIdade?: boolean;
}
