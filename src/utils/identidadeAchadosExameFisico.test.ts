import assert from 'node:assert/strict';
import test from 'node:test';
import type { ExameFisicoSelecao } from '@/types/processoEnfermagem';
import { alternarSelecaoAchado, criarIdentidadeAchadoExameFisico, resolverSelecaoLegada } from './identidadeAchadosExameFisico';

const criar = (sistemaId: string, indiceAchado: number, indiceOpcao = 0, texto = 'Presente'): ExameFisicoSelecao => ({
  identidade: criarIdentidadeAchadoExameFisico({ sistemaId, exame: 'Pele', indiceAchado, achado: `Achado ${indiceAchado}`, indiceOpcao, opcao: texto }),
  grupoAchado: criarIdentidadeAchadoExameFisico({ sistemaId, exame: 'Pele', indiceAchado, achado: `Achado ${indiceAchado}` }),
  sistemaId, sistema: 'Tegumentar', exame: 'Pele', achado: `Achado ${indiceAchado}`, opcao: texto,
  tipo: 'opcao', alterado: true, nhb: 'Integridade da pele',
});

test('identidade distingue sistema, achado e opção mesmo com rótulos repetidos', () => {
  const a = criar('sistema-a', 0);
  const b = criar('sistema-a', 1);
  const c = criar('sistema-b', 0);
  assert.equal(new Set([a.identidade, b.identidade, c.identidade]).size, 3);
});

test('seleção e desmarcação são independentes e opções do mesmo achado são exclusivas', () => {
  const presente = criar('sistema-a', 0, 0, 'Presente');
  const ausente = { ...presente, identidade: criarIdentidadeAchadoExameFisico({ sistemaId: 'sistema-a', exame: 'Pele', indiceAchado: 0, achado: 'Achado 0', indiceOpcao: 1, opcao: 'Ausente' }), opcao: 'Ausente' };
  const outro = criar('sistema-a', 1);
  let selecoes = alternarSelecaoAchado({}, presente, true);
  selecoes = alternarSelecaoAchado(selecoes, outro, true);
  assert.equal(Object.keys(selecoes).length, 2);
  selecoes = alternarSelecaoAchado(selecoes, ausente, true);
  assert.deepEqual(Object.values(selecoes).map(item => item.opcao).sort(), ['Ausente', 'Presente']);
  assert.equal(Object.values(selecoes).filter(item => item.grupoAchado === presente.grupoAchado).length, 1);
  selecoes = alternarSelecaoAchado(selecoes, ausente, false);
  assert.deepEqual(Object.values(selecoes).map(item => item.opcao), ['Presente']);
});

test('texto legado só é recuperado quando não há ambiguidade', () => {
  const candidatos = [
    { sistemaId: 's1', exame: 'Pele', texto: 'Presente', id: 'a' },
    { sistemaId: 's2', exame: 'Pele', texto: 'Presente', id: 'b' },
  ];
  assert.equal(resolverSelecaoLegada(candidatos, '', 'Pele', 'Presente'), undefined);
  assert.equal(resolverSelecaoLegada(candidatos, 's1', 'Pele', 'Presente')?.id, 'a');
});
