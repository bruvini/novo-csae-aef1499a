
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
  ehAdmin?: boolean;
}

export interface DiagnosticoCompleto {
  id?: string;
  nome: string;
  codigo?: string;
  titulo?: string;
  explicacao?: string;
  subconjuntoId: string;
  subitemId?: string;
  definicao?: string;
  subconjunto?: string;
  subitemNome?: string;
  resultadosEsperados: ResultadoEsperado[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  descricao?: string;
}

export interface ResultadoEsperado {
  id?: string;
  descricao: string;
  intervencoes: Intervencao[];
  diagnosticoId?: string;
}

export interface Intervencao {
  id?: string;
  descricao?: string;
  resultadoEsperadoId?: string;
  verboPrimeiraEnfermeiro?: string;
  verboOutraPessoa?: string;
  descricaoRestante?: string;
  nomeDocumento?: string;
  linkDocumento?: string;
  intervencaoEnfermeiro?: string;
  intervencaoInfinitivo?: string;
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
  representaAlteracao?: boolean;
  variacaoPor?: 'Sexo' | 'Idade' | 'Ambos' | 'Nenhum';
  tipoValor?: 'Numérico' | 'Texto';
  valorTexto?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  idadeMinima?: number;
  idadeMaxima?: number;
  sexo?: 'Masculino' | 'Feminino' | 'Todos';
  tituloAlteracao?: string;
  nhbId?: string;
  diagnosticoId?: string;
}

export interface ExameLaboratorial {
  id?: string;
  nome: string;
  sigla?: string;
  descricao?: string;
  tipoExame?: 'Laboratorial' | 'Imagem';
  diferencaSexoIdade?: boolean;
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
  diferencaSexoIdade?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface RevisaoSistema {
  id?: string;
  nome: string;
  sistemaCorporalId: string;
  sistemaId: string;
  sistemaNome: string;
  pergunta?: string;
  diferencaSexoIdade?: boolean;
  valoresReferencia: ValorReferencia[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface SubconjuntoDiagnostico {
  id?: string;
  nome: string;
  descricao?: string;
  tipo: 'Protocolo' | 'NHB';
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
  tipoCaso?: string;
  casoClinico?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  focoEsperado?: string;
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
