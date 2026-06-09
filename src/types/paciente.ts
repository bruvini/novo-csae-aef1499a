
import { Timestamp } from 'firebase/firestore';

// Identidades de gênero suportadas no cadastro
export type IdentidadeGenero =
  | 'Homem Cisgênero'
  | 'Mulher Cisgênero'
  | 'Homem Trans (sem cirurgia)'
  | 'Homem Trans (com cirurgia)'
  | 'Mulher Trans (sem cirurgia)'
  | 'Mulher Trans (com cirurgia)'
  | 'Não-binário'
  | 'Prefiro não informar'
  | 'Feminino'   // legado — mantido para compatibilidade com registros antigos
  | 'Masculino'; // legado — mantido para compatibilidade com registros antigos

export type SexoBiologicoNormalizado = 'Masculino' | 'Feminino' | 'Ambos';

/**
 * Mapeia a identidade de gênero do cadastro para o sexo biológico usado nos
 * filtros clínicos do exame físico, conforme diretrizes WPATH e boas práticas.
 *
 * Regras:
 * - Homem/Mulher Cis e valores legados → biológico direto
 * - Homem Trans sem cirurgia → Feminino (órgãos reprodutivos femininos presentes)
 * - Homem Trans com cirurgia → Masculino (histerectomia/ooforectomia realizadas)
 * - Mulher Trans sem cirurgia → Masculino (órgãos reprodutivos masculinos presentes)
 * - Mulher Trans com cirurgia → Ambos (próstata retida; neovagina — exibir tudo)
 * - Não-binário / Prefiro não informar → Ambos (exibir todos os sistemas)
 */
export function getSexoBiologico(sexo: string): SexoBiologicoNormalizado {
  switch (sexo) {
    case 'Homem Cisgênero':
    case 'Masculino':
      return 'Masculino';
    case 'Mulher Cisgênero':
    case 'Feminino':
      return 'Feminino';
    case 'Homem Trans (sem cirurgia)':
      return 'Feminino';
    case 'Homem Trans (com cirurgia)':
      return 'Masculino';
    case 'Mulher Trans (sem cirurgia)':
      return 'Masculino';
    case 'Mulher Trans (com cirurgia)':
    case 'Não-binário':
    case 'Prefiro não informar':
    default:
      return 'Ambos';
  }
}

export interface ProcessoEnfermagem {
  idProcesso: string;
  dataInicio: Timestamp;
  dataFim?: Timestamp | null;
  dataConclusao?: Timestamp | null;
  status: 'em_andamento' | 'concluido';
  statusProcesso?: 'Em andamento' | 'Concluído'; // Para compatibilidade
  etapaAtual?: number;
  enfermeiroId?: string;
  pacienteId?: string;
  sessoesDeTrabalho?: any[];
  avaliacao?: any;
  diagnostico?: any;
  planejamento?: any;
  implementacao?: any;
  evolucao?: any;
}

export interface Paciente {
  id?: string; // ID do documento Firestore
  nomeCompleto: string;
  dataNascimento: Timestamp;
  sexo: IdentidadeGenero;
  dataCadastro: Timestamp;
  uidUsuario: string; // UID do enfermeiro autenticado
  idUsuario?: string; // ID do documento do usuário na coleção 'usuarios'
  processosEnfermagem: ProcessoEnfermagem[];
}

export type StatusPaciente = 'Sem processo iniciado' | 'Em andamento' | 'Concluído';

export interface IndicadoresPacientes {
  totalPacientes: number;
  processosAtivos: number;
  totalProcessosConcluidos: number;
}

// Utilitário para determinar o status do paciente com base na lista de processos
export function determinarStatusPaciente(paciente: Paciente): StatusPaciente {
  if (!paciente?.processosEnfermagem || paciente.processosEnfermagem.length === 0) {
    return 'Sem processo iniciado';
  }

  // Se existir algum processo em andamento, prioriza esse status
  const temEmAndamento = paciente.processosEnfermagem.some(
    (p) => p.status === 'em_andamento' || p.statusProcesso === 'Em andamento'
  );
  if (temEmAndamento) return 'Em andamento';

  // Caso contrário, se houver algum concluído
  const temConcluido = paciente.processosEnfermagem.some(
    (p) => p.status === 'concluido' || p.statusProcesso === 'Concluído'
  );
  if (temConcluido) return 'Concluído';

  return 'Sem processo iniciado';
}
