import {
  doc, runTransaction, serverTimestamp, Timestamp, updateDoc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { DadosProfissionais, Usuario } from "@/types/usuario";
import { dadosProfissionaisIguais } from "@/utils/revisaoCadastral";

function normalizarProfissional(dados: DadosProfissionais): DadosProfissionais {
  const res: DadosProfissionais = {
    formacao: dados.formacao.trim(),
    atuaSMS: dados.atuaSMS === true,
  };
  const opcoes: Array<keyof DadosProfissionais> = [
    "numeroCoren", "ufCoren", "dataInicioResidencia", "iesEnfermagem",
    "lotacao", "matricula", "cidadeTrabalho", "localCargo",
  ];
  for (const campo of opcoes) {
    const valor = dados[campo];
    if (typeof valor === "string") Object.assign(res, { [campo]: valor.trim() });
  }
  return res;
}

export function validarDadosProfissionais(dados: DadosProfissionais): string[] {
  const problemas: string[] = [];
  if (!dados.formacao || dados.formacao.length > 120) problemas.push("Informe a formação.");
  if (dados.formacao === "Residente de Enfermagem" &&
    (!dados.dataInicioResidencia || !/^\\d{4}-\\d{2}-\\d{2}$/.test(dados.dataInicioResidencia))) {
    problemas.push("Informe a data de início da residência.");
  }
  if (dados.atuaSMS && (!dados.lotacao || !dados.matricula)) problemas.push("Informe lotação e matrícula.");
  if (["Enfermeiro", "Residente de Enfermagem", "Técnico de Enfermagem"].includes(dados.formacao)
      && (!dados.numeroCoren || !dados.ufCoren)) problemas.push("Informe número e UF do COREN.");
  return problemas;
}

export async function solicitarRevisaoProfissional(uid: string, dados: DadosProfissionais): Promise<void> {
  const proposta = normalizarProfissional(dados);
  const erros = validarDadosProfissionais(proposta);
  if (erros.length) throw new Error(erros.join(" "));
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "usuarios", uid);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Cadastro não encontrado.");
    const perfil = snap.data() as Usuario;
    if (!["Liberado", "Aprovado"].includes(perfil.statusAcesso))
      throw new Error("Seu perfil precisa estar aprovado para solicitar alteração.");
    if (perfil.ehAdmin) throw new Error("Alterações no perfil de administrador exigem revisão assistida.");
    if (perfil.alteracaoCadastralPendente) throw new Error("Já existe uma revisão profissional pendente.");
    if (dadosProfissionaisIguais(perfil.dadosProfissionais, proposta))
      throw new Error("Nenhum dado profissional foi alterado.");
    tx.update(ref, {
      dadosProfissionaisPropostos: proposta,
      statusAcesso: "AguardandoRevisaoCadastro",
      alteracaoCadastralPendente: true,
      dataAlteracaoCadastral: serverTimestamp(),
    });
  });
}

export async function decidirRevisaoProfissional(
  uid: string,
  adminUid: string,
  decisao: "Aprovada" | "Recusada",
  motivo = "",
): Promise<void> {
  if (!adminUid || uid === adminUid) throw new Error("Não é permitido revisar a própria conta.");
  if (decisao === "Recusada" && motivo.trim().length < 8)
    throw new Error("Informe uma justificativa de pelo menos 8 caracteres.");
  await runTransaction(db, async (tx) => {
    const ref = doc(db, "usuarios", uid);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Perfil não encontrado.");
    const data = snap.data() as Usuario;
    if (data.statusAcesso !== "AguardandoRevisaoCadastro" ||
      data.alteracaoCadastralPendente !== true || !data.dadosProfissionaisPropostos)
      throw new Error("A solicitação já foi processada ou não está disponível.");
    const historico = data.historicoRevisoes ?? [];
    if (historico.length >= 100) throw new Error("Limite do histórico alcançado; solicite arquivamento seguro.");
    const registro = {
      dadosAnteriores: data.dadosProfissionais,
      dadosPropostos: data.dadosProfissionaisPropostos,
      decisao,
      motivo: motivo.trim(),
      ...(data.dataAlteracaoCadastral ? { solicitadoEm: data.dataAlteracaoCadastral } : {}),
      revisadoEm: Timestamp.now(),
      revisadoPorUid: adminUid,
    };
    const comum = {
      historicoRevisoes: [...historico, registro],
      alteracaoCadastralPendente: false,
      revisadoPorUid: adminUid,
      resultadoRevisaoCadastral: decisao,
      dataRevisaoCadastral: serverTimestamp(),
    };
    if (decisao === "Aprovada") {
      tx.update(ref, {
        ...comum,
        statusAcesso: "Liberado",
        dadosProfissionais: data.dadosProfissionaisPropostos,
        dadosProfissionaisAnteriores: data.dadosProfissionais,
        dataAprovacao: serverTimestamp(),
      });
    } else {
      tx.update(ref, {
        ...comum,
        statusAcesso: "Recusado",
        motivoRecusa: motivo.trim(),
        justificativaRecusaAlteracao: motivo.trim(),
        dataRecusa: serverTimestamp(),
      });
    }
  });
}
