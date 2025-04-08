
import { Timestamp } from "firebase/firestore";

export interface TermoCipe {
  id: string;
  termo: string;
  tipo: "foco" | "julgamento" | "meio" | "acao" | "tempo" | "localizacao" | "cliente";
  codigo: string;
  definicao: string;
}

export interface CasoClinico {
  id?: string;
  casoClinico: string;
  tipoCaso: "diagnostico" | "intervencao";
  focoEsperado: string | null;
  julgamentoEsperado: string | null;
  meioEsperado: string | null;
  acaoEsperado: string | null;
  localizacaoEsperado: string | null;
  clienteEsperado: string | null;
  tempoEsperado: string | null;
  arrayVencedor?: string[];
}
