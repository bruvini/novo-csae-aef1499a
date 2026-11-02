import ExcelJS, { type Worksheet } from 'exceljs';
import type { EstatisticasBI, EvolucaoEntry } from '@/services/bancodados/biUsuariosDB';
import type { EstatisticasProducao, ItemRanking, ItemTemporal } from '@/utils/painelEstatistico';
import { formatarVariacao } from '@/utils/painelEstatistico';

const VERDE = '08783E';
const VERDE_CLARO = 'E8F5EE';
const CINZA = 'E5E7EB';
const TEXTO = '1F2937';
const BRANCO = 'FFFFFF';

export interface OpcoesExportacaoPainel {
  usuarios: EstatisticasBI;
  producao: EstatisticasProducao;
  geradoEm?: Date;
  ultimaAtualizacao?: unknown;
  filtroProducao: string;
  visaoCadastros: string;
  visaoAcessos: string;
  visaoProducao: string;
  evolucaoCadastros: EvolucaoEntry[];
  evolucaoAcessos: EvolucaoEntry[];
  serieProducao: ItemTemporal[];
}

function dataDoValor(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

function prepararAba(sheet: Worksheet, titulo: string) {
  sheet.views = [{ showGridLines: false }];
  sheet.properties.defaultRowHeight = 19;
  sheet.getCell('A2').value = titulo;
  sheet.getCell('A2').font = { name: 'Arial', size: 15, bold: true, color: { argb: VERDE } };
  sheet.getRow(2).height = 25;
  sheet.getCell('A3').value = 'Portal CSAE Floripa 2.0';
  sheet.getCell('A3').font = { name: 'Arial', size: 10, italic: true, color: { argb: '6B7280' } };
}

function cabecalhoSecao(sheet: Worksheet, row: number, titulo: string, colunas = 4) {
  sheet.mergeCells(row, 1, row, colunas);
  const cell = sheet.getCell(row, 1);
  cell.value = titulo;
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_CLARO } };
  cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: VERDE } };
  cell.alignment = { vertical: 'middle' };
  sheet.getRow(row).height = 23;
}

function adicionarTabela(
  sheet: Worksheet,
  row: number,
  nome: string,
  colunas: string[],
  linhas: Array<Array<string | number | Date | null>>,
): number {
  const rows = linhas.length ? linhas : [colunas.map((_, index) => index === 0 ? 'Sem dados' : null)];
  sheet.addTable({
    name: nome,
    ref: `A${row}`,
    headerRow: true,
    totalsRow: false,
    style: { theme: 'TableStyleMedium4', showRowStripes: true },
    columns: colunas.map((name) => ({
      name,
      filterButton: true,
      ...(name.includes('Percentual') || name.includes('Variação') ? { style: { numFmt: '0.0%' } } : {}),
    })),
    rows,
  });
  const header = sheet.getRow(row);
  header.font = { name: 'Arial', size: 10, bold: true, color: { argb: BRANCO } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  for (let r = row + 1; r <= row + rows.length; r += 1) {
    sheet.getRow(r).font = { name: 'Arial', size: 10, color: { argb: TEXTO } };
    sheet.getRow(r).alignment = { vertical: 'middle', wrapText: true };
  }
  return row + rows.length + 2;
}

function porcentagem(valor: number, total: number) { return total > 0 ? valor / total : 0; }
function linhasRanking(itens: ItemRanking[]) { return itens.map((item, index) => [index + 1, item.name, item.value]); }

function adicionarScorecard(sheet: Worksheet, row: number, col: number, titulo: string, valor: string | number, formato?: string) {
  sheet.mergeCells(row, col, row, col + 1);
  sheet.mergeCells(row + 1, col, row + 2, col + 1);
  const tituloCell = sheet.getCell(row, col);
  tituloCell.value = titulo;
  tituloCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: '4B5563' } };
  tituloCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: VERDE_CLARO } };
  tituloCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  const valorCell = sheet.getCell(row + 1, col);
  valorCell.value = valor;
  valorCell.font = { name: 'Arial', size: 15, bold: true, color: { argb: VERDE } };
  valorCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  if (formato && typeof valor === 'number') valorCell.numFmt = formato;
  [sheet.getCell(row, col), sheet.getCell(row + 1, col)].forEach((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: CINZA } }, bottom: { style: 'thin', color: { argb: CINZA } },
      left: { style: 'thin', color: { argb: CINZA } }, right: { style: 'thin', color: { argb: CINZA } },
    };
  });
}

