
import { Timestamp } from "firebase/firestore";

// Tipos de usuário
export interface UsuarioAutenticado {
  uid: string;
  email: string;
  nome: string;
  tipoUsuario: "Administrador" | "Enfermeiro" | "Técnico" | "Estudante";
  coren?: string;
  unidade?: string;
  ehAdmin: boolean;
  atuaSMS?: boolean;
  statusAcesso?: "Aprovado" | "Aguardando" | "Negado" | "Revogado" | "Cancelado";
  dadosPessoais?: {
    nomeCompleto: string;
    cpf: string;
    telefone: string;
  };
  dataCriacao?: Timestamp;
  ultimoAcesso?: Timestamp;
  id?: string;
}

// Alias for backward compatibility
export type Usuario = UsuarioAutenticado;

export interface SessaoUsuario {
  uid: string;
  email: string;
  nomeUsuario: string;
  tipoUsuario: string;
  statusAcesso?: string;
  usuario: any; // Made this property explicit to match usage in Dashboard.tsx
}

// Histórico de acessos
export interface LogAcesso {
  id?: string;
  usuarioUid: string;
  usuarioEmail: string;
  usuarioNome: string;
  dataHora?: Timestamp;
  pagina?: string;
  acao?: string;
}
