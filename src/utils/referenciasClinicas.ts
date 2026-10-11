import { differenceInCalendarDays, differenceInMonths, differenceInYears } from 'date-fns';

export type InterpretacaoClinica = 'normal' | 'alterado' | 'indeterminado';
export const CONTEXTOS_CLINICOS = [
  { id: 'geral', titulo: 'Avaliação geral' },
  { id: 'gestante', titulo: 'Gestação' },
  { id: 'gestante_jejum', titulo: 'Gestação — jejum' },
  { id: 'gestante_pos_1h', titulo: 'Gestação — 1h após refeição' },
  { id: 'gestante_pos_2h', titulo: 'Gestação — 2h após refeição' },
  { id: 'diabetes_jejum', titulo: 'Diabetes — jejum' },
  { id: 'diabetes_pos_2h', titulo: 'Diabetes — 2h após refeição' },
  { id: 'jejum', titulo: 'Jejum' },
  { id: 'pos_1h', titulo: '1h após refeição' },
  { id: 'pos_2h', titulo: '2h após refeição' },
  { id: 'aleatoria', titulo: 'Aferição aleatória' },
  { id: 'dengue', titulo: 'Investigação de dengue' },
  { id: 'atleta', titulo: 'Atleta em repouso' },
] as const;

export interface RegraReferenciaClinica {
  idadeMinima?: number | null;
  idadeMaxima?: number | null;
  idadeUnidade?: 'dias' | 'meses' | 'anos' | 'not-specified' | '';
  criterioSexo?: string | null;
  criterioCondicao?: string | null;
  contextoClinico?: string | null;
  interpretacaoClinica?: InterpretacaoClinica | null;
  valorMinimo?: number | null;
  valorMaximo?: number | null;
  nomeAlteracao?: string | null;
  subconjuntoNHBVinculado?: string | null;
}
export interface ClassificacaoReferencia {
  status: 'normal' | 'alterado' | 'neutro';
  nomeAlteracao?: string;
  nhb?: string;
  motivo?: string;
}
export interface PerfilReferencia {
  dataNascimento: Date;
  sexo: string;
  dataAvaliacao?: Date;
}

