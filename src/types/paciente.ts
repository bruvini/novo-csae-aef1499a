
import { Timestamp } from "firebase/firestore";

// Pacientes
export interface Paciente {
  id?: string;
  nome: string;
  dataNascimento: string;
  sexo: 'Feminino' | 'Masculino';
  profissionalUid: string;
  ultimaConsulta?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}
