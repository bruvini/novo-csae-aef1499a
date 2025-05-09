
import { Timestamp } from "firebase/firestore";
import { Evolucao } from "./evolucao";

// Pacientes
export interface Paciente {
  id?: string;
  nome?: string;
  nomeCompleto: string;
  dataNascimento: string | Timestamp;
  idade?: number;
  sexo: 'Feminino' | 'Masculino';
  profissionalUid: string;
  ultimaConsulta?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
  evolucoes?: Evolucao[];
}
