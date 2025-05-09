
import { Timestamp } from "firebase/firestore";

export interface ModuloDisponivel {
  id?: string;
  nome: string;
  titulo: string;
  slug: string;
  descricao: string;
  ativo: boolean;
  categoria: "clinico" | "educacional" | "gestao";
  ordem?: number;
  icone?: string;
  visibilidade: "todos" | "admin" | "sms";
  exibirNoDashboard: boolean;
  exibirNavbar: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
