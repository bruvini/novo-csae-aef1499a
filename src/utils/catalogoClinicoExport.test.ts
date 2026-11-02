import { test } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { criarAbasCatalogo, criarJsonCatalogo, csvDaAba, gerarXlsxCatalogo, gerarZipCatalogo, type Catalogo } from './catalogoClinicoExport';

const fixture = (): Catalogo => ({
  SinaisVitais: [{ id: 'sv', dados: { sinalVitalNome: 'Pressão', unidadeMedida: 'mmHg', valoresDeReferencia: [{ idadeMinima: 0, valorMaximo: 120, criterioSexo: 'Ambos' }] } }],
  ExamesLabImagem: [{ id: 'ex', dados: { nomeExame: 'Hemograma', componentes: [{ componenteAnalisado: 'Hb', resultados: [{ valorMinimo: 0, interpretacaoClinica: 'normal' }] }] } }],
  RevisaoSistemas: [{ id: 'si', dados: { nomeSistema: 'Respiratório', exames: [{ nomeExame: 'Ausculta', propedeutica: 'Ausculta', achados: [{ descricaoAchado: 'Normal', opcoes: [{ textoOpcao: 'Sim' }] }] }] } }],
  subconjuntosEnfermagem: [{ id: 'su', dados: { tituloSubconjunto: 'Teste' } }],
  rolEnfermagem: [{ id: 'dg', dados: { tituloDiagnostico: '=1+1', resultadosEsperados: [
    { tituloResultado: 'R1', intervencoes: [{ acaoPrescrita: 'A1', materiaisDeApoio: [{ tituloMaterialApoio: 'Guia', urlMaterialApoio: 'https://example.test' }] }, { acaoPrescrita: 'A2', materiaisDeApoio: [] }] },
    { tituloResultado: 'R2', intervencoes: [] },
  ], subconjuntos: [{ tituloSubconjunto: 'Teste', tipoSubconjunto: 'NHB' }] } }],
});

test('15 abas preservam coleções, IDs e relações clínicas sem alterar originais', () => {
  const dados = fixture();
  const antes = JSON.stringify(dados);
  const abas = criarAbasCatalogo(dados);
  assert.equal(abas.length, 15);
  assert.deepEqual(abas.map(aba => aba.linhas.length), [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 1]);
  assert.equal(abas[13].linhas[0].resultadoId, abas[12].linhas[0].id);
  assert.equal(abas[14].linhas[0].intervencaoId, abas[13].linhas[0].id);
  assert.equal(abas[1].linhas[0].idadeMinima, 0);
  assert.equal(JSON.stringify(dados), antes);
});

test('coleções vazias continuam representadas sem inventar linhas', () => {
  const vazio: Catalogo = { SinaisVitais: [], ExamesLabImagem: [], RevisaoSistemas: [], subconjuntosEnfermagem: [], rolEnfermagem: [] };
  const abas = criarAbasCatalogo(vazio);
  assert.equal(abas.length, 15);
  assert.ok(abas.every(aba => aba.linhas.length === 0));
  assert.equal(JSON.parse(criarJsonCatalogo(vazio, new Date(0), new Date(0))).colecoes.rolEnfermagem.quantidade, 0);
});

test('JSON mantém campos e timestamps em ISO com contagens por coleção', () => {
  const dados = fixture();
  dados.SinaisVitais[0].dados.dataCadastro = { toDate: () => new Date('2026-11-02T12:00:00Z') };
  const json = JSON.parse(criarJsonCatalogo(dados, new Date('2026-11-02T12:00:00Z'), new Date('2026-11-02T12:00:01Z')));
  assert.equal(json.colecoes.SinaisVitais.quantidade, 1);
  assert.equal(json.colecoes.SinaisVitais.documentos[0].dados.dataCadastro, '2026-11-02T12:00:00.000Z');
  assert.equal(json.colecoes.rolEnfermagem.documentos[0].dados.resultadosEsperados.length, 2);
});

test('CSV e ZIP incluem 15 arquivos e neutralizam fórmulas e caracteres especiais', async () => {
  const abas = criarAbasCatalogo(fixture());
  const csv = csvDaAba(abas[10]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /'=1\+1/);
  const zip = await JSZip.loadAsync(await gerarZipCatalogo(abas));
  assert.equal(Object.keys(zip.files).length, 15);
  assert.equal(await zip.file('diagnosticos.csv')?.async('string'), csv);
});

test('XLSX abre com 15 abas e textos clínicos não viram fórmulas', async () => {
  const workbook = new ExcelJS.Workbook();
  const buffer = await gerarXlsxCatalogo(criarAbasCatalogo(fixture()));
  await workbook.xlsx.load(await buffer.arrayBuffer());
  assert.equal(workbook.worksheets.length, 15);
  const sheet = workbook.getWorksheet('Diagnósticos');
  assert.ok(sheet);
  const row = sheet.getRow(2);
  const cell = row.getCell((sheet.getRow(1).values as unknown[]).indexOf('tituloDiagnostico'));
  assert.equal(cell.value, "'=1+1");
  assert.equal(cell.type, ExcelJS.ValueType.String);
});


