// src/services/bancodados/usuariosDB.ts

import { doc, runTransaction, serverTimestamp, type Firestore } from "firebase/firestore";
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
  const ref = doc(firestore, "usuarios", usuario.uid);
  await runTransaction(firestore, async (transaction) => {
    const existingProfile = await transaction.get(ref);
    if (existingProfile.exists()) {
      throw Object.assign(new Error("Já existe um perfil para esta conta."), {
        code: "firestore/already-exists",
      });
    }

    transaction.set(ref, {
      ...usuario,
      statusAcesso: "Aguardando",
      dataCadastro: serverTimestamp(),
    });
  });
}
