
import { Timestamp } from 'firebase/firestore';

export interface ProcessoEnfermagem {
  id: string;
  pacienteId: string;
  enfermeiroId: string;
  status: 'em_andamento' | 'concluido';
  etapaAtual: number; // de 1 a 5
  dataInicio: Timestamp;
  dataConclusao?: Timestamp;
  // Estruturas de dados para cada etapa (inicialmente podem ser objetos vazios)
  avaliacao: any;
  diagnostico: any;
  planejamento: any;
  implementacao: any;
  evolucao: any;
}

export interface EtapaProcesso {
  numero: number;
  nome: string;
  descricao: string;
  icone: string;
}

export const ETAPAS_PROCESSO: EtapaProcesso[] = [
  {
    numero: 1,
    nome: "Avaliação",
    descricao: "Coleta de dados sobre a condição de saúde do paciente através de entrevista, exame físico e análise de documentos, visando identificar necessidades de cuidado.",
    icone: "Search"
  },
  {
    numero: 2,
    nome: "Diagnóstico",
    descricao: "Processo de interpretação e análise dos dados coletados na avaliação para identificar problemas de saúde reais ou potenciais que podem ser resolvidos pela enfermagem.",
    icone: "FileText"
  },
  {
    numero: 3,
    nome: "Planejamento",
    descricao: "Determinação de resultados esperados e seleção de intervenções de enfermagem para alcançar objetivos específicos do cuidado ao paciente.",
    icone: "Target"
  },
  {
    numero: 4,
    nome: "Implementação",
    descricao: "Execução das intervenções de enfermagem planejadas, incluindo cuidados diretos, educação do paciente e coordenação do cuidado.",
    icone: "Play"
  },
  {
    numero: 5,
    nome: "Evolução",
    descricao: "Avaliação contínua dos resultados obtidos e da eficácia das intervenções implementadas, com ajustes necessários no plano de cuidados.",
    icone: "TrendingUp"
  }
];
