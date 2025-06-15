
import { Timestamp } from "firebase/firestore";

// Registro de Evolução
export interface Evolucao {
  id: string;
  pacienteId: string;
  profissionalUid: string;
  dataInicio: Timestamp;
  statusEvolucao: 'EM_ANDAMENTO' | 'FINALIZADO';
  dataFim?: Timestamp;
  dadosAvaliacao?: {
    etapaHistorico?: {
      coletaDados?: string;
      exameFisico?: {
        sinaisVitais?: { [key: string]: string | number };
        resultadosExames?: object;
        revisaoSistemas?: object;
      };
      necessidadesHumanasBasicas?: string[];
    };
  };
  dataAtualizacao?: Timestamp;
}
