import {
  arrayUnion,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type {
  DadosPessoais,
  DadosProfissionais,
  EventoHistoricoUsuario,
  Usuario,
} from "@/types/usuario";
import { listarAlteracoesProfissionais } from "@/utils/profileUtils";

export async function buscarMeuPerfil(uid: string): Promise<Usuario> {
  const snapshot = await getDoc(doc(db, "usuarios", uid));
  if (!snapshot.exists()) throw new Error("Perfil não encontrado.");
  return { id: snapshot.id, ...snapshot.data() } as Usuario;
}

export async function atualizarDadosPessoais(
  uid: string,
  dadosPessoais: DadosPessoais,
  nomeUsuario: string,
): Promise<void> {
  const evento: EventoHistoricoUsuario = {
    tipo: "dados_pessoais_atualizados",
    dataHora: Timestamp.now(),
    responsavelId: uid,
    responsavelNome: nomeUsuario,
    descricao: "Dados pessoais atualizados pelo próprio usuário.",
  };

  await updateDoc(doc(db, "usuarios", uid), {
    dadosPessoais,
    dataAtualizacaoDadosPessoais: serverTimestamp(),
    historicoRevisoes: arrayUnion(evento),
  });
}

export async function solicitarRevisaoDadosProfissionais(
  uid: string,
  dadosAnteriores: DadosProfissionais,
  dadosNovos: DadosProfissionais,
  nomeUsuario: string,
): Promise<void> {
  const alteracoes = listarAlteracoesProfissionais(dadosAnteriores, dadosNovos);
  if (alteracoes.length === 0)
    throw new Error("Nenhuma alteração profissional foi identificada.");

  const evento: EventoHistoricoUsuario = {
    tipo: "alteracao_profissional_solicitada",
    dataHora: Timestamp.now(),
    responsavelId: uid,
    responsavelNome: nomeUsuario,
    descricao: "Usuário enviou novos dados profissionais para revisão.",
    alteracoes,
  };

  await updateDoc(doc(db, "usuarios", uid), {
    statusAcesso: "RevisaoCadastral",
    alteracaoProfissionalPendente: {
      dadosAnteriores,
      dadosNovos,
      dataSolicitacao: Timestamp.now(),
    },
    historicoRevisoes: arrayUnion(evento),
  });
}
