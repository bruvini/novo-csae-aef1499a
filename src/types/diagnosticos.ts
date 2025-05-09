
import { Timestamp } from "firebase/firestore";
import { Intervencao, ResultadoEsperado } from "./intervencoes";

// Diagnósticos de Enfermagem
export interface DiagnosticoCompleto {
  id?: string;
  nome: string;
  explicacao?: string;
  titulo?: string;
  definicao?: string;
  codigoCipe?: string;
  subconjuntoId: string;
  subconjunto?: string;
  subitemId?: string;
  subitemNome?: string;
  caracteristicasDefinidoras?: string[];
  fatoresRelacionados?: string[];
  populacaoRisco?: string[];
  condicoesAssociadas?: string[];
  resultadosEsperados: ResultadoEsperado[];
  ativo?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  descricao?: string;
}

export interface DiagnosticoSelecionado {
  diagnosticoId: string;
  diagnosticoTitulo: string;
  caracteristicasDefinidoras: string[];
  fatoresRelacionados: string[];
  intervencoesSelecionadas: {
    intervencaoId: string;
    intervencaoTitulo: string;
  }[];
  resultadosEsperados: {
    resultadoId: string;
    resultadoTitulo: string;
  }[];
}

// Updated Subconjunto interface to include "Sistema" and "Outro" types
export interface Subconjunto {
  id?: string;
  nome: string;
  tipo: 'NHB' | 'Sistema' | 'Outro' | 'Protocolo';
  descricao?: string;
  ativo: boolean;
  ordem?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Updated SubconjuntoDiagnostico interface to include "Sistema" and "Outro" types
export interface SubconjuntoDiagnostico {
  id?: string;
  nome: string;
  tipo: 'NHB' | 'Sistema' | 'Outro' | 'Protocolo';
  descricao?: string;
  ativo?: boolean;
  ordem?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
