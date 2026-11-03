import { ProcessoEnfermagem, AvaliacaoEnfermagem, DiagnosticoPlanejado, DiagnosticoEnfermagem } from '@/types/processoEnfermagem';

export interface RequisitoDescricaoAvaliacao {
  exame: string;
  achado: string;
}

export interface RegistroExameFisico {
  exame: string;
  valor: string | number;
  tipo: 'parametro' | 'achado';
  descricao?: string;
}

export interface ValidacaoAvaliacao {
  coletaValida: boolean;
  exameFisicoValido: boolean;
  descricoesObrigatoriasPendentes: string[];
  completa: boolean;
}

export interface CatalogoAchadosAprovados {
  exames: Array<{
    nomeExame: string;
    achados: Array<{
      descricaoAchado: string;
      tipoAchado?: 'simples' | 'opcoes';
      opcoes?: Array<{ textoOpcao: string }>;
    }>;
  }>;
}

export function alinharDiagnosticosPlanejados(
  selecionados: DiagnosticoEnfermagem['diagnosticosSelecionados'],
  salvos: DiagnosticoPlanejado[],
): DiagnosticoPlanejado[] {
  const ordemSalva = salvos.filter((item) => selecionados.some((diag) => diag.id === item.diagnosticoId))
    .sort((a, b) => a.ordemPrioridade - b.ordemPrioridade);
  const idsSalvos = new Set(ordemSalva.map((item) => item.diagnosticoId));
  const ordem = [...ordemSalva.map((item) => selecionados.find((diag) => diag.id === item.diagnosticoId)!), ...selecionados.filter((diag) => !idsSalvos.has(diag.id))];
  return ordem.map((diag, index) => {
    const salvo = salvos.find((item) => item.diagnosticoId === diag.id);
    return {
      ...(salvo || { diagnosticoId: diag.id, intervencoesSelecionadas: [] }),
      tituloDiagnostico: diag.tituloDiagnostico,
      ordemPrioridade: index + 1,
      ...(diag.naturezaDiagnostico ? { naturezaDiagnostico: diag.naturezaDiagnostico } : {}),
    };
  });
}

/** Mesmo resultado para arraste com ponteiro e teclado. */
export function reordenarDiagnosticosPlanejados(
  itens: DiagnosticoPlanejado[], origem: number, destino: number,
): DiagnosticoPlanejado[] {
  if (origem < 0 || destino < 0 || origem >= itens.length || destino >= itens.length) return itens;
  const ordenados = [...itens];
  const [movido] = ordenados.splice(origem, 1);
  ordenados.splice(destino, 0, movido);
  return ordenados.map((item, index) => ({ ...item, ordemPrioridade: index + 1 }));
}

export function isDiagnosticoPositivo(
  natureza: DiagnosticoPlanejado['naturezaDiagnostico'] | undefined,
  legadoIsPositivo: boolean | undefined,
): boolean {
  if (natureza === 'problema' || natureza === 'risco' || natureza === 'promocao_saude') {
    return natureza === 'promocao_saude';
  }
  return legadoIsPositivo === true;
}

export function isAchadoDoCatalogoAprovado(
  sistemas: CatalogoAchadosAprovados[],
  exame: string,
  achado: string
): boolean {
  return sistemas.some((sistema) =>
    sistema.exames.some((item) =>
      item.nomeExame === exame
      && item.achados.some((opcao) =>
        (opcao.tipoAchado !== 'opcoes' && opcao.descricaoAchado === achado)
        || (opcao.opcoes || []).some((subopcao) => subopcao.textoOpcao === achado)
      )
    )
  );
}

export function isValorAvaliacaoValido(value: unknown): value is string | number {
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' && value.trim().length > 0;
}

export function obterRegistrosExameFisico(avaliacao?: AvaliacaoEnfermagem): RegistroExameFisico[] {
  if (!avaliacao) return [];

  const parametros = avaliacao.exameFisico || {};
  const selecoes = avaliacao.exameFisicoMulti || {};
  const descricoes = avaliacao.exameFisicoDescricoes || {};
  const registros: RegistroExameFisico[] = [];

  Object.entries(parametros).forEach(([exame, valor]) => {
    if (!isValorAvaliacaoValido(valor)) return;

    const selecoesDoExame = selecoes[exame];
    if (typeof valor === 'string' && Array.isArray(selecoesDoExame) && selecoesDoExame.includes(valor)) return;
    registros.push({ exame, valor, tipo: 'parametro' });
  });

  Object.entries(selecoes).forEach(([exame, valores]) => {
    if (!Array.isArray(valores)) return;
    valores.forEach((valor) => {
      if (!isValorAvaliacaoValido(valor)) return;
      const descricao = descricoes[`${exame}|||${valor}`];
      registros.push({
        exame,
        valor,
        tipo: 'achado',
        ...(isValorAvaliacaoValido(descricao) ? { descricao } : {}),
      });
    });
  });

  return registros;
}

