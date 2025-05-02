
import { Timestamp } from "firebase/firestore";

// Tipo para usuário autenticado
export interface UsuarioAutenticado {
  uid: string;
  email: string | null;
  nome?: string | null;
  tipoUsuario?: "Administrador" | "Enfermeiro" | "Técnico" | "Estudante";
  atuaSMS?: boolean;
  coren?: string;
  unidade?: string;
  ehAdmin?: boolean;
  emailVerificado?: boolean;
  dataCriacao?: Timestamp;
  ultimoAcesso?: Timestamp;
  fotoURL?: string | null;
}

// Tipos para logs de acesso
export interface LogAcesso {
  id?: string;
  usuarioUid: string;
  usuarioEmail: string;
  usuarioNome?: string;
  dataAcesso: Timestamp;
  pagina?: string;
  dispositivo?: {
    tipo?: string;
    navegador?: string;
    sistema?: string;
    resolucao?: string;
  }
}

// Tipos para sugestões
export interface Sugestao {
  id?: string;
  titulo: string;
  descricao: string;
  categoria: "diagnostico" | "intervencao" | "resultado" | "protocolo" | "geral";
  status: "enviada" | "analise" | "aprovada" | "rejeitada";
  usuarioUid: string;
  usuarioNome?: string;
  usuarioEmail: string;
  dataCriacao: Timestamp;
  dataAtualizacao: Timestamp;
  respostas?: RespostaSugestao[];
  arquivos?: string[];
}

export interface RespostaSugestao {
  id?: string;
  conteudo: string;
  usuarioUid: string;
  usuarioNome?: string;
  usuarioEmail: string;
  dataCriacao: Timestamp;
  anexos?: string[];
}

