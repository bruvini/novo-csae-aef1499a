
import { Timestamp } from "firebase/firestore";

export interface Intervencao {
  id?: string;
  titulo: string;
  descricao: string;
  resultado?: string; 
  diagnosticoId?: string;
  criadoPor?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

export interface ResultadoEsperado {
  id?: string;
  titulo: string;
  descricao: string;
  diagnosticoId?: string;
  intervencoes: Intervencao[];
  criadoPor?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}