export function validarAvaliacao(
  processo: ProcessoEnfermagem,
  requisitosDescricao: RequisitoDescricaoAvaliacao[] = []
): ValidacaoAvaliacao {
  const avaliacao = processo.avaliacao;
  const coletaValida = typeof avaliacao?.coletaDeDadosSubjetivos === 'string'
    && avaliacao.coletaDeDadosSubjetivos.trim().length > 0;
  const exameFisicoValido = obterRegistrosExameFisico(avaliacao).length > 0;
  const descricoesObrigatoriasPendentes = requisitosDescricao
    .filter(({ exame, achado }) => {
      const selecaoAtual = avaliacao?.exameFisicoMulti?.[exame];
      const valorLegado = avaliacao?.exameFisico?.[exame];
      const selecionado = (Array.isArray(selecaoAtual) && selecaoAtual.includes(achado)) || valorLegado === achado;
      if (!selecionado) return false;

      const descricao = avaliacao?.exameFisicoDescricoes?.[`${exame}|||${achado}`];
      return !isValorAvaliacaoValido(descricao);
    })
    .map(({ achado }) => achado);

  return {
    coletaValida,
    exameFisicoValido,
    descricoesObrigatoriasPendentes,
    completa: coletaValida && exameFisicoValido && descricoesObrigatoriasPendentes.length === 0,
  };
}

/**
 * Planejamento deve cobrir TODOS os diagnósticos atualmente selecionados.
 * Registros legados ou diagnósticos retirados não podem liberar uma etapa,
 * tampouco podem apagar as escolhas de outro diagnóstico.
 */
export function obterPendenciasPlanejamento(
  diagnostico: DiagnosticoEnfermagem | undefined,
  planejados: DiagnosticoPlanejado[] = [],
): string[] {
  const selecionados = diagnostico?.diagnosticosSelecionados ?? [];
  const idsSelecionados = new Set(selecionados.map((item) => item.id));
  const idsPlanejados = planejados.map((item) => item.diagnosticoId);
  if (new Set(idsPlanejados).size !== idsPlanejados.length) {
    return ['O planejamento contém diagnósticos duplicados; revise a seleção atual.'];
  }
  if (planejados.some((item) => !idsSelecionados.has(item.diagnosticoId))) {
    return ['Remova do planejamento os diagnósticos que não estão selecionados.'];
  }
  return selecionados.flatMap((selecionado) => {
    const plano = planejados.find((item) => item.diagnosticoId === selecionado.id);
    const nome = selecionado.tituloDiagnostico;
    if (!plano) return [`${nome}: planejamento ainda não iniciado`];
    const isPositivo = isDiagnosticoPositivo(
      selecionado.naturezaDiagnostico || plano.naturezaDiagnostico,
      plano.isPositivo,
    );
    if (isPositivo) {
      if ((plano.intervencoesSelecionadas?.length ?? 0) > 0 || plano.justificativaSemIntervencao?.trim()) return [];
      return [`${nome}: justifique a ausência de intervenção nesta consulta`];
    }
    const pendencias: string[] = [];
    if (!plano.resultadoEsperadoSelecionado?.trim()) pendencias.push('resultado esperado');
    if (!(plano.intervencoesSelecionadas?.length > 0)) pendencias.push('intervenção');
    return pendencias.length ? [`${nome}: falta ${pendencias.join(' e ')}`] : [];
  });
}

export function continuidadeDoProcesso(processo: ProcessoEnfermagem): { completa: boolean; somenteEncerramento: boolean } {
  const abordados = processo.avaliacao?.cuidadosAnterioresAbordados || [];
  const decisoes = processo.diagnostico?.reavaliacoesAnteriores || [];
  const completa = abordados.every(cuidado => {
    const decisao = decisoes.find(item => item.acompanhamentoId === cuidado.acompanhamentoId);
    if (!decisao) return false;
    if (decisao.decisao === 'encerrar') return true;
    const diagnosticoNecessarioId = decisao.decisao === 'substituir'
      ? decisao.novoDiagnosticoId
      : decisao.diagnosticoOrigemId;
    return Boolean(diagnosticoNecessarioId
      && processo.diagnostico?.diagnosticosSelecionados.some(item => item.id === diagnosticoNecessarioId));
  });
  const somenteEncerramento = abordados.length > 0
    && completa
    && processo.diagnostico?.diagnosticosSelecionados.length === 0
    && abordados.every(cuidado => decisoes.find(item => item.acompanhamentoId === cuidado.acompanhamentoId)?.decisao === 'encerrar');
  return { completa, somenteEncerramento };
}

