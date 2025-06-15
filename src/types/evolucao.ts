
import { Timestamp } from "firebase/firestore";
import { DiagnosticoSelecionado } from "./diagnosticos";

// Registro de Evolução
export interface Evolucao {
  id: string;
  pacienteId: string;
  profissionalUid: string;
  dataInicio: Timestamp;
  statusEvolucao: 'EM_ANDAMENTO' | 'FINALIZADO';
  dataFim?: Timestamp;
  dadosAvaliacao?: {
    queixaPrincipal: string;
    historiaDoenca?: string;
    comorbidades?: string[];
    alergias?: string[];
    medicamentosUso?: string[];
  };
  dados?: Record<string, any>;
  diagnosticosSelecionados?: DiagnosticoSelecionado[];
  dataAtualizacao?: Timestamp;
  avaliacao?: string;
  diagnosticos?: any[];
  planejamento?: any[];
  implementacao?: any[];
  evolucaoFinal?: string;
}
