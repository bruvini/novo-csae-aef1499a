import assert from 'node:assert/strict';
import test from 'node:test';
import { classificarReferenciaNumerica, classificarReferenciaQualitativa, contextoDaReferencia, contextosDaReferencia, contextosAplicaveisAoPaciente, familiaPressaoArterial, contextoRegistradoParaTexto, identidadeParametroVital, idadeCompativel, interpretarRegra, normalizarNomeClinico } from './referenciasClinicas';

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
  assert.equal(classificarReferenciaNumerica(125, r, pessoa, 'gestante').status, 'neutro'); // conflito: limítrofe geral × meta gestante
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

test('não confunde exceto gestantes com gestação e não mascara hipoglicemia', () => {
  const r = [
    { valorMinimo: 0, valorMaximo: 91, criterioCondicao: 'Gestante — jejum', nomeAlteracao: 'Normal' },
    { valorMinimo: 0, valorMaximo: 59, criterioCondicao: 'Gestante — hipoglicemia', nomeAlteracao: 'Hipoglicemia', subconjuntoNHBVinculado: 'Regulação neurológica' },
  ];
  assert.equal(contextoDaReferencia({criterioCondicao: 'Jejum (≥8h) — pessoas com DM, exceto gestantes'}), 'diabetes_jejum');
  assert.equal(classificarReferenciaNumerica(50, r, pessoa, 'gestante_jejum').status, 'neutro');
});

test('contextos explícitos aparecem no resumo sem inventar contexto para dados legados', () => {
  assert.equal(contextoRegistradoParaTexto(undefined, 'Glicemia Capilar'), '');
  assert.match(contextoRegistradoParaTexto({ 'Glicemia Capilar': 'gestante_jejum' }, 'Glicemia Capilar'), /Gestação — jejum/);
  assert.match(contextoRegistradoParaTexto({ 'PAS': 'situacao-antiga' }, 'PAS'), /situacao-antiga/);
});

test('resultado informativo e valor limítrofe não geram alerta nem NHB automática', () => {
  const info = { ...base, valorMinimo: 5, valorMaximo: 24.99, interpretacaoClinica: 'informativo' as const, nomeAlteracao: 'Beta-hCG faixa limítrofe', subconjuntoNHBVinculado: '' };
  assert.equal(classificarReferenciaNumerica(14, [info], pessoa, 'geral').status, 'neutro');
  const categoria = { resultadoClassificatorio: 'BI-RADS 3 — provavelmente benigno', interpretacaoClinica: 'informativo' as const, nomeAlteracao: 'Seguimento orientado pelo laudo', subconjuntoNHBVinculado: '' };
  assert.equal(classificarReferenciaQualitativa('BI-RADS 3 — provavelmente benigno', [categoria]).status, 'neutro');
  const suspeito = { resultadoClassificatorio: 'BI-RADS 4 — suspeito', interpretacaoClinica: 'alterado' as const, nomeAlteracao: 'Achado suspeito — encaminhar', subconjuntoNHBVinculado: 'Terapêutica e de Prevenção' };
  assert.equal(classificarReferenciaQualitativa('BI-RADS 4 — suspeito', [suspeito]).nhb, 'Terapêutica e de Prevenção');
});

test('faixa geral cadastrada classifica temperatura 38 °C e não altera a referência', () => {
  const referencias = [
    { ...base, valorMinimo: 35.5, valorMaximo: 37.9, contextoClinico: 'geral', nomeAlteracao: 'Normalidade', interpretacaoClinica: 'normal' as const },
    { ...base, valorMinimo: 38, valorMaximo: null, contextoClinico: 'geral', nomeAlteracao: 'Febre', interpretacaoClinica: 'alterado' as const, subconjuntoNHBVinculado: 'Regulação térmica' },
  ];
  const antes = structuredClone(referencias);
  const resultado = classificarReferenciaNumerica(38, referencias, pessoa);
  assert.equal(resultado.status, 'alterado');
  assert.equal(resultado.nomeAlteracao, 'Febre');
  assert.deepEqual(referencias, antes);
});

test('38 °C sem faixa geral não usa faixa exclusiva de dengue', () => {
  const dengue = { ...base, valorMinimo: 38, valorMaximo: null, criterioCondicao: 'Investigação de dengue', nomeAlteracao: 'Febre', subconjuntoNHBVinculado: 'Regulação térmica' };
  const semContexto = classificarReferenciaNumerica(38, [dengue], pessoa);
  const geral = classificarReferenciaNumerica(38, [dengue], pessoa, 'geral');
  const contextoEspecifico = classificarReferenciaNumerica(38, [dengue], pessoa, 'dengue');
  assert.equal(contextoDaReferencia(dengue), 'dengue');
  assert.equal(semContexto.codigoMotivo, 'contexto-nao-selecionado');
  assert.equal(geral.codigoMotivo, 'contexto-sem-referencia');
  assert.equal(contextoEspecifico.status, 'alterado');
});

