#!/usr/bin/env -S npx tsx
/**
 * Comparação OFFLINE dos diagnósticos/resultados/intervenções, sem Firestore.
 *
 * npm run conciliar:rol -- inventario_rol.json "Diagnósticos e Resultados.xlsx" relatorio.json
 *
 * Fonte: exclusivamente as 3 abas de "Diagnósticos de Enfermagem e Resultados Esperados".
 * Nenhuma planilha de exame físico ou de parâmetros pode ser usada aqui.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import ExcelJS, { type Worksheet } from 'exceljs';
import {
  conciliarRol, type InventarioDiagnostico, type LinhaFonteRol, type LinhaRol,
} from '../src/utils/conciliacaoRolEnfermagem';

const ABAS = {
  ListaDiagnosticos: [
    'tituloDiagnostico','descricaoDiagnostico','tipoSubconjunto1','tituloSubconjunto1',
    'tipoSubconjunto2','tituloSubconjunto2','tituloResultado','descricaoResultado',
    'acaoEnfermeiro','acaoPrescrita','tituloMaterialApoio','urlMaterialApoio',
  ],
  'DE-RE': ['DE', 'RE'],
  ListaResultadosEsperados: ['tituloResultado','acaoPrescrita'],
} as const;
function valor(sheet: Worksheet, row: number, col: number): string {
  const cell = sheet.getRow(row).getCell(col + 1);
  if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) {
    throw new Error('Fórmula não permitida em ' + sheet.name + '!' + cell.address +
      '. Verifique o valor na fonte antes de reconciliar.');
  }
  return cell.text.trim();
}
function linhas(sheet: Worksheet, headers: readonly string[]): Array<{ linha: number; celulas: string[] }> {
  for (let i = 0; i < headers.length; i += 1) {
    if (valor(sheet, 1, i) !== headers[i]) {
      throw new Error('Cabeçalho inesperado: ' + sheet.name + ' coluna ' + (i+1) +
        ' — esperado "' + headers[i] + '". Confirme o arquivo de diagnósticos, não o de exame físico.');
    }
  }
  if (sheet.rowCount > 10000) throw new Error('Mais de 10 mil linhas em ' + sheet.name + ': revise a origem.');
  const saida: Array<{ linha: number; celulas: string[] }> = [];
  for (let i = 2; i <= sheet.rowCount; i += 1) {
    const celulas = headers.map((_, j) => valor(sheet, i, j));
    if (celulas.some(Boolean)) saida.push({ linha: i, celulas });
  }
  return saida;
}
async function main(): Promise<void> {
  const [inventarioPath, workbookPath, outputPath] = process.argv.slice(2);
  if (!inventarioPath || !workbookPath || !outputPath || !workbookPath.endsWith('.xlsx')
    || !outputPath.endsWith('.json')) {
    throw new Error('Uso: npm run conciliar:rol -- <inventario_rol.json> <diagnosticos.xlsx> <relatorio.json>');
  }
  const inventario = JSON.parse(readFileSync(inventarioPath, 'utf8')) as InventarioDiagnostico;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  const get = (name: keyof typeof ABAS) => {
    const sheet = workbook.getWorksheet(name);
    if (!sheet) throw new Error('Aba de diagnósticos ausente: ' + name);
    return linhas(sheet, ABAS[name]);
  };
  const fonte: LinhaFonteRol = {
    principal: get('ListaDiagnosticos').map(item => {
      const values = Object.fromEntries(ABAS.ListaDiagnosticos.map(
        (key, index) => [key, item.celulas[index]]));
      return { linha: item.linha, ...values } as unknown as LinhaRol;
    }),
    diagnosticosResultados: get('DE-RE').map(
      row => ({ linha: row.linha, diagnostico: row.celulas[0], resultado: row.celulas[1] })),
    resultadosIntervencoes: get('ListaResultadosEsperados').map(
      row => ({ linha: row.linha, resultado: row.celulas[0], intervencao: row.celulas[1] })),
  };
  if (!fonte.principal.length) throw new Error('ListaDiagnosticos sem linhas; não gerar relatório vazio.');
  const resultado = conciliarRol(inventario, fonte);
  writeFileSync(outputPath, JSON.stringify(resultado, null, 2) + '\n',
    { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  const aRevisar = resultado.itens.filter(item => item.decisao === 'revisao-csae').length;
  console.log('CSAE — SOMENTE LEITURA; nenhuma gravação no Firestore ou no Drive.');
  console.log('Linhas da planilha:', resultado.contagens.linhasPrincipais);
  console.log('Diagnósticos distintos na fonte:', resultado.contagens.diagnosticosDistintosFonte);
  console.log('Diagnósticos no Firebase:', resultado.contagens.diagnosticosFirestore);
  console.log('Diagnósticos que exigem revisão:', aRevisar);
  console.log('Relatório privado:', outputPath);
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Falha ao comparar diagnósticos');
  process.exitCode = 1;
});
