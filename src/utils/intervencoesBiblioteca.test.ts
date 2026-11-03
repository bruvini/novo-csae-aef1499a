import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtrarDestinosDiagnosticos, obterDisponibilidadePorResultado, validarPreparacao } from './intervencoesBiblioteca';

test('catálogo de destino permanece pesquisável além das primeiras 100 opções e preserva índices de resultados repetidos', () => {
  const diagnosticos = Array.from({ length: 140 }, (_, indice) => ({
    id: `d${indice}`, tituloDiagnostico: `Diagnóstico ${indice}`,
    resultadosEsperados: [{ tituloResultado: 'Resultado repetido' }, { tituloResultado: indice === 139 ? 'Resultado final' : 'Outro resultado' }],
  }));
  const encontrados = filtrarDestinosDiagnosticos(diagnosticos, 'final');
  assert.equal(encontrados.length, 1);
  assert.equal(encontrados[0].diagnostico.id, 'd139');
  assert.equal(encontrados[0].resultado.resultadoIndice, 1);
  assert.equal(filtrarDestinosDiagnosticos([diagnosticos[0]], 'repetido').length, 1);
});

test('publicação específica admite mais de cinco destinos e não exige campos manuais de homologação', () => {
  const destinos = Array.from({ length: 8 }, (_, indice) => ({ diagnosticoId: `d${indice}`, tituloDiagnostico: `Diagnóstico ${indice}`, tituloResultado: `Resultado ${indice}`, resultadoIndice: 0 }));
  assert.doesNotThrow(() => validarPreparacao({ acaoPrescrita: 'Orientar', acaoEnfermeiro: 'Oriento', destinos }));
  assert.throws(() => validarPreparacao({ acaoPrescrita: 'Orientar', acaoEnfermeiro: 'Oriento', destinos: [...destinos, destinos[0]] }), /repetidos/);
});

test('transversal não recebe destinos e sua utilização exige seleção por resultado', () => {
  assert.doesNotThrow(() => validarPreparacao({ acaoPrescrita: 'Orientar', acaoEnfermeiro: 'Oriento', destinos: [], modoDisponibilidade: 'transversal' }));
  assert.throws(() => validarPreparacao({ acaoPrescrita: 'Orientar', acaoEnfermeiro: 'Oriento', destinos: [{ diagnosticoId: 'd', tituloDiagnostico: 'D', tituloResultado: 'R' }], modoDisponibilidade: 'transversal' }), /não pode conter destinos/);
  const library = [
    { modoDisponibilidade: 'transversal' as const, destinos: [] },
    { modoDisponibilidade: 'resultados_especificos' as const, destinos: [{ diagnosticoId: 'd', tituloDiagnostico: 'D', tituloResultado: 'R', resultadoIndice: 1 }] },
  ];
  assert.deepEqual(obterDisponibilidadePorResultado(library, 'd', 1, 'R'), library);
  assert.deepEqual(obterDisponibilidadePorResultado(library, 'd', 0, 'R'), [library[0]]);
});
