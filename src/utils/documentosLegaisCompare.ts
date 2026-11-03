import type { ConteudoDocumentoLegal } from "@/services/bancodados/documentosLegaisDB";

/** Comparação sem dependência da ordem de serialização dos mapas Firestore. */
export function conteudosLegaisIguais(a: ConteudoDocumentoLegal | null, b: ConteudoDocumentoLegal | null): boolean {
  if (!a || !b) return a === b;
  return a.introducao === b.introducao
    && a.secoes.length === b.secoes.length
    && a.secoes.every((secao, i) =>
      secao.titulo === b.secoes[i].titulo && secao.corpo === b.secoes[i].corpo
    );
}

