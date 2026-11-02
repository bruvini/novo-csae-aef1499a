import test from 'node:test';
import assert from 'node:assert/strict';
import { calcularTempoAtivoSegundos, formatarTempoRegistrado } from './tempoProcesso';

test('soma sessões encerradas sem contabilizar intervalo parado entre sessões', () => {
  const total = calcularTempoAtivoSegundos({
    sessoesDeTrabalho: [
      { inicioSessao: new Date('2026-10-10T09:00:00Z'), fimSessao: new Date('2026-10-10T10:00:00Z') },
      { inicioSessao: new Date('2026-10-10T14:00:00Z'), fimSessao: new Date('2026-10-10T14:30:00Z') },
      { inicioSessao: new Date('2026-10-10T14:45:00Z') },
    ],
  });
  assert.equal(total, 5400);
});

test('usa duração registrada explícita apenas quando faltam sessões válidas', () => {
  assert.equal(calcularTempoAtivoSegundos({ tempoAtivoSegundos: 3900 }), 3900);
  assert.equal(calcularTempoAtivoSegundos({ tempoAtividadeMinutos: 20 }), 1200);
});

test('descarta sessões com valores invertidos e não inventa tempo', () => {
  assert.equal(calcularTempoAtivoSegundos({
    sessoesDeTrabalho: [
      { inicioSessao: new Date('2026-10-10T16:00:00Z'), fimSessao: new Date('2026-10-10T15:00:00Z') },
    ],
  }), 0);
  assert.equal(formatarTempoRegistrado(123.8), '2h 03min');
});