/**
 * Calcula quais etapas do processo de enfermagem estão concluídas.
 * Fonte única de verdade para validação de progresso.
 */
export function calcularEtapasCompletadas(
  processo: ProcessoEnfermagem,
  requisitosDescricao: RequisitoDescricaoAvaliacao[] = []
): number[] {
  const concluidas: number[] = [];

  if (validarAvaliacao(processo, requisitosDescricao).completa) concluidas.push(1);

  const continuidade = continuidadeDoProcesso(processo);

  // A etapa de diagnóstico só fica concluída quando a avaliação também está válida.
  if (
    concluidas.includes(1)
    && continuidade.completa
    && ((processo.diagnostico?.diagnosticosSelecionados?.length ?? 0) > 0 || continuidade.somenteEncerramento)
  ) concluidas.push(2);

  // Etapa 3: verificar os diagnósticos selecionados, não apenas os registros já
  // criados em planejamento (que podem estar incompletos ou ser legados).
  const diagnosticosPlanejados = processo.planejamento?.diagnosticosPlanejados ?? [];
  const planejamentoOk =
    concluidas.includes(2) &&
    (diagnosticosPlanejados.length > 0 && obterPendenciasPlanejamento(processo.diagnostico, diagnosticosPlanejados).length === 0
      || continuidade.somenteEncerramento);
  if (planejamentoOk) concluidas.push(3);

  // A prescrição pode ficar para uma consulta futura. Somente ações marcadas
  // como realizadas exigem executor.
  const implementacao = processo.implementacao || {};
  const implementacaoOk = (processo.planejamento?.diagnosticosPlanejados ?? []).every((plano) => {
    const prescritas = plano.intervencoesSelecionadas ?? [];
    if (prescritas.length === 0) return true;
    const implementadas = implementacao[plano.tituloDiagnostico]?.intervencoes
      ?.filter((item) => item.implementadoNestaConsulta) ?? [];
    return implementadas.every((item) =>
      Array.isArray(item.quemExecuta) ? item.quemExecuta.length > 0 : Boolean(item.quemExecuta)
    );
  });
  const etapaMaximaAlcancada = obterEtapaMaximaAlcancada(processo);
  const implementacaoVisitada = etapaMaximaAlcancada >= 4 || Object.keys(implementacao).length > 0;
  if (planejamentoOk && implementacaoVisitada && implementacaoOk) concluidas.push(4);

  // A documentação da Evolução é opcional por decisão clínica desta entrega.
  const evolucaoVisitada = etapaMaximaAlcancada >= 5 || Boolean(
    processo.evolucao?.julgamentoClinico?.trim() || processo.evolucao?.resumoGerado?.trim()
    || Object.keys(processo.evolucao?.respostasIntervencoes || {}).length
    || Object.keys(processo.evolucao?.avaliacoesResultados || {}).length
    || processo.evolucao?.observacoesCompartilhadas?.length
  );
  const evolucaoValida = continuidade.somenteEncerramento
    ? Boolean(processo.evolucao?.julgamentoClinico?.trim())
    : evolucaoVisitada;
  if (concluidas.includes(4) && evolucaoValida) concluidas.push(5);

  // Etapa 6 — Resumo gerado
  if (concluidas.includes(5) && processo.evolucao?.resumoGerado?.trim()) concluidas.push(6);

  return concluidas;
}

/** Usa o maior estágio persistido e oferece compatibilidade para processos legados. */
export function obterEtapaMaximaAlcancada(processo: ProcessoEnfermagem): number {
  const etapaPersistida = processo.etapaMaximaAlcancada ?? processo.etapaAtual ?? 1;
  if (!Number.isFinite(etapaPersistida)) return 1;
  return Math.min(6, Math.max(1, Math.floor(etapaPersistida)));
}

/**
 * Verifica se uma etapa específica está acessível dado o estado atual do processo.
 * Uma etapa é acessível se já foi completada OU se as pré-condições foram atendidas.
 */
