export type SinalizacaoMultipla = { nivel: 'nenhuma' | 'possivel' | 'lista'; candidatas: string[] };

/** Sinalização textual, sem inferir qualidade ou adequação clínica. */
export function sinalizarIntervencoesMultiplas(texto: string): SinalizacaoMultipla {
  const linhas = texto.replace(/\r\n?/g, '\n').split('\n')
    .map(linha => linha.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(Boolean);
  const marcadas = texto.split(/\r?\n/).filter(linha => /^\s*(?:[-*•]|\d+[.)])\s+/.test(linha)).length;
  if (linhas.length >= 2 && marcadas >= 2) return { nivel: 'lista', candidatas: linhas };
  if (linhas.length >= 2) return { nivel: 'possivel', candidatas: linhas };
  const separadas = texto.split(/\s*;\s*/).map(parte => parte.trim()).filter(Boolean);
  if (separadas.length >= 3) return { nivel: 'possivel', candidatas: separadas };
  return { nivel: 'nenhuma', candidatas: [texto.trim()].filter(Boolean) };
}

export function revisarSeparacao(candidatas: string[]): string[] {
  const finais = candidatas.map(item => item.trim()).filter(Boolean);
  if (finais.length < 2) throw new Error('Informe ao menos duas intervenções individuais.');
  if (finais.some(item => item.length > 2000)) throw new Error('Intervenção excede o limite de 2.000 caracteres.');
  if (new Set(finais.map(item => item.toLocaleLowerCase('pt-BR'))).size !== finais.length) throw new Error('Intervenções repetidas.');
  return finais;
}
