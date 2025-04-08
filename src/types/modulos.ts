
import { Timestamp } from "firebase/firestore";

export interface ModuloDisponivel {
  id?: string;
  nome: string;
  titulo: string;
  descricao: string;
  ativo: boolean;
  categoria: "clinico" | "educacional" | "gestao";
  ordem?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
