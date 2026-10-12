import assert from 'node:assert/strict';
import test from 'node:test';
import { protegerVinculosDoRol, type IdentidadesRol } from './protecaoRolHistorico';

const anterior = (): IdentidadesRol => ({
  tituloDiagnostico: 'Dor aguda',
  subconjuntos: [{ tipoSubconjunto: 'nhb', tituloSubconjunto: 'Conforto' }],
  resultadosEsperados: [{
    tituloResultado: 'Dor controlada',
    intervencoes: [
      { acaoPrescrita: 'Avaliar dor', acaoEnfermeiro: 'Avalio dor' },
      { acaoPrescrita: 'Orientar repouso', acaoEnfermeiro: 'Oriento repouso' },
    ],
  }],
});
test('permite adicionar resultado, intervenção e subconjunto sem afetar históricos', () => {
  const proximo = anterior();
  proximo.subconjuntos.push({ tipoSubconjunto: 'protocolo', tituloSubconjunto: 'Dor' });
  proximo.resultadosEsperados[0].intervencoes.push({
    acaoPrescrita: 'Orientar hidratação', acaoEnfermeiro: 'Oriento hidratação',
  });
  proximo.resultadosEsperados.push({
    tituloResultado: 'Conforto melhorado', intervencoes: [],
  });
  assert.doesNotThrow(() => protegerVinculosDoRol(anterior(), proximo));
});
test('bloqueia troca do título e remoção de NHB já relacionada', () => {
  assert.throws(() => protegerVinculosDoRol(anterior(),
    { ...anterior(), tituloDiagnostico: 'Outro diagnóstico' }), /renomear/);
  assert.throws(() => protegerVinculosDoRol(anterior(),
    { ...anterior(), subconjuntos: [] }), /NHBs/);
});
test('bloqueia remoção ou renomeação de resultado e intervenção já usados', () => {
  assert.throws(() => protegerVinculosDoRol(anterior(), {
    ...anterior(), resultadosEsperados: [],
  }), /resultados antigos|resultado esperado/);
  const edit = anterior();
  edit.resultadosEsperados[0].intervencoes[0].acaoPrescrita = 'Reavaliar sintomas';
  assert.throws(() => protegerVinculosDoRol(anterior(), edit), /ação prescrita/);
  const nurse = anterior();
  nurse.resultadosEsperados[0].intervencoes[0].acaoEnfermeiro = 'Alterado';
  assert.throws(() => protegerVinculosDoRol(anterior(), nurse), /enfermeiro/);
});
test('não introduz resultados duplicados que disputariam a seleção no planejamento', () => {
  const a = anterior();
  a.resultadosEsperados.push({ tituloResultado: 'DOR CONTROLADA', intervencoes: [] });
  assert.throws(() => protegerVinculosDoRol(anterior(), a), /duplicado/);
});

test('legado com resultados repetidos não perde nenhum registro ao editar', () => {
  const velho = anterior();
  velho.resultadosEsperados.push({ ...velho.resultadosEsperados[0] });
  const novo = anterior();
  assert.throws(() => protegerVinculosDoRol(velho, novo), /resultados antigos/);
  assert.doesNotThrow(() => protegerVinculosDoRol(velho, velho));
});
