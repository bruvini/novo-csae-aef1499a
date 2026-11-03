import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import ExcelJS from 'exceljs';
import {
  agregarRegistrosProducao,
  aplicarVariacoesTemporais,
  calcularVariacaoTemporal,
  classeVariacao,
  formatarVariacao,
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

test('tooltip colore pelo valor real e preserva ausência de base', () => {
  assert.equal(classeVariacao({ variacaoPercentual: 12, variacaoTipo: 'percentual' }), 'text-emerald-600');
  assert.equal(classeVariacao({ variacaoPercentual: -80, variacaoTipo: 'percentual' }), 'text-rose-600');
  assert.equal(classeVariacao({ variacaoPercentual: 0, variacaoTipo: 'percentual' }), 'text-slate-600');
  assert.equal(classeVariacao({ variacaoPercentual: null, variacaoTipo: 'novo' }), 'text-slate-600');
  assert.equal(formatarVariacao({ variacaoPercentual: null, variacaoTipo: 'sem-base' }), 'Sem base de comparação');
  assert.equal(formatarVariacao({ variacaoPercentual: -80, variacaoTipo: 'percentual' }), '-80%');
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
  assert.ok(stats.temporalAvancado.diario.length >= 2);
  assert.ok(stats.temporalAvancado.diario.some((item) => item.value === 0));
  assert.equal(stats.temporalAvancado.diario.at(-1)?.acumulado, 2);
  assert.equal(stats.temporalAvancado.mensal[0].value, 2);
  assert.equal(stats.temporalAvancado.hora.length, 24);
});

test('série diária limitada a 30 dias preserva o acumulado desde o primeiro processo', () => {
  const registros = Array.from({ length: 40 }, (_, index) => {
    const data = new Date(Date.UTC(2026, 8, 1 + index, 12));
    const iso = data.toISOString();
    return registro({ id: `p${index}`, pacienteChave: `pac${index}`, dataReferencia: iso, dataConclusaoReferencia: iso });
  });
  const diaria = agregarRegistrosProducao(registros).temporalAvancado.diario;
  assert.equal(diaria.length, 30);
  // O recorte é calculado até a data corrente em São Paulo. Um número fixo
  // deixava o teste inválido a cada dia, mesmo com a agregação correta.
  const primeiroDiaVisivel = diaria[0].name.split('/').reverse().join('-');
  const esperadoPrimeiroDia = registros.filter((item) => item.dataReferencia.slice(0, 10) <= primeiroDiaVisivel).length;
  assert.equal(diaria[0].acumulado, esperadoPrimeiroDia);
  assert.equal(diaria.at(-1)?.acumulado, 40);
});

const usuariosFixture: EstatisticasBI = {
  ultimaAtualizacao: new Date('2026-09-21T12:00:00Z'), totalCadastrados: 10, totalAprovados: 8,
  totalAguardando: 1, totalRecusados: 1, totalIncompletos: 0,
  taxaAprovacao: 80, tempoMedioLiberacaoHoras: 12, totalAcessosPlataforma: 50, mediaAcessosUsuario: 6.25,
  historicoAcessosConsiderados: 10, usuariosComHistoricoLimitado: 0,
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
