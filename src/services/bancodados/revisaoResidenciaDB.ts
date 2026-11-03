import { doc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import type { Usuario, RevisaoResidenciaHistorico } from "@/types/usuario";
import { lotacoesSMS } from "@/lib/constants";
import {
  dataCivilSaoPaulo, marcoDoisAnosResidencia,
  somarDiasCivis, verificarPrazoResidencia,
} from "@/utils/revisaoCadastral";

export const MOTIVO_REVOGACAO_RESIDENCIA =
  "Fim da residência e não inclusão no quadro de profissionais da rede.";

export type DecisaoResidencia =
  | { acao: "Converter"; atuaSMS: boolean; lotacao: string; matricula: string }
  | { acao: "Revogar" }
  | { acao: "Prorrogar"; dias: number; observacao?: string };

export function validarDecisaoResidencia(decisao: DecisaoResidencia): string[] {
  if (decisao.acao === "Converter") {
    if (!decisao.atuaSMS) return [];
    const erros: string[] = [];
    if (!lotacoesSMS.includes(decisao.lotacao)) erros.push("Selecione uma unidade cadastrada na lista oficial.");
    if (!decisao.matricula.trim() || decisao.matricula.trim().length > 40) erros.push("Informe matrícula válida (até 40 caracteres).");
    return erros;
  }
  if (decisao.acao === "Prorrogar") {
    if (!Number.isInteger(decisao.dias) || decisao.dias < 1 || decisao.dias > 730)
      return ["Informe uma prorrogação entre 1 e 730 dias."];
    if ((decisao.observacao ?? "").length > 600) return ["A observação deve ter até 600 caracteres."];
  }
  return [];
}

export async function decidirRevisaoResidencia(
  usuarioId: string,
  administradorUid: string,
  decisao: DecisaoResidencia,
): Promise<"Liberado" | "Revogado"> {
  if (!usuarioId || !administradorUid || usuarioId === administradorUid) {
    throw new Error("É necessário outro administrador para revisar este perfil.");
  }
  const erros = validarDecisaoResidencia(decisao);
  if (erros.length) throw new Error(erros.join(" "));

  return runTransaction(db, async (tx) => {
    const ref = doc(db, "usuarios", usuarioId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("O cadastro não foi encontrado.");
    const usuario = snap.data() as Usuario;
    if (usuario.uid !== usuarioId) throw new Error("O vínculo do cadastro precisa ser regularizado antes da revisão.");
    if (usuario.ehAdmin) throw new Error("Perfis administradores exigem revisão assistida.");
    if (!["Aprovado", "Liberado"].includes(usuario.statusAcesso)
      || usuario.alteracaoCadastralPendente === true
      || usuario.dadosProfissionais.formacao !== "Residente de Enfermagem") {
      throw new Error("Somente residentes ativos e aprovados podem ser revisados.");
    }
    const agora = new Date();
    const prazo = verificarPrazoResidencia(usuario, agora);
    if (!prazo?.vencido) throw new Error("O prazo de revisão ainda não foi atingido.");
    const inicio = usuario.dadosProfissionais.dataInicioResidencia ?? "";
    const marco = marcoDoisAnosResidencia(inicio);
    if (!marco) throw new Error("A data de início da residência é inválida.");

    const historico = usuario.historicoRevisoesResidencia ?? [];
    if (historico.length >= 60) throw new Error("Limite do histórico atingido. Solicite arquivamento com rastreabilidade.");
    const atual = dataCivilSaoPaulo(agora);
    const converte = decisao.acao === "Converter";
    const prorrogacao = decisao.acao === "Prorrogar";
    const vinculoSMS = converte ? decisao.atuaSMS : usuario.dadosProfissionais.atuaSMS;
    const liberado = prorrogacao || (converte && vinculoSMS);
    const status: "Liberado" | "Revogado" = liberado ? "Liberado" : "Revogado";
    const proximoPrazo = prorrogacao ? somarDiasCivis(atual, decisao.dias) : "";
    const motivo = prorrogacao
      ? (decisao.observacao?.trim() || "Residência prorrogada por " + decisao.dias + " dias a partir da data da decisão.")
      : converte && vinculoSMS
        ? "Conclusão da residência e confirmação do vínculo profissional na SMS."
        : converte
          ? "Conclusão da residência, sem vínculo ativo com a SMS. Formação atualizada; acesso revogado."
          : MOTIVO_REVOGACAO_RESIDENCIA;
    const registro: RevisaoResidenciaHistorico = {
      acao: prorrogacao ? "Prorrogado" : converte ? "Convertido" : "Revogado",
      revisorUid: administradorUid,
      decididoEm: Timestamp.now(),
      inicioResidencia: inicio,
      marcoDoisAnos: marco,
      statusResultante: status,
      motivo,
      proximoPrazo,
      diasProrrogados: prorrogacao ? decisao.dias : 0,
      vinculoSMS,
      lotacao: converte ? (decisao.atuaSMS ? decisao.lotacao : "") : (usuario.dadosProfissionais.lotacao ?? ""),
      matricula: converte ? (decisao.atuaSMS ? decisao.matricula.trim() : "") : (usuario.dadosProfissionais.matricula ?? ""),
    };

    const common = {
      historicoRevisoesResidencia: [...historico, registro],
      dataRevisaoResidencia: serverTimestamp(),
      revisadoResidenciaPorUid: administradorUid,
    };
    if (prorrogacao) {
      tx.update(ref, { ...common, revisaoResidenciaEm: proximoPrazo });
    } else if (converte) {
      const profissionais = {
        ...usuario.dadosProfissionais,
        formacao: "Enfermeiro",
        atuaSMS: decisao.atuaSMS,
        lotacao: decisao.atuaSMS ? decisao.lotacao : "",
        matricula: decisao.atuaSMS ? decisao.matricula.trim() : "",
      };
      // Não apagar dataInicioResidencia: integra a trilha histórica da formação.
      tx.update(ref, {
        ...common, dadosProfissionais: profissionais, statusAcesso: status,
        ...(liberado ? {} : {
          motivoRevogacao: motivo, dataRevogacao: serverTimestamp(), revogadoPorUid: administradorUid,
        }),
      });
    } else {
      tx.update(ref, {
        ...common, statusAcesso: "Revogado",
        motivoRevogacao: motivo, dataRevogacao: serverTimestamp(), revogadoPorUid: administradorUid,
      });
    }
    return status;
  });
}