export function isEtapaAcessivel(
  numeroEtapa: number,
  etapaAtual: number,
  _etapasCompletadas: number[],
  processo: ProcessoEnfermagem,
  requisitosDescricao: RequisitoDescricaoAvaliacao[] = []
): boolean {
  // A etapa atual e as anteriores seguem acessíveis para edição/revisão.
  if (numeroEtapa <= etapaAtual) return true;

  // Recalcular a conclusão com os dados atuais. O array recebido pode
  // representar o último salvamento, anterior ao último clique do enfermeiro.
  const atuais = calcularEtapasCompletadas(processo, requisitosDescricao);
  if (numeroEtapa === 2 && !atuais.includes(1)) return false;
  if (atuais.includes(numeroEtapa)) return true;

  switch (numeroEtapa) {
    case 2:
      return validarAvaliacao(processo, requisitosDescricao).completa;
    case 3:
      return atuais.includes(2);
    case 4:
      return atuais.includes(3);
    case 5:
      return atuais.includes(4);
    case 6:
      return atuais.includes(5);
    default:
      return false;
  }
}

/**
 * Retorna a mensagem explicando por que uma etapa está bloqueada.
 * Retorna null se a etapa está acessível.
 */
export function getMotivoBloqueio(
  numeroEtapa: number,
  etapaAtual: number,
  etapasCompletadas: number[],
  processo: ProcessoEnfermagem,
  requisitosDescricao: RequisitoDescricaoAvaliacao[] = []
): string | null {
  if (isEtapaAcessivel(numeroEtapa, etapaAtual, etapasCompletadas, processo, requisitosDescricao)) return null;

  switch (numeroEtapa) {
    case 2: {
      const validacao = validarAvaliacao(processo, requisitosDescricao);
      const pendencias: string[] = [];
      if (!validacao.coletaValida) pendencias.push('preencha a coleta de dados subjetivos (entrevista)');
      if (!validacao.exameFisicoValido) {
        pendencias.push('registre ao menos um sinal vital ou achado válido selecionado no catálogo aprovado de exame físico');
      }
      if (validacao.descricoesObrigatoriasPendentes.length > 0) {
        pendencias.push('preencha as descrições obrigatórias dos achados selecionados');
      }
      return `Para avançar ao Diagnóstico, ${pendencias.join(' e ')}.`;
    }
    case 3: {
      if (!validarAvaliacao(processo, requisitosDescricao).completa) {
        return 'Para avançar, revise as informações obrigatórias da Avaliação de Enfermagem.';
      }
      const continuidade = continuidadeDoProcesso(processo);
      if (!continuidade.completa) return 'Registre uma decisão clínica para cada cuidado anterior abordado na Avaliação.';
      if (continuidade.somenteEncerramento) return null;
      return 'Selecione pelo menos um diagnóstico de enfermagem na etapa anterior.';
    }
    case 4: {
      if (continuidadeDoProcesso(processo).somenteEncerramento) return null;
      const pendencias = obterPendenciasPlanejamento(processo.diagnostico, processo.planejamento?.diagnosticosPlanejados ?? []);
      if (pendencias.length) {
        return `Revise o planejamento: ${pendencias.join('; ')}.`;
      }
      return 'Revise a avaliação e os diagnósticos selecionados antes de avançar.';
    }
    case 5:
    case 6: {
      if (continuidadeDoProcesso(processo).somenteEncerramento && !processo.evolucao?.julgamentoClinico?.trim()) {
        return 'Registre a síntese clínica obrigatória da reavaliação na Evolução de Enfermagem.';
      }
      if (numeroEtapa === 6 && !calcularEtapasCompletadas(processo, requisitosDescricao).includes(5)) {
        return 'Conclua a Evolução de Enfermagem antes de abrir o resumo final.';
      }
      const pendencias = obterPendenciasPlanejamento(
        processo.diagnostico,
        processo.planejamento?.diagnosticosPlanejados ?? [],
      );
      if (pendencias.length) return `Revise o planejamento: ${pendencias.join('; ')}.`;
      return 'Defina o executor de cada intervenção marcada como realizada antes de avançar.';
    }
    default:
      return 'Complete as etapas anteriores para liberar.';
  }
}

/** Executa a transição somente depois de confirmar que o salvamento foi concluído. */
export async function executarAvancoAposSalvar(
  salvar: () => Promise<boolean>,
  avancar: () => void
): Promise<boolean> {
  try {
    const salvo = await salvar();
    if (!salvo) return false;
    avancar();
    return true;
  } catch {
    return false;
  }
}
