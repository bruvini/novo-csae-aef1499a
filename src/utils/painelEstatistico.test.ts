import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import ExcelJS from 'exceljs';
import {
  agregarRegistrosProducao,
  aplicarVariacoesTemporais,
  calcularVariacaoTemporal,
  filtrarRegistrosProducao,
  type RegistroProducao,
} from './painelEstatistico';
import { criarWorkbookPainelEstatistico } from './painelEstatisticoXlsx';
import type { EstatisticasBI } from '@/services/bancodados/biUsuariosDB';

function registro(overrides: Partial<RegistroProducao> = {}): RegistroProducao {
  return {
    id: 'p1', usuarioId: 'u1', usuarioNome: 'PROFISSIONAL 1', lotacao: 'CS CENTRO', pacienteChave: 'pac1',
    pacienteSexo: 'Feminino', pacienteFaixaEtaria: '19-39', status: 'concluido',
    dataReferencia: '2026-09-15T10:00:00.000Z', dataConclusaoReferencia: '2026-09-15T10:00:00.000Z',
    duracaoHoras: 2, exameFisico: ['Pressão arterial'], nhbs: ['Nutrição'], diagnosticos: ['Diagnóstico A'],
    subconjuntos: ['Subconjunto A'], resultados: ['Resultado A'], intervencoesPrescritas: ['Intervenção A'],
    intervencoesAplicadas: ['Intervenção A'], executores: ['Enfermeiro'], acoesEnfermeiro: ['Ação A'],
    ...overrides,
  };
}

test('calcula aumento, redução, estabilidade, novo e primeiro ponto sem base', () => {
  assert.deepEqual(calcularVariacaoTemporal(10, 5), { variacaoPercentual: 100, variacaoTipo: 'percentual' });
  assert.deepEqual(calcularVariacaoTemporal(6, 8), { variacaoPercentual: -25, variacaoTipo: 'percentual' });
  assert.deepEqual(calcularVariacaoTemporal(20, 20), { variacaoPercentual: 0, variacaoTipo: 'percentual' });
  assert.deepEqual(calcularVariacaoTemporal(5, 0), { variacaoPercentual: null, variacaoTipo: 'novo' });
  assert.deepEqual(calcularVariacaoTemporal(5), { variacaoPercentual: null, variacaoTipo: 'sem-base' });
});

test('aplica comparação ao período imediatamente anterior apresentado', () => {
  const serie = aplicarVariacoesTemporais([{ name: 'A', value: 0 }, { name: 'B', value: 0 }, { name: 'C', value: 4 }]);
  assert.equal(serie[0].variacaoTipo, 'sem-base');
  assert.equal(serie[1].variacaoPercentual, 0);
  assert.equal(serie[2].variacaoTipo, 'novo');
});

test('agregação por lotação inclui profissional fora do Top 10 global', () => {
  const globais = Array.from({ length: 11 }, (_, index) => [
    registro({ id: `a${index}-1`, usuarioId: `u${index}`, usuarioNome: `TOP ${index}`, pacienteChave: `pa${index}`, lotacao: 'CS A' }),
    registro({ id: `a${index}-2`, usuarioId: `u${index}`, usuarioNome: `TOP ${index}`, pacienteChave: `pa${index}`, lotacao: 'CS A' }),
  ]).flat();
  const foraTop = registro({ id: 'b1', usuarioId: 'u-baixo', usuarioNome: 'FORA DO TOP', pacienteChave: 'pb1', lotacao: 'CS B' });
  const todos = [...globais, foraTop];
  const global = agregarRegistrosProducao(todos);
  assert.equal(global.rankingUsuarios.length, 10);
  assert.equal(global.rankingUsuarios.some((item) => item.id === 'u-baixo'), false);
  const filtrados = filtrarRegistrosProducao(todos, { lotacao: 'CS B' });
  const unidade = agregarRegistrosProducao(filtrados);
  assert.equal(unidade.totalProcessos, 1);
  assert.equal(unidade.rankingUsuarios[0].name, 'FORA DO TOP');
});

