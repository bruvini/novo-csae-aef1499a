import type { IntervencaoAutoral } from '@/services/bancodados/intervencoesAutoraisDB';
import { agruparSugestoes } from './sugestoesIntervencoes';

export type PeriodoGovernanca = '30' | '90' | '365' | 'todos';
export interface FiltrosGovernanca {
  periodo: PeriodoGovernanca;
  status: string;
  diagnostico: string;
  resultado: string;
  tipo: string;
  categoria: string;
  dimensao?: 'atomicidadeStatus' | 'especificidadeNivel' | 'pertinenciaClinica' | 'exequibilidadeNivel' | 'reavaliabilidadeNivel' | '';
  classificacao?: string;
}
const data = (value?: { toDate?: () => Date }) => value?.toDate?.();
const percentual = (parte: number, total: number) => total ? Math.round(parte / total * 1000) / 10 : null;
const mediana = (valores: number[]) => {
  if (!valores.length) return null;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return Math.round(((ordenados[meio] + ordenados[(ordenados.length - 1) / 2]) / 2) * 10) / 10;
};
const dia = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(value);
export const mesSaoPaulo = (value: Date) => dia(value).slice(0, 7);
export const semanaSaoPaulo = (value: Date) => {
  const [ano, mes, numero] = dia(value).split('-').map(Number);
  const utc = new Date(Date.UTC(ano, mes - 1, numero));
  const diaSemana = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - diaSemana);
  return utc.toISOString().slice(0, 10);
};

export function filtrarGovernanca(items: IntervencaoAutoral[], filtros: FiltrosGovernanca, agora = new Date()) {
  const inicio = filtros.periodo === 'todos' ? 0 : agora.getTime() - Number(filtros.periodo) * 86_400_000;
  return items.filter(item => {
    const criada = data(item.dataCriacao);
    return (filtros.periodo === 'todos' || (!!criada && criada.getTime() >= inicio))
      && (filtros.status === 'todos' || (item.status || 'aguardando') === filtros.status)
      && (filtros.tipo === 'todos' || (item.derivacao ? 'derivada' : 'original') === filtros.tipo)
      && (filtros.categoria === 'todas' || item.categoriaRejeicao === filtros.categoria)
      && (!filtros.dimensao || !filtros.classificacao || item.avaliacaoQualidade?.[filtros.dimensao] === filtros.classificacao)
      && (!filtros.diagnostico || (item.tituloDiagnosticoOrigem || '').toLocaleLowerCase('pt-BR').includes(filtros.diagnostico.toLocaleLowerCase('pt-BR')))
      && (!filtros.resultado || (item.tituloResultadoOrigem || item.tituloResultadoVinculado || '').toLocaleLowerCase('pt-BR').includes(filtros.resultado.toLocaleLowerCase('pt-BR')));
  });
}

