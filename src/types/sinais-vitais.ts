
import { Timestamp } from "firebase/firestore";

// Sinal Vitais
export interface SinalVital {
  id?: string;
  nome: string;
  abreviacao?: string;
  unidade: string;
  valorMinimo?: number;
  valorMaximo?: number;
  ordem?: number;
  descricao?: string;
  ativo: boolean;
  diferencaSexoIdade?: boolean;
  valoresReferencia?: AlteracaoSinalVital[];
  alteracoes?: AlteracaoSinalVital[];
}

export interface AlteracaoSinalVital {
  id?: string;
  titulo: string;
  descricao?: string;
  condicao: 'abaixo' | 'acima' | 'entre' | 'igual';
  valorMinimo?: number;
  valorMaximo?: number;
  valorReferencia?: string;
  nhbIds?: string[];
  diagnosticoIds?: string[];
  unidade: string;
  representaAlteracao: boolean;
  variacaoPor: 'Nenhum' | 'Sexo' | 'Idade' | 'Ambos';
  tipoValor: 'Numérico' | 'Texto';
  tituloAlteracao?: string;
  valorTexto?: string;
  idadeMinima?: number;
  idadeMaxima?: number;
  sexo?: 'Todos' | 'Masculino' | 'Feminino';
}

// Interface for ValorReferencia (used in components)
export interface ValorReferencia {
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
  titulo?: string;
  condicao?: 'abaixo' | 'acima' | 'entre' | 'igual';
}

// Import the SubconjuntoDiagnostico interface from diagnósticos
export type { SubconjuntoDiagnostico, DiagnosticoCompleto } from './diagnosticos';
