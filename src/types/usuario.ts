
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
    rg?: string;
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
  };
  dadosProfissionais?: {
    formacao: string;
    numeroCoren?: string;
    ufCoren?: string;
    dataInicioResidencia?: string;
    iesEnfermagem?: string;
    atuaSMS?: boolean;
    lotacao?: string;
    matricula?: string;
    cidadeTrabalho?: string;
    localCargo?: string;
  };
  dataCriacao?: Timestamp;
  ultimoAcesso?: Timestamp;
  contadorAcessos?: number;
  id?: string;
  sobrenome?: string;
  createdAt?: Timestamp;
  gestorConteudos?: boolean;
  totens?: boolean;
  instituicao?: string;
  statusAprovacao?: string;
  termoResponsabilidadeUrl?: string;
}

// Alias for backward compatibility
export type Usuario = UsuarioAutenticado;

export interface SessaoUsuario {
  uid: string;
  email: string;
  nome: string;
  nomeUsuario?: string;
  sobrenome?: string;
  tipoUsuario?: string;
  statusAcesso?: string;
  statusAprovacao?: "Pendente" | "Aprovado" | "Reprovado";
  ehAdmin?: boolean;
  gestorConteudos?: boolean;
  totens?: boolean;
  instituicao?: string;
  createdAt?: Date;
  usuario?: {
    atuaSMS?: boolean;
    contadorAcessos?: number;
    [key: string]: any;
  };
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
