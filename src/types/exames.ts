
import { Timestamp } from "firebase/firestore";

export interface ValorReferencia {
  unidade: string;
  representaAlteracao?: boolean;
  variacaoPor?: 'Sexo' | 'Idade' | 'Ambos' | 'Nenhum';
  tipoValor?: 'Numérico' | 'Texto';
  valorMinimo?: number;
  valorMaximo?: number;
  valorTexto?: string;
  idadeMinima?: number;
  idadeMaxima?: number;
  sexo?: 'Masculino' | 'Feminino' | 'Todos';
  tituloAlteracao?: string;
  nhbId?: string;
  diagnosticoId?: string;
}

export interface ExameLaboratorial {
  id?: string;
  nome: string;
  descricao?: string;
  tipo?: 'textual' | 'numerico';
  tipoExame?: 'Laboratorial' | 'Imagem';
  unidade?: string;
  valorReferencia?: string;
  diferencaSexoIdade?: boolean;
  valoresReferencia: ValorReferencia[];
  criadoPor?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}
