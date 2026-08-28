// src/services/bancodados/usuariosDB.ts

import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import {
  normalizarCidade,
  normalizarNomeCompleto,
} from "@/utils/userNormalization";

interface DadosPessoais {
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

interface DadosProfissionais {
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

export interface UsuarioData {
  uid: string;
  email: string;
  dadosPessoais: DadosPessoais;
  dadosProfissionais: DadosProfissionais;
  termoResponsabilidadeAceito: boolean;
  termoResponsabilidadeData: unknown;
  ehAdmin: boolean;
  gestorConteudos: boolean;
  tipoUsuario: "Comum" | "Admin";
  statusAcesso?: "Aguardando" | "Liberado" | "Recusado";
}

export async function cadastrarUsuario(usuario: UsuarioData): Promise<void> {
  const ref = doc(collection(db, "usuarios"), usuario.uid);
  await setDoc(ref, {
    ...usuario,
    dadosPessoais: {
      ...usuario.dadosPessoais,
      nomeCompleto: normalizarNomeCompleto(usuario.dadosPessoais.nomeCompleto),
      cidade: normalizarCidade(usuario.dadosPessoais.cidade),
    },
    statusAcesso: "Aguardando",
    dataCadastro: serverTimestamp(),
  });
}
