export type ValorSinalVital = string | number | null | undefined;

export interface SinalVitalParaApresentacao {
  sinalVitalNome: string;
  unidadeMedida?: string | null;
}

export interface SinalVitalApresentado {
  nome: string;
  valor: string;
}

interface FamiliaPressaoArterial {
  medida: 'sistolica' | 'diastolica';
  chave: string;
  contexto: string;
}

const normalizarTexto = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const unidadesConhecidas: Record<string, string> = {
  bpm: 'bpm',
  'mg/dl': 'mg/dL',
  mmhg: 'mmHg',
  '%': '%',
  '°c': '°C',
  'ºc': '°C',
  s: 's',
  segundo: 's',
  segundos: 's',
  seg: 's',
  'seg.': 's',
};

function unidadeApresentavel(unidade?: string | null): string {
  const original = unidade?.trim();
  if (!original) return '';

  const chave = normalizarTexto(original).replace(/\s+/g, '');
  return unidadesConhecidas[chave] ?? original;
}

function formatarDecimalBrasileiro(texto: string): string {
  const numero = texto.match(/^([+-]?\d+)([.,])(\d+)$/);
  if (!numero) return texto;

  const [, parteInteira, separador, fracao] = numero;
  // Um ponto seguido por três dígitos também pode ser separador de milhar.
  if (separador === '.' && fracao.length === 3) return texto;
  return `${parteInteira},${fracao}`;
}

function normalizarUnidadesNoValor(texto: string): string {
  return texto
    .replace(/mg\s*\/\s*d[lL]\b/gi, 'mg/dL')
    .replace(/mm\s*hg\b/gi, 'mmHg')
    .replace(/[º°]\s*c\b/gi, '°C')
    .replace(/\bsegundos?\b|\bseg\.?\b/gi, 's')
    .replace(/\bbpm\b/gi, 'bpm');
}

function formatarValorBase(valor: ValorSinalVital): string | null {
  if (valor === null || valor === undefined) return null;

  const texto = String(valor).trim();
  if (!texto) return null;

  const numeroComUnidadeColada = texto.match(
    /^([+-]?\d+(?:[.,]\d+)?)(?=(?:bpm|mg\s*\/\s*dl|mm\s*hg|%|[º°]\s*c|segundos?|seg\.?|s)$)/i,
  );
  if (numeroComUnidadeColada) {
    const numero = formatarDecimalBrasileiro(numeroComUnidadeColada[1]);
    const unidade = normalizarUnidadesNoValor(texto.slice(numeroComUnidadeColada[1].length)).trim();
    return `${numero}${unidade === '%' ? '' : ' '}${unidade}`;
  }

  const numeroComSufixo = texto.match(/^([+-]?\d+(?:[.,]\d+)?)(\s+.*)?$/);
  if (numeroComSufixo) {
    const numero = formatarDecimalBrasileiro(numeroComSufixo[1]);
    return normalizarUnidadesNoValor(`${numero}${numeroComSufixo[2] ?? ''}`);
  }

  return normalizarUnidadesNoValor(texto);
}

