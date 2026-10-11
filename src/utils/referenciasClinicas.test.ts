import assert from 'node:assert/strict';
import test from 'node:test';
import { classificarReferenciaNumerica, classificarReferenciaQualitativa, contextoDaReferencia, familiaPressaoArterial, identidadeParametroVital, idadeCompativel, interpretarRegra, normalizarNomeClinico } from './referenciasClinicas';

const pessoa = { dataNascimento: new Date(1995, 3, 10), sexo: 'Feminino', dataAvaliacao: new Date(2026, 9, 11) };
const base = { idadeUnidade: 'anos' as const, criterioSexo: 'Ambos', nomeAlteracao: 'Normal', valorMinimo: 60, valorMaximo: 100 };

test('idade em dias e meses respeita fronteiras e não compara meses com anos', () => {
  const bebe = new Date(2026, 0, 15);
  assert.equal(idadeCompativel({idadeMinima: 2, idadeMaxima: 11, idadeUnidade: 'meses'}, bebe, new Date(2026,2,14)), false);
  assert.equal(idadeCompativel({idadeMinima: 2, idadeMaxima: 11, idadeUnidade: 'meses'}, bebe, new Date(2026,2,15)), true);
  assert.equal(idadeCompativel({idadeMinima: 7, idadeMaxima: 9, idadeUnidade: 'dias'}, bebe, new Date(2026,0,23)), true);
});
test('zero é válido e não confunde anormal com normal', () => {
  const result = classificarReferenciaNumerica(0, [{...base, valorMinimo: 0, valorMaximo: 5, nomeAlteracao: 'Anormal', subconjuntoNHBVinculado: 'Regulação térmica'}], pessoa, 'geral');
  assert.equal(result.status, 'alterado');
  assert.equal(interpretarRegra({nomeAlteracao:'Não Reagente'}), 'normal');
  assert.equal(interpretarRegra({nomeAlteracao:'Dentro da Meta'}), 'normal');
});
test('gestação não é inferida pelo sexo e requer contexto explícito', () => {
  const r = [{ ...base, valorMinimo: 120, valorMaximo: 139, nomeAlteracao: 'Limítrofe', subconjuntoNHBVinculado: 'Regulação vascular' },
    { ...base, valorMinimo: 100, valorMaximo: 139, criterioSexo: 'Feminino', criterioCondicao: 'Gestante normal', nomeAlteracao: 'Normal (Gestante)' }];
  assert.equal(classificarReferenciaNumerica(125, r, pessoa).status, 'neutro');
  assert.equal(classificarReferenciaNumerica(125, r, pessoa, 'geral').status, 'alterado');
  assert.equal(classificarReferenciaNumerica(125, r, pessoa, 'gestante').status, 'normal');
});
test('jejum e pós-prandial são contextos diferentes', () => {
  const r = [
    { ...base, valorMinimo: 80, valorMaximo: 130, criterioCondicao: 'Jejum — DM', nomeAlteracao: 'Dentro da meta' },
    { ...base, valorMinimo: 0, valorMaximo: 180, criterioCondicao: '2h após refeição — DM', nomeAlteracao: 'Dentro da meta' },
  ];
  assert.equal(contextoDaReferencia(r[0]), 'diabetes_jejum');
  assert.equal(contextoDaReferencia(r[1]), 'diabetes_pos_2h');
  assert.equal(classificarReferenciaNumerica(150, r, pessoa, 'diabetes_jejum').status,'neutro');
  assert.equal(classificarReferenciaNumerica(150, r, pessoa, 'diabetes_pos_2h').status, 'normal');
});
test('não escolhe silenciosamente primeira faixa divergente', () => {
  const r = [{ ...base, nomeAlteracao: 'Normal' }, { ...base, nomeAlteracao: 'Taquicardia', subconjuntoNHBVinculado: 'Oxigenação' }];
  assert.equal(classificarReferenciaNumerica(80, r, pessoa, 'geral').status, 'neutro');
});
test('respeita classificação explícita ao invés de heurística lexical', () => {
  assert.equal(classificarReferenciaNumerica(90, [{ ...base, interpretacaoClinica: 'indeterminado' }], pessoa, 'geral').status,'neutro');
  assert.equal(classificarReferenciaQualitativa('Não reagente', [{ resultadoClassificatorio:'Não reagente', nomeAlteracao:'Normal', interpretacaoClinica:'normal' }]).status,'normal');
});
test('protege família de PA sem confundir cálculos e medidas derivadas', () => {
  assert.equal(familiaPressaoArterial('PRESSÃO ARTERIAL sistólica — Investigação de dengue'),'pas');
  assert.equal(familiaPressaoArterial('Pressão arterial sistólica (PAS)'),'pas');
  assert.equal(familiaPressaoArterial('Pressão diferencial (Convergência)'),null);
  assert.equal(familiaPressaoArterial('Queda da PA sistólica na manobra postural'),null);
  assert.equal(normalizarNomeClinico(' Pressão   ARTERIAL '), 'pressao arterial');
});

test('não permite aliases de PA, FC ou FR como outro parâmetro', () => {
  assert.equal(identidadeParametroVital('Frequência Cardíaca'), identidadeParametroVital('Frequência Cardíaca (FC)'));
  assert.equal(identidadeParametroVital('FR'), identidadeParametroVital('Frequência Respiratória'));
  assert.equal(identidadeParametroVital('Pressão Arterial'), 'pressao-arterial-composta');
});
