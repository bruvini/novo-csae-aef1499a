
import { Timestamp } from "firebase/firestore";
import { Intervencao, ResultadoEsperado } from "./intervencoes";

export interface Subconjunto {
  id?: string;
  nome: string;
  tipo: 'NHB' | 'Protocolo';
  descricao?: string;
  ativo?: boolean;
  criadoPor?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

export interface DiagnosticoCompleto {
  id?: string;
  nome: string;
  titulo?: string;
  descricao?: string;
  explicacao?: string;
  subconjuntoId?: string;
  tipoRisco?: string;
  caracteristicasDefinidoras?: string[];
  fatoresRelacionados?: string[];
  fatoresRisco?: string[];
  condicaoAssociada?: string;
  condicoesAssociadas?: string[];
  populacaoRisco?: string;
  resultadosEsperados: ResultadoEsperado[];
  criadoPor?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

// For backward compatibility
export type SubconjuntoDiagnostico = Subconjunto;
