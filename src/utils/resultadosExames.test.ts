import assert from 'node:assert/strict';
import test from 'node:test';
import {
  encontrarFaixaNumerica,
  formatarResultadoExame,
  formatarValorClinico,
  resolverStatusReferencia,
} from './resultadosExames';

test('preserva zero e remove valores vazios ou inválidos do prontuário', () => {
  assert.equal(formatarValorClinico(0), '0');
  for (const valor of [undefined, null, Number.NaN, '', '   ', 'undefined', 'null', 'NaN']) {
    assert.equal(formatarValorClinico(valor), null);
  }
});

test('inclui complemento classificatório somente quando pertence ao resultado selecionado', () => {
  const registro = {
    resultadoClassificatorio: 'Reagente',
    valorTexto: '1:8',
    rotuloValorTexto: 'Titulação',
  };
  assert.equal(formatarResultadoExame('Reagente', registro), 'Reagente — Titulação: 1:8');
  assert.equal(formatarResultadoExame('Não Reagente', registro), 'Não Reagente');
  assert.equal(formatarResultadoExame('Reagente'), 'Reagente');
});

test('status estruturado prevalece sobre o texto legado', () => {
  const fallback = (texto?: string | null) => Boolean(texto?.includes('Normal'));
  assert.equal(resolverStatusReferencia({ statusReferencia: 'normal', nomeAlteracao: 'Fora da meta' }, fallback), 'normal');
  assert.equal(resolverStatusReferencia({ statusReferencia: 'alterado', nomeAlteracao: '' }, fallback), 'alterado');
  assert.equal(resolverStatusReferencia({ nomeAlteracao: 'Normal' }, fallback), 'normal');
});

test('classifica os limites de HbA1c sem lacunas nos valores clínicos testados', () => {
  const faixas = [
    { valorMinimo: 0, valorMaximo: 6.999999, statusReferencia: 'normal' as const },
    { valorMinimo: 7, valorMaximo: 7.999999, statusReferencia: 'atencao' as const },
    { valorMinimo: 8, valorMaximo: null, statusReferencia: 'alterado' as const },
  ];
  const casos = new Map<number, string>([
    [6, 'normal'], [6.9, 'normal'], [7, 'atencao'], [7.5, 'atencao'],
    [7.9, 'atencao'], [8, 'alterado'], [10, 'alterado'], [10.1, 'alterado'],
  ]);
  casos.forEach((esperado, valor) => {
    assert.equal(encontrarFaixaNumerica(faixas, valor)?.statusReferencia, esperado);
  });
});
