/**
 * Conciliação local SOMENTE LEITURA.
 * Uso:
 *   npm run conciliar:clinical -- inventario_clinico.json "Exame físico.xlsx" relatorio.json
 *
 * O inventário é gerado pelo script auditar-catalogo-clinico.py.
 * Exportar a planilha nativa "Exame físico" do Drive em .xlsx, sem alterar o original.
 * Não acessa Firestore, pacientes, usuários, credenciais ou rede.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import ExcelJS from 'exceljs';
import { conciliarCatalogoClinico, type AbaOrigem, type FontesPlanilha, type InventarioClinico } from '../src/utils/conciliacaoCatalogo';

const NOMES_ABAS: AbaOrigem[] = ['SinaisVitais', 'RevisaoSistemas', 'ExamesLabImagem'];
const CABECALHOS: Record<AbaOrigem, Array<[number, string]>> = {
  SinaisVitais: [[0, 'sinalVitalNome'], [3, 'idadeMinima'], [8, 'valorMinimo'], [10, 'nomeAlteracao']],
  RevisaoSistemas: [[0, 'Nome do sistema'], [3, 'Exame'], [8, 'Achado']],
  ExamesLabImagem: [[0, 'nomeExame'], [2, 'tipoExame'], [3, 'componenteAnalisado'], [12, 'nomeAlteracao']],
};
function lerTexto(sheet: ExcelJS.Worksheet, linha: number, coluna: number): string {
  return sheet.getRow(linha).getCell(coluna + 1).text.trim();
}
async function executar() {
  const [inventarioPath, planilhaPath, saidaPath] = process.argv.slice(2);
  if (!inventarioPath || !planilhaPath || !saidaPath) {
    throw new Error('Uso: npm run conciliar:clinical -- <inventario.json> <exame-fisico.xlsx> <relatorio.json>');
  }
  if (!planilhaPath.toLowerCase().endsWith('.xlsx') || !saidaPath.toLowerCase().endsWith('.json')) {
    throw new Error('A planilha deve ser XLSX e o relatório deve ser JSON.');
  }
  const inventario = JSON.parse(readFileSync(inventarioPath, 'utf8')) as InventarioClinico;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(planilhaPath);
  const fontes = {} as FontesPlanilha;
  for (const nome of NOMES_ABAS) {
    const sheet = workbook.getWorksheet(nome);
    if (!sheet) throw new Error('Aba obrigatória ausente: ' + nome);
    for (const [col, esperado] of CABECALHOS[nome]) {
      const real = lerTexto(sheet, 1, col);
      if (real !== esperado) {
        throw new Error('Layout divergente em ' + nome + '!' + (col + 1) +
          ': esperado ' + esperado + ', encontrado ' + real);
      }
    }
    if (sheet.rowCount > 10000) {
      throw new Error('Planilha acima do limite seguro de 10 mil linhas por aba: ' + nome);
    }
    const linhas: FontesPlanilha[AbaOrigem] = [];
    const ultimaColuna = nome === 'SinaisVitais' ? 12 : nome === 'ExamesLabImagem' ? 14 : 11;
    for (let n = 2; n <= sheet.rowCount; n += 1) {
      const celulas = Array.from({ length: ultimaColuna }, (_, col) => lerTexto(sheet, n, col));
      if (celulas.some(c => c)) linhas.push({ linha: n, celulas });
    }
    fontes[nome] = linhas;
  }
  const relatorio = conciliarCatalogoClinico(inventario, fontes);
  writeFileSync(saidaPath, JSON.stringify(relatorio, null, 2) + '\n',
    { flag: 'wx', mode: 0o600, encoding: 'utf8' });
  console.log('Relatório somente leitura: ' + saidaPath);
  console.log(JSON.stringify({ contagensOrigem: relatorio.contagensOrigem,
    totaisPorAcao: relatorio.totaisPorAcao }, null, 2));
  console.log('Nenhum dado do Firestore foi alterado. Cada ação requer avaliação e aprovação da CSAE.');
}
executar().catch((error: unknown) => {
  console.error('Conciliação cancelada: ' + (error instanceof Error ? error.message : 'erro não identificado'));
  process.exitCode = 1;
});