// Tipos para módulos do sistema
export interface ModuloDisponivel {
  id?: string;
  nome: string; // identificador único
  titulo: string;
  slug: string; // para URL
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

// Tipos para pacientes e evoluções
export interface Paciente {
  id?: string;
  nome: string;
  dataNascimento: Timestamp;
  sexo: "feminino" | "masculino" | "outro";
  cpf?: string;
  cns?: string;
  telefone?: string;
  endereco?: string;
  historico?: string;
  condicoesPreexistentes?: string[];
  alergias?: string[];
  medicamentos?: string[];
  profissionalUid: string;
  dataRegistro: Timestamp;
  ultimaAtualizacao: Timestamp;
}

export interface Evolucao {
  id?: string;
  pacienteId: string;
  pacienteNome: string;
  data: Timestamp;
  enfermeiro: {
    uid: string;
    nome: string;
    coren?: string;
  };
  unidade?: string;
  motivo?: string;
  historico?: string;
  diagnosticos?: DiagnosticoEvolucao[];
  intervencoes?: IntervencaoEvolucao[];
  resultados?: ResultadoEvolucao[];
  sinaisVitais?: SinaisVitais;
  examesFisicos?: ExameFisicoRegistro[];
  examesLaboratoriais?: ExameLaboratorialRegistro[];
  conduta?: string;
  observacoes?: string;
  status: "rascunho" | "finalizado";
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface DiagnosticoEvolucao {
  id: string;
  nome: string;
  codigo?: string;
  descricao?: string;
  fatoresRelacionados?: string[];
  caracteristicasDefinidoras?: string[];
}

export interface IntervencaoEvolucao {
  id: string;
  nome: string;
  codigo?: string;
  descricao?: string;
  acoes?: string[];
}

export interface ResultadoEvolucao {
  id: string;
  nome: string;
  codigo?: string;
  descricao?: string;
  indicadores?: string[];
}

export interface SinaisVitais {
  pressaoArterial?: string;
  frequenciaCardiaca?: number;
  frequenciaRespiratoria?: number;
  temperatura?: number;
  saturacaoO2?: number;
  dor?: number;
  glicemia?: number;
  peso?: number;
  altura?: number;
  imc?: number;
  circunferenciaCintura?: number;
  circunferenciaCraniana?: number;
}

export interface ExameFisicoRegistro {
  sistemaId: string;
  sistemaNome: string;
  itens: {
    revisaoId: string;
    revisaoNome: string;
    valor: string;
    alterado: boolean;
    observacoes?: string;
  }[];
}

export interface ExameLaboratorialRegistro {
  categoriaId: string;
  categoriaNome: string;
  exames: {
    exameId: string;
    exameNome: string;
    valor: string;
    data: Timestamp;
    alterado: boolean;
    observacoes?: string;
  }[];
}

// Tipos para CIPE
export interface EixoCipe {
  id?: string;
  nome: string;
  codigo: string;
  descricao: string;
  ordem: number;
}

export interface TermoCipe {
  id?: string;
  nome: string;
  codigo: string;
  definicao: string;
  eixoId: string;
  eixoNome?: string;
  ativo: boolean;
  tipo?: string;
  descricao?: string;
  palavrasChave?: string[];
  termosPai?: string[];
  termosFilho?: string[];
  exemplos?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Tipos para sistemas corporais
export interface SistemaCorporal {
  id?: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

export interface RevisaoSistema {
  id?: string;
  nome: string;
  sistemaCorporalId: string;
  sistemaNome?: string;
  pergunta?: string;
  diferencaSexoIdade?: boolean;
  valoresReferencia: ValorReferencia[];
}

export interface ValorReferencia {
  descricao: string;
  valor: string;
  sexo?: "masculino" | "feminino" | "ambos";
  idadeMinima?: number;
  idadeMaxima?: number;
  unidadeTempo?: "dias" | "meses" | "anos";
}

// Tipos para exames laboratoriais
export interface CategoriaExame {
  id?: string;
  nome: string;
  descricao?: string;
  ordem: number;
}

export interface ExameLaboratorial {
  id?: string;
  nome: string;
  categoriaId: string;
  categoriaNome?: string;
  sigla?: string;
  descricao?: string;
  unidadeMedida?: string;
  valoresReferencia: ValorReferenciaExame[];
}

export interface ValorReferenciaExame {
  descricao: string;
  valorMinimo?: number;
  valorMaximo?: number;
  valorTexto?: string;
  sexo?: "masculino" | "feminino" | "ambos";
  idadeMinima?: number;
  idadeMaxima?: number;
  unidadeTempo?: "dias" | "meses" | "anos";
}

// Tipos para diagnósticos de enfermagem
export interface SubconjuntoDiagnostico {
  id?: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  tipo: "basico" | "especializado" | "personalizado";
  diagnosticos: DiagnosticoEnfermagem[];
}

export interface DiagnosticoEnfermagem {
  id?: string;
  nome: string;
  codigo?: string;
  definicao: string;
  eixoFoco: string;
  eixoJulgamento: string;
  eixoCliente?: string;
  eixoLocalizacao?: string;
  eixoIdade?: string;
  eixoTempo?: string;
  eixoMeio?: string;
  caracteristicasDefinidoras?: string[];
  fatoresRelacionados?: string[];
  condicoesAssociadas?: string[];
  populacaoRisco?: string[];
  referencias?: string[];
}

export type TimelineEventType = "fundacao" | "evento" | "protocolo" | "publicacao" | "implementacao" | "reconhecimento";

export interface TimelineEvent {
  id?: string;
  tipo: TimelineEventType;
  data: Timestamp;
  titulo: string;
  descricao: string;
  imagens?: string[];
  links?: {
    titulo: string;
    url: string;
  }[];
  participantes?: string[];
  destacado?: boolean;
  ordem?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Tipo para POPs (Procedimentos Operacionais Padrão)
export interface POP {
  id?: string;
  codigo: string;
  titulo: string;
  versao: string;
  dataAprovacao: Timestamp;
  dataRevisao?: Timestamp;
  proximaRevisao?: Timestamp;
  objetivo: string;
  responsaveis: string[];
  executores: string[];
  materiais?: string[];
  descricaoProcedimento: string[];
  observacoes?: string[];
  referencias?: string[];
  anexos?: string[];
  elaboradores: string[];
  revisores?: string[];
  aprovador?: string;
  categoria: string;
  ativo: boolean;
  pdfUrl?: string;
  visualizacoes?: number;
  downloads?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Tipo para categorias de POPs
export interface CategoriaPOP {
  id?: string;
  nome: string;
  descricao?: string;
  ordem: number;
  ativa: boolean;
}
