import type { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import { diagnosticosAnterioresDisponiveis } from './continuidadeCuidado';

/** Associações recuperadas do catálogo vigente, não a origem da busca do profissional. */
export interface VinculosDiagnostico {
  id: string;
  titulo: string;
  nhbs: string[];
  protocolos: string[];
}

export interface IndicadoresRetorno {
  oportunidades: number;
  abordados: number;
  mantidos: number;
  substituidos: number;
  encerrados: number;
  /** Abordagens documentadas na avaliação sem decisão diagnóstica final. */
  abordadosSemDecisao: number;
}

export const SEM_RETORNO: IndicadoresRetorno = {
  oportunidades: 0, abordados: 0, mantidos: 0, substituidos: 0,
  encerrados: 0, abordadosSemDecisao: 0,
};

export function unicosNomes(itens: string[]): string[] {
  return [...new Map(itens.map(item => String(item || '').trim()).filter(Boolean)
    .map(item => [item.toLocaleLowerCase('pt-BR'), item])).values()];
}

export function vinculosDoCatalogo(
  vinculos: Array<{ tipoSubconjunto?: string; tituloSubconjunto?: string }> | undefined,
): Pick<VinculosDiagnostico, 'nhbs' | 'protocolos'> {
  const nhbs: string[] = [];
  const protocolos: string[] = [];
  for (const vinculo of vinculos || []) {
    const tipo = (vinculo.tipoSubconjunto || '').trim().toLocaleLowerCase('pt-BR');
    const titulo = (vinculo.tituloSubconjunto || '').trim();
    if (!titulo) continue;
    if (tipo === 'nhb' || tipo.includes('necessidade')) nhbs.push(titulo);
    if (tipo.includes('protocolo')) protocolos.push(titulo);
  }
  return { nhbs: unicosNomes(nhbs), protocolos: unicosNomes(protocolos) };
}

export interface ConsultaMinimaContinuidade {
  idProcesso: string;
  status: string;
  dataInicio?: { toDate: () => Date; toMillis?: () => number } | Date;
  dataConclusao?: { toDate: () => Date; toMillis?: () => number } | Date;
  avaliacao?: {
    cuidadosAnterioresAbordados?: Array<{ acompanhamentoId: string }>;
  };
  diagnostico?: {
    diagnosticosSelecionados?: Array<{ id: string; tituloDiagnostico: string; acompanhamentoId?: string }>;
    reavaliacoesAnteriores?: Array<{
      acompanhamentoId: string;
      processoOrigemId: string;
      diagnosticoOrigemId: string;
      decisao: 'manter' | 'substituir' | 'encerrar';
      novoDiagnosticoId?: string;
    }>;
  };
  planejamento?: {
    diagnosticosPlanejados?: Array<{
      diagnosticoId: string;
      tituloDiagnostico: string;
      acompanhamentoId?: string;
      resultadoEsperadoSelecionado?: string;
      intervencoesSelecionadas?: Array<{ acaoPrescrita: string }>;
    }>;
  };
}

function dataConsulta(processo: ConsultaMinimaContinuidade): number {
  const valor = processo.dataConclusao || processo.dataInicio;
  if (valor instanceof Date) return valor.getTime();
  if (valor && typeof valor.toDate === 'function') return valor.toDate().getTime();
  return 0;
}

/**
 * Uma oportunidade = um diagnóstico ativo antes de uma consulta posterior concluída.
 * O estado anterior é reconstruído com o MESMO algoritmo do PE. A comparação respeita
 * o paciente proprietário do histórico; não cria vínculo entre cadastros distintos.
 * Não incorpora processos em andamento nem infere decisões não documentadas.
 */
export function reconstruirContinuidadePorConsulta(
  processosPaciente: ConsultaMinimaContinuidade[],
): Map<string, IndicadoresRetorno> {
  const resultado = new Map<string, IndicadoresRetorno>();
  const anteriores: ConsultaMinimaContinuidade[] = [];
  const concluidos = processosPaciente.filter(p => p.status === 'concluido' && dataConsulta(p) > 0)
    .sort((a, b) => dataConsulta(a) - dataConsulta(b) || a.idProcesso.localeCompare(b.idProcesso));

  for (const atual of concluidos) {
    const historico = anteriores.map(p => ({ ...p, id: p.idProcesso })) as unknown as ProcessoEnfermagem[];
    const disponiveis = diagnosticosAnterioresDisponiveis(historico, '');
    const idsDisponiveis = new Set(disponiveis.map(d => d.acompanhamentoId));
    const abordados = new Set((atual.avaliacao?.cuidadosAnterioresAbordados || [])
      .map(a => a.acompanhamentoId).filter(id => idsDisponiveis.has(id)));
    const decisoes = new Map<string, 'manter' | 'substituir' | 'encerrar'>();
    for (const decisao of atual.diagnostico?.reavaliacoesAnteriores || []) {
      if (!idsDisponiveis.has(decisao.acompanhamentoId)) continue;
      decisoes.set(decisao.acompanhamentoId, decisao.decisao);
      abordados.add(decisao.acompanhamentoId);
    }
    const estados = [...decisoes.values()];
    resultado.set(atual.idProcesso, {
      oportunidades: idsDisponiveis.size,
      abordados: abordados.size,
      mantidos: estados.filter(d => d === 'manter').length,
      substituidos: estados.filter(d => d === 'substituir').length,
      encerrados: estados.filter(d => d === 'encerrar').length,
      abordadosSemDecisao: [...abordados].filter(id => !decisoes.has(id)).length,
    });
    anteriores.push(atual);
  }
  return resultado;
}
