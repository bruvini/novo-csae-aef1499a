
import { Timestamp } from 'firebase/firestore';

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

export interface RevisaoResidenciaHistorico {
  acao: 'Convertido' | 'Revogado' | 'Prorrogado';
  revisorUid: string;
  decididoEm: Timestamp;
  marcoDoisAnos: string;
  inicioResidencia: string;
  statusResultante: 'Liberado' | 'Revogado';
  motivo: string;
  proximoPrazo: string;
  diasProrrogados: number;
  vinculoSMS: boolean;
  lotacao: string;
  matricula: string;
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
  tipoUsuario: 'Comum' | 'Admin' | 'Administrador';
  statusAcesso: 'Aguardando' | 'Liberado' | 'Recusado' | 'Aprovado' | 'Rejeitado' | 'Revogado' | 'AguardandoRevisaoCadastro';
  paginasPermitidas?: string[]; // Array de IDs de páginas permitidas
  totalAcessos?: number;
  ultimoAcesso?: Timestamp;
  dataCadastro?: Timestamp;
  dataRecusa?: Timestamp;
  dataRevogacao?: Timestamp;
  revogadoPorUid?: string;
  dataAprovacao?: Timestamp;
  dataRestauracao?: Timestamp;
  dataRecusaAcesso?: Timestamp;
  dataLiberacaoAcesso?: Timestamp;
  motivoRecusa?: string;
  historicoAcesso?: HistoricoAcesso[];
  // Próxima verificação é independente do marco original e não o sobrescreve.
  revisaoResidenciaEm?: string;
  dataRevisaoResidencia?: Timestamp;
  revisadoResidenciaPorUid?: string;
  motivoRevogacao?: string;
  historicoRevisoesResidencia?: RevisaoResidenciaHistorico[];
  dadosProfissionaisPropostos?: DadosProfissionais;
  dadosProfissionaisAnteriores?: DadosProfissionais;
  alteracaoCadastralPendente?: boolean;
  dataAlteracaoCadastral?: Timestamp;
  dataRevisaoCadastral?: Timestamp;
  revisadoPorUid?: string;
  resultadoRevisaoCadastral?: 'Aprovada' | 'Recusada';
  justificativaRecusaAlteracao?: string;
  historicoRevisoes?: Array<{
    dadosAnteriores: DadosProfissionais;
    dadosPropostos: DadosProfissionais;
    decisao: 'Aprovada' | 'Recusada';
    motivo: string;
    solicitadoEm?: Timestamp;
    revisadoEm: Timestamp;
    revisadoPorUid: string;
  }>;
}
