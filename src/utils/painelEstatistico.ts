import { chaveDataSaoPaulo, diaSemanaSaoPaulo } from './accessMetrics';

export interface ItemRanking {
  name: string;
  value: number;
}

export type VariacaoTipo = 'percentual' | 'novo' | 'sem-base';

export interface ItemTemporal {
  name: string;
  value: number;
  acumulado?: number;
  /** Quantidade de processos concluídos entre os registros desse mesmo período. */
  concluidos?: number;
  acumuladoConcluidos?: number;
  variacaoPercentual?: number | null;
  variacaoTipo: VariacaoTipo;
}

export interface RaioXUsuario {
  totalPacientes: number;
  processosAtivos: number;
  processosConcluidos: number;
  tempoMedioHoras: number;
  topDiagnosticos: string[];
  topNHBs: string[];
  topIntervencoes: string[];
  executorMaisFrequente?: string;
}

export interface UsuarioRanking extends ItemRanking {
  id: string;
  lotacao: string;
  raioX: RaioXUsuario;
}

export interface RegistroProducao {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  lotacao: string;
  pacienteChave: string;
  pacienteSexo: string;
  pacienteFaixaEtaria?: string;
  status: 'em_andamento' | 'concluido';
  dataReferencia: string;
  dataInicioReferencia?: string;
  dataConclusaoReferencia?: string;
  duracaoHoras?: number;
  exameFisico: string[];
  nhbs: string[];
  diagnosticos: string[];
  subconjuntos: string[];
  resultados: string[];
  intervencoesPrescritas: string[];
  intervencoesAplicadas: string[];
  executores: string[];
  acoesEnfermeiro: string[];
}

