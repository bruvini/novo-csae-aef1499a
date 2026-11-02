export const COLECOES_CATALOGO = ['SinaisVitais', 'ExamesLabImagem', 'RevisaoSistemas', 'subconjuntosEnfermagem', 'rolEnfermagem'] as const;
export type ColecaoCatalogo = typeof COLECOES_CATALOGO[number];
export type DocumentoCatalogo = { id: string; dados: Record<string, unknown> };
export type Catalogo = Record<ColecaoCatalogo, DocumentoCatalogo[]>;
type Linha = Record<string, unknown>;
export type AbaCatalogo = { nome: string; arquivo: string; linhas: Linha[] };

const objeto = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const lista = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const texto = (value: unknown): string => typeof value === 'string' ? value : '';
const idFilho = (pai: string, campo: string, indice: number) => `${pai}/${campo}/${indice}`;

export function normalizarCatalogo(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return ((value as { toDate: () => Date }).toDate()).toISOString();
  }
  if (Array.isArray(value)) return value.map(normalizarCatalogo);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizarCatalogo(item)]));
  return value;
}

// IDs de exportação usam o caminho do documento e o índice original do array.
// São estáveis para um mesmo retrato e não são gravados no Firestore.
export function criarAbasCatalogo(catalogo: Catalogo): AbaCatalogo[] {
  const abas: AbaCatalogo[] = [
    ['Sinais Vitais', 'sinais_vitais'], ['Referências Vitais', 'referencias_vitais'],
    ['Exames Diagnósticos', 'exames_diagnosticos'], ['Componentes dos Exames', 'componentes_exames'],
    ['Resultados dos Exames', 'resultados_exames'], ['Sistemas Corporais', 'sistemas_corporais'],
    ['Exames Físicos', 'exames_fisicos'], ['Achados Clínicos', 'achados_clinicos'],
    ['Opções dos Achados', 'opcoes_achados'], ['Subconjuntos', 'subconjuntos'],
    ['Diagnósticos', 'diagnosticos'], ['Vínculos Diagnósticos', 'vinculos_diagnosticos'],
    ['Resultados Esperados', 'resultados_esperados'], ['Intervenções', 'intervencoes'],
    ['Materiais de Apoio', 'materiais_apoio'],
  ].map(([nome, arquivo]) => ({ nome, arquivo, linhas: [] }));
  const push = (aba: number, linha: Linha, campos: Record<string, unknown>) => {
    abas[aba].linhas.push({ ...linha, ...objeto(normalizarCatalogo(campos)) });
  };
  for (const doc of catalogo.SinaisVitais) {
    const { valoresDeReferencia, ...campos } = doc.dados;
    push(0, { id: doc.id }, campos);
    lista(valoresDeReferencia).forEach((item, i) => push(1, { id: idFilho(doc.id, 'valoresDeReferencia', i), sinalVitalId: doc.id }, objeto(item)));
  }
  for (const doc of catalogo.ExamesLabImagem) {
    const { componentes, ...campos } = doc.dados;
    push(2, { id: doc.id }, campos);
    lista(componentes).forEach((componente, i) => {
      const cid = idFilho(doc.id, 'componentes', i);
      const { resultados, ...dados } = objeto(componente);
      push(3, { id: cid, exameId: doc.id }, dados);
      lista(resultados).forEach((resultado, j) => push(4, { id: idFilho(cid, 'resultados', j), exameId: doc.id, componenteId: cid }, objeto(resultado)));
    });
  }
  for (const doc of catalogo.RevisaoSistemas) {
    const { exames, ...campos } = doc.dados;
    push(5, { id: doc.id }, campos);
    lista(exames).forEach((exame, i) => {
      const eid = idFilho(doc.id, 'exames', i);
      const { achados, ...dados } = objeto(exame);
      push(6, { id: eid, sistemaId: doc.id }, dados);
      lista(achados).forEach((achado, j) => {
        const aid = idFilho(eid, 'achados', j);
        const { opcoes, ...camposAchado } = objeto(achado);
        push(7, { id: aid, sistemaId: doc.id, exameId: eid }, camposAchado);
        lista(opcoes).forEach((opcao, k) => push(8, { id: idFilho(aid, 'opcoes', k), achadoId: aid }, objeto(opcao)));
      });
    });
  }
  for (const doc of catalogo.subconjuntosEnfermagem) push(9, { id: doc.id }, doc.dados);
  for (const doc of catalogo.rolEnfermagem) {
    const { subconjuntos, resultadosEsperados, ...campos } = doc.dados;
    push(10, { id: doc.id }, campos);
    lista(subconjuntos).forEach((item, i) => push(11, { id: idFilho(doc.id, 'subconjuntos', i), diagnosticoId: doc.id }, objeto(item)));
    lista(resultadosEsperados).forEach((resultado, i) => {
      const rid = idFilho(doc.id, 'resultadosEsperados', i);
      const { intervencoes, ...dados } = objeto(resultado);
      push(12, { id: rid, diagnosticoId: doc.id }, dados);
      lista(intervencoes).forEach((intervencao, j) => {
        const iid = idFilho(rid, 'intervencoes', j);
        const { materiaisDeApoio, ...dadosIntervencao } = objeto(intervencao);
        push(13, { id: iid, diagnosticoId: doc.id, resultadoId: rid }, dadosIntervencao);
        lista(materiaisDeApoio).forEach((material, k) => push(14, { id: idFilho(iid, 'materiaisDeApoio', k), intervencaoId: iid }, objeto(material)));
      });
    });
  }
  return abas;
}

