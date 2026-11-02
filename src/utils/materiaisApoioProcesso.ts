import type { Intervencao as IntervencaoCatalogo, MaterialApoio } from '@/services/bancodados/rolEnfermagemDB';
import type { DiagnosticoPlanejado, EvolucaoEnfermagem, ImplementacaoEnfermagem, IntervencaoImplementada, IntervencaoSelecionada, MaterialApoioConsulta, ProcessoEnfermagem } from '@/types/processoEnfermagem';

export function criarIntervencaoConsulta(
  dados: Pick<IntervencaoCatalogo, 'acaoPrescrita' | 'acaoEnfermeiro'> & { materiaisDeApoio?: MaterialApoio[] },
  tipo: IntervencaoSelecionada['tipo'],
  origemCatalogoChave?: string,
  criarId: () => string = () => crypto.randomUUID(),
): IntervencaoSelecionada {
  const intervencaoId = criarId();
  return {
    intervencaoId,
    ...(origemCatalogoChave ? { origemCatalogoChave } : {}),
    acaoPrescrita: dados.acaoPrescrita,
    ...(dados.acaoEnfermeiro ? { acaoEnfermeiro: dados.acaoEnfermeiro } : {}),
    tipo,
    materiaisDeApoio: (dados.materiaisDeApoio || []).map((material, index) => ({
      id: `${intervencaoId}:m${index + 1}`,
      tituloMaterialApoio: material.tituloMaterialApoio,
      urlMaterialApoio: material.urlMaterialApoio,
    })),
  };
}

/** O catálogo pode conter endereços legados inválidos; apenas HTTPS vira link. */
export function linkMaterialSeguro(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' && !!parsed.hostname && !parsed.username && !parsed.password ? parsed.href : null;
  } catch { return null; }
}

export function atualizarEntrega(intervencao: IntervencaoImplementada, materialId: string, entregue: boolean): IntervencaoImplementada {
  const atuais = intervencao.materiaisEntreguesIds || [];
  const ids = entregue ? [...new Set([...atuais, materialId])] : atuais.filter(id => id !== materialId);
  return { ...intervencao, materiaisEntreguesIds: ids };
}

/** Usa o ID nas seleções novas e consome cada ocorrência textual legada uma vez. */
export function encontrarImplementada(plano: IntervencaoSelecionada, existentes: IntervencaoImplementada[], usadas: Set<number>): IntervencaoImplementada | undefined {
  const indice = existentes.findIndex((item, i) => !usadas.has(i) && (
    plano.intervencaoId ? item.intervencaoId === plano.intervencaoId : !item.intervencaoId && item.acaoPrescrita === plano.acaoPrescrita && item.tipo === plano.tipo
  ));
  if (indice < 0) return undefined;
  usadas.add(indice);
  return existentes[indice];
}

export function conciliarImplementacao(planejados: DiagnosticoPlanejado[], atual: ImplementacaoEnfermagem): ImplementacaoEnfermagem {
  const proxima: ImplementacaoEnfermagem = {};
  for (const diag of planejados) {
    const existentes = atual[diag.tituloDiagnostico]?.intervencoes || [];
    const usadas = new Set<number>();
    proxima[diag.tituloDiagnostico] = {
      intervencoes: (diag.intervencoesSelecionadas || []).map(plano => {
        const { materiaisDeApoio: _materiais, ...dados } = plano;
        const existente = encontrarImplementada(plano, existentes, usadas);
        return existente ? { ...dados, ...existente } : { ...dados, implementadoNestaConsulta: false };
      }),
    };
  }
  return proxima;
}

export function materiaisComEntrega(materiais: MaterialApoioConsulta[] | undefined, intervencao: IntervencaoImplementada | undefined) {
  const entregues = new Set(intervencao?.materiaisEntreguesIds || []);
  return (materiais || []).map(material => ({ ...material, entregue: entregues.has(material.id) }));
}

export function materiaisDoProcesso(processo: Pick<ProcessoEnfermagem, 'planejamento' | 'implementacao'>) {
  return (processo.planejamento?.diagnosticosPlanejados || []).flatMap(diag => {
    const existentes = processo.implementacao?.[diag.tituloDiagnostico]?.intervencoes || [];
    const usadas = new Set<number>();
    return (diag.intervencoesSelecionadas || []).flatMap(plano => {
      const implementada = encontrarImplementada(plano, existentes, usadas);
      return (plano.materiaisDeApoio || []).map(material => ({
        diagnosticoId: diag.diagnosticoId,
        tituloDiagnostico: diag.tituloDiagnostico,
        intervencaoId: plano.intervencaoId,
        acaoPrescrita: plano.acaoPrescrita,
        ...material,
        entregue: !!implementada?.materiaisEntreguesIds?.includes(material.id),
      }));
    });
  });
}

export function materiaisAgrupados(processo: Pick<ProcessoEnfermagem, 'planejamento' | 'implementacao'>) {
  const grupos = new Map<string, { chave: string; tituloDiagnostico: string; acaoPrescrita: string; materiais: Array<MaterialApoioConsulta & { entregue: boolean }> }>();
  for (const material of materiaisDoProcesso(processo)) {
    const chave = `${material.diagnosticoId}|${material.intervencaoId || material.acaoPrescrita}`;
    const grupo = grupos.get(chave) || { chave, tituloDiagnostico: material.tituloDiagnostico, acaoPrescrita: material.acaoPrescrita, materiais: [] };
    grupo.materiais.push({ id: material.id, tituloMaterialApoio: material.tituloMaterialApoio, urlMaterialApoio: material.urlMaterialApoio, entregue: material.entregue });
    grupos.set(chave, grupo);
  }
  return [...grupos.values()];
}

export function linhasMateriaisEntregues(processo: Pick<ProcessoEnfermagem, 'planejamento' | 'implementacao'>): string[] {
  return materiaisDoProcesso(processo).filter(material => material.entregue)
    .map(material => `Material de apoio entregue: ${material.tituloMaterialApoio}.`);
}

export function assinaturaEntregas(implementacao: ImplementacaoEnfermagem): string {
  return JSON.stringify(Object.entries(implementacao).sort(([a], [b]) => a.localeCompare(b)).flatMap(([diag, dados]) =>
    dados.intervencoes.flatMap((intervencao, index) => (intervencao.materiaisEntreguesIds || []).length
      ? [[diag, intervencao.intervencaoId || `${index}:${intervencao.acaoPrescrita}`, [...intervencao.materiaisEntreguesIds!].sort()]]
      : [])));
}

export function invalidarResumoAoAlterarEntrega(evolucao: EvolucaoEnfermagem, anterior: ImplementacaoEnfermagem, proxima: ImplementacaoEnfermagem): EvolucaoEnfermagem {
  return assinaturaEntregas(anterior) === assinaturaEntregas(proxima) ? evolucao : { ...evolucao, resumoGerado: '' };
}
