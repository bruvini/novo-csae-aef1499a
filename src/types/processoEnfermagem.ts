
import { Timestamp } from 'firebase/firestore';

// NOVO TIPO para registrar cada sessão de trabalho
export interface SessaoDeTrabalho {
  inicioSessao: Timestamp;
  fimSessao?: Timestamp; // Opcional, pois a sessão atual não terá um fim até ser salva
}

export interface AvaliacaoEnfermagem {
  coletaDeDadosSubjetivos: string;
  exameFisico: {
    [parametro: string]: string | number; // Ex: { "Frequência Cardíaca": 110, "Pressão Arterial Sistólica": 130 }
  };
  nhbsAfetadas: { parametro: string; nhb: string }[];
}

interface DiagnosticoSelecionado {
  id: string; // ID do documento do diagnóstico em 'rolEnfermagem'
  tituloDiagnostico: string;
}

export interface DiagnosticoEnfermagem {
  diagnosticosSelecionados: DiagnosticoSelecionado[];
}

// NOVOS TIPOS para a Etapa de Planejamento
export interface IntervencaoSelecionada {
  acaoPrescrita: string;
  tipo: 'padrao' | 'autoral'; // 'padrao' para as do sistema, 'autoral' para as customizadas
}

export interface DiagnosticoPlanejado {
  diagnosticoId: string;
  tituloDiagnostico: string;
  ordemPrioridade: number;
  resultadoEsperadoSelecionado?: string; // Armazena o título do resultado escolhido
  intervencoesSelecionadas: IntervencaoSelecionada[];
}

export interface PlanejamentoEnfermagem {
  diagnosticosPlanejados: DiagnosticoPlanejado[];
}

// NOVOS TIPOS para a Etapa de Implementação
export interface IntervencaoImplementada extends IntervencaoSelecionada {
  implementadoNestaConsulta: boolean;
  quemExecuta?: 'Enfermeiro' | 'Equipe/Outros'; // Apenas para intervenções 'padrao'
  prazo?: number;
  prazoUnidade?: 'segundos' | 'minutos' | 'horas' | 'dias' | 'semanas' | 'meses' | 'anos';
}

export interface ImplementacaoEnfermagem {
  // A chave será o título do diagnóstico para fácil acesso
  [tituloDiagnostico: string]: {
    intervencoes: IntervencaoImplementada[];
  }
}

export interface ProcessoEnfermagem {
  id: string;
  pacienteId: string;
  enfermeiroId: string;
  status: 'em_andamento' | 'concluido';
  etapaAtual: number; // de 1 a 5
  dataInicio: Timestamp;
  dataConclusao?: Timestamp;
  sessoesDeTrabalho: SessaoDeTrabalho[]; // NOVO CAMPO: um array para registrar todas as sessões
  // Estruturas de dados para cada etapa (inicialmente podem ser objetos vazios)
  avaliacao: AvaliacaoEnfermagem;
  diagnostico: DiagnosticoEnfermagem;
  planejamento: PlanejamentoEnfermagem;
  implementacao: ImplementacaoEnfermagem;
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
    descricao: "Compreende a identificação de problemas existentes, condições de vulnerabilidades ou disposições para melhorar comportamentos de saúde. Estes representam o julgamento clínico das informações obtidas sobre as necessidades do cuidado de Enfermagem e saúde da pessoa, família, coletividade ou grupos especiais.",
    icone: "FileText"
  },
  {
    numero: 3,
    nome: "Planejamento",
    descricao: "Planejamento de Enfermagem – compreende o desenvolvimento de um plano assistencial direcionado para à pessoa, família, coletividade, grupos especiais, e compartilhado com os sujeitos do cuidado e equipe de Enfermagem e saúde.",
    icone: "Target"
  },
  {
    numero: 4,
    nome: "Implementação",
    descricao: "Compreende a realização das intervenções, ações e atividades previstas no planejamento assistencial, pela equipe de enfermagem, respeitando as resoluções/pareceres do Conselho Federal e Conselhos Regionais de Enfermagem quanto a competência técnica de cada profissional, por meio da colaboração e comunicação contínua, inclusive com a checagem quanto à execução da prescrição de enfermagem.",
    icone: "Play"
  },
  {
    numero: 5,
    nome: "Evolução",
    descricao: "Avaliação contínua dos resultados obtidos e da eficácia das intervenções implementadas, com ajustes necessários no plano de cuidados.",
    icone: "TrendingUp"
  }
];
