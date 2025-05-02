
import { Timestamp } from 'firebase/firestore';

export interface PacientePerinatal {
  id?: string;
  nome: string;
  dataNascimento: Timestamp;
  titulo: string;
  descricao: string;
  tipoPaciente: 'mulher' | 'bebê';
  situacaoObstetrica?: 'Gestante' | 'Puérpera';
  idadeGestacional?: number;
  dataParto?: Timestamp;
  nomeMae?: string;
  idadeGestacionalNascer?: number;
  prematuro?: boolean;
  profissionalUid: string;
  profissionalNome: string;
  dataCadastro?: Timestamp;
  dataAtualizacao?: Timestamp;
  cpf: string;
  cns: string;
  telefone: string;
  endereco: string;
  unidade: string;
  municipio: string;
  microarea: string;
  agenteSaude: string;
  dataUltimaMenstruacao: Timestamp | null;
  dataProvavelParto: Timestamp | null;
  ativo: boolean;
  situacao: 'pre-natal' | 'puerperio' | 'puericultura';
}

export interface PerfilUsuario {
  uid: string;
  email: string;
  nome: string;
  nomeUsuario: string;
  ehAdmin: boolean;
  atuaSMS: boolean;
}

export interface Usuario {
  id?: string;
  uid: string;
  email: string;
  nome: string;
  perfil: string;
  foto: string;
  telefone: string;
  atuaSMS: boolean;
  dadosPessoais: {
    nomeCompleto: string;
    rg: string;
    cpf: string;
    endereco: {
      rua: string;
      numero: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    }
  };
  dadosProfissionais: {
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
  };
  dataCadastro: Timestamp;
  statusAcesso: "Aguardando" | "Aprovado" | "Negado" | "Bloqueado";
  dataAprovacao?: Timestamp;
  dataRevogacao?: Timestamp;
  motivoRevogacao?: string;
  dataUltimoAcesso?: Timestamp;
  historico_logs?: any[];
  tipoUsuario?: "Administrador" | "Comum";
  logAcessos?: Timestamp[];
}

// Additional interfaces needed by various components
export interface DiagnosticoCompleto {
  id?: string;
  codigo: string;
  titulo: string;
  definicao: string;
  subconjuntoId: string;
  resultadosEsperados: ResultadoEsperado[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ResultadoEsperado {
  id?: string;
  descricao: string;
  intervencoes: Intervencao[];
  diagnosticoId?: string;
}

export interface Intervencao {
  id?: string;
  descricao: string;
  resultadoEsperadoId?: string;
}

export interface Subconjunto {
  id?: string;
  nome: string;
  tipo: 'Protocolo' | 'NHB';
  descricao?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ValorReferencia {
  id?: string;
  minimo?: number;
  maximo?: number;
  unidade: string;
  grupo?: string;
  observacao?: string;
}

export interface ExameLaboratorial {
  id?: string;
  nome: string;
  sigla: string;
  descricao?: string;
  valoresReferencia: ValorReferencia[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SinalVital {
  id?: string;
  nome: string;
  sigla: string;
  descricao?: string;
  valoresReferencia: ValorReferencia[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SubconjuntoDiagnostico {
  id?: string;
  nome: string;
  descricao?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RevisaoSistema {
  id?: string;
  pergunta: string;
  sistemaCorporalId: string;
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

export interface TermoCipe {
  id?: string;
  termo: string;
  eixo: string;
  codigo: string;
  definicao: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface CasoClinico {
  id?: string;
  titulo: string;
  descricao: string;
  diagnosticos: DiagnosticoCompleto[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ProtocoloEnfermagem {
  id: string;
  nome: string;
  volume: string;
  descricao: string;
  linkPdf: string;
  linkImagem?: string;
  dataPublicacao: Timestamp;
  dataAtualizacao?: Timestamp;
}
