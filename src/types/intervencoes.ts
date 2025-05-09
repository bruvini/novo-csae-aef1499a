
import { Timestamp } from "firebase/firestore";

export interface Intervencao {
  id?: string;
  titulo: string;
  descricao: string;
  verboPrimeiraEnfermeiro?: string;
  verboOutraPessoa?: string;
  descricaoRestante?: string;
  nomeDocumento?: string;
  linkDocumento?: string;
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