export function criarJsonCatalogo(catalogo: Catalogo, inicio: Date, fim: Date): string {
  return JSON.stringify({ schemaVersion: 1, portal: 'CSAE Floripa 2.0', projetoFirebase: 'csaefloripa',
    leituraInicio: inicio.toISOString(), leituraFim: fim.toISOString(),
    colecoes: Object.fromEntries(COLECOES_CATALOGO.map(nome => [nome, {
      quantidade: catalogo[nome].length,
      documentos: catalogo[nome].map(doc => ({ id: doc.id, dados: normalizarCatalogo(doc.dados) })),
    }])) }, null, 2);
}

const seguro = (value: unknown): string | number | boolean => {
  if (value == null) return '';
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  const string = typeof value === 'string' ? value : JSON.stringify(value);
  return /^[\s]*[=+\-@\t\r]/.test(string) ? `'${string}` : string;
};
const colunas = (aba: AbaCatalogo) => [...new Set(['id', ...aba.linhas.flatMap(linha => Object.keys(linha))])];

export function csvDaAba(aba: AbaCatalogo): string {
  const keys = colunas(aba);
  const celula = (value: unknown) => `"${String(seguro(value)).replace(/"/g, '""')}"`;
  return '\uFEFF' + [keys.map(celula).join(';'), ...aba.linhas.map(linha => keys.map(key => celula(linha[key])).join(';'))].join('\r\n');
}

export async function gerarZipCatalogo(abas: AbaCatalogo[]): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  abas.forEach(aba => zip.file(`${aba.arquivo}.csv`, csvDaAba(aba)));
  return zip.generateAsync({ type: 'blob' });
}

export async function gerarXlsxCatalogo(abas: AbaCatalogo[]): Promise<Blob> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  abas.forEach(aba => {
    const sheet = workbook.addWorksheet(aba.nome);
    const keys = colunas(aba);
    sheet.columns = keys.map(key => ({ header: key, key, width: Math.min(60, Math.max(16, key.length + 4)) }));
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: keys.length } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
    aba.linhas.forEach(linha => sheet.addRow(Object.fromEntries(keys.map(key => [key, seguro(linha[key])]))));
    sheet.eachRow(row => { if (row.number > 1) row.alignment = { vertical: 'top', wrapText: true }; });
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
