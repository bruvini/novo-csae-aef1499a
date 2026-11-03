import {
  collection, doc, getDoc, getDocs, onSnapshot, runTransaction, serverTimestamp,
  type Timestamp, type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import { LEGAL_DOCUMENTS, type LegalDocumentKind } from "@/lib/legalDocuments";

export interface ConteudoDocumentoLegal {
  introducao: string;
  secoes: Array<{ titulo: string; corpo: string }>;
}

export interface RevisaoDocumentoLegal {
  id: string;
  tipo: LegalDocumentKind;
  versao: number;
  revisao: number;
  situacao: "rascunho" | "publicada";
  operacao: "criada" | "editada" | "publicada";
  anteriorId: string;
  conteudo: ConteudoDocumentoLegal;
  autorUid: string;
  criadoEm: Timestamp;
  publicadoEm?: Timestamp;
}

export interface EstadoDocumentoLegal {
  publicadaId: string;
  rascunhoId: string;
  sequencia: number;
  ultimaAcao: RevisaoDocumentoLegal["operacao"];
  atualizadoPor: string;
  atualizadoEm: Timestamp;
}

const raiz = (tipo: LegalDocumentKind) => doc(db, "documentosLegais", tipo);
const revisaoRef = (tipo: LegalDocumentKind, id: string) => doc(db, "documentosLegais", tipo, "revisoes", id);

export function conteudoInicial(tipo: LegalDocumentKind): ConteudoDocumentoLegal {
  const minuta = LEGAL_DOCUMENTS[tipo];
  return {
    introducao: minuta.introduction,
    secoes: minuta.sections.map((s) => ({ titulo: s.title, corpo: s.paragraphs.join("\n\n") })),
  };
}

export function validarConteudoLegal(conteudo: ConteudoDocumentoLegal): string[] {
  const erros: string[] = [];
  if (!conteudo.introducao.trim() || conteudo.introducao.length > 20000) erros.push("A introdução é obrigatória e limitada a 20 mil caracteres.");
  if (!conteudo.secoes.length || conteudo.secoes.length > 25) erros.push("Informe entre 1 e 25 seções.");
  for (const [index, secao] of conteudo.secoes.entries()) {
    if (!secao.titulo.trim() || secao.titulo.length > 180) erros.push(`A seção ${index + 1} precisa de título válido.`);
    if (!secao.corpo.trim() || secao.corpo.length > 20000) erros.push(`A seção ${index + 1} precisa de conteúdo (até 20 mil caracteres).`);
  }
  return erros;
}

const PENDENCIAS = [
  /pendente(?:s)? de (?:validação|confirmação|definição)/i,
  /a ser confirmado/i, /ainda precisam ser definid/i,
  /precisam ser confirmad/i, /precisa ser confirmado/i,
  /deverá constar expressamente/i, /minuta para/i,
];
export function pendenciasParaPublicacao(conteudo: ConteudoDocumentoLegal): string[] {
  const itens = [conteudo.introducao, ...conteudo.secoes.map((s) => s.corpo)];
  return itens.flatMap((texto, indice) =>
    PENDENCIAS.some((regex) => regex.test(texto))
      ? [indice === 0 ? "Introdução" : `Seção ${indice}`]
      : [],
  );
}

const revision = (tipo: LegalDocumentKind, id: string, data: Record<string, unknown>): RevisaoDocumentoLegal =>
  ({ id, ...data, tipo } as unknown as RevisaoDocumentoLegal);

export function observarPublicacao(
  tipo: LegalDocumentKind,
  aoCarregar: (versao: RevisaoDocumentoLegal | null, erro?: Error) => void,
): Unsubscribe {
  let active = true;
  let solicitacao = 0;
  return (() => {
    const unsubscribe = onSnapshot(raiz(tipo), async (snapshot) => {
      const current = ++solicitacao;
      const publishedId = snapshot.data()?.publicadaId as string | undefined;
      if (!publishedId) {
        aoCarregar(null);
        return;
      }
      try {
        const item = await getDoc(revisaoRef(tipo, publishedId));
        if (active && current === solicitacao) aoCarregar(item.exists() ? revision(tipo, item.id, item.data()) : null);
      } catch (error) {
        if (active && current === solicitacao) aoCarregar(null, error as Error);
      }
    }, (error) => { if (active) aoCarregar(null, error); });
    return () => { active = false; unsubscribe(); };
  })();
}

export async function listarVersoesLegais(tipo: LegalDocumentKind) {
  const [estadoSnap, versoesSnap] = await Promise.all([
    getDoc(raiz(tipo)),
    getDocs(collection(db, "documentosLegais", tipo, "revisoes")),
  ]);
  const estado = estadoSnap.exists() ? estadoSnap.data() as EstadoDocumentoLegal : null;
  const versoes = versoesSnap.docs.map((s) => revision(tipo, s.id, s.data()))
    .sort((a, b) => b.versao - a.versao || b.revisao - a.revisao);
  return { estado, versoes };
}

export async function criarVersaoLegal(tipo: LegalDocumentKind, autorUid: string) {
  const estadoRef = raiz(tipo);
  await runTransaction(db, async (tx) => {
    const old = await tx.get(estadoRef);
    const estado = old.exists() ? old.data() as EstadoDocumentoLegal : null;
    if (estado?.rascunhoId) throw new Error("Já existe um rascunho. Conclua a edição antes de criar outra versão.");
    let conteudo = conteudoInicial(tipo);
    if (estado?.publicadaId) {
      const atual = await tx.get(revisaoRef(tipo, estado.publicadaId));
      if (!atual.exists()) throw new Error("A versão publicada não foi encontrada.");
      conteudo = atual.data().conteudo as ConteudoDocumentoLegal;
    }
    const numero = (estado?.sequencia ?? 0) + 1;
    const id = `v${numero}-r0`;
    tx.set(revisaoRef(tipo, id), {
      tipo, versao: numero, revisao: 0, situacao: "rascunho",
      operacao: "criada", anteriorId: estado?.publicadaId ?? "",
      conteudo, autorUid, criadoEm: serverTimestamp(),
    });
    tx.set(estadoRef, {
      publicadaId: estado?.publicadaId ?? "", rascunhoId: id,
      sequencia: numero, ultimaAcao: "criada", atualizadoPor: autorUid, atualizadoEm: serverTimestamp(),
    });
  });
}

export async function salvarRevisaoLegal(tipo: LegalDocumentKind, autorUid: string, conteudo: ConteudoDocumentoLegal, esperadoId: string) {
  const errors = validarConteudoLegal(conteudo);
  if (errors.length) throw new Error(errors.join(" "));
  await runTransaction(db, async (tx) => {
    const stateRef = raiz(tipo);
    const estadoSnap = await tx.get(stateRef);
    if (!estadoSnap.exists()) throw new Error("Documento não inicializado.");
    const estado = estadoSnap.data() as EstadoDocumentoLegal;
    if (!estado.rascunhoId || estado.rascunhoId !== esperadoId) throw new Error("Rascunho atualizado por outra pessoa. Recarregue a versão.");
    const anterior = await tx.get(revisaoRef(tipo, estado.rascunhoId));
    if (!anterior.exists() || anterior.data().situacao !== "rascunho") throw new Error("Rascunho indisponível.");
    const atual = anterior.data() as RevisaoDocumentoLegal;
    const rev = atual.revisao + 1;
    const id = `v${estado.sequencia}-r${rev}`;
    tx.set(revisaoRef(tipo, id), {
      tipo, versao: estado.sequencia, revisao: rev, situacao: "rascunho",
      operacao: "editada", anteriorId: estado.rascunhoId,
      conteudo, autorUid, criadoEm: serverTimestamp(),
    });
    tx.update(stateRef, { rascunhoId: id, ultimaAcao: "editada", atualizadoPor: autorUid, atualizadoEm: serverTimestamp() });
  });
}

export async function publicarVersaoLegal(tipo: LegalDocumentKind, autorUid: string, esperadoId: string) {
  await runTransaction(db, async (tx) => {
    const stateRef = raiz(tipo);
    const estadoSnap = await tx.get(stateRef);
    if (!estadoSnap.exists()) throw new Error("Documento não inicializado.");
    const estado = estadoSnap.data() as EstadoDocumentoLegal;
    if (!estado.rascunhoId || estado.rascunhoId !== esperadoId) throw new Error("O rascunho mudou. Recarregue antes de publicar.");
    const atualSnap = await tx.get(revisaoRef(tipo, estado.rascunhoId));
    if (!atualSnap.exists() || atualSnap.data().situacao !== "rascunho") throw new Error("Rascunho indisponível.");
    const rascunho = atualSnap.data() as RevisaoDocumentoLegal;
    const erros = [...validarConteudoLegal(rascunho.conteudo), ...pendenciasParaPublicacao(rascunho.conteudo).map((p) => `Pendência em: ${p}`)];
    if (erros.length) throw new Error(erros.join(" "));
    const id = `v${rascunho.versao}-r${rascunho.revisao + 1}`;
    tx.set(revisaoRef(tipo, id), {
      tipo, versao: rascunho.versao, revisao: rascunho.revisao + 1,
      situacao: "publicada", operacao: "publicada", anteriorId: estado.rascunhoId,
      conteudo: rascunho.conteudo, autorUid, criadoEm: serverTimestamp(), publicadoEm: serverTimestamp(),
    });
    tx.update(stateRef, { publicadaId: id, rascunhoId: "", ultimaAcao: "publicada", atualizadoPor: autorUid, atualizadoEm: serverTimestamp() });
  });
}
