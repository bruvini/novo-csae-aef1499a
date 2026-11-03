import assert from 'node:assert/strict';
import test from 'node:test';
import { atualizarSelecaoAposReavaliacao } from './reavaliacaoDiagnostica';

const diagnostico = (id: string, acompanhamentoId?: string) => ({ id, tituloDiagnostico: id, ...(acompanhamentoId ? { acompanhamentoId } : {}) });

test('manter e substituir atualizam somente o acompanhamento correspondente', () => {
  const atuais = [diagnostico('origem', 'linha-a'), diagnostico('outro', 'linha-b'), diagnostico('independente')];
  assert.deepEqual(atualizarSelecaoAposReavaliacao(atuais, 'linha-a', 'manter', diagnostico('origem')), [diagnostico('outro', 'linha-b'), diagnostico('independente'), diagnostico('origem', 'linha-a')]);
  assert.deepEqual(atualizarSelecaoAposReavaliacao(atuais, 'linha-a', 'substituir', diagnostico('novo')), [diagnostico('outro', 'linha-b'), diagnostico('independente'), diagnostico('novo', 'linha-a')]);
});

test('substituição sem diagnóstico escolhido permanece incompleta e não remove decisões independentes', () => {
  const atuais = [diagnostico('origem', 'linha-a'), diagnostico('independente')];
  assert.deepEqual(atualizarSelecaoAposReavaliacao(atuais, 'linha-a', 'substituir'), [diagnostico('independente')]);
});

test('encerrar remove apenas a seleção ligada ao acompanhamento, não um diagnóstico independente', () => {
  const atuais = [diagnostico('origem', 'linha-a'), diagnostico('origem'), diagnostico('outro', 'linha-b')];
  assert.deepEqual(atualizarSelecaoAposReavaliacao(atuais, 'linha-a', 'encerrar'), [diagnostico('origem'), diagnostico('outro', 'linha-b')]);
});

test('selecionar uma substituição já independente não duplica nem reclassifica a seleção', () => {
  const atuais = [diagnostico('independente'), diagnostico('origem', 'linha-a')];
  assert.deepEqual(atualizarSelecaoAposReavaliacao(atuais, 'linha-a', 'substituir', diagnostico('independente')), [diagnostico('independente')]);
});
