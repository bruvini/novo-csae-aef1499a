export interface ItemRanking {
  name: string;
  value: number;
}

export type VariacaoTipo = 'percentual' | 'novo' | 'sem-base';

export interface ItemTemporal {
  name: string;
  value: number;
  acumulado?: number;
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
  const valor = item.variacaoPercentual ?? 0;
  return `${valor > 0 ? '+' : ''}${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
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
  const concluidos = registros.filter((registro) => registro.status === 'concluido');
  const datas = concluidos
    .map((registro) => new Date(registro.dataConclusaoReferencia || registro.dataReferencia))
    .filter((date) => !Number.isNaN(date.getTime()));
  const pad = (value: number) => String(value).padStart(2, '0');
  const contagem = (key: (date: Date) => string) => datas.reduce<Record<string, number>>((acc, date) => {
    const chave = key(date);
    acc[chave] = (acc[chave] || 0) + 1;
    return acc;
  }, {});
  const construir = (map: Record<string, number>, nomes: (key: string) => string, limite?: number) => {
    const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    const visiveis = limite ? entries.slice(-limite) : entries;
    let acumulado = 0;
    return aplicarVariacoesTemporais(visiveis.map(([key, value]) => ({
      name: nomes(key),
      value,
      acumulado: (acumulado += value),
    })));
  };

  const porHora = Array.from({ length: 24 }, () => 0);
  const porSemana = Array.from({ length: 7 }, () => 0);
  datas.forEach((date) => {
    porHora[date.getHours()] += 1;
    porSemana[date.getDay()] += 1;
  });
  const hora = aplicarVariacoesTemporais(porHora.map((value, index) => ({
    name: `${pad(index)}h`, value,
  })));
  const diaSemana = aplicarVariacoesTemporais(porSemana.map((value, index) => ({
    name: DIAS_SEMANA[index], value,
  })));
  const diario = construir(contagem((date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`),
    (key) => `${key.slice(8, 10)}/${key.slice(5, 7)}/${key.slice(0, 4)}`, 30);
  const mensal = construir(contagem((date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`),
    (key) => `${key.slice(5, 7)}/${key.slice(0, 4)}`, 12);
  const anual = construir(contagem((date) => String(date.getFullYear())), (key) => key, 12);
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
