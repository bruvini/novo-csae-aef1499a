
import { Timestamp } from "firebase/firestore";
import { DiagnosticoSelecionado } from "./diagnosticos";

// Registro de Evolução
export interface Evolucao {
  id?: string;
  pacienteId: string;
  profissionalUid: string;
  dataInicio: Timestamp;
  dataFim?: Timestamp;
  status: 'iniciada' | 'em_andamento' | 'finalizada';
  dadosAvaliacao?: {
    queixaPrincipal: string;
    historiaDoenca?: string;
    comorbidades?: string[];
    alergias?: string[];
    medicamentosUso?: string[];
  };
  dados: Record<string, any>;
  diagnosticosSelecionados?: DiagnosticoSelecionado[];
  dataAtualizacao?: Timestamp;
  statusConclusao?: 'Em andamento' | 'Concluído' | 'Interrompido';
  avaliacao?: string;
  diagnosticos?: any[];
  planejamento?: any[];
  implementacao?: any[];
  evolucaoFinal?: string;
}
