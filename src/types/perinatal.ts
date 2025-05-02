
import { Timestamp } from "firebase/firestore";

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
