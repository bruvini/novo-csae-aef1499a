import assert from 'node:assert/strict';
import test from 'node:test';
import type { RegistroProducao } from './painelEstatistico';
import {
  CACHE_CHUNK_LIMITE_BYTES,
  CACHE_PROCESSOS_SCHEMA_VERSION,
  cacheProducaoValido,
  exportacaoPainelHabilitada,
  normalizarExecutores,
  particionarRegistrosPorTamanho,
  removerUndefined,
  resolverEstadoProducao,
  tamanhoJsonBytes,
  tentarPersistirCache,
} from './painelEstatisticoCache';

function registro(index: number, extra: Partial<RegistroProducao> = {}): RegistroProducao {
  return {
    id: `processo-${index}`, usuarioId: `u-${index % 20}`, usuarioNome: `PROFISSIONAL ${index % 20}`,
    lotacao: `CS ${index % 8}`, pacienteChave: `paciente-${index}`, pacienteSexo: 'Não informado',
    status: index % 4 === 0 ? 'em_andamento' : 'concluido', dataReferencia: new Date(2026, 8, 1 + (index % 20)).toISOString(),
    exameFisico: [], nhbs: [], diagnosticos: [], subconjuntos: [], resultados: [], intervencoesPrescritas: [],
    intervencoesAplicadas: [], executores: [], acoesEnfermeiro: [], ...extra,
  };
}

test('remove undefined de campos opcionais e estruturas aninhadas', () => {
  const sanitized = removerUndefined({
    pacienteFaixaEtaria: undefined,
    dataInicioReferencia: '2026-09-01T10:00:00.000Z',
    dataConclusaoReferencia: undefined,
    etapas: { avaliacao: undefined, diagnostico: [] },
  });
  assert.deepEqual(sanitized, {
    dataInicioReferencia: '2026-09-01T10:00:00.000Z',
    etapas: { diagnostico: [] },
  });
});

test('aceita processo em andamento, paciente sem nascimento e etapas ausentes', () => {
  const partial = removerUndefined(registro(1, {
    status: 'em_andamento',
    pacienteFaixaEtaria: undefined,
    dataConclusaoReferencia: undefined,
  }));
  assert.equal(partial.status, 'em_andamento');
  assert.equal('pacienteFaixaEtaria' in partial, false);
  assert.equal('dataConclusaoReferencia' in partial, false);
  assert.deepEqual(partial.diagnosticos, []);
});

test('normaliza quemExecuta legado como string e novo como array', () => {
  assert.deepEqual(normalizarExecutores('Enfermeiro'), ['Enfermeiro']);
  assert.deepEqual(normalizarExecutores(['Enfermeiro', 'Equipe Multiprofissional']), ['Enfermeiro', 'Equipe Multiprofissional']);
  assert.deepEqual(normalizarExecutores(undefined), []);
});

test('falha de escrita do cache não interrompe o resultado calculado', async () => {
  let registrado: unknown;
  const success = await tentarPersistirCache(
    async () => { throw new Error('permission-denied'); },
    (error) => { registrado = error; },
  );
  assert.equal(success, false);
  assert.match(String(registrado), /permission-denied/);
});

test('distingue cache válido, expirado e incompatível', () => {
  const now = Date.now();
  const base = {
    schemaVersion: CACHE_PROCESSOS_SCHEMA_VERSION,
    ultimaAtualizacao: new Date(now - 1_000),
    lotacoesUnicas: [], lotacaoDocumentos: [], registroChunks: 0,
  };
  assert.equal(cacheProducaoValido(base, now), true);
  assert.equal(cacheProducaoValido({ ...base, ultimaAtualizacao: new Date(now - 13 * 60 * 60 * 1000) }, now), false);
  assert.equal(cacheProducaoValido({ ...base, schemaVersion: 8 }, now), false);
});

test('distingue carregamento, erro real, zero real e sucesso', () => {
  assert.equal(resolverEstadoProducao(true, null, undefined), 'loading');
  assert.equal(resolverEstadoProducao(false, 'falha de leitura', undefined), 'error');
  assert.equal(resolverEstadoProducao(false, null, 0), 'empty');
  assert.equal(resolverEstadoProducao(false, null, 494), 'success');
});

test('particiona volume grande mantendo cada payload abaixo do limite seguro', () => {
  const large = Array.from({ length: 5_000 }, (_, index) => registro(index, {
    diagnosticos: [`Diagnóstico clínico detalhado ${index}`],
    intervencoesPrescritas: [`Intervenção de enfermagem detalhada ${index}`],
  }));
  const chunks = particionarRegistrosPorTamanho(large);
  assert.ok(chunks.length > 1);
  assert.equal(chunks.flat().length, large.length);
  chunks.forEach((chunk) => assert.ok(tamanhoJsonBytes({ registros: chunk }) <= CACHE_CHUNK_LIMITE_BYTES));
});

test('habilita exportação somente após sucesso completo do carregamento', () => {
  assert.equal(exportacaoPainelHabilitada(false, 'success', true, true, false), true);
  assert.equal(exportacaoPainelHabilitada(false, 'error', true, false, false), false);
  assert.equal(exportacaoPainelHabilitada(false, 'empty', true, false, false), false);
});
