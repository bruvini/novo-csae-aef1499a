
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
  tipoValor?: 'Numérico' | 'Texto';
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
  updatedAt?: Timestamp;
}

export interface ExameLaboratorial {
  id?: string;
  nome: string;
  tipoExame: 'Laboratorial' | 'Imagem';
  diferencaSexoIdade: boolean;
  valoresReferencia: ValorReferencia[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RevisaoSistema {
  id?: string;
  nome: string;
  sistemaId: string;
  sistemaNome: string;
  diferencaSexoIdade: boolean;
  valoresReferencia: ValorReferencia[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SistemaCorporal {
  id?: string;
  nome: string;
  descricao?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Intervencao {
  verboPrimeiraEnfermeiro: string;
  verboOutraPessoa: string;
  descricaoRestante: string;
  intervencaoEnfermeiro?: string;
  intervencaoInfinitivo?: string;
  nomeDocumento?: string;
  linkDocumento?: string;
  id?: string;
}

export interface ResultadoEsperado {
  descricao: string;
  intervencoes: Intervencao[];
  id?: string;
}

export interface DiagnosticoCompleto {
  id?: string;
  nome: string;
  subconjunto: 'Protocolo de Enfermagem' | 'Necessidades Humanas Básicas';
  subconjuntoId: string;
  subitemNome: string;
  subitemId?: string;
  explicacao?: string;
  descricao?: string;
  resultadosEsperados: ResultadoEsperado[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface NHB {
  id?: string;
  nome: string;
  descricao?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
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
  updatedAt?: Timestamp;
}

export interface Subconjunto {
  id?: string;
  nome: string;
  tipo: 'Protocolo' | 'NHB';
  descricao?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Novas interfaces para CIPE
export interface TermoCipe {
  id?: string;
  tipo: string;
  termo: string;
  descricao: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CasoClinico {
  id?: string;
  tipoCaso: 'Diagnóstico' | 'Ações' | 'Resultados';
  casoClinico: string;
  focoEsperado: string | null;
  julgamentoEsperado: string | null;
  meioEsperado: string | null;
  acaoEsperado: string | null;
  tempoEsperado: string | null;
  localizacaoEsperado: string | null;
  clienteEsperado: string | null;
  arrayVencedor: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Interfaces para o Acompanhamento Perinatal
export interface PacientePerinatal {
  id?: string;
  titulo: string;
  descricao: string;
  tipoPaciente: "mulher" | "bebê";
  nome: string;
  dataNascimento: Timestamp;
  profissionalUid: string;
  profissionalNome: string;
  dataCadastro: Timestamp;
  dataAtualizacao: Timestamp;
  
  // Campos específicos para mulher
  situacaoObstetrica?: "Gestante" | "Puérpera";
  dataParto?: Timestamp;
  idadeGestacional?: number; // Em semanas
  
  // Campos específicos para bebê
  nomeMae?: string;
  idadeGestacionalNascer?: number; // Em semanas
  prematuro?: boolean;
}

export interface ConsultaPreNatal {
  id?: string;
  pacienteId: string;
  dataConsulta: Timestamp;
  profissionalUid: string;
  profissionalNome: string;
  tipoConsulta: "Primeira" | "Primeiro Trimestre" | "Segundo Trimestre" | "Terceiro Trimestre" | "Encerramento";
  
  // Dados da consulta
  idadeGestacional: number; // Em semanas
  peso: number; // Em kg
  altura?: number; // Em metros
  imc?: number;
  pressaoArterial: string; // No formato "120/80"
  edema?: "ausente" | "MMII" | "MMII e face" | "generalizado";
  movimentosFetais?: "presentes" | "ausentes";
  batimentoCardiacoFetal?: number; // BPM
  alturaPelvica?: number; // Em cm
  examesRealizados?: { nome: string, resultado: string, data: Timestamp }[];
  orientacoesRealizadas: string[];
  prescricoes?: { medicamento: string, posologia: string, duracao: string }[];
  condutas: string[];
  
  // Campos específicos para encerramento
  tipoEncerramento?: "Parto" | "Aborto";
  dataParto?: Timestamp;
  tipoParto?: "Normal" | "Cesárea" | "Fórceps";
  localParto?: string;
  nomeBebe?: string;
  dataNascimentoBebe?: Timestamp;
}

export interface ConsultaPuerperio {
  id?: string;
  pacienteId: string;
  dataConsulta: Timestamp;
  profissionalUid: string;
  profissionalNome: string;
  tipoPuerperio: "Imediato" | "Tardio";
  diasPosParto: number;
  
  // Dados da consulta
  peso: number; // Em kg
  pressaoArterial: string; // No formato "120/80"
  temperatura?: number;
  mamas: "flácidas" | "túrgidas" | "ingurgitadas" | "mastite";
  mamilos: "íntegros" | "fissuras" | "escoriados";
  involucaoUterina: string;
  loquios: "rubros" | "serosanguinolentos" | "serosos" | "ausentes";
  ferida?: "cicatrizada" | "em cicatrização" | "sinais de infecção" | "deiscência";
  emocional: string;
  amamentacao: "exclusiva" | "mista" | "artificial";
  dificuldadesAmamentacao?: string;
  planejamentoReprodutivo?: string;
  orientacoesRealizadas: string[];
  prescricoes?: { medicamento: string, posologia: string, duracao: string }[];
  condutas: string[];
}

export interface ConsultaPuericultura {
  id?: string;
  pacienteId: string;
  dataConsulta: Timestamp;
  profissionalUid: string;
  profissionalNome: string;
  idadeCrianca: string; // Ex: "5 dias", "1 mês", "2 meses" etc.
  
  // Dados antropométricos
  peso: number; // Em kg
  comprimento: number; // Em cm
  perimetroCefalico: number; // Em cm
  perimetroToracico?: number; // Em cm
  imc?: number;
  
  // Avaliação do DNPM
  dnpm: {
    social?: string;
    motor?: string;
    adaptativo?: string;
    linguagem?: string;
  };
  
  // Avaliação física
  avaliacaoFisica: {
    pele?: string;
    cabeca?: string;
    fontanelas?: string;
    olhos?: string;
    orelhas?: string;
    boca?: string;
    torax?: string;
    abdomen?: string;
    genitalia?: string;
    membros?: string;
    coluna?: string;
  };
  
  // Triagem e imunização
  triagem: {
    testeDoOlhinho?: "normal" | "alterado" | "não realizado";
    testeOrelhinha?: "normal" | "alterado" | "não realizado";
    testePezinho?: "normal" | "alterado" | "não realizado" | "pendente";
    testeCoracaozinho?: "normal" | "alterado" | "não realizado";
  };
  
  vacinacaoAtualizada: boolean;
  vacinasPendentes?: string[];
  
  // Alimentação
  alimentacao: "aleitamento materno exclusivo" | "aleitamento misto" | "fórmula infantil" | "alimentação complementar" | "alimentação da família";
  dificuldadesAlimentacao?: string;
  
  // Suplementação
  suplementacaoVitaminaA?: boolean;
  suplementacaoFerro?: boolean;
  suplementacaoOutros?: { suplemento: string, dose: string }[];
  
  // Exames complementares
  examesRealizados?: { nome: string, resultado: string, data: Timestamp }[];
  
  // Situações especiais
  situacoesEspeciais?: {
    prematuro?: boolean;
    HIV?: boolean;
    sifilis?: boolean;
    hepatiteB?: boolean;
  };
  
  orientacoesRealizadas: string[];
  prescricoes?: { medicamento: string, posologia: string, duracao: string }[];
  condutas: string[];
}
