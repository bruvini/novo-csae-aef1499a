import assert from 'node:assert/strict';
import test from 'node:test';
import type { Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import { atualizarBuscaPorAcompanhamento, buscarDiagnosticosSubstitutos } from './buscaDiagnosticoSubstituto';

const item = (id: string, tituloDiagnostico: string, descricaoDiagnostico = '') => ({ id, tituloDiagnostico, descricaoDiagnostico }) as Diagnostico;

test('busca títulos e descrições por correspondência parcial sem diferenciar acentos ou caixa', () => {
  const dados = [item('1', 'Risco de infecção'), item('2', 'Dor aguda', 'Avaliar a infeccao no local'), item('3', 'Dor crônica')];
  assert.deepEqual(buscarDiagnosticosSubstitutos(dados, 'INFECCAO').map(d => d.id), ['1', '2']);
  assert.deepEqual(buscarDiagnosticosSubstitutos(dados, 'dor ag').map(d => d.id), ['2']);
});

test('prioriza correspondências no título e mantém IDs distintos em nomes semelhantes', () => {
  const dados = [item('desc', 'Mobilidade', 'Dor e mobilidade reduzida'), item('prefixo', 'Dor aguda'), item('exato', 'Dor'), item('parcial', 'Dor crônica')];
  assert.deepEqual(buscarDiagnosticosSubstitutos(dados, 'dor').map(d => d.id), ['exato', 'prefixo', 'parcial', 'desc']);
});

test('catálogo com mais de 600 diagnósticos permanece pesquisável até o último item', () => {
  const dados = Array.from({ length: 750 }, (_, index) => item(`d${index}`, index === 749 ? 'Diagnóstico Ápice' : `Diagnóstico ${index}`));
  assert.deepEqual(buscarDiagnosticosSubstitutos(dados, 'apice').map(d => d.id), ['d749']);
  assert.equal(buscarDiagnosticosSubstitutos(dados, 'diagnostico').length, 750);
  assert.deepEqual(buscarDiagnosticosSubstitutos(dados, ''), []);
});

test('pesquisas por acompanhamento permanecem independentes', () => {
  const a = atualizarBuscaPorAcompanhamento({}, 'acomp-a', 'dor');
  const b = atualizarBuscaPorAcompanhamento(a, 'acomp-b', 'mobilidade');
  assert.deepEqual(b, { 'acomp-a': 'dor', 'acomp-b': 'mobilidade' });
  assert.deepEqual(atualizarBuscaPorAcompanhamento(b, 'acomp-a', 'respiração'), { 'acomp-a': 'respiração', 'acomp-b': 'mobilidade' });
  assert.equal(a['acomp-b'], undefined);
});
