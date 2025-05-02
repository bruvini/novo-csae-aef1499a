
import { Timestamp } from "firebase/firestore";

// Tipos de usuário
export interface UsuarioAutenticado {
  uid: string;
  email: string;
  nome: string;
  tipoUsuario: "Administrador" | "Enfermeiro" | "Técnico" | "Estudante";
  coren?: string;
  unidade?: string;
  ehAdmin: boolean;
  atuaSMS?: boolean;
  statusAcesso?: "Aprovado" | "Aguardando" | "Negado" | "Revogado" | "Cancelado";
  dadosPessoais?: {
    nomeCompleto: string;
    cpf: string;
    telefone: string;
  };
  dataCriacao?: Timestamp;
  ultimoAcesso?: Timestamp;
}

export interface SessaoUsuario {
  uid: string;
  email: string;
  nomeUsuario: string;
  tipoUsuario: string;
  statusAcesso?: string;
}

// Histórico de acessos
export interface LogAcesso {
  id?: string;
  usuarioUid: string;
  usuarioEmail: string;
  usuarioNome: string;
  dataHora?: Timestamp;
  pagina?: string;
  acao?: string;
}

// Pacientes
export interface Paciente {
  id?: string;
  nome: string;
  dataNascimento: string;
  sexo: 'Feminino' | 'Masculino';
  profissionalUid: string;
  ultimaConsulta?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

// Exames Laboratoriais
export interface ExameLaboratorial {
  id?: string;
  nome: string;
  tipoExame: 'Laboratorial' | 'Imagem';
  diferencaSexoIdade: boolean;
  valoresReferencia: ValorReferenciaExame[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ValorReferenciaExame {
  id?: string;
  unidade: string;
  representaAlteracao: boolean;
  variacaoPor: 'Nenhum' | 'Sexo' | 'Idade' | 'Ambos';
  tipoValor: 'Numérico' | 'Texto';
  valorMinimo?: number;
  valorMaximo?: number;
  valorTexto?: string;
  idadeMinima?: number;
  idadeMaxima?: number;
  sexo?: 'Todos' | 'Masculino' | 'Feminino';
  tituloAlteracao?: string;
  nhbId?: string;
  diagnosticoId?: string;
}

// Registro de Evolução
export interface Evolucao {
  id?: string;
  pacienteId: string;
  profissionalUid: string;
  dataInicio: Timestamp;
  dataFim?: Timestamp;
  status: 'iniciada' | 'em_andamento' | 'finalizada';
  dadosAvaliacao?: {
    queixaPrincipal: string;
    historiaDoenca?: string;
    comorbidades?: string[];
    alergias?: string[];
    medicamentosUso?: string[];
  };
  dados: Record<string, any>;
  diagnosticosSelecionados?: DiagnosticoSelecionado[];
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
}

export interface Intervencao {
  id?: string;
  titulo: string;
  definicao?: string;
  codigoCipe?: string;
  diagnosticoIds: string[];
  atividades?: string[];
  ativo: boolean;
  verboPrimeiraEnfermeiro?: string;
  verboOutraPessoa?: string;
  descricaoRestante?: string;
  intervencaoEnfermeiro?: string;
  intervencaoInfinitivo?: string;
  nomeDocumento?: string;
  linkDocumento?: string;
}

export interface ResultadoEsperado {
  id?: string;
  titulo?: string;
  descricao: string;
  definicao?: string;
  codigoCipe?: string;
  diagnosticoIds?: string[];
  indicadores?: string[];
  ativo?: boolean;
  intervencoes: Intervencao[];
}

export interface Subconjunto {
  id?: string;
  nome: string;
  tipo: 'NHB' | 'Sistema' | 'Outro' | 'Protocolo';
  descricao?: string;
  ativo?: boolean;
  ordem?: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

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

// Sinais Vitais
export interface SinalVital {
  id?: string;
  nome: string;
  abreviacao?: string;
  unidade: string;
  valorMinimo?: number;
  valorMaximo?: number;
  ordem?: number;
  descricao?: string;
  ativo: boolean;
  diferencaSexoIdade?: boolean;
  valoresReferencia?: AlteracaoSinalVital[];
  alteracoes?: AlteracaoSinalVital[];
}

export interface AlteracaoSinalVital {
  id?: string;
  titulo: string;
  descricao?: string;
  condicao: 'abaixo' | 'acima' | 'entre' | 'igual';
  valorMinimo?: number;
  valorMaximo?: number;
  valorReferencia?: string;
  nhbId?: string;
  diagnosticoId?: string;
}

// POPs (Procedimentos Operacionais Padrão)
export interface POP {
  id?: string;
  titulo: string;
  codigo: string;
  versao: string;
  dataAtualizacao: Timestamp;
  objetivo: string;
  aplicacao: string;
  responsaveis: string;
  materiaisNecessarios: string[];
  descricaoProcedimento: string[];
  referencias: string[];
  cuidadosEspeciais?: string;
  anexos?: string[];
  ativo: boolean;
  categoria: string;
}

// Protocolos de Enfermagem
export interface ProtocoloEnfermagem {
  id?: string;
  volume: string;
  nome: string;
  dataPublicacao: Timestamp;
  dataAtualizacao?: Timestamp;
  descricao: string;
  linkPdf: string;
  linkImagem?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Sistemas Corporais e Revisão de Sistemas
export interface SistemaCorporal {
  id?: string;
  nome: string;
  descricao?: string;
  ordem?: number;
  ativo: boolean;
}

export interface RevisaoSistema {
  id?: string;
  sistemaCorporalId: string;
  titulo: string;
  descricao?: string;
  tipoAlteracao: 'Objetiva' | 'Subjetiva' | 'Ambas';
  padrao?: string;
  diagnosticoId?: string;
  nhbId?: string;
  ativo: boolean;
  ordem?: number;
}

// Variáveis de configuração
export interface ConfiguracaoSistema {
  id?: string;
  nome: string;
  valor: string | number | boolean | object;
  categoria: string;
  descricao?: string;
  ultimaAtualizacao: Timestamp;
}

// Sugestões e feedback
export interface Sugestao {
  id?: string;
  usuarioUid: string;
  usuarioNome: string;
  usuarioEmail: string;
  tipo: 'Sugestão' | 'Erro' | 'Dúvida';
  titulo: string;
  descricao: string;
  status: 'Nova' | 'Em Análise' | 'Implementada' | 'Rejeitada' | 'Respondida';
  dataEnvio: Timestamp;
  resposta?: string;
  respostaData?: Timestamp;
  respostaUsuarioUid?: string;
}

// Interface para ValorReferencia (usada em componentes)
export interface ValorReferencia {
  id?: string;
  unidade: string;
  representaAlteracao: boolean;
  variacaoPor: 'Nenhum' | 'Sexo' | 'Idade' | 'Ambos';
  tipoValor: 'Numérico' | 'Texto';
  valorMinimo?: number;
  valorMaximo?: number;
  valorTexto?: string;
  idadeMinima?: number;
  idadeMaxima?: number;
  sexo?: 'Todos' | 'Masculino' | 'Feminino';
  tituloAlteracao?: string;
  nhbId?: string;
  diagnosticoId?: string;
}
