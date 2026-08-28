const removerAcentos = (valor: string) =>
  valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const normalizarChaveTexto = (valor?: string | null) =>
  removerAcentos(valor ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");

const cidadesConhecidas: Record<string, string> = {
  biguacu: "Biguaçu",
  florianopolis: "Florianópolis",
  fpolis: "Florianópolis",
  joinville: "Joinville",
  palhoca: "Palhoça",
  "rio de janeiro": "Rio de Janeiro",
  "s jose": "São José",
  "sao jose": "São José",
  sj: "São José",
  "santo amaro da imperatriz": "Santo Amaro da Imperatriz",
  "sao pedro de alcantara": "São Pedro de Alcântara",
};

const palavrasMinusculas = new Set(["da", "das", "de", "do", "dos", "e"]);

const aplicarTitulo = (valor: string) =>
  valor
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .map((palavra, indice) =>
      indice > 0 && palavrasMinusculas.has(palavra)
        ? palavra
        : palavra.charAt(0).toLocaleUpperCase("pt-BR") + palavra.slice(1),
    )
    .join(" ");

export const normalizarCidade = (valor?: string | null) => {
  const cidade = (valor ?? "").trim().replace(/\s+/g, " ");
  if (!cidade) return "";
  return (
    cidadesConhecidas[normalizarChaveTexto(cidade)] ?? aplicarTitulo(cidade)
  );
};

export const normalizarNomeCompleto = (valor?: string | null) =>
  (valor ?? "").trim().replace(/\s+/g, " ").toLocaleUpperCase("pt-BR");

export const obterCidadesUnicas = (cidades: Array<string | null | undefined>) =>
  [...new Set(cidades.map(normalizarCidade).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
