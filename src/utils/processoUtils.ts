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
  return selecionados.flatMap((selecionado) => {
    const plano = planejados.find((item) => item.diagnosticoId === selecionado.id);
    const nome = selecionado.tituloDiagnostico;
    if (!plano) return [`${nome}: planejamento ainda não iniciado`];
    if (plano.isPositivo === true) return [];
    const pendencias: string[] = [];
    if (!plano.resultadoEsperadoSelecionado?.trim()) pendencias.push('resultado esperado');
    if (!(plano.intervencoesSelecionadas?.length > 0)) pendencias.push('intervenção');
    return pendencias.length ? [`${nome}: falta ${pendencias.join(' e ')}`] : [];
  });
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

  // A etapa de diagnóstico só fica concluída quando a avaliação também está válida.
  if (
    concluidas.includes(1)
    && (processo.diagnostico?.diagnosticosSelecionados?.length ?? 0) > 0
  ) concluidas.push(2);

  // Etapa 3: verificar os diagnósticos selecionados, não apenas os registros já
  // criados em planejamento (que podem estar incompletos ou ser legados).
  const diagnosticosPlanejados = processo.planejamento?.diagnosticosPlanejados ?? [];
  const planejamentoOk =
    concluidas.includes(2) &&
    diagnosticosPlanejados.length > 0 &&
    obterPendenciasPlanejamento(processo.diagnostico, diagnosticosPlanejados).length === 0;
  if (planejamentoOk) concluidas.push(3);

  // Etapa 4 — Implementação: pelo menos 1 intervenção implementada nesta consulta e todas têm executor
  const implementacao = processo.implementacao || {};
  let peloMenosUmaImplementada = false;
  let temPendenciaExecutor = false;

  Object.values(implementacao).forEach((d) => {
    const implementadas = d.intervencoes?.filter((i) => i.implementadoNestaConsulta) || [];
    if (implementadas.length > 0) {
      peloMenosUmaImplementada = true;
      if (implementadas.some((i) => !i.quemExecuta)) {
        temPendenciaExecutor = true;
      }
    }
  });

  if (peloMenosUmaImplementada && !temPendenciaExecutor) concluidas.push(4);

  // Etapa 5 — Evolução: pelo menos 1 grupo de intervenções executadas registrado
  const temEvolucao =
    !!processo.evolucao?.intervencoesExecutadas &&
    Object.keys(processo.evolucao.intervencoesExecutadas).length > 0;
  if (temEvolucao) concluidas.push(5);

  // Etapa 6 — Resumo gerado
  if (processo.evolucao?.resumoGerado) concluidas.push(6);

  return concluidas;
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
    case 6: {
      const implementacao = processo.implementacao || {};
      let peloMenosUmaImplementada = false;
      let temPendenciaExecutor = false;

      Object.values(implementacao).forEach((d) => {
        const implementadas = d.intervencoes?.filter((i) => i.implementadoNestaConsulta) || [];
        if (implementadas.length > 0) {
          peloMenosUmaImplementada = true;
          if (implementadas.some((i) => !i.quemExecuta)) {
            temPendenciaExecutor = true;
          }
        }
      });
      return peloMenosUmaImplementada && !temPendenciaExecutor;
    }
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
      return 'Selecione pelo menos um diagnóstico de enfermagem na etapa anterior.';
    }
    case 4: {
      const pendencias = obterPendenciasPlanejamento(processo.diagnostico, processo.planejamento?.diagnosticosPlanejados ?? []);
      if (pendencias.length) {
        return `Revise o planejamento: ${pendencias.join('; ')}.`;
      }
      return 'Revise a avaliação e os diagnósticos selecionados antes de avançar.';
    }
    case 5:
    case 6: {
      const implementacao = processo.implementacao || {};
      let peloMenosUmaImplementada = false;
      
      Object.values(implementacao).forEach((d) => {
        if (d.intervencoes?.some((i) => i.implementadoNestaConsulta)) {
          peloMenosUmaImplementada = true;
        }
      });

      if (!peloMenosUmaImplementada) {
        return 'Para liberar esta etapa, marque pelo menos uma intervenção como implementada na Etapa 4.';
      }
      return 'Existem intervenções implementadas sem um executor definido. Por favor, especifique quem executará cada ação técnica.';
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
