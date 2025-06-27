// src/types/usuario.ts
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

export interface Usuario {
  id?: string; // ID do Firestore
  uid: string; // UID do Auth
  email: string;
  dadosPessoais: DadosPessoais;
  dadosProfissionais: DadosProfissionais;
  termoResponsabilidadeAceito: boolean;
  termoResponsabilidadeData: Timestamp; // era any
  ehAdmin: boolean;
  gestorConteudos: boolean;
  tipoUsuario: 'Comum' | 'Admin';
  statusAcesso: 'Aguardando' | 'Liberado' | 'Recusado';
  dataCadastro?: Timestamp; // era any
  dataRecusaAcesso?: Timestamp; // era any
  dataLiberacaoAcesso?: Timestamp; // era any
}