test('séries diária, mensal e semanal são exatas e a semana respeita Dom a Sáb', () => {
  const stats = agregarRegistrosProducao([
    registro(),
    registro({ id: 'p2', pacienteChave: 'pac2', dataReferencia: '2026-09-16T11:00:00.000Z', dataConclusaoReferencia: '2026-09-16T11:00:00.000Z' }),
  ]);
  assert.deepEqual(stats.temporalAvancado.diaSemana.map((item) => item.name), ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);
  assert.equal(stats.temporalAvancado.diario.length, 2);
  assert.equal(stats.temporalAvancado.mensal[0].value, 2);
  assert.equal(stats.temporalAvancado.hora.length, 24);
});

const usuariosFixture: EstatisticasBI = {
  ultimaAtualizacao: new Date('2026-09-21T12:00:00Z'), totalCadastrados: 10, totalAprovados: 8,
  taxaAprovacao: 80, tempoMedioLiberacaoHoras: 12, totalAcessosPlataforma: 50, mediaAcessosUsuario: 6.25,
  usuariosPorLotacao: { 'CS CENTRO': [{ nome: 'PROFISSIONAL 1', acessos: 5 }] },
  distribuicaoFormacao: [{ name: 'Enfermeiro', value: 10 }], distribuicaoAtuaSMS: [{ name: 'Sim', value: 10 }],
  todasLotacoes: [{ name: 'CS CENTRO', value: 10 }], situacaoCadastros: [{ name: 'Liberado', valor: 8 }],
  evolucaoDiaria: [], evolucaoSemanal: [], evolucaoMensal: [], evolucaoAnual: [],
  evolucaoAcessosDiaria: [], evolucaoAcessosSemanal: [], evolucaoAcessosMensal: [], evolucaoAcessosAnual: [],
};

test('workbook possui 11 abas, metadados filtrados e valores numéricos sem dados sensíveis', async () => {
  const producao = agregarRegistrosProducao([registro()]);
  const workbook = criarWorkbookPainelEstatistico({
    usuarios: usuariosFixture, producao, geradoEm: new Date('2026-09-21T15:00:00Z'), ultimaAtualizacao: new Date('2026-09-21T12:00:00Z'),
    filtroProducao: 'CS CENTRO', visaoCadastros: 'Mensal', visaoAcessos: 'Mensal', visaoProducao: 'Dia',
    evolucaoCadastros: [], evolucaoAcessos: [], serieProducao: producao.temporalAvancado.diario,
  });
  const buffer = await workbook.xlsx.writeBuffer();
  if (process.env.PAINEL_XLSX_OUTPUT) {
    await mkdir(dirname(process.env.PAINEL_XLSX_OUTPUT), { recursive: true });
    await writeFile(process.env.PAINEL_XLSX_OUTPUT, Buffer.from(buffer));
  }
  const reaberto = new ExcelJS.Workbook();
  await reaberto.xlsx.load(buffer);
  assert.deepEqual(reaberto.worksheets.map((sheet) => sheet.name), ['Resumo', 'Usuários', 'Evolução Usuários', 'Produção', 'Evolução Clínica', 'Avaliação', 'Diagnósticos', 'Planejamento', 'Implementação', 'Evolução Enfermagem', 'Produtividade']);
  assert.equal(reaberto.getWorksheet('Resumo')?.getCell('B7').value, 'CS CENTRO');
  assert.equal(typeof reaberto.getWorksheet('Produção')?.getCell('A6').value, 'number');
  const conteudo = reaberto.worksheets.flatMap((sheet) => sheet.getSheetValues()).join(' ').toLowerCase();
  assert.equal(conteudo.includes('cpf'), false);
  assert.equal(conteudo.includes('@'), false);
});