function unidadeEstaNoTexto(texto: string, unidade: string): boolean {
  if (!unidade) return false;
  const canonica = unidadeApresentavel(unidade);
  const normalizado = normalizarTexto(texto);

  const detectores: Record<string, RegExp> = {
    bpm: /\bbpm\b/i,
    'mg/dL': /mg\s*\/\s*dl\b/i,
    mmHg: /mm\s*hg\b/i,
    '%': /%/,
    '°C': /[º°]\s*c\b/i,
    s: /(?:^|[^a-z])(?:s|seg\.?|segundo[s]?)(?=$|[^a-z])/i,
  };

  const detector = detectores[canonica];
  if (detector) return detector.test(texto);

  const unidadeNormalizada = normalizarTexto(canonica);
  if (normalizado.includes(unidadeNormalizada) && unidadeNormalizada.length > 2) {
    return true;
  }

  const escapada = canonica.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[\\s(])${escapada}(?=$|[\\s)])`, 'i').test(texto);
}

function formatarValorComUnidade(
  valor: ValorSinalVital,
  nome: string,
  unidade?: string | null,
): string | null {
  const valorFormatado = formatarValorBase(valor);
  if (valorFormatado === null) return null;

  const unidadeFormatada = unidadeApresentavel(unidade);
  if (
    !unidadeFormatada ||
    unidadeEstaNoTexto(nome, unidadeFormatada) ||
    unidadeEstaNoTexto(valorFormatado, unidadeFormatada)
  ) {
    return valorFormatado;
  }

  return `${valorFormatado}${unidadeFormatada === '%' ? '' : ' '}${unidadeFormatada}`;
}

/**
 * Identifica somente PAS/PAD explícitas. Medidas médias, diferenciais,
 * posturais e outras derivadas permanecem como parâmetros independentes.
 */
export function familiaPressaoArterial(nome: string): FamiliaPressaoArterial | null {
  const normalizado = normalizarTexto(nome);
  if (/\b(media|pam|diferencial|pulso|postural|ortostatica|ortostatismo|convergencia|convergente)\b/.test(normalizado)) {
    return null;
  }

  const temSistolica = /\bsistolica\b/.test(normalizado);
  const temDiastolica = /\bdiastolica\b/.test(normalizado);
  const temPAS = /\bpas\b/.test(normalizado);
  const temPAD = /\bpad\b/.test(normalizado);
  const sistolica = temSistolica || temPAS;
  const diastolica = temDiastolica || temPAD;

  if (sistolica === diastolica) return null;

  const contextoNormalizado = normalizado
    .replace(/\bpressao\s+arterial\b/g, ' ')
    .replace(/\bpressao\b/g, ' ')
    .replace(/\bpa\b/g, ' ')
    .replace(/\b(?:sistolica|diastolica|pas|pad|mmhg)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const contexto = nome
    .replace(/press[aã]o\s+arterial/gi, ' ')
    .replace(/press[aã]o/gi, ' ')
    .replace(/\b(?:sist[oó]lica|diast[oó]lica|PAS|PAD|mmHg)\b/gi, ' ')
    .replace(/[()[\]]/g, ' ')
    .replace(/[—–:-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    medida: sistolica ? 'sistolica' : 'diastolica',
    chave: contextoNormalizado,
    contexto,
  };
}

function valorNumericoParaPA(valor: ValorSinalVital, unidade: string): string | null {
  const texto = formatarValorBase(valor);
  if (!texto) return null;

  const semUnidade = texto.replace(/\s*mm\s*hg\s*$/i, '').trim();
  if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(semUnidade)) return null;
  return formatarDecimalBrasileiro(semUnidade);
}

/** Formata os sinais vitais sem alterar os dados originais do processo. */
export function formatarSinaisVitais(
  exameFisico: Record<string, ValorSinalVital>,
  catalogo: SinalVitalParaApresentacao[],
): SinalVitalApresentado[] {
  const preenchidos = catalogo.flatMap((sinal, indice) => {
    const valor = exameFisico[sinal.sinalVitalNome];
    const formatado = formatarValorComUnidade(valor, sinal.sinalVitalNome, sinal.unidadeMedida);
    if (formatado === null) return [];

    return [{ sinal, indice, valor, formatado, familia: familiaPressaoArterial(sinal.sinalVitalNome) }];
  });

  const gruposPA = new Map<string, { sistolicas: typeof preenchidos; diastolicas: typeof preenchidos }>();
  preenchidos.forEach((item) => {
    if (!item.familia || unidadeApresentavel(item.sinal.unidadeMedida) !== 'mmHg') return;
    const grupo = gruposPA.get(item.familia.chave) ?? { sistolicas: [], diastolicas: [] };
    grupo[item.familia.medida === 'sistolica' ? 'sistolicas' : 'diastolicas'].push(item);
    gruposPA.set(item.familia.chave, grupo);
  });

  const pares = new Map<number, SinalVitalApresentado>();
  const pareados = new Set<number>();
  gruposPA.forEach(({ sistolicas, diastolicas }) => {
    if (sistolicas.length !== 1 || diastolicas.length !== 1) return;
    const sistolica = sistolicas[0];
    const diastolica = diastolicas[0];
    const valorSistolico = valorNumericoParaPA(sistolica.valor, sistolica.sinal.unidadeMedida ?? '');
    const valorDiastolico = valorNumericoParaPA(diastolica.valor, diastolica.sinal.unidadeMedida ?? '');
    if (valorSistolico === null || valorDiastolico === null) return;

    const primeiro = sistolica.indice < diastolica.indice ? sistolica : diastolica;
    const contexto = sistolica.familia?.contexto || diastolica.familia?.contexto;
    const nome = `Pressão Arterial (PA)${contexto ? ` — ${contexto}` : ''}`;
    pares.set(primeiro.indice, { nome, valor: `${valorSistolico}/${valorDiastolico} mmHg` });
    pareados.add(primeiro.indice);
    pareados.add(primeiro === sistolica ? diastolica.indice : sistolica.indice);
  });

  return preenchidos.flatMap((item) => {
    if (pareados.has(item.indice)) {
      const par = pares.get(item.indice);
      return par ? [par] : [];
    }
    return [{
      nome: item.sinal.sinalVitalNome,
      valor: item.formatado,
    }];
  });
}

export function valorSinalVitalPreenchido(valor: ValorSinalVital): boolean {
  return valor !== null && valor !== undefined && String(valor).trim() !== '';
}