export interface EstatisticasProducao {
  totalProcessos: number;
  totalProcessosConcluidos: number;
  totalProcessosEmAndamento: number;
  totalPacientesAtendidos: number;
  taxaConclusao: number;
  totalDiagnosticosUnicos: number;
  totalIntervencoesUnicas: number;
  totalNhbsUnicas: number;
  mediaDiagnosticosPorProcesso: number;
  tempoMedioProcessoHoras: number;
  diagnosticosTop: ItemRanking[];
  intervencoesTop: ItemRanking[];
  resultadosTop: ItemRanking[];
  nhbsTop: ItemRanking[];
  distribuicaoStatus: ItemRanking[];
  distribuicaoExecutores: ItemRanking[];
  perfilPacientes: { sexo: ItemRanking[]; faixasEtarias: ItemRanking[] };
  rankingUsuarios: UsuarioRanking[];
  rankingLotacoes: ItemRanking[];
  etapasPE: {
    avaliacao: { physical: ItemRanking[]; nhbs: ItemRanking[] };
    diagnostico: { top: ItemRanking[]; subset: ItemRanking[] };
    planejamento: { results: ItemRanking[]; prescribed: ItemRanking[] };
    implementacao: { applied: ItemRanking[]; executors: ItemRanking[] };
    evolucao: { nurseApplied: ItemRanking[] };
  };
  temporalAvancado: {
    hora: ItemTemporal[];
    diario: ItemTemporal[];
    diaSemana: ItemTemporal[];
    mensal: ItemTemporal[];
    anual: ItemTemporal[];
  };
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function calcularVariacaoTemporal(
  atual: number,
  anterior?: number,
): Pick<ItemTemporal, 'variacaoPercentual' | 'variacaoTipo'> {
  if (anterior === undefined) return { variacaoPercentual: null, variacaoTipo: 'sem-base' };
  if (anterior === 0 && atual > 0) return { variacaoPercentual: null, variacaoTipo: 'novo' };
  if (anterior === 0) return { variacaoPercentual: 0, variacaoTipo: 'percentual' };
  return {
    variacaoPercentual: Number((((atual - anterior) / anterior) * 100).toFixed(1)),
    variacaoTipo: 'percentual',
  };
}

export function aplicarVariacoesTemporais(
  itens: Array<Omit<ItemTemporal, 'variacaoPercentual' | 'variacaoTipo'>>,
): ItemTemporal[] {
  return itens.map((item, index) => ({
    ...item,
    ...calcularVariacaoTemporal(item.value, index > 0 ? itens[index - 1].value : undefined),
  }));
}

export function formatarVariacao(item: Pick<ItemTemporal, 'variacaoPercentual' | 'variacaoTipo'>): string {
  if (item.variacaoTipo === 'novo') return 'Novo';
  if (item.variacaoTipo === 'sem-base') return 'Sem base de comparação';
  if (typeof item.variacaoPercentual !== 'number' || !Number.isFinite(item.variacaoPercentual)) return 'Sem base de comparação';
  const valor = item.variacaoPercentual;
  return `${valor > 0 ? '+' : ''}${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

export function classeVariacao(item: Pick<ItemTemporal, 'variacaoPercentual' | 'variacaoTipo'>): string {
  if (item.variacaoTipo === 'novo' || item.variacaoTipo === 'sem-base') return 'text-slate-600';
  const valor = item.variacaoPercentual;
  return typeof valor === 'number' && Number.isFinite(valor)
    ? valor > 0 ? 'text-emerald-600' : valor < 0 ? 'text-rose-600' : 'text-slate-600'
    : 'text-slate-600';
}

export function rankingDeValores(values: string[], limit = 10): ItemRanking[] {
  const counts: Record<string, number> = {};
  values.filter(Boolean).forEach((value) => { counts[value] = (counts[value] || 0) + 1; });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'pt-BR'))
    .slice(0, limit);
}

function temporalDeRegistros(registros: RegistroProducao[]): EstatisticasProducao['temporalAvancado'] {
  // Cada processo pertence a UM período: sua data de conclusão, quando
  // concluído, ou de início, quando ainda está em andamento. Duas barras
  // comparam o mesmo conjunto: todos e, dentre eles, os concluídos.
  const itens = registros
    .map(registro => ({
      data: new Date(registro.dataReferencia),
      concluido: registro.status === 'concluido',
    }))
    .filter(item => !Number.isNaN(item.data.getTime()));

  type Contagem = { total: number; concluidos: number };
  const acumular = (map: Record<string, Contagem>, key: string, concluido: boolean) => {
    const atual = map[key] ?? (map[key] = { total: 0, concluidos: 0 });
    atual.total++;
    if (concluido) atual.concluidos++;
  };
  const porDia: Record<string, Contagem> = {};
  const porMes: Record<string, Contagem> = {};
  const porAno: Record<string, Contagem> = {};
  const porHora = Array.from({ length: 24 }, (): Contagem => ({ total: 0, concluidos: 0 }));
  const porSemana = Array.from({ length: 7 }, (): Contagem => ({ total: 0, concluidos: 0 }));
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const doisDigitos = (n: number) => String(n).padStart(2, '0');

  itens.forEach(({ data, concluido }) => {
    const isoDia = chaveDataSaoPaulo(data);
    acumular(porDia, isoDia, concluido);
    acumular(porMes, isoDia.slice(0, 7), concluido);
    acumular(porAno, isoDia.slice(0, 4), concluido);
    const hora = Number(new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo', hour: '2-digit', hourCycle: 'h23',
    }).format(data));
    if (hora >= 0 && hora < 24) {
      porHora[hora].total++;
      if (concluido) porHora[hora].concluidos++;
    }
    const diaSemana = diaSemanaSaoPaulo(data);
    porSemana[diaSemana].total++;
    if (concluido) porSemana[diaSemana].concluidos++;
  });

  const construir = (map: Record<string, Contagem>, rotulo: (key: string) => string, limite?: number) => {
    const todos = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    // Sem datas artificiais de atividade; dias sem registro não entram na série.
    const corte = limite ? Math.max(0, todos.length - limite) : 0;
    let acumulado = todos.slice(0, corte).reduce((v, [, item]) => v + item.total, 0);
    let acumuladoConcluidos = todos.slice(0, corte).reduce((v, [, item]) => v + item.concluidos, 0);
    return aplicarVariacoesTemporais(todos.slice(corte).map(([key, item]) => ({
      name: rotulo(key),
      value: item.total,
      concluidos: item.concluidos,
      acumulado: (acumulado += item.total),
      acumuladoConcluidos: (acumuladoConcluidos += item.concluidos),
    })));
  };

  const hora = aplicarVariacoesTemporais(porHora.map((item, index) => ({
    name: doisDigitos(index) + 'h',
    value: item.total,
    concluidos: item.concluidos,
  })));
  const diaSemana = aplicarVariacoesTemporais(porSemana.map((item, index) => ({
    name: dias[index],
    value: item.total,
    concluidos: item.concluidos,
  })));
  const diario = construir(porDia, key => key.slice(8, 10) + '/' + key.slice(5, 7) + '/' + key.slice(0, 4), 30);
  const mensal = construir(porMes, key => key.slice(5, 7) + '/' + key.slice(0, 4), 12);
  const anual = construir(porAno, key => key, 12);
  return { hora, diario, diaSemana, mensal, anual };
}

export function agregarRegistrosProducao(registros: RegistroProducao[]): EstatisticasProducao {
  const concluidos = registros.filter((registro) => registro.status === 'concluido');
  const pacientes = new Map<string, RegistroProducao>();
  registros.forEach((registro) => {
    if (!pacientes.has(registro.pacienteChave)) pacientes.set(registro.pacienteChave, registro);
  });
  const duracoes = concluidos
    .map((registro) => registro.duracaoHoras)
    .filter((value): value is number => typeof value === 'number' && value > 0 && value < 720);
  const porUsuario = new Map<string, RegistroProducao[]>();
  registros.forEach((registro) => porUsuario.set(registro.usuarioId, [...(porUsuario.get(registro.usuarioId) || []), registro]));
  const rankingUsuarios = [...porUsuario.entries()].map(([id, producoes]) => {
    const concluidas = producoes.filter((registro) => registro.status === 'concluido');
    const tempos = concluidas.map((registro) => registro.duracaoHoras)
      .filter((value): value is number => typeof value === 'number' && value > 0 && value < 720);
    return {
      id,
      name: producoes[0].usuarioNome,
      lotacao: producoes[0].lotacao,
      value: concluidas.length,
      raioX: {
        totalPacientes: new Set(producoes.map((registro) => registro.pacienteChave)).size,
        processosAtivos: producoes.length - concluidas.length,
        processosConcluidos: concluidas.length,
        tempoMedioHoras: tempos.length ? Number((tempos.reduce((a, b) => a + b, 0) / tempos.length).toFixed(1)) : 0,
        topDiagnosticos: rankingDeValores(producoes.flatMap((registro) => registro.diagnosticos), 5).map((item) => item.name),
        topNHBs: rankingDeValores(producoes.flatMap((registro) => registro.nhbs), 5).map((item) => item.name),
        topIntervencoes: rankingDeValores(producoes.flatMap((registro) => registro.intervencoesPrescritas), 5).map((item) => item.name),
        executorMaisFrequente: rankingDeValores(producoes.flatMap((registro) => registro.executores), 1)[0]?.name || 'N/A',
      },
    };
  }).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'pt-BR')).slice(0, 10);

  const diagnosticos = registros.flatMap((registro) => registro.diagnosticos);
  const intervencoes = registros.flatMap((registro) => registro.intervencoesPrescritas);
  const nhbs = registros.flatMap((registro) => registro.nhbs);
  const sexos = [...pacientes.values()].map((registro) => registro.pacienteSexo || 'Não informado');
  const faixas = [...pacientes.values()].map((registro) => registro.pacienteFaixaEtaria).filter((value): value is string => Boolean(value));

  return {
    totalProcessos: registros.length,
    totalProcessosConcluidos: concluidos.length,
    totalProcessosEmAndamento: registros.length - concluidos.length,
    totalPacientesAtendidos: pacientes.size,
    taxaConclusao: registros.length ? Number(((concluidos.length / registros.length) * 100).toFixed(1)) : 0,
    totalDiagnosticosUnicos: new Set(diagnosticos).size,
    totalIntervencoesUnicas: new Set(intervencoes).size,
    totalNhbsUnicas: new Set(nhbs).size,
    mediaDiagnosticosPorProcesso: registros.length ? Number((diagnosticos.length / registros.length).toFixed(1)) : 0,
    tempoMedioProcessoHoras: duracoes.length ? Number((duracoes.reduce((a, b) => a + b, 0) / duracoes.length).toFixed(1)) : 0,
    diagnosticosTop: rankingDeValores(diagnosticos),
    intervencoesTop: rankingDeValores(intervencoes),
    resultadosTop: rankingDeValores(registros.flatMap((registro) => registro.resultados)),
    nhbsTop: rankingDeValores(nhbs),
    distribuicaoStatus: [
      { name: 'Concluídos', value: concluidos.length },
      { name: 'Em Andamento', value: registros.length - concluidos.length },
    ],
    distribuicaoExecutores: rankingDeValores(registros.flatMap((registro) => registro.executores)),
    perfilPacientes: {
      sexo: rankingDeValores(sexos, Number.POSITIVE_INFINITY),
      faixasEtarias: ['0-18', '19-39', '40-59', '60+'].map((name) => ({ name, value: faixas.filter((item) => item === name).length })),
    },
    rankingUsuarios,
    rankingLotacoes: rankingDeValores(concluidos.map((registro) => registro.lotacao)),
    etapasPE: {
      avaliacao: {
        physical: rankingDeValores(registros.flatMap((registro) => registro.exameFisico)),
        nhbs: rankingDeValores(nhbs),
      },
      diagnostico: {
        top: rankingDeValores(diagnosticos),
        subset: rankingDeValores(registros.flatMap((registro) => registro.subconjuntos)),
      },
      planejamento: {
        results: rankingDeValores(registros.flatMap((registro) => registro.resultados)),
        prescribed: rankingDeValores(intervencoes),
      },
      implementacao: {
        applied: rankingDeValores(registros.flatMap((registro) => registro.intervencoesAplicadas)),
        executors: rankingDeValores(registros.flatMap((registro) => registro.executores)),
      },
      evolucao: { nurseApplied: rankingDeValores(registros.flatMap((registro) => registro.acoesEnfermeiro)) },
    },
    temporalAvancado: temporalDeRegistros(registros),
  };
}

export function filtrarRegistrosProducao(
  registros: RegistroProducao[],
  filtros: { lotacao?: string; usuarioId?: string; inicio?: Date | null; fim?: Date | null },
): RegistroProducao[] {
  return registros.filter((registro) => {
    const data = new Date(registro.dataReferencia);
    return (!filtros.lotacao || registro.lotacao === filtros.lotacao)
      && (!filtros.usuarioId || registro.usuarioId === filtros.usuarioId)
      && (!filtros.inicio || data >= filtros.inicio)
      && (!filtros.fim || data <= filtros.fim);
  });
}
