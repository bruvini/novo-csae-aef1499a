import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cacheTemporalAindaValido,
  chaveDataSaoPaulo,
  converterDataAcesso,
  deveAcrescentarHistoricoAcesso,
  deveContabilizarLogin,
  diaSemanaSaoPaulo,
  LIMITE_HISTORICO_ACESSO,
  normalizarTotalAcessos,
  planejarRegistroLogin,
  preencherDias,
  somarTotalLoginsRegistrados, diasComEventos,
  tentarRegistrarLogin,
} from './accessMetrics';

test('login explícito é contabilizado; sessão restaurada e recarregamento não são eventos', () => {
  assert.equal(deveContabilizarLogin('login_explicito'), true);
  assert.equal(deveContabilizarLogin('restauracao_sessao'), false);
  assert.equal(deveContabilizarLogin('recarregamento'), false);
});

test('abas distintas só contam um evento por login explícito em cada aba', () => {
  const origens = ['login_explicito', 'login_explicito'] as const;
  assert.equal(origens.filter(deveContabilizarLogin).length, 2);
  const restauracoes = ['restauracao_sessao', 'recarregamento', 'restauracao_sessao'] as const;
  assert.equal(restauracoes.filter(deveContabilizarLogin).length, 0);
});

test('contador trata campos ausentes e legados sem número como zero', () => {
  assert.equal(normalizarTotalAcessos(undefined), 0);
  assert.equal(normalizarTotalAcessos(null), 0);
  assert.equal(normalizarTotalAcessos('7'), 0);
  assert.equal(normalizarTotalAcessos(12), 12);
});

test('total do painel corresponde à soma dos contadores existentes e ignora dados legados inválidos', () => {
  assert.equal(somarTotalLoginsRegistrados([12, 3, undefined, null, '9', -1]), 15);
});

test('histórico aceita o evento de número 200 e para sem apagar os anteriores', () => {
  assert.equal(deveAcrescentarHistoricoAcesso(Array(198).fill({})), true);
  assert.equal(deveAcrescentarHistoricoAcesso(Array(199).fill({})), true);
  assert.equal(deveAcrescentarHistoricoAcesso(Array(LIMITE_HISTORICO_ACESSO).fill({})), false);
  assert.equal(deveAcrescentarHistoricoAcesso(Array(LIMITE_HISTORICO_ACESSO + 1).fill({})), false);
  assert.equal(deveAcrescentarHistoricoAcesso(undefined), true);
});

test('login no limite continua incrementando contador e último acesso sem exceder regra', () => {
  const plan = planejarRegistroLogin(592, Array(200).fill({ dataHora: new Date() }));
  assert.deepEqual(plan, { proximoTotal: 593, acrescentarHistorico: false });
});

test('falha no registro estatístico não interrompe a decisão de autenticação', async () => {
  let erroAvisado: unknown;
  const resultado = await tentarRegistrarLogin(
    async () => { throw new Error('permission-denied'); },
    (error) => { erroAvisado = error; },
  );
  assert.equal(resultado, null);
  assert.match(String(erroAvisado), /permission-denied/);
});

test('falha de leitura ou formato de data inválido não inventa evento no gráfico', () => {
  assert.equal(converterDataAcesso(null), null);
  assert.equal(converterDataAcesso(undefined), null);
  assert.equal(converterDataAcesso('data inválida'), null);
  assert.equal(converterDataAcesso({ seconds: 1_798_000_000 }) instanceof Date, true);
});

test('timestamps são agrupados pelo dia civil de America/Sao_Paulo', () => {
  const antesDaMeiaNoiteUTC = new Date('2026-10-27T02:30:00.000Z');
  assert.equal(chaveDataSaoPaulo(antesDaMeiaNoiteUTC), '2026-10-26');
  assert.equal(diaSemanaSaoPaulo(antesDaMeiaNoiteUTC), 1);
});

test('série diária inclui dias sem eventos com zero, sem confundir ausência de dados', () => {
  assert.deepEqual(preencherDias({ '2026-10-26': 7, '2026-10-28': 2 }, '2026-10-26', '2026-10-28'), [
    { key: '2026-10-26', novos: 7 },
    { key: '2026-10-27', novos: 0 },
    { key: '2026-10-28', novos: 2 },
  ]);
  assert.deepEqual(preencherDias({}, undefined, '2026-10-28'), []);
});

test('cache vence após TTL e timestamps futuros ou ausentes são inválidos', () => {
  const now = Date.parse('2026-11-02T12:00:00Z');
  assert.equal(cacheTemporalAindaValido(new Date(now - 60_000), now, 15 * 60_000), true);
  assert.equal(cacheTemporalAindaValido(new Date(now - 16 * 60_000), now, 15 * 60_000), false);
  assert.equal(cacheTemporalAindaValido(new Date(now + 60_000), now, 15 * 60_000), false);
  assert.equal(cacheTemporalAindaValido(null, now, 15 * 60_000), false);
});

test('a série de login pode terminar antes dos processos concluídos sem representar erro', () => {
  const ultimoLogin = chaveDataSaoPaulo(new Date('2026-10-27T02:30:00.000Z'));
  const conclusao = chaveDataSaoPaulo(new Date('2026-10-30T02:30:00.000Z'));
  assert.equal(ultimoLogin, '2026-10-26');
  assert.equal(conclusao, '2026-10-29');
  assert.ok(conclusao > ultimoLogin);
});


test('dias sem logins não aparecem na evolução', () => {
  assert.deepEqual(diasComEventos({ '2026-10-29': 0, '2026-10-28': 3, '2026-10-26': 7 }), [
    { key: '2026-10-26', novos: 7 }, { key: '2026-10-28', novos: 3 },
  ]);
});
