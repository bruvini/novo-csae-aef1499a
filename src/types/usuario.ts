
import { Timestamp } from "firebase/firestore";

export interface DadosPessoais {
  nomeCompleto: string;
  rg: string;
  cpf: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  lotacao?: string;
  matricula?: string;
  observacoes?: string;
}

export interface DadosProfissionais {
  formacao: 'Enfermeiro' | 'Residente de Enfermagem' | 'Técnico de Enfermagem' | 'Acadêmico de Enfermagem';
  numeroCoren?: string;
  ufCoren?: string;
  dataInicioResidencia?: string;
  iesEnfermagem?: string;
  atuaSMS: boolean;
  lotacao?: string;
  matricula?: string;
  cidadeTrabalho?: string;
  localCargo?: string;
}

export interface Log {
  usuario_afetado: string;
  acao: "aprovado" | "recusado" | "revogado" | "reativado" | "excluído";
  quem_realizou: string;
  data_hora: Timestamp;
  justificativa?: string;
}

export interface Usuario {
  dadosPessoais: DadosPessoais;
  dadosProfissionais: DadosProfissionais;
  email: string;
  uid: string;
  dataCadastro: Timestamp;
  statusAcesso: 'Aguardando' | 'Aprovado' | 'Negado' | 'Revogado' | 'Cancelado';
  tipoUsuario?: 'Administrador' | 'Comum';
  dataAprovacao?: Timestamp;
  dataRevogacao?: Timestamp;
  motivoRevogacao?: string;
  dataUltimoAcesso?: Timestamp;
  historico_logs?: Log[];
  id?: string;
  termoResponsabilidadeAceito?: boolean;
  termoResponsabilidadeData?: Timestamp;
  // Legacy properties for backward compatibility
  nome?: string;
  sobrenome?: string;
  ehAdmin?: boolean;
  gestorConteudos?: boolean;
  unidade?: string;
  atuaSMS?: boolean; // Adding this property to resolve Dashboard error
}

export interface SessaoUsuario {
  uid: string;
  email: string;
  nomeUsuario: string;
  tipoUsuario: 'Administrador' | 'Comum';
  usuario: Usuario;
}
