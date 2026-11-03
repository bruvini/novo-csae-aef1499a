import type { Intervencao, Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import type { IntervencaoBiblioteca } from '@/services/bancodados/intervencoesAutoraisDB';

export type EstadoCatalogoPlanejamento = 'carregando' | 'carregado' | 'erro';

export type ResolucaoDiagnostico =
  | { estado: 'carregando' }
  | { estado: 'erro' }
  | { estado: 'nao_encontrado' }
  | { estado: 'sem_resultados'; diagnostico: Diagnostico }
  | { estado: 'com_resultados'; diagnostico: Diagnostico };

export function resolverDiagnosticoPlanejamento(
  id: string,
  catalogo: Diagnostico[],
  estado: EstadoCatalogoPlanejamento,
): ResolucaoDiagnostico {
  if (estado === 'carregando') return { estado };
  if (estado === 'erro') return { estado };
  const diagnostico = catalogo.find(item => item.id === id);
  if (!diagnostico) return { estado: 'nao_encontrado' };
  return diagnostico.resultadosEsperados?.length
    ? { estado: 'com_resultados', diagnostico }
    : { estado: 'sem_resultados', diagnostico };
}

export type OpcaoIntervencaoPlanejamento =
  | { origem: 'catalogo'; chave: string; indiceCatalogo: number; intervencao: Intervencao }
  | { origem: 'biblioteca'; chave: string; intervencao: IntervencaoBiblioteca };

const normalizar = (texto: string) => texto.trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
const identidade = (acao: string, enfermeiro: string) => `${normalizar(acao)}|${normalizar(enfermeiro)}`;

export function combinarIntervencoesPlanejamento(
  nativas: Intervencao[],
  aprovadas: IntervencaoBiblioteca[],
): OpcaoIntervencaoPlanejamento[] {
  const resultado: OpcaoIntervencaoPlanejamento[] = [];
  const indices = new Map<string, number>();
  nativas.forEach((intervencao, indiceCatalogo) => {
    const chave = identidade(intervencao.acaoPrescrita, intervencao.acaoEnfermeiro);
    indices.set(chave, resultado.length);
    resultado.push({ origem: 'catalogo', chave: `catalogo:${indiceCatalogo}`, indiceCatalogo, intervencao });
  });
  aprovadas.forEach(intervencao => {
    const chave = identidade(intervencao.acaoPrescrita, intervencao.acaoEnfermeiro);
    const existente = indices.get(chave);
    const opcao: OpcaoIntervencaoPlanejamento = { origem: 'biblioteca', chave: `biblioteca:${intervencao.id}:v${intervencao.versao}`, intervencao };
    if (existente === undefined) {
      indices.set(chave, resultado.length);
      resultado.push(opcao);
    } else {
      // Uma publicação aprovada tem identidade/proveniência própria; usa a ação aprovada sem duplicar a opção nativa.
      resultado[existente] = opcao;
    }
  });
  return resultado;
}

export function removerProcessoPorId<T extends { idProcesso: string }>(processos: T[], processoId: string): T[] {
  return processos.filter(processo => processo.idProcesso !== processoId);
}
