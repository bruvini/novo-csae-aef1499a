import { normalizarNomeClinico } from './referenciasClinicas';

interface VinculoSubset { tipoSubconjunto: string; tituloSubconjunto: string }
interface VinculoIntervencao { acaoPrescrita: string; acaoEnfermeiro?: string }
interface VinculoResultado {
  tituloResultado: string;
  intervencoes: VinculoIntervencao[];
}
export interface IdentidadesRol {
  tituloDiagnostico: string;
  subconjuntos: VinculoSubset[];
  resultadosEsperados: VinculoResultado[];
}

const chave = (value: string) => normalizarNomeClinico(value);
const chaveSubset = (s: VinculoSubset) => chave(s.tipoSubconjunto) + ':' + chave(s.tituloSubconjunto);

/**
 * Etapa de Planejamento utiliza o ID do diagnóstico, o título do resultado e
 * o texto prescrito da intervenção. Esses identificadores devem sobreviver
 * à edição ordinária do catálogo para não quebrar processos antigos.
 */
export function protegerVinculosDoRol(anterior: IdentidadesRol, proximo: IdentidadesRol): void {
  if (anterior.tituloDiagnostico !== proximo.tituloDiagnostico) {
    throw new Error('Não é permitido renomear um diagnóstico usado em processos históricos. Use migração versionada.');
  }
  const antigosSub = new Set((anterior.subconjuntos || []).map(chaveSubset));
  const novosSub = new Set((proximo.subconjuntos || []).map(chaveSubset));
  for (const nome of antigosSub) if (!novosSub.has(nome)) {
    throw new Error('Não é permitido remover vínculos de NHBs ou protocolos já cadastrados sem revisão versionada.');
  }

  const resultadosAtuais = proximo.resultadosEsperados || [];
  const antes = anterior.resultadosEsperados || [];
  const antigosPorNome = new Map(antes.map(resultado => [resultado.tituloResultado, resultado]));
  const novosPorNome = new Map(resultadosAtuais.map(resultado => [resultado.tituloResultado, resultado]));
  // Mantém legados repetidos editáveis, mas impede introduzir novos títulos ambíguos.
  const contagem = (arr: VinculoResultado[]) => {
    const c = new Map<string, number>();
    for (const x of arr) c.set(chave(x.tituloResultado), (c.get(chave(x.tituloResultado)) || 0) + 1);
    return c;
  };
  const antigosContados = contagem(antes);
  const novosContados = contagem(resultadosAtuais);
  for (const [nome, totalAnterior] of antigosContados) {
    if ((novosContados.get(nome) || 0) < totalAnterior) {
      throw new Error('Não é permitido eliminar resultados antigos, inclusive legados repetidos: ' + nome);
    }
  }
  for (const [nome, quantidade] of novosContados) {
    if (quantidade > 1 && quantidade > (antigosContados.get(nome) || 0)) {
      throw new Error('Resultado esperado duplicado no mesmo diagnóstico: ' + nome);
    }
  }
  for (const [nome, antigo] of antigosPorNome) {
    const novo = novosPorNome.get(nome);
    if (!novo) {
      throw new Error('Não é permitido excluir/renomear resultado esperado já utilizado: ' + nome);
    }
    const originais = new Set((antigo.intervencoes || []).map(i => i.acaoPrescrita));
    const prescritas = new Set((novo.intervencoes || []).map(i => i.acaoPrescrita));
    for (const prescricao of originais) if (!prescritas.has(prescricao)) {
      throw new Error('Não é permitido excluir/renomear ação prescrita histórica: ' + prescricao);
    }
    // Ação do enfermeiro não é a chave principal do planejamento, mas alterações
    // também devem preservar a vinculação sem substituir descrição automaticamente.
    for (const intervention of antigo.intervencoes || []) {
      const match = (novo.intervencoes || []).find(i => i.acaoPrescrita === intervention.acaoPrescrita);
      if (match && intervention.acaoEnfermeiro !== match.acaoEnfermeiro) {
        throw new Error('Ação do enfermeiro vinculada à prescrição foi modificada. Submeta revisão versionada.');
      }
    }
  }
}