export function calcularGovernanca(items: IntervencaoAutoral[], granularidade: 'mensal' | 'semanal' = 'mensal', agora = new Date()) {
  const originais = items.filter(item => !item.derivacao);
  const derivadas = items.filter(item => !!item.derivacao);
  const analisadas = items.filter(item => item.status === 'aprovada' || item.status === 'rejeitada');
  const aprovadas = items.filter(item => item.status === 'aprovada');
  const rejeitadas = items.filter(item => item.status === 'rejeitada');
  const pendentes = items.filter(item => !item.divisao && (!item.status || item.status === 'aguardando'));
  const porId = new Map(items.map(item => [item.id, item]));
  const parciais = originais.filter(item => {
    const filhas = item.divisao?.derivadasIds.map(id => porId.get(id)) || [];
    return filhas.some(filha => filha?.status === 'aprovada') && filhas.some(filha => filha?.status !== 'aprovada');
  }).length;
  const originaisAnalisadas = originais.filter(item => {
    if (!item.divisao) return item.status === 'aprovada' || item.status === 'rejeitada';
    return item.divisao.derivadasIds.every(id => {
      const status = porId.get(id)?.status;
      return status === 'aprovada' || status === 'rejeitada';
    });
  }).length;
  const tempos = items.flatMap(item => {
    const criada = data(item.dataCriacao), decidida = data(item.divisao?.dataHora || item.dataDecisao);
    if (!item.divisao && item.status !== 'aprovada' && item.status !== 'rejeitada') return [];
    return criada && decidida && decidida >= criada ? [(decidida.getTime() - criada.getTime()) / 86_400_000] : [];
  });
  const esperas = pendentes.flatMap(item => {
    const criada = data(item.dataCriacao);
    return criada && agora >= criada ? [(agora.getTime() - criada.getTime()) / 86_400_000] : [];
  });
  const faixa = (n: number) => n <= 7 ? 'Até 7 dias' : n <= 15 ? '8 a 15 dias' : n <= 30 ? '16 a 30 dias' : 'Mais de 30 dias';
  const distribuicaoTempo = Object.fromEntries(['Até 7 dias', '8 a 15 dias', '16 a 30 dias', 'Mais de 30 dias'].map(chave => [chave, tempos.filter(valor => faixa(valor) === chave).length]));
  const periodo = granularidade === 'mensal' ? mesSaoPaulo : semanaSaoPaulo;
  const serie = new Map<string, { periodo: string; recebidas: number; aprovadas: number; rejeitadas: number }>();
  const adicionar = (item: IntervencaoAutoral, campo: 'recebidas' | 'aprovadas' | 'rejeitadas', quando?: Date) => {
    if (!quando) return;
    const chave = periodo(quando), ponto = serie.get(chave) || { periodo: chave, recebidas: 0, aprovadas: 0, rejeitadas: 0 };
    ponto[campo]++; serie.set(chave, ponto);
  };
  originais.forEach(item => adicionar(item, 'recebidas', data(item.dataCriacao)));
  aprovadas.forEach(item => adicionar(item, 'aprovadas', data(item.dataDecisao)));
  rejeitadas.forEach(item => adicionar(item, 'rejeitadas', data(item.dataDecisao)));
  const categorias = new Map<string, number>();
  rejeitadas.forEach(item => { const chave = item.categoriaRejeicao || 'Não informada'; categorias.set(chave, (categorias.get(chave) || 0) + 1); });
  let acumuladoRejeicoes = 0;
  const rejeicoes = [...categorias].sort((a, b) => b[1] - a[1]).map(([nome, valor]) => {
    acumuladoRejeicoes += valor;
    return { nome, valor, percentual: percentual(valor, rejeitadas.length), acumulado: percentual(acumuladoRejeicoes, rejeitadas.length) };
  });
  const avaliadas = items.filter(item => !!item.avaliacaoQualidade);
  const campos = ['atomicidadeStatus', 'especificidadeNivel', 'pertinenciaClinica', 'exequibilidadeNivel', 'reavaliabilidadeNivel'] as const;
  const qualidade = Object.fromEntries(campos.map(campo => {
    const contagens = new Map<string, number>();
    avaliadas.forEach(item => { const valor = item.avaliacaoQualidade?.[campo]; if (valor) contagens.set(valor, (contagens.get(valor) || 0) + 1); });
    return [campo, { total: [...contagens.values()].reduce((a, b) => a + b, 0), distribuicao: [...contagens].map(([nome, valor]) => ({ nome, valor })) }];
  })) as Record<typeof campos[number], { total: number; distribuicao: { nome: string; valor: number }[] }>;
  const pontos = { unica: 2, multiplas_relacionadas: 1, multiplas_independentes: 0, adequada: 2, parcial: 1, insuficiente: 0, pertinente: 2, condicionada: 1, incompativel: 0 } as Record<string, number>;
  const completas = avaliadas.flatMap(item => {
    const avaliacao = item.avaliacaoQualidade!;
    if (campos.some(campo => !avaliacao[campo] || !(avaliacao[campo]! in pontos))) return [];
    return [campos.reduce((soma, campo) => soma + pontos[avaliacao[campo]!], 0) * 10];
  });
  const alertas = new Map<string, number>();
  avaliadas.forEach(item => item.avaliacaoQualidade?.alertasSeguranca?.forEach(alerta => alertas.set(alerta, (alertas.get(alerta) || 0) + 1)));
  const matriz = new Map<string, { contexto: string; total: number; dimensoes: Record<string, { inadequadas: number; avaliadas: number }> }>();
  for (const item of avaliadas) {
    const contexto = [item.tituloDiagnosticoOrigem, item.tituloResultadoOrigem || item.tituloResultadoVinculado].filter(Boolean).join(' → ');
    if (!item.tituloDiagnosticoOrigem || !contexto) continue;
    const linha = matriz.get(contexto) || { contexto, total: 0, dimensoes: {} };
    linha.total++;
    for (const campo of campos) {
      const valor = item.avaliacaoQualidade?.[campo];
      if (!valor || valor === 'indeterminada') continue;
      const celula = linha.dimensoes[campo] || { inadequadas: 0, avaliadas: 0 };
      celula.avaliadas++;
      if (['multiplas_independentes', 'insuficiente', 'incompativel'].includes(valor)) celula.inadequadas++;
      linha.dimensoes[campo] = celula;
    }
    matriz.set(contexto, linha);
  }
  const grupos = agruparSugestoes(originais);
  const autores = new Map<string, number>();
  originais.forEach(item => autores.set(item.autorId, (autores.get(item.autorId) || 0) + 1));
  const distribuicaoAutores = Object.fromEntries(['1', '2 a 5', '6 a 10', '11 a 20', 'Mais de 20'].map(chave => [chave, [...autores.values()].filter(n => (chave === '1' ? n === 1 : chave === '2 a 5' ? n <= 5 && n >= 2 : chave === '6 a 10' ? n <= 10 && n >= 6 : chave === '11 a 20' ? n <= 20 && n >= 11 : n > 20)).length]));
  const revisoes = new Map<string, number>();
  avaliadas.forEach(item => { const chave = item.avaliacaoQualidade?.intensidadeRevisao; if (chave) revisoes.set(chave, (revisoes.get(chave) || 0) + 1); });
  return {
    originais: originais.length, derivadas: derivadas.length, desmembradas: originais.filter(item => !!item.divisao).length,
    pendentes: pendentes.length, aprovadas: aprovadas.length, rejeitadas: rejeitadas.length, parciais, originaisAnalisadas,
    analisadas: analisadas.length, serie: [...serie.values()].sort((a, b) => a.periodo.localeCompare(b.periodo)),
    tempo: { mediana: mediana(tempos), p90: tempos.length ? Math.round([...tempos].sort((a, b) => a - b)[Math.ceil(tempos.length * .9) - 1] * 10) / 10 : null, esperaMediana: mediana(esperas), amostra: tempos.length, faixas: distribuicaoTempo },
    rejeicoes, qualidade, avaliadas: avaliadas.length, completas: completas.length,
    iqfMedio: completas.length ? Math.round(completas.reduce((a, b) => a + b, 0) / completas.length * 10) / 10 : null,
    alertas: [...alertas].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor),
    grupos, duplicadas: new Set(grupos.flatMap(grupo => grupo.ocorrencias.map(item => item.id))).size,
    revisoes: [...revisoes].map(([nome, valor]) => ({ nome, valor })), distribuicaoAutores,
    matriz: [...matriz.values()].sort((a, b) => b.total - a.total),
    publicadas: aprovadas.filter(item => !!item.intervencaoBibliotecaId || !!item.preparacao?.referenciaDeliberacao).length,
  };
}
