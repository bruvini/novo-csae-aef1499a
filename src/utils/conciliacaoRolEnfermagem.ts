/** Auditoria técnica, não prescrição e não autorização para mudar o catálogo. */
export interface LinhaRol {
  linha: number;
  tituloDiagnostico: string;
  descricaoDiagnostico: string;
  tipoSubconjunto1: string;
  tituloSubconjunto1: string;
  tipoSubconjunto2: string;
  tituloSubconjunto2: string;
  tituloResultado: string;
  descricaoResultado: string;
  acaoEnfermeiro: string;
  acaoPrescrita: string;
  tituloMaterialApoio: string;
  urlMaterialApoio: string;
}
export interface LinhaDiagnosticoResultado { linha: number; diagnostico: string; resultado: string }
export interface LinhaResultadoIntervencao { linha: number; resultado: string; intervencao: string }
export interface LinhaFonteRol {
  principal: LinhaRol[];
  diagnosticosResultados: LinhaDiagnosticoResultado[];
  resultadosIntervencoes: LinhaResultadoIntervencao[];
}
export interface InventarioDiagnostico {
  projeto: string;
  modo: string;
  geradoEmUTC?: string;
  colecoes: {
    rolEnfermagem: Array<{
      id: string;
      tituloDiagnostico: string;
      descricaoDiagnostico: string;
      subconjuntos: Array<{ tipoSubconjunto: string; tituloSubconjunto: string }>;
      resultadosEsperados: Array<{
        tituloResultado: string;
        descricaoResultado: string;
        intervencoes: Array<{
          acaoEnfermeiro: string;
          acaoPrescrita: string;
          materiaisDeApoio?: Array<{ tituloMaterialApoio: string; urlMaterialApoio: string }>;
        }>;
      }>;
    }>;
    subconjuntosEnfermagem: Array<{
      id: string; tipoSubconjunto: string; tituloSubconjunto: string;
    }>;
  };
}
type TipoAlerta =
  | 'nao-localizado'
  | 'duplicidade-no-firebase'
  | 'vinculo-nhb-divergente'
  | 'resultado-a-conferir'
  | 'intervencao-a-conferir'
  | 'fonte-inconsistente'
  | 'revisar-descricao';
