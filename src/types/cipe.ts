
import { Timestamp } from "firebase/firestore";

// CIPE related interfaces
export interface TermoCipe {
  id?: string;
  termo: string;
  tipo?: string;
  descricao?: string;
  conceito?: string;
  eixo?: string;
  codigo?: string;
  ativo?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CasoClinico {
  id?: string;
  titulo: string;
  descricao: string;
  termosCipe: string[];
  ativo: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  tipoCaso: string;
  casoClinico: string;
  focoEsperado: string | null;
  julgamentoEsperado: string | null;
  meioEsperado: string | null;
  acaoEsperado: string | null;
  tempoEsperado: string | null;
  localizacaoEsperado: string | null;
  clienteEsperado: string | null;
  arrayVencedor: string[];
}
