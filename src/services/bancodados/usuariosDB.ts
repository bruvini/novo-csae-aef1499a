// src/services/bancodados/usuariosDB.ts

import { collection, doc, setDoc, serverTimestamp, type Firestore } from "firebase/firestore";
import { db } from "@/services/firebase";

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

export async function cadastrarUsuario(usuario: UsuarioData, firestore: Firestore = db): Promise<void> {
  const ref = doc(collection(firestore, "usuarios"), usuario.uid);
  await setDoc(ref, {
    ...usuario,
    statusAcesso: "Aguardando",
    dataCadastro: serverTimestamp(),
  });
}
