import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularGovernanca, filtrarGovernanca, mesSaoPaulo } from './indicadoresIntervencoes';
import { agruparSugestoes, resumoAprovacaoOriginais } from './sugestoesIntervencoes';
import { revisarSeparacao, sinalizarIntervencoesMultiplas } from './individualizacaoIntervencoes';
import type { IntervencaoAutoral } from '../services/bancodados/intervencoesAutoraisDB';

const timestamp = (iso: string) => ({ toDate: () => new Date(iso), toMillis: () => Date.parse(iso) }) as IntervencaoAutoral['dataCriacao'];
const base = (id: string, textoIntervencao = 'Orientar retorno'): IntervencaoAutoral => ({ id, textoIntervencao, autorId: id, autorNome: 'Teste', tituloResultadoVinculado: 'Adesão', dataCriacao: timestamp('2026-11-01T02:30:00Z'), status: 'aguardando' });

test('lista estruturada exige separação e ação integrada permanece única', () => {
  assert.equal(sinalizarIntervencoesMultiplas('Avaliar e registrar sinais de infecção').nivel, 'nenhuma');
  assert.equal(sinalizarIntervencoesMultiplas('1. Avaliar adesão\n2. Orientar retorno').nivel, 'lista');
  assert.deepEqual(revisarSeparacao(['Avaliar adesão', 'Orientar retorno']), ['Avaliar adesão', 'Orientar retorno']);
  assert.throws(() => revisarSeparacao(['Avaliar adesão', 'Avaliar adesão']), /repetid/i);
});

test('originais desmembradas não inflam aprovação nem fila; derivadas têm decisão própria', () => {
  const original = { ...base('a'), divisao: { grupoId: 'a', derivadasIds: ['a-d1', 'a-d2'], revisorId: 'g', revisorNome: 'Gestor', dataHora: timestamp('2026-11-01T10:00:00Z')! } };
  const filhas = [
    { ...base('a-d1'), derivacao: { originalId: 'a', grupoId: 'a', ordem: 1, revisorId: 'g', dataHora: timestamp('2026-11-01T10:00:00Z')! }, status: 'aprovada' as const },
    { ...base('a-d2'), derivacao: { originalId: 'a', grupoId: 'a', ordem: 2, revisorId: 'g', dataHora: timestamp('2026-11-01T10:00:00Z')! }, status: 'aguardando' as const },
  ];
  const todos = [original, ...filhas];
  assert.deepEqual(resumoAprovacaoOriginais(todos), { total: 1, integrais: 0, parciais: 1, taxa: 0 });
  const resumo = calcularGovernanca(todos);
  assert.equal(resumo.originais, 1);
  assert.equal(resumo.derivadas, 2);
  assert.equal(resumo.pendentes, 1);
  assert.equal(resumo.parciais, 1);
});

test('IQF só aparece em avaliação humana completa; indeterminada não recebe nota fictícia', () => {
  const parcial = { ...base('p'), avaliacaoQualidade: { atomicidadeStatus: 'unica' as const } };
  assert.equal(calcularGovernanca([parcial]).iqfMedio, null);
  const completa = { ...base('c'), avaliacaoQualidade: { atomicidadeStatus: 'unica' as const, especificidadeNivel: 'adequada' as const, pertinenciaClinica: 'pertinente' as const, exequibilidadeNivel: 'parcial' as const, reavaliabilidadeNivel: 'adequada' as const, avaliadorId: 'gestor' } };
  assert.equal(calcularGovernanca([parcial, completa]).iqfMedio, 90);
  assert.equal(calcularGovernanca([completa]).qualidade.atomicidadeStatus.total, 1);
});

test('datas de São Paulo, decisões e registros legados são separados', () => {
  assert.equal(mesSaoPaulo(new Date('2026-11-01T02:30:00Z')), '2026-10');
  const aprovada = { ...base('a'), status: 'aprovada' as const, dataDecisao: timestamp('2026-11-02T15:00:00Z') };
  const legado = { ...base('l'), dataCriacao: undefined };
  const resumo = calcularGovernanca([aprovada, legado]);
  assert.deepEqual(resumo.serie.map(p => [p.periodo, p.recebidas, p.aprovadas]), [['2026-10', 1, 0], ['2026-11', 0, 1]]);
  assert.equal(resumo.tempo.amostra, 1);
  assert.equal(filtrarGovernanca([aprovada, legado], { periodo: '30', status: 'todos', diagnostico: '', resultado: '', tipo: 'todos', categoria: 'todas' }, new Date('2026-11-02')).length, 1);
});

test('duplicidade exata, normalizada e similar é somente triagem textual e escala a 1.300 sugestões', () => {
  const massa = Array.from({ length: 1300 }, (_, i) => base(String(i), i < 100 ? 'Orientar retorno programado ao paciente' : `Ação individual ${i}`));
  massa[100].textoIntervencao = 'Retorno programado orientar ao paciente';
  massa[101].textoIntervencao = 'Programado retorno orientar ao paciente';
  const grupos = agruparSugestoes(massa);
  assert.equal(grupos[0].ocorrencias.length, 100);
  assert.ok(grupos.some(g => g.tipo === 'similar'));
});
