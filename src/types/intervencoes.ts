
import { Timestamp } from "firebase/firestore";

export interface Intervencao {
  id?: string;
  titulo: string;
  definicao?: string;
  codigoCipe?: string;
  diagnosticoIds: string[];
  atividades?: string[];
  ativo: boolean;
  verboPrimeiraEnfermeiro?: string;
  verboOutraPessoa?: string;
  descricaoRestante?: string;
  intervencaoEnfermeiro?: string;
  intervencaoInfinitivo?: string;
  nomeDocumento?: string;
  linkDocumento?: string;
}

export interface ResultadoEsperado {
  id?: string;
  titulo?: string;
  descricao: string;
  definicao?: string;
  codigoCipe?: string;
  diagnosticoIds?: string[];
  indicadores?: string[];
  ativo?: boolean;
  intervencoes: Intervencao[];
}
