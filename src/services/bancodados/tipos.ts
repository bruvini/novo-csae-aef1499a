
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
  id: string;
  uid: string;
  email: string;
  nomeUsuario: string;
  formacao: string;
  dataRegistro: Timestamp;
  // Add other necessary fields
}

export interface Usuario {
  id: string;
  uid: string;
  email: string;
  dadosPessoais: {
    nomeCompleto: string;
    rg: string;
    cpf: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
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
    dataProrrogacaoResidencia?: string;
  };
  dataCadastro: Timestamp;
  statusAcesso: "Aguardando" | "Aprovado" | "Negado";
  dataAprovacao?: Timestamp;
  dataRevogacao?: Timestamp;
  motivoRevogacao?: string;
  dataUltimoAcesso?: Timestamp;
  historico_logs?: any[];
  tipoUsuario?: "Administrador" | "Comum";
  logAcessos?: Timestamp[];
}
