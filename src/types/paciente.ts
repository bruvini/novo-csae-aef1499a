
import { Timestamp } from "firebase/firestore";
import { Evolucao } from "./evolucao";

// Pacientes
export interface Paciente {
  id?: string;
  nome: string;
  dataNascimento: string;
  sexo: 'Feminino' | 'Masculino';
  profissionalUid: string;
  nomeProfissional: string;
  statusPaciente: 'NAO_ESTA_CONSULTANDO' | 'ESTA_CONSULTANDO';
  dataCadastro?: Timestamp;
  dataAtualizacao?: Timestamp;
  evolucoes?: Evolucao[];
}
