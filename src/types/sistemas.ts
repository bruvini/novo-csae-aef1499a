
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
  valoresReferencia?: ValorReferenciaSistema[];
  diferencaSexoIdade?: boolean;
}

// Adding a dedicated interface for ValorReferenciaSistema
export interface ValorReferenciaSistema {
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
  nhbId?: string;
  diagnosticoId?: string;
  titulo?: string;
  condicao?: 'abaixo' | 'acima' | 'entre' | 'igual';
}