export function normalizarNomeClinico(nome: string): string {
  return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Chaves apenas para prevenir novos aliases; não renomeiam dados clínicos já salvos. */
export function identidadeParametroVital(nome: string): string {
  const n = normalizarNomeClinico(nome);
  const familia = familiaPressaoArterial(nome);
  if (familia) return 'pressao-arterial-' + familia;
  if (/\bpressao arterial\b/.test(n) || n === 'pa') return 'pressao-arterial-composta';
  if (/^frequencia cardiaca\b/.test(n) || n === 'fc') return 'frequencia-cardiaca';
  if (/^frequencia respiratoria\b/.test(n) || n === 'fr') return 'frequencia-respiratoria';
  if (/^saturacao de oxigenio\b/.test(n) || n === 'spo2') return 'saturacao-oxigenio';
  if (/^temperatura corporal\b/.test(n)) return 'temperatura-corporal';
  if (/^glicemia capilar\b/.test(n) || n === 'hgt') return 'glicemia-capilar';
  return n;
}

export function familiaPressaoArterial(nome: string): 'pas' | 'pad' | null {
  const n = normalizarNomeClinico(nome);
  if (/\b(queda|diferencial|convergencia|postural|media|pam)\b/.test(n)) return null;
  if (/\b(sistolica|pas)\b/.test(n) && /\b(pressao|pa|pas)\b/.test(n)) return 'pas';
  if (/\b(diastolica|pad)\b/.test(n) && /\b(pressao|pa|pad)\b/.test(n)) return 'pad';
  return null;
}

export function idadeCompativel(ref: RegraReferenciaClinica, nascimento: Date, avaliacao: Date = new Date()): boolean {
  if (Number.isNaN(nascimento.getTime()) || Number.isNaN(avaliacao.getTime())) return false;
  const idade = ref.idadeUnidade === 'dias' ? differenceInCalendarDays(avaliacao, nascimento)
    : ref.idadeUnidade === 'meses' ? differenceInMonths(avaliacao, nascimento)
    : differenceInYears(avaliacao, nascimento);
  if (idade < 0) return false;
  return (ref.idadeMinima == null || idade >= ref.idadeMinima)
    && (ref.idadeMaxima == null || idade <= ref.idadeMaxima);
}

export function sexoCompativel(ref: RegraReferenciaClinica, sexo: string): boolean {
  return !ref.criterioSexo || ref.criterioSexo === 'Ambos'
    || normalizarNomeClinico(ref.criterioSexo) === normalizarNomeClinico(sexo);
}

/** Apenas detecta alguns contextos legados explícitos; nunca infere gestação do sexo. */
export function contextoDaReferencia(ref: RegraReferenciaClinica): string {
  if (ref.contextoClinico?.trim()) return ref.contextoClinico;
  const text = normalizarNomeClinico(ref.criterioCondicao || '');
  if (/gestant|gravidez|dmg/.test(text)) {
    if (/jejum/.test(text)) return 'gestante_jejum';
    if (/\b1h\b|1 hora/.test(text)) return 'gestante_pos_1h';
    if (/\b2h\b|2 horas/.test(text)) return 'gestante_pos_2h';
    return 'gestante';
  }
  if (/\bdengue\b/.test(text)) return 'dengue';
  if (/\batleta\b/.test(text)) return 'atleta';
  if (/diabetes|\bdm\b/.test(text)) {
    if (/jejum/.test(text)) return 'diabetes_jejum';
    if (/\b2h\b|2 horas/.test(text)) return 'diabetes_pos_2h';
  }
  if (/jejum/.test(text)) return 'jejum';
  if (/\b1h\b|1 hora/.test(text)) return 'pos_1h';
  if (/\b2h\b|2 horas/.test(text)) return 'pos_2h';
  if (/aleator/.test(text)) return 'aleatoria';
  return 'geral';
}

export function contextosDoParametro(refs: readonly RegraReferenciaClinica[]): string[] {
  return [...new Set(refs.map(contextoDaReferencia))].filter(Boolean);
}

export function interpretarRegra(ref: RegraReferenciaClinica): InterpretacaoClinica {
  if (ref.interpretacaoClinica) return ref.interpretacaoClinica;
  const nome = normalizarNomeClinico(ref.nomeAlteracao || '');
  if (/(^| )(normal|normalidade|negativo|negativa|nao reagente|adequado|adequada|desejavel|dentro da meta|ausente|preservado)( |$)/.test(nome) || /^normo/.test(nome)) return 'normal';
  if (!nome && !ref.subconjuntoNHBVinculado?.trim()) return 'indeterminado';
  if (ref.subconjuntoNHBVinculado?.trim() || nome) return 'alterado';
  return 'indeterminado';
}

function noIntervalo(ref: RegraReferenciaClinica, value: number): boolean {
  if (ref.valorMinimo == null && ref.valorMaximo == null) return false;
  return (ref.valorMinimo == null || value >= ref.valorMinimo)
    && (ref.valorMaximo == null || value <= ref.valorMaximo);
}

export function classificarReferenciaNumerica(
  valor: string | number,
  referencias: readonly RegraReferenciaClinica[],
  pessoa: PerfilReferencia,
  contexto?: string,
): ClassificacaoReferencia {
  if (valor === '' || valor === undefined || valor === null) return { status: 'neutro' };
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) return { status: 'neutro', motivo: 'Valor inválido.' };
  const candidatas = referencias.filter(r =>
    idadeCompativel(r, pessoa.dataNascimento, pessoa.dataAvaliacao)
    && sexoCompativel(r, pessoa.sexo) && noIntervalo(r, numero));
  if (!candidatas.length) return { status: 'neutro', motivo: 'Nenhuma referência aprovada corresponde a este valor, idade e sexo.' };
  const contextos = [...new Set(candidatas.map(contextoDaReferencia))];
  if (!contexto && contextos.some(c => c !== 'geral')) {
    return { status: 'neutro', motivo: 'Informe o contexto clínico para interpretar este resultado.' };
  }
  let selecionadas = candidatas.filter(r => contextoDaReferencia(r) === (contexto || 'geral'));
  if (!selecionadas.length && contexto && contexto !== 'geral') {
    if (!referencias.some(r => contextoDaReferencia(r) === contexto)) {
      selecionadas = candidatas.filter(r => contextoDaReferencia(r) === 'geral');
    }
  }
  if (!selecionadas.length) return { status: 'neutro', motivo: 'Não há referência para o contexto informado.' };
  const resultados = selecionadas.map(r => ({
    regra: r, interpretacao: interpretarRegra(r),
    nome: normalizarNomeClinico(r.nomeAlteracao || ''),
    nhb: normalizarNomeClinico(r.subconjuntoNHBVinculado || ''),
  }));
  const assinaturas = new Set(resultados.map(r =>
    r.interpretacao === 'normal' ? 'normal' : [r.interpretacao, r.nome, r.nhb].join('|')));
  if (assinaturas.size > 1) {
    return { status: 'neutro', motivo: 'Referências sobrepostas com interpretações diferentes. Solicite revisão à Gestão de Conteúdos.' };
  }
  const escolhido = resultados[0];
  if (escolhido.interpretacao === 'indeterminado') {
    return { status: 'neutro', motivo: 'Interpretação não definida na Gestão de Conteúdos.' };
  }
  if (escolhido.interpretacao === 'normal') return { status: 'normal' };
  return { status: 'alterado', nomeAlteracao: escolhido.regra.nomeAlteracao || 'Alteração',
    nhb: escolhido.regra.subconjuntoNHBVinculado || undefined };
}

export function classificarReferenciaQualitativa(
  resultado: string, referencias: readonly (RegraReferenciaClinica & { resultadoClassificatorio?: string })[],
): ClassificacaoReferencia {
  const correspondentes = referencias.filter(r => r.resultadoClassificatorio === resultado);
  if (!correspondentes.length) return { status: 'neutro' };
  const assinaturas = new Set(correspondentes.map(r =>
    [interpretarRegra(r), normalizarNomeClinico(r.subconjuntoNHBVinculado || '')].join('|')));
  if (assinaturas.size !== 1) return { status: 'neutro', motivo: 'Resultados duplicados com interpretações divergentes.' };
  const r = correspondentes[0], status = interpretarRegra(r);
  return status === 'normal' ? { status: 'normal' }
    : status === 'alterado' ? { status: 'alterado', nomeAlteracao: r.nomeAlteracao || 'Alteração', nhb: r.subconjuntoNHBVinculado || undefined }
    : { status: 'neutro', motivo: 'Interpretação não definida.' };
}
