
import { Timestamp } from "firebase/firestore";

export interface PacientePerinatal {
  id?: string;
  nome: string;
  dataNascimento: Timestamp;
  cpf: string;
  cns: string; 
  telefone: string;
  endereco: string;
  nomeMae?: string; // Nova propriedade
  dataUltimaMenstruacao: Timestamp | null;
  idadeGestacional: number;
  idadeGestacionalNascer?: number; // Nova propriedade
  dataProvavelParto: Timestamp | null;
  dataParto?: Timestamp | null;
  prematuro?: boolean; // Nova propriedade
  // Campos de unidade
  unidade: string;
  municipio: string;
  microarea: string;
  agenteSaude: string;
  // Campos de controle
  ativo: boolean;
  situacao: 'pre-natal' | 'parto' | 'puerperio' | 'puericultura' | 'concluido';
  tipoPaciente: 'gestante' | 'puerpera' | 'bebe';
  // Histórico
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;
  updatedBy?: string;
}

export interface ConsultaPreNatal {
  id?: string;
  pacienteId: string;
  dataConsulta: Timestamp;
  semanaGestacional: number;
  peso: number;
  pressaoArterial: string;
  alturaUterina: number;
  bcf: number;
  edema: string;
  movimentacaoFetal: boolean;
  queixas: string[];
  conduta: string;
  proximaConsulta: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ConsultaPuerperio {
  id?: string;
  pacienteId: string;
  dataConsulta: Timestamp;
  diasPosParto: number;
  sinaisVitais: {
    pa: string;
    fc: number;
    temperatura: number;
  };
  mamas: string;
  abdomen: string;
  utero: string;
  loquios: string;
  ferida: string;
  eliminacoes: string;
  queixas: string[];
  conduta: string;
  proximaConsulta: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ConsultaPuericultura {
  id?: string;
  pacienteId: string;
  dataConsulta: Timestamp;
  idadeBebe: number; // em dias
  peso: number;
  comprimento: number;
  perimetroCefalico: number;
  perimetroToracico: number;
  alimentacao: string;
  eliminacoes: string;
  sono: string;
  pele: string;
  queixas: string[];
  conduta: string;
  proximaConsulta: Timestamp | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
