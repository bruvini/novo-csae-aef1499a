
import { Timestamp } from "firebase/firestore";

export interface ModuloDisponivel {
  id?: string;
  nome: string;          // URL slug (ex: "pops", "minicurso-cipe")
  titulo: string;        // Display name
  descricao: string;     // Brief description
  ativo: boolean;        // Whether the module is active
  categoria: "clinico" | "educacional" | "gestao";  // Module category
  visibilidade: "todos" | "admin" | "sms";  // Who can see this module
  exibirDashboard: boolean;   // Show on dashboard
  exibirNavbar: boolean;      // Show on navbar
  icone?: string;             // Icon name from lucide
  ordem?: number;             // Order in menus
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
