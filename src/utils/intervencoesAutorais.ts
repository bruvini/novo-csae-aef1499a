import type { Diagnostico } from '@/services/bancodados/rolEnfermagemDB';

export const normalizarAcao = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');

export async function identificadorSugestao(processoId: string, diagnosticoId: string, resultado: string, texto: string, autorId: string) {
  const bytes = new TextEncoder().encode(JSON.stringify([processoId, diagnosticoId, resultado, texto, autorId]));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function encontrarResultado(diagnostico: Diagnostico, titulo: string) {
  const iguais = diagnostico.resultadosEsperados.filter(resultado => resultado.tituloResultado === titulo);
  if (iguais.length !== 1) throw new Error(`Resultado ausente ou ambíguo em ${diagnostico.tituloDiagnostico}: ${titulo}`);
  return iguais[0];
}

export function incorporarIntervencao(diagnostico: Diagnostico, destinos: string[], acaoPrescrita: string, acaoEnfermeiro: string, origemSugestaoId?: string) {
  for (const titulo of destinos) encontrarResultado(diagnostico, titulo);
  return diagnostico.resultadosEsperados.map(resultado => {
    if (!destinos.includes(resultado.tituloResultado)) return resultado;
    const anteriores = resultado.intervencoes || [];
    if (anteriores.some(item => normalizarAcao(item.acaoPrescrita) === normalizarAcao(acaoPrescrita))) {
      throw new Error(`Intervenção já existe em ${resultado.tituloResultado}`);
    }
    return { ...resultado, intervencoes: [...anteriores, { acaoPrescrita, acaoEnfermeiro, materiaisDeApoio: [], ...(origemSugestaoId ? { origemSugestaoId } : {}) }] };
  });
}