function finalizarAba(sheet: Worksheet, freezeRow?: number) {
  sheet.columns.forEach((column, index) => {
    const largura = index === 0 ? 28 : index >= 2 ? 22 : 34;
    column.width = Math.min(70, Math.max(column.width || 0, largura));
  });
  if (freezeRow) sheet.views = [{ state: 'frozen', ySplit: freezeRow, showGridLines: false }];
  const used = sheet.rowCount;
  sheet.getCell(`A${used + 2}`).value = 'Arquivo gerado automaticamente pelo Portal CSAE Floripa 2.0.';
  sheet.getCell(`A${used + 2}`).font = { name: 'Arial', size: 9, italic: true, color: { argb: '6B7280' } };
}

function linhasEvolucao(itens: EvolucaoEntry[]) {
  return itens.map((item) => [item.name, item.novos, item.acumulado, item.variacaoPercentual === undefined ? 'Sem base de comparação' : item.variacaoPercentual / 100]);
}

export function criarWorkbookPainelEstatistico(opcoes: OpcoesExportacaoPainel): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Portal CSAE Floripa 2.0';
  workbook.created = opcoes.geradoEm || new Date();
  workbook.modified = opcoes.geradoEm || new Date();
  const geradoEm = opcoes.geradoEm || new Date();
  const atualizadoEm = dataDoValor(opcoes.ultimaAtualizacao);
  const { usuarios, producao } = opcoes;

  const resumo = workbook.addWorksheet('Resumo', { properties: { tabColor: { argb: VERDE } } });
  prepararAba(resumo, 'Painel Estatístico — Retrato da Produção');
  const metadados = [
    ['Data e hora da exportação', geradoEm],
    ['Última atualização do BI', atualizadoEm || 'Não informada'],
    ['Filtro de produção', opcoes.filtroProducao],
    ['Visão temporal de cadastros', opcoes.visaoCadastros],
    ['Visão temporal de acessos', opcoes.visaoAcessos],
    ['Visão temporal de produção clínica', opcoes.visaoProducao],
  ];
  metadados.forEach(([label, value], index) => {
    resumo.getCell(5 + index, 1).value = label;
    resumo.getCell(5 + index, 1).font = { name: 'Arial', size: 10, bold: true };
    resumo.getCell(5 + index, 2).value = value as string | Date;
    if (value instanceof Date) resumo.getCell(5 + index, 2).numFmt = 'dd/mm/yyyy hh:mm';
  });
  cabecalhoSecao(resumo, 12, 'Usuários', 8);
  const cardsUsuarios: Array<[string, number, string?]> = [
    ['Solicitações de cadastro', usuarios.totalCadastrados], ['Usuários liberados', usuarios.totalAprovados],
    ['Acessos à plataforma', usuarios.totalAcessosPlataforma], ['Média de acessos por usuário', usuarios.mediaAcessosUsuario],
    ['Taxa de aprovação', usuarios.taxaAprovacao / 100, '0.0%'], ['Tempo médio para liberação (h)', usuarios.tempoMedioLiberacaoHoras],
  ];
  cardsUsuarios.forEach(([titulo, valor, formato], index) => adicionarScorecard(resumo, 14 + Math.floor(index / 4) * 4, 1 + (index % 4) * 2, titulo, valor, formato));
  cabecalhoSecao(resumo, 22, 'Produção Clínica', 8);
  const cardsProducao: Array<[string, number, string?]> = [
    ['Total de processos', producao.totalProcessos], ['Processos concluídos', producao.totalProcessosConcluidos],
    ['Processos em andamento', producao.totalProcessosEmAndamento], ['Taxa de conclusão', producao.taxaConclusao / 100, '0.0%'],
    ['Tempo médio do processo (h)', producao.tempoMedioProcessoHoras], ['Pacientes atendidos', producao.totalPacientesAtendidos],
    ['Diagnósticos únicos', producao.totalDiagnosticosUnicos], ['Intervenções únicas', producao.totalIntervencoesUnicas],
    ['NHBs únicas', producao.totalNhbsUnicas], ['Média de diagnósticos por processo', producao.mediaDiagnosticosPorProcesso],
  ];
  cardsProducao.forEach(([titulo, valor, formato], index) => adicionarScorecard(resumo, 24 + Math.floor(index / 4) * 4, 1 + (index % 4) * 2, titulo, valor, formato));
  resumo.columns = Array.from({ length: 8 }, () => ({ width: 18 }));
  finalizarAba(resumo);

  const abaUsuarios = workbook.addWorksheet('Usuários');
  prepararAba(abaUsuarios, 'Usuários');
  let row = 5;
  cabecalhoSecao(abaUsuarios, row++, 'Situação dos cadastros', 3);
  row = adicionarTabela(abaUsuarios, row, 'SituacaoCadastros', ['Status', 'Quantidade', 'Percentual'], usuarios.situacaoCadastros.map((item) => [item.name, item.valor, porcentagem(item.valor, usuarios.totalCadastrados)]));
  cabecalhoSecao(abaUsuarios, row++, 'Profissionais por categoria', 3);
  row = adicionarTabela(abaUsuarios, row, 'ProfissionaisCategoria', ['Categoria', 'Quantidade', 'Percentual'], usuarios.distribuicaoFormacao.map((item) => [item.name, item.value, porcentagem(item.value, usuarios.totalCadastrados)]));
  cabecalhoSecao(abaUsuarios, row++, 'Vínculo SMS', 3);
  row = adicionarTabela(abaUsuarios, row, 'VinculoSms', ['Vínculo', 'Quantidade', 'Percentual'], usuarios.distribuicaoAtuaSMS.map((item) => [item.name, item.value, porcentagem(item.value, usuarios.totalCadastrados)]));
  cabecalhoSecao(abaUsuarios, row++, 'Lotações', 3);
  row = adicionarTabela(abaUsuarios, row, 'LotacoesUsuarios', ['Posição', 'Lotação', 'Usuários'], usuarios.todasLotacoes.map((item, index) => [index + 1, item.name, item.value]));
  cabecalhoSecao(abaUsuarios, row++, 'Profissionais e acessos por lotação', 3);
  adicionarTabela(abaUsuarios, row, 'UsuariosPorLotacao', ['Lotação', 'Profissional', 'Total de acessos'], Object.entries(usuarios.usuariosPorLotacao).flatMap(([lotacao, profissionais]) => profissionais.map((profissional) => [lotacao, profissional.nome, profissional.acessos])));
  finalizarAba(abaUsuarios, 6);

  const evolucaoUsuarios = workbook.addWorksheet('Evolução Usuários');
  prepararAba(evolucaoUsuarios, 'Evolução de Usuários');
  evolucaoUsuarios.getCell('A5').value = `Evolução de Cadastros — ${opcoes.visaoCadastros}`;
  evolucaoUsuarios.getCell('A5').font = { bold: true, color: { argb: VERDE } };
  row = adicionarTabela(evolucaoUsuarios, 6, 'EvolucaoCadastros', ['Período', 'Novos', 'Acumulado', 'Variação'], linhasEvolucao(opcoes.evolucaoCadastros));
  evolucaoUsuarios.getCell(`A${row}`).value = `Evolução de Acessos — ${opcoes.visaoAcessos}`;
  evolucaoUsuarios.getCell(`A${row}`).font = { bold: true, color: { argb: VERDE } };
  adicionarTabela(evolucaoUsuarios, row + 1, 'EvolucaoAcessos', ['Período', 'Acessos', 'Acumulado', 'Variação'], linhasEvolucao(opcoes.evolucaoAcessos));
  finalizarAba(evolucaoUsuarios, 6);

  const producaoAba = workbook.addWorksheet('Produção');
  prepararAba(producaoAba, 'Produção Clínica');
  adicionarScorecard(producaoAba, 5, 1, 'Total de processos', producao.totalProcessos);
  adicionarScorecard(producaoAba, 5, 3, 'Concluídos', producao.totalProcessosConcluidos);
  adicionarScorecard(producaoAba, 5, 5, 'Taxa de conclusão', producao.taxaConclusao / 100, '0.0%');
  adicionarScorecard(producaoAba, 5, 7, 'Pacientes atendidos', producao.totalPacientesAtendidos);
  row = 10;
  row = adicionarTabela(producaoAba, row, 'StatusProducao', ['Situação', 'Quantidade', 'Percentual'], producao.distribuicaoStatus.map((item) => [item.name, item.value, porcentagem(item.value, producao.totalProcessos)]));
  row = adicionarTabela(producaoAba, row, 'PerfilSexo', ['Sexo', 'Quantidade', 'Percentual'], producao.perfilPacientes.sexo.map((item) => [item.name, item.value, porcentagem(item.value, producao.totalPacientesAtendidos)]));
  adicionarTabela(producaoAba, row, 'PerfilFaixaEtaria', ['Faixa etária', 'Quantidade', 'Percentual'], producao.perfilPacientes.faixasEtarias.map((item) => [item.name, item.value, porcentagem(item.value, producao.totalPacientesAtendidos)]));
  finalizarAba(producaoAba, 10);

  const evolucaoClinica = workbook.addWorksheet('Evolução Clínica');
  prepararAba(evolucaoClinica, `Evolução Clínica — ${opcoes.visaoProducao}`);
  adicionarTabela(evolucaoClinica, 5, 'EvolucaoClinicaTabela', ['Período', 'Processos concluídos', 'Acumulado', 'Variação em relação ao anterior'], opcoes.serieProducao.map((item) => [item.name, item.value, item.acumulado ?? null, item.variacaoTipo === 'percentual' ? (item.variacaoPercentual || 0) / 100 : formatarVariacao(item)]));
  finalizarAba(evolucaoClinica, 5);

  const abasRanking: Array<[string, Array<[string, string[], ItemRanking[]]>]> = [
    ['Avaliação', [['Itens de exame físico mais registrados', ['Posição', 'Item', 'Quantidade'], producao.etapasPE.avaliacao.physical], ['NHBs afetadas', ['Posição', 'NHB', 'Quantidade'], producao.etapasPE.avaliacao.nhbs]]],
    ['Diagnósticos', [['Diagnósticos mais frequentes', ['Posição', 'Diagnóstico', 'Quantidade'], producao.etapasPE.diagnostico.top], ['Subconjuntos', ['Posição', 'Subconjunto', 'Quantidade'], producao.etapasPE.diagnostico.subset]]],
    ['Planejamento', [['Resultados esperados', ['Posição', 'Resultado esperado', 'Quantidade'], producao.etapasPE.planejamento.results], ['Intervenções prescritas', ['Posição', 'Intervenção', 'Quantidade'], producao.etapasPE.planejamento.prescribed]]],
    ['Implementação', [['Intervenções aplicadas', ['Posição', 'Intervenção', 'Quantidade'], producao.etapasPE.implementacao.applied]]],
    ['Evolução Enfermagem', [['Ações exclusivas do enfermeiro', ['Posição', 'Ação', 'Quantidade'], producao.etapasPE.evolucao.nurseApplied]]],
  ];
  abasRanking.forEach(([nomeAba, blocos], abaIndex) => {
    const sheet = workbook.addWorksheet(nomeAba);
    prepararAba(sheet, nomeAba);
    let current = 5;
    blocos.forEach(([titulo, colunas, itens], blocoIndex) => {
      cabecalhoSecao(sheet, current++, titulo, colunas.length);
      current = adicionarTabela(sheet, current, `Ranking${abaIndex}_${blocoIndex}`, colunas, linhasRanking(itens));
    });
    if (nomeAba === 'Implementação') {
      cabecalhoSecao(sheet, current++, 'Executores', 3);
      adicionarTabela(sheet, current, 'ExecutoresImplementacao', ['Executor', 'Quantidade', 'Percentual'], producao.etapasPE.implementacao.executors.map((item) => [item.name, item.value, porcentagem(item.value, producao.etapasPE.implementacao.executors.reduce((sum, currentItem) => sum + currentItem.value, 0))]));
    }
    finalizarAba(sheet, 6);
  });

  const produtividade = workbook.addWorksheet('Produtividade');
  prepararAba(produtividade, 'Produtividade');
  row = adicionarTabela(produtividade, 5, 'RankingProfissionais', ['Posição', 'Nome', 'Lotação', 'Pacientes', 'Em andamento', 'Concluídos', 'Tempo médio (h)', 'Executor mais frequente', 'Top diagnósticos', 'Top NHBs', 'Top intervenções'], producao.rankingUsuarios.map((item, index) => [index + 1, item.name, item.lotacao, item.raioX.totalPacientes, item.raioX.processosAtivos, item.raioX.processosConcluidos, item.raioX.tempoMedioHoras, item.raioX.executorMaisFrequente || 'N/A', item.raioX.topDiagnosticos.join('; '), item.raioX.topNHBs.join('; '), item.raioX.topIntervencoes.join('; ')]));
  cabecalhoSecao(produtividade, row++, 'Ranking de lotações', 3);
  adicionarTabela(produtividade, row, 'RankingLotacoesProducao', ['Posição', 'Lotação', 'Processos concluídos'], linhasRanking(producao.rankingLotacoes));
  produtividade.getColumn(2).width = 34;
  produtividade.getColumn(9).width = 55;
  produtividade.getColumn(10).width = 45;
  produtividade.getColumn(11).width = 55;
  finalizarAba(produtividade, 5);

  workbook.eachSheet((sheet) => {
    sheet.eachRow((sheetRow) => sheetRow.eachCell((cell) => {
      if (!cell.font?.name) cell.font = { ...cell.font, name: 'Arial', size: cell.font?.size || 10 };
    }));
  });
  return workbook;
}

export function nomeArquivoPainelEstatistico(filtroProducao: string, data = new Date()): string {
  const unidade = filtroProducao.replace(/^Filtro de Produção:\s*/i, '').trim();
  const sufixo = unidade && unidade !== 'Todas as unidades' ? `_${unidade}` : '';
  const timestamp = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}_${String(data.getHours()).padStart(2, '0')}${String(data.getMinutes()).padStart(2, '0')}`;
  return `Portal_CSAE_Painel_Estatistico${sufixo}_${timestamp}.xlsx`.replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_');
}

export async function exportarPainelEstatisticoXlsx(opcoes: OpcoesExportacaoPainel): Promise<string> {
  const workbook = criarWorkbookPainelEstatistico(opcoes);
  const buffer = await workbook.xlsx.writeBuffer();
  const nome = nomeArquivoPainelEstatistico(opcoes.filtroProducao, opcoes.geradoEm);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = nome;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return nome;
}