export interface ItemRevisaoRol {
  tituloDiagnostico: string;
  documentosFirebase: string[];
  linhasOrigem: number[];
  alertas: Array<{ tipo: TipoAlerta; detalhe: string }>;
  decisao: 'revisao-csae' | 'comparacao-sem-pendencia-aparente' | 'apenas-firebase';
}
export interface RelatorioRol {
  projeto: 'csaefloripa';
  modo: 'somente_leitura';
  geradoEmUTCInventario: string;
  contagens: {
    linhasPrincipais: number;
    diagnosticosDistintosFonte: number;
    diagnosticosFirestore: number;
    resultadosRelacionadosFonte: number;
    intervencoesRelacionadasFonte: number;
  };
  itens: ItemRevisaoRol[];
  avisos: string[];
}
export const normalizarRol = (s: string) => (s || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  .replace(/[^a-z0-9]+/g, ' ').trim();
const nf = normalizarRol;
const tipar = (s: string): string => {
  const n = nf(s);
  return n === 'protocolo enfermagem' || n === 'protocolo' ? 'protocolo' : n;
};
const chaveSub = (tipo: string, titulo: string) => tipar(tipo) + ':' + nf(titulo);
const chaveIntervencao = (enfermeiro: string, prescrita: string) =>
  nf(enfermeiro) + '|' + nf(prescrita);
const mapa = <T>(items: T[], obter: (r: T) => string): Map<string, T[]> => {
  const out = new Map<string, T[]>();
  for (const item of items) {
    const nome = obter(item);
    if (!nome) continue;
    out.set(nome, [...(out.get(nome) || []), item]);
  }
  return out;
};
function adicionar(item: ItemRevisaoRol, tipo: TipoAlerta, detalhe: string): void {
  if (!item.alertas.some(a => a.tipo === tipo && a.detalhe === detalhe)) {
    item.alertas.push({ tipo, detalhe });
  }
}
const ausentes = (fonte: Set<string>, destino: Set<string>): string[] =>
  [...fonte].filter(x => !destino.has(x));

/**
 * Não cruza protocolos/sinais/exames: apenas rol e relações explícitas dos
 * três separadores do arquivo "Diagnósticos de Enfermagem e Resultados Esperados".
 */
export function conciliarRol(
  inventario: InventarioDiagnostico, planilha: LinhaFonteRol,
): RelatorioRol {
  if (inventario.projeto !== 'csaefloripa' || inventario.modo !== 'somente_leitura'
    || !Array.isArray(inventario.colecoes?.rolEnfermagem)
    || !Array.isArray(inventario.colecoes?.subconjuntosEnfermagem)) {
    throw new Error('Inventário clínico inválido. É obrigatório usar leitura do rol do projeto CSAE.');
  }
  const principal = mapa(planilha.principal, r => nf(r.tituloDiagnostico));
  const db = mapa(inventario.colecoes.rolEnfermagem, d => nf(d.tituloDiagnostico));
  const sourcePairs = new Set(planilha.diagnosticosResultados.map(
    r => nf(r.diagnostico) + ':' + nf(r.resultado)));
  const sourceActions = new Set(planilha.resultadosIntervencoes.map(
    r => nf(r.resultado) + ':' + nf(r.intervencao)));
  const nhbs = new Set(inventario.colecoes.subconjuntosEnfermagem
    .filter(r => tipar(r.tipoSubconjunto) === 'nhb').map(r => nf(r.tituloSubconjunto)));
  const itens: ItemRevisaoRol[] = [];

  for (const key of [...new Set([...principal.keys(), ...db.keys()])].sort()) {
    const linhas = principal.get(key) || [];
    const documentos = db.get(key) || [];
    const item: ItemRevisaoRol = {
      tituloDiagnostico: linhas[0]?.tituloDiagnostico || documentos[0]?.tituloDiagnostico || key,
      documentosFirebase: documentos.map(x => x.id),
      linhasOrigem: linhas.map(r => r.linha),
      alertas: [],
      decisao: 'comparacao-sem-pendencia-aparente',
    };
    if (!linhas.length) {
      item.decisao = 'apenas-firebase';
      itens.push(item);
      continue; // Não considerar ausência da planilha motivo para exclusão.
    }
    if (!documentos.length) adicionar(item, 'nao-localizado',
      'Título não localizado no Firestore. Pesquisar sinônimos e classificação antes de propor criação.');
    if (documentos.length > 1) adicionar(item, 'duplicidade-no-firebase',
      'Títulos equivalentes em documentos diferentes. Preservar todos os IDs até avaliar históricos.');

    const descriptions = new Set(linhas.map(r => nf(r.descricaoDiagnostico)).filter(Boolean));
    const mainResults = new Set(linhas.map(r => nf(r.tituloResultado)).filter(Boolean));
    const mainSubsets = new Set(linhas.flatMap(r => [
      chaveSub(r.tipoSubconjunto1, r.tituloSubconjunto1),
      chaveSub(r.tipoSubconjunto2, r.tituloSubconjunto2),
    ]).filter(x => !x.endsWith(':')));
    const sourceNHBs = new Set(linhas.flatMap(r => [
      { tipo: r.tipoSubconjunto1, nome: r.tituloSubconjunto1 },
      { tipo: r.tipoSubconjunto2, nome: r.tituloSubconjunto2 },
    ]).filter(s => tipar(s.tipo) === 'nhb' && nf(s.nome)).map(s => nf(s.nome)));
    for (const nhb of sourceNHBs) {
      if (!nhbs.has(nhb)) adicionar(item, 'vinculo-nhb-divergente',
        'A NHB declarada na planilha não foi localizada entre os subconjuntos existentes: ' + nhb);
    }
    for (const r of mainResults) {
      if (!sourcePairs.has(key + ':' + r)) adicionar(item, 'fonte-inconsistente',
        'Resultado da aba principal sem correspondência em DE-RE: ' + r);
    }
    for (const r of linhas) {
      const expected = nf(r.tituloResultado);
      const prescribed = nf(r.acaoPrescrita);
      if (expected && prescribed && !sourceActions.has(expected + ':' + prescribed)) {
        adicionar(item, 'fonte-inconsistente',
          'Ação da aba principal não localizada na aba ListaResultadosEsperados: ' + prescribed);
      }
    }

    if (documentos.length === 1) {
      const doc = documentos[0];
      if (descriptions.size > 1 ||
        (descriptions.size && !descriptions.has(nf(doc.descricaoDiagnostico)))) {
        adicionar(item, 'revisar-descricao',
          'Descrições do diagnóstico divergem entre fonte e Firestore. Não sobrescrever sem revisão.');
      }
      const dbSubs = new Set(doc.subconjuntos.map(r =>
        chaveSub(r.tipoSubconjunto, r.tituloSubconjunto)));
      if (ausentes(mainSubsets, dbSubs).length || ausentes(dbSubs, mainSubsets).length) {
        adicionar(item, 'vinculo-nhb-divergente',
          'Associações de NHB/protocolo diferentes nas duas fontes; revisar vínculo sem desvincular automaticamente.');
      }
      const dbResults = new Set(doc.resultadosEsperados.map(r => nf(r.tituloResultado)));
      const missing = ausentes(mainResults, dbResults);
      const extra = ausentes(dbResults, mainResults);
      if (missing.length || extra.length) adicionar(item, 'resultado-a-conferir',
        'Resultados vinculados distintos: presentes apenas no Drive (' + missing.length +
        '), apenas no Firestore (' + extra.length + '). Não excluir resultados extras.');
      const expectedActions = new Map<string, Set<string>>();
      for (const row of linhas) {
        const outcome = nf(row.tituloResultado);
        if (!outcome || !nf(row.acaoEnfermeiro + row.acaoPrescrita)) continue;
        if (!expectedActions.has(outcome)) expectedActions.set(outcome, new Set());
        expectedActions.get(outcome)!.add(chaveIntervencao(row.acaoEnfermeiro, row.acaoPrescrita));
      }
      for (const result of doc.resultadosEsperados) {
        const out = nf(result.tituloResultado);
        const expected = expectedActions.get(out);
        if (!expected) continue;
        const present = new Set(result.intervencoes.map(i =>
          chaveIntervencao(i.acaoEnfermeiro, i.acaoPrescrita)));
        if (ausentes(expected, present).length || ausentes(present, expected).length) {
          adicionar(item, 'intervencao-a-conferir',
            'Intervenções diferentes no resultado "' + result.tituloResultado +
            '": apenas Drive (' + ausentes(expected, present).length +
            '), apenas Firestore (' + ausentes(present, expected).length + ').');
        }
      }
    }
    if (item.alertas.length) item.decisao = 'revisao-csae';
    itens.push(item);
  }
  return {
    projeto: 'csaefloripa', modo: 'somente_leitura',
    geradoEmUTCInventario: inventario.geradoEmUTC || 'não informada',
    contagens: {
      linhasPrincipais: planilha.principal.length,
      diagnosticosDistintosFonte: principal.size,
      diagnosticosFirestore: inventario.colecoes.rolEnfermagem.length,
      resultadosRelacionadosFonte: new Set(planilha.principal
        .filter(r => nf(r.tituloResultado)).map(r => nf(r.tituloDiagnostico) + ':' + nf(r.tituloResultado))).size,
      intervencoesRelacionadasFonte: new Set(planilha.principal
        .filter(r => nf(r.acaoEnfermeiro + r.acaoPrescrita))
        .map(r => nf(r.tituloDiagnostico) + ':' + nf(r.tituloResultado) +
          ':' + chaveIntervencao(r.acaoEnfermeiro, r.acaoPrescrita))).size,
    },
    itens,
    avisos: [
      'Não importa nem altera conteúdo; relatório de conciliação não substitui decisão da CSAE.',
      'Nomes normalizados indicam correspondência textual, não equivalência clínica.',
      'Documentos presentes apenas no Firestore não devem ser excluídos.',
      'Resultados, intervenções, materiais e NHBs vinculados dependem de avaliação institucional.',
      'Não utilizar outras planilhas desta pasta como referência de exames físicos ou parâmetros vitais.',
    ],
  };
}
