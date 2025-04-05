
import { Timestamp, FieldValue } from 'firebase/firestore';

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
}

export interface Paciente {
  id?: string;
  nomeCompleto: string;
  dataNascimento: Timestamp;
  idade: number;
  sexo: 'Masculino' | 'Feminino' | 'Outro';
  profissionalUid: string;
  profissionalNome: string;
  dataCadastro: Timestamp;
  dataAtualizacao?: Timestamp | FieldValue;
  evolucoes?: Evolucao[];
}

export interface Evolucao {
  id?: string;
  dataInicio: Timestamp;
  dataAtualizacao: Timestamp | FieldValue;
  dataConclusao?: Timestamp | FieldValue;
  statusConclusao: 'Em andamento' | 'Interrompido' | 'Concluído';
  avaliacao?: string;
  diagnosticos?: DiagnosticoEnfermagem[];
  planejamento?: Planejamento[];
  implementacao?: Implementacao[];
  evolucaoFinal?: string;
}

export interface DiagnosticoEnfermagem {
  id: string;
  descricao: string;
  selecionado: boolean;
}

export interface Planejamento {
  diagnosticoId: string;
  resultadoEsperado: string;
  intervencoes: string[];
}

export interface Implementacao {
  intervencaoId: string;
  responsavel: string;
  status: 'Pendente' | 'Em andamento' | 'Concluído';
  observacoes?: string;
}

export interface ValorReferencia {
  idadeMinima?: number;
  idadeMaxima?: number;
  sexo?: 'Masculino' | 'Feminino' | 'Todos';
  valorMinimo?: number;
  valorMaximo?: number;
  valorTexto?: string;
  tipoValor: 'Numérico' | 'Texto';
  unidade: string;
  nhbId?: string;
  diagnosticoId?: string;
  representaAlteracao: boolean;
  tituloAlteracao?: string;
  variacaoPor: 'Sexo' | 'Idade' | 'Ambos' | 'Nenhum';
}

export interface SinalVital {
  id?: string;
  nome: string;
  diferencaSexoIdade: boolean;
  valoresReferencia: ValorReferencia[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp | FieldValue;
}

export interface ExameLaboratorial {
  id?: string;
  nome: string;
  diferencaSexoIdade: boolean;
  valoresReferencia: ValorReferencia[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp | FieldValue;
}

export interface RevisaoSistema {
  id?: string;
  nome: string;
  diferencaSexoIdade: boolean;
  valoresReferencia: ValorReferencia[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp | FieldValue;
}

export interface Intervencao {
  id: string;
  descricao: string;
  linkArquivo?: string;
}

export interface DiagnosticoCompleto {
  id?: string;
  descricao: string;
  subconjunto: 'Protocolo de Enfermagem' | 'Necessidades Humanas Básicas';
  subitemId: string;
  subitemNome: string;
  explicacao?: string;
  intervencoes: Intervencao[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp | FieldValue;
}

export interface NHB {
  id?: string;
  nome: string;
  descricao?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp | FieldValue;
}

export interface ProtocoloEnfermagem {
  id?: string;
  volume: string;
  nome: string;
  dataPublicacao: Timestamp;
  dataAtualizacao?: Timestamp;
  linkImagem?: string;
  descricao: string;
  linkPdf: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp | FieldValue;
}
