
import { Timestamp, FieldValue } from "firebase/firestore";

export interface TermoCipe {
  id?: string;
  termo: string;
  descricao: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EixoCipe {
  arrayFoco: TermoCipe[];
  arrayJulgamento: TermoCipe[];
  arrayMeios: TermoCipe[];
  arrayAcao: TermoCipe[];
  arrayTempo: TermoCipe[];
  arrayLocalizacao: TermoCipe[];
  arrayCliente: TermoCipe[];
}

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
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProgressoCursoCipe {
  moduloIntroducao: boolean;
  moduloEixos: {
    foco: boolean;
    julgamento: boolean;
    meios: boolean;
    acao: boolean;
    tempo: boolean;
    localizacao: boolean;
    cliente: boolean;
    concluido: boolean;
  };
  moduloElaboracao: {
    diagnosticos: boolean;
    acoes: boolean;
    resultados: boolean;
    concluido: boolean;
  };
  moduloExercicios: boolean;
  statusCurso: boolean;
}
