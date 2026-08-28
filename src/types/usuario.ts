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
}

export interface DadosProfissionais {
  formacao: string;
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

export interface HistoricoAcesso {
  dataHora: Timestamp;
  ip?: string;
}

export type TipoEventoUsuario =
  | "cadastro_enviado"
  | "acesso_aprovado"
  | "acesso_recusado"
  | "acesso_revogado"
  | "privilegios_atualizados"
  | "acesso_restaurado"
  | "alteracao_profissional_solicitada"
  | "alteracao_profissional_aprovada"
  | "alteracao_profissional_recusada"
  | "dados_pessoais_atualizados";

export interface EventoHistoricoUsuario {
  tipo: TipoEventoUsuario;
  dataHora: Timestamp;
  responsavelId?: string;
  responsavelNome: string;
  descricao: string;
  motivo?: string;
  alteracoes?: Array<{ campo: string; anterior: string; novo: string }>;
}

export interface AlteracaoProfissionalPendente {
  dadosAnteriores: DadosProfissionais;
  dadosNovos: DadosProfissionais;
  dataSolicitacao: Timestamp;
}

export interface ResultadoRevisaoCadastral {
  status: "Aprovada" | "Recusada";
  dataRevisao: Timestamp;
  responsavelId: string;
  responsavelNome: string;
  motivo?: string;
  alteracoes: Array<{ campo: string; anterior: string; novo: string }>;
}

export interface Usuario {
  id?: string; // ID do Firestore
  uid: string; // UID do Auth
  email: string;
  dadosPessoais: DadosPessoais;
  dadosProfissionais: DadosProfissionais;
  termoResponsabilidadeAceito: boolean;
  termoResponsabilidadeData: Timestamp;
  ehAdmin: boolean;
  gestorConteudos: boolean;
  tipoUsuario: "Comum" | "Admin" | "Administrador";
  statusAcesso:
    | "Aguardando"
    | "Liberado"
    | "Recusado"
    | "Aprovado"
    | "Rejeitado"
    | "Revogado"
    | "RevisaoCadastral";
  paginasPermitidas?: string[]; // Array de IDs de páginas permitidas
  versaoPermissoes?: number;
  totalAcessos?: number;
  ultimoAcesso?: Timestamp;
  dataCadastro?: Timestamp;
  dataRecusa?: Timestamp;
  dataAprovacao?: Timestamp;
  dataRestauracao?: Timestamp;
  dataRecusaAcesso?: Timestamp;
  dataLiberacaoAcesso?: Timestamp;
  motivoRecusa?: string;
  motivoRevogacao?: string;
  dataRevogacao?: Timestamp;
  analisadoPor?: string;
  analisadoPorUid?: string;
  historicoAcesso?: HistoricoAcesso[];
  historicoRevisoes?: EventoHistoricoUsuario[];
  alteracaoProfissionalPendente?: AlteracaoProfissionalPendente;
  ultimaRevisaoCadastral?: ResultadoRevisaoCadastral;
}