test('referência legada de febre conserva os dois contextos que declara no protocolo', () => {
  const legado = {
    ...base,
    valorMinimo: 38,
    valorMaximo: null,
    criterioCondicao: 'Sinal de gravidade em hipoglicemia/desidratação (P1); compõe caso suspeito de dengue (P2)',
    nomeAlteracao: 'Febre',
    subconjuntoNHBVinculado: 'Regulação térmica',
  };
  assert.deepEqual(contextosDaReferencia(legado), ['hipoglicemia_desidratacao_grave', 'dengue']);
  assert.equal(classificarReferenciaNumerica(38, [legado], pessoa).codigoMotivo, 'contexto-nao-selecionado');
  assert.equal(classificarReferenciaNumerica(38, [legado], pessoa, 'hipoglicemia_desidratacao_grave').status, 'alterado');
  assert.equal(classificarReferenciaNumerica(38, [legado], pessoa, 'dengue').status, 'alterado');
  assert.equal(classificarReferenciaNumerica(38, [legado], pessoa, 'geral').codigoMotivo, 'contexto-sem-referencia');
});

test('avaliação geral única é automática, mas contexto específico único exige seleção explícita', () => {
  const geral = { ...base, contextoClinico: 'geral', interpretacaoClinica: 'normal' as const };
  const especial = { ...base, contextoClinico: 'dengue', interpretacaoClinica: 'alterado' as const, nomeAlteracao: 'Febre' };
  assert.equal(classificarReferenciaNumerica(80, [geral], pessoa).status, 'normal');
  assert.equal(classificarReferenciaNumerica(80, [especial], pessoa).codigoMotivo, 'contexto-nao-selecionado');
  assert.deepEqual(contextosAplicaveisAoPaciente([geral, especial], pessoa), ['geral', 'dengue']);
});

test('contextos disponíveis respeitam idade e sexo e não aplicam regra de outro perfil', () => {
  const referencias = [
    { ...base, contextoClinico: 'geral' },
    { ...base, criterioSexo: 'Feminino', contextoClinico: 'gestante' },
    { ...base, idadeMinima: 0, idadeMaxima: 10, idadeUnidade: 'anos' as const, contextoClinico: 'pediatrico' },
  ];
  assert.deepEqual(contextosAplicaveisAoPaciente(referencias, pessoa), ['geral', 'gestante']);
  assert.equal(classificarReferenciaNumerica(80, referencias, pessoa, 'pediatrico').codigoMotivo, 'contexto-sem-referencia');
});

test('contextos de glicemia em jejum, pós-prandial e gestação continuam independentes', () => {
  const referencias = [
    { ...base, valorMinimo: 70, valorMaximo: 99, criterioCondicao: 'Jejum — Diabetes', nomeAlteracao: 'Dentro da meta' },
    { ...base, valorMinimo: 0, valorMaximo: 180, criterioCondicao: '2h após refeição — Diabetes', nomeAlteracao: 'Dentro da meta' },
    { ...base, valorMinimo: 0, valorMaximo: 91, criterioCondicao: 'Gestante — jejum', nomeAlteracao: 'Normal gestacional' },
  ];
  assert.equal(classificarReferenciaNumerica(95, referencias, pessoa, 'diabetes_jejum').status, 'normal');
  assert.equal(classificarReferenciaNumerica(95, referencias, pessoa, 'diabetes_pos_2h').status, 'normal');
  assert.equal(classificarReferenciaNumerica(95, referencias, pessoa, 'gestante_jejum').codigoMotivo, 'fora-das-faixas');
  assert.equal(classificarReferenciaNumerica(95, referencias, pessoa).codigoMotivo, 'contexto-nao-selecionado');
});

test('distingue valor fora de faixa, falta de contexto e referências conflitantes', () => {
  const normal = { ...base, valorMinimo: 35.5, valorMaximo: 37.9, contextoClinico: 'geral', interpretacaoClinica: 'normal' as const };
  const alterada = { ...base, valorMinimo: 37, valorMaximo: 39, contextoClinico: 'geral', nomeAlteracao: 'Febre', interpretacaoClinica: 'alterado' as const };
  assert.equal(classificarReferenciaNumerica(40, [normal], pessoa, 'geral').codigoMotivo, 'fora-das-faixas');
  assert.equal(classificarReferenciaNumerica(37.5, [normal, alterada], pessoa, 'geral').codigoMotivo, 'referencias-conflitantes');
  assert.equal(classificarReferenciaNumerica(37.5, [normal, alterada], pessoa).codigoMotivo, 'referencias-conflitantes');
});
