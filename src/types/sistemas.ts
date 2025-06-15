
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
  titulo: string; // Usado para "Propedêutica"
  descricao?: string;
  ativo: boolean;
  valoresReferencia?: ValorReferenciaSistema[];
}

// Simplificado para "Achados do Exame Físico"
export interface ValorReferenciaSistema {
  id?: string;
  titulo: string; // Usado para "Descrição do Achado"
  representaAlteracao: boolean;
  nhbIds?: string[];
  diagnosticoIds?: string[];
}
