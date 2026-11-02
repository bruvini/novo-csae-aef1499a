import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contagensSugestoes, filtrarSugestoes, indiceSemelhantes, sugestoesSemelhantes, taxaAprovacao } from './sugestoesIntervencoes';
import type { IntervencaoAutoral } from '../services/bancodados/intervencoesAutoraisDB';
import { encontrarResultado, identificadorSugestao, incorporarIntervencao, normalizarAcao } from './intervencoesAutorais';
import type { Diagnostico } from '../services/bancodados/rolEnfermagemDB';

const items: IntervencaoAutoral[] = [
  { id: '1', textoIntervencao: 'Orientar caminhada', tituloResultadoVinculado: 'Mobilidade', autorId: 'a', autorNome: 'Ana', tituloDiagnosticoOrigem: 'Mobilidade', status: 'aguardando' },
  { id: '2', textoIntervencao: 'Orientar caminhada', tituloResultadoVinculado: 'Mobilidade', autorId: 'b', autorNome: 'Bia' },
  { id: '3', textoIntervencao: 'Verificar sinais', tituloResultadoVinculado: 'Saúde', autorId: 'a', autorNome: 'Ana', status: 'rejeitada' },
];

test('três situações, legado, filtros combinados e sugestões semelhantes', () => {
  assert.deepEqual(contagensSugestoes(items), { aguardando: 2, aprovada: 0, rejeitada: 1 });
  const resultado = filtrarSugestoes(items, { status: 'aguardando', texto: 'orientar', autor: 'Ana', diagnostico: 'Mobilidade', resultado: 'Mobilidade', ordem: 'recentes' });
  assert.deepEqual(resultado.map(i => i.id), ['1']);
  assert.equal(sugestoesSemelhantes(items[0], items), 1);
  assert.equal(normalizarAcao('  Verificar  PRESSÃO '), 'verificar pressao');
});

test('taxa global inclui pendentes e rejeitadas e trata base vazia', () => {
  assert.equal(taxaAprovacao(25, 100), 25);
  assert.equal(taxaAprovacao(0, 0), null);
  assert.equal(taxaAprovacao(0, 100), 0);
});

test('índice de texto e filtros operam sobre 1.300 registros sem limitar as contagens', () => {
  const massa = Array.from({ length: 1300 }, (_, i): IntervencaoAutoral => ({
    id: String(i), textoIntervencao: i < 2 ? 'Orientar caminhada' : `Ação ${i}`,
    tituloResultadoVinculado: 'Resultado', autorId: 'uid', autorNome: 'email@example.test',
    autorNomeResolvido: 'Nome Completo', status: i < 25 ? 'aprovada' : 'aguardando',
  }));
  assert.equal(indiceSemelhantes(massa).get(normalizarAcao('Orientar caminhada')), 2);
  assert.equal(contagensSugestoes(massa).aprovada, 25);
  assert.equal(filtrarSugestoes(massa, { status: 'aguardando', texto: '', autor: 'Nome Completo', diagnostico: '', resultado: '', ordem: 'recentes' }).length, 1275);
});

test('identificador de sugestão é estável e varia com processo e texto', async () => {
  const id = await identificadorSugestao('p1', 'd1', 'resultado', 'ação', 'u1');
  assert.equal(id.length, 64);
  assert.equal(id, await identificadorSugestao('p1', 'd1', 'resultado', 'ação', 'u1'));
  assert.notEqual(id, await identificadorSugestao('p2', 'd1', 'resultado', 'ação', 'u1'));
});

test('destino sem resultado único bloqueia publicação', () => {
  const diagnostico = { tituloDiagnostico: 'Teste', resultadosEsperados: [{ tituloResultado: 'Igual' }, { tituloResultado: 'Igual' }] } as Diagnostico;
  assert.throws(() => encontrarResultado(diagnostico, 'Igual'), /ambíguo/);
  assert.throws(() => encontrarResultado(diagnostico, 'Ausente'), /ausente/);
});

test('incorporação em vários resultados preserva materiais e bloqueia duplicidade', () => {
  const diagnostico = { tituloDiagnostico: 'Teste', resultadosEsperados: [
    { tituloResultado: 'A', descricaoResultado: '', intervencoes: [{ acaoPrescrita: 'Medir pressão', acaoEnfermeiro: 'Meço pressão', materiaisDeApoio: [{ tituloMaterialApoio: 'Guia', urlMaterialApoio: 'https://example.test' }] }] },
    { tituloResultado: 'B', descricaoResultado: '', intervencoes: [] },
  ] } as Diagnostico;
  const resultado = incorporarIntervencao(diagnostico, ['A', 'B'], 'Orientar cuidados', 'Oriento cuidados', 'sugestao-1');
  assert.equal(resultado[0].intervencoes[0].materiaisDeApoio[0].tituloMaterialApoio, 'Guia');
  assert.equal(resultado[0].intervencoes[1].acaoPrescrita, 'Orientar cuidados');
  assert.equal(resultado[0].intervencoes[1].origemSugestaoId, 'sugestao-1');
  assert.equal(resultado[1].intervencoes[0].acaoEnfermeiro, 'Oriento cuidados');
  assert.equal(diagnostico.resultadosEsperados[1].intervencoes.length, 0);
  assert.throws(() => incorporarIntervencao(diagnostico, ['A'], 'MEDIR PRESSAO', 'Meço pressão'), /já existe/);
});
