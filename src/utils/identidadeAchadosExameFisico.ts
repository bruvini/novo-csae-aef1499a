import type { ExameFisicoSelecao } from '@/types/processoEnfermagem';

export interface IdentidadeAchadoPartes {
  sistemaId: string;
  exame: string;
  indiceAchado: number;
  achado: string;
  indiceOpcao?: number;
  opcao?: string;
}

export function chaveSelecaoLegada(exame: string, texto: string): string {
  return encodeURIComponent(JSON.stringify([exame, texto]));
}

export function criarIdentidadeAchadoExameFisico(partes: IdentidadeAchadoPartes): string {
  return encodeURIComponent(JSON.stringify([
    partes.sistemaId, partes.exame, partes.indiceAchado, partes.achado,
    partes.indiceOpcao ?? null, partes.opcao ?? null,
  ]));
}

export function alternarSelecaoAchado(
  selecoes: Record<string, ExameFisicoSelecao>,
  selecao: ExameFisicoSelecao,
  marcada: boolean,
): Record<string, ExameFisicoSelecao> {
  const next = { ...selecoes };
  if (!marcada) {
    delete next[selecao.identidade];
    return next;
  }
  for (const [id, atual] of Object.entries(next)) {
    if (atual.grupoAchado === selecao.grupoAchado) delete next[id];
  }
  next[selecao.identidade] = selecao;
  return next;
}

/** Só associa texto legado quando ele identifica uma única opção no catálogo. */
export function resolverSelecaoLegada<T extends { sistemaId: string; exame: string; texto: string }>(
  registros: T[], sistemaId: string, exame: string, texto: string,
): T | undefined {
  const encontrados = registros.filter(item => item.exame === exame && item.texto === texto
    && (!sistemaId || item.sistemaId === sistemaId));
  return encontrados.length === 1 ? encontrados[0] : undefined;
}
