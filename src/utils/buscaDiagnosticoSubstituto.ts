import type { Diagnostico } from '@/services/bancodados/rolEnfermagemDB';

export function normalizarTermoDiagnostico(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
}

export function buscarDiagnosticosSubstitutos(diagnosticos: Diagnostico[], consulta: string): Diagnostico[] {
  const termo = normalizarTermoDiagnostico(consulta);
  if (!termo) return [];

  return diagnosticos.flatMap(diagnostico => {
    const titulo = normalizarTermoDiagnostico(diagnostico.tituloDiagnostico || '');
    const descricao = normalizarTermoDiagnostico(diagnostico.descricaoDiagnostico || '');
    const relevancia = titulo === termo ? 0
      : titulo.startsWith(termo) ? 1
        : titulo.includes(termo) ? 2
          : descricao.startsWith(termo) ? 3
            : descricao.includes(termo) ? 4
              : -1;
    return relevancia < 0 ? [] : [{ diagnostico, relevancia, titulo }];
  }).sort((a, b) => a.relevancia - b.relevancia || a.titulo.localeCompare(b.titulo, 'pt-BR') || a.diagnostico.id.localeCompare(b.diagnostico.id))
    .map(item => item.diagnostico);
}

export function atualizarBuscaPorAcompanhamento(
  buscas: Record<string, string>, acompanhamentoId: string, termo: string,
): Record<string, string> {
  return { ...buscas, [acompanhamentoId]: termo };
}
