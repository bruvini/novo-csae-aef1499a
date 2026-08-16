import { ProcessoEnfermagem } from '@/types/processoEnfermagem';

/**
 * Calcula quais etapas do processo de enfermagem estão concluídas.
 * Fonte única de verdade para validação de progresso.
 */
export function calcularEtapasCompletadas(processo: ProcessoEnfermagem): number[] {
  const concluidas: number[] = [];

  // Etapa 1 — Avaliação: requer dados subjetivos E pelo menos 1 item no exame físico
  const temColeta = !!(processo.avaliacao?.coletaDeDadosSubjetivos?.trim());
  const temExameFisico = Object.keys(processo.avaliacao?.exameFisico || {}).length > 0;
  if (temColeta && temExameFisico) concluidas.push(1);

  // Etapa 2 — Diagnóstico: pelo menos 1 diagnóstico selecionado
  if ((processo.diagnostico?.diagnosticosSelecionados?.length ?? 0) > 0) concluidas.push(2);

  // Etapa 3 — Planejamento: todos os diagnósticos não-positivos têm resultado E intervenção
  const diagnosticosPlanejados = processo.planejamento?.diagnosticosPlanejados ?? [];
  const planejamentoOk =
    diagnosticosPlanejados.length > 0 &&
    diagnosticosPlanejados.every((diag) => {
      if (diag.isPositivo) return true;
      const temIntervencoes = (diag.intervencoesSelecionadas?.length ?? 0) > 0;
      const temResultado = !!(diag.resultadoEsperadoSelecionado?.trim());
      return temIntervencoes && temResultado;
    });
  if (planejamentoOk) concluidas.push(3);

  // Etapa 4 — Implementação: pelo menos 1 intervenção implementada nesta consulta e todas têm executor
  const implementacao = processo.implementacao || {};
  let peloMenosUmaImplementada = false;
  let temPendenciaExecutor = false;

  Object.values(implementacao).forEach((d) => {
    const implementadas = d.intervencoes?.filter((i) => i.implementadoNestaConsulta) || [];
    if (implementadas.length > 0) {
      peloMenosUmaImplementada = true;
      if (implementadas.some((i) => !i.quemExecuta || (Array.isArray(i.quemExecuta) && i.quemExecuta.length === 0))) {
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
  etapasCompletadas: number[],
  processo: ProcessoEnfermagem
): boolean {
  // Etapas já visitadas ou completadas são sempre acessíveis
  if (numeroEtapa <= etapaAtual || etapasCompletadas.includes(numeroEtapa)) return true;

  switch (numeroEtapa) {
    case 2: {
      const temColeta = !!(processo.avaliacao?.coletaDeDadosSubjetivos?.trim());
      const temExameFisico = Object.keys(processo.avaliacao?.exameFisico || {}).length > 0;
      return temColeta && temExameFisico;
    }
    case 3:
      return (processo.diagnostico?.diagnosticosSelecionados?.length ?? 0) > 0;
    case 4: {
      const diags = processo.planejamento?.diagnosticosPlanejados ?? [];
      if (diags.length === 0) return false;
      return diags.every((diag) => {
        if (diag.isPositivo) return true;
        return (
          (diag.intervencoesSelecionadas?.length ?? 0) > 0 &&
          !!(diag.resultadoEsperadoSelecionado?.trim())
        );
      });
    }
    case 5:
    case 6: {
      const implementacao = processo.implementacao || {};
      let peloMenosUmaImplementada = false;
      let temPendenciaExecutor = false;

      Object.values(implementacao).forEach((d) => {
        const implementadas = d.intervencoes?.filter((i) => i.implementadoNestaConsulta) || [];
        if (implementadas.length > 0) {
          peloMenosUmaImplementada = true;
          if (implementadas.some((i) => !i.quemExecuta || (Array.isArray(i.quemExecuta) && i.quemExecuta.length === 0))) {
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
  processo: ProcessoEnfermagem
): string | null {
  if (isEtapaAcessivel(numeroEtapa, etapaAtual, etapasCompletadas, processo)) return null;

  switch (numeroEtapa) {
    case 2:
      return 'Para liberar esta etapa, preencha a coleta de dados subjetivos e pelo menos um item do exame físico.';
    case 3:
      return 'Para liberar esta etapa, selecione pelo menos um diagnóstico de enfermagem na etapa anterior.';
    case 4:
      return 'Para liberar esta etapa, todos os diagnósticos precisam ter um resultado esperado e pelo menos uma intervenção definida no planejamento.';
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
