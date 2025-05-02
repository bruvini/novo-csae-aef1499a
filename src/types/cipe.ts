import { Timestamp } from "firebase/firestore";

export interface CasoClinico {
  id?: string;
  tipoCaso: "Diagnóstico" | "Ações" | "Resultados";
  casoClinico: string;
  focoEsperado: string | null;
  julgamentoEsperado: string | null;
  meioEsperado: string | null;
  acaoEsperado: string | null;
  tempoEsperado: string | null;
  localizacaoEsperado: string | null;
  clienteEsperado: string | null;
  arrayVencedor: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface TermoCipe {
  id?: string;
  tipo: string;
  termo: string;
  descricao: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
