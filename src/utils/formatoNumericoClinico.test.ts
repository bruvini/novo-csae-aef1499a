import assert from 'node:assert/strict';
import test from 'node:test';
import { validarLimiteNumericoFonte } from './formatoNumericoClinico';

test('rejeita número decimal transformado em data serial no Google Sheets', () => {
  assert.throws(
    () => validarLimiteNumericoFonte(45783, 'd.m', 'ExamesLabImagem!J2'),
    /ExamesLabImagem!J2/,
  );
  assert.throws(
    () => validarLimiteNumericoFonte(new Date('2025-05-06T00:00:00Z'), 'General', 'SinaisVitais!J62'),
    /SinaisVitais!J62/,
  );
});
test('não permite fórmulas nem texto de percentil como limite numérico direto', () => {
  assert.throws(() => validarLimiteNumericoFonte({formula: 'A1+B1', result: 6.5}, '0.0', 'ExamesLabImagem!J2'), /data\/fórmula/);
  assert.throws(() => validarLimiteNumericoFonte('P10 / P90', 'General', 'SinaisVitais!J4'), /percentis/);
});
test('aceita números literais, vírgula decimal, zero e célula vazia', () => {
  assert.doesNotThrow(() => validarLimiteNumericoFonte(0, 'General', 'SinaisVitais!D2'));
  assert.doesNotThrow(() => validarLimiteNumericoFonte('6,5', '0.0', 'ExamesLabImagem!J2'));
  assert.doesNotThrow(() => validarLimiteNumericoFonte(null, 'General', 'ExamesLabImagem!J3'));
  assert.doesNotThrow(() => validarLimiteNumericoFonte(5.6, '0.0', 'ExamesLabImagem!K3'));
});
