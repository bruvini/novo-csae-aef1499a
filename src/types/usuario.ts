
import { Timestamp } from "firebase/firestore";

// Tipo para status de aprovação do usuário
export type StatusAprovacao = 'Aprovado' | 'Pendente' | 'Reprovado';

// Usuário autenticado com dados vindos do Firebase
export interface UsuarioAutenticado {
  uid: string;
  email: string;
  nome: string;
  ehAdmin: boolean;
  createdAt?: Date | Timestamp;
  statusAprovacao: StatusAprovacao;
}

// Sessão do usuário (dados mantidos no frontend)
export interface SessaoUsuario {
  uid: string;
  email: string;
  nome: string;
  ehAdmin: boolean;
}
