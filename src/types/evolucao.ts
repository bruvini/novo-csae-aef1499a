
import { Timestamp } from "firebase/firestore";

export interface DiagnosticoEnfermagemInterface {
  id: string;
  descricao: string;
  selecionado: boolean;
  nhbIds?: string[];
  intervencoes?: string[];
}

export interface Evolucao {
  id?: string;
  pacienteId?: string;
  profissionalId?: string;
  dataInicio: Timestamp;
  dataConclusao?: Timestamp;
  dataAtualizacao: Timestamp;
  statusConclusao: 'Em andamento' | 'Concluído' | 'Interrompido';
  avaliacao?: string;
  diagnosticos?: DiagnosticoEnfermagemInterface[];
  planejamento?: any[];
  implementacao?: any[];
  evolucaoFinal?: string;
  parametrosAvaliados?: Record<string, any>;
}
