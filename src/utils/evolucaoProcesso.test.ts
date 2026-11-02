import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ProcessoEnfermagem } from '@/types/processoEnfermagem';
import { alinharDiagnosticosPlanejados, calcularEtapasCompletadas, reordenarDiagnosticosPlanejados } from './processoUtils';
import { conciliarEvolucao, obterIntervencoesDaConsulta, referenciaIntervencao, referenciaResultado } from './evolucaoProcesso';

function processo(): ProcessoEnfermagem {
  const a = { intervencaoId: 'i1', acaoPrescrita: 'Orientar alimentação', tipo: 'padrao' as const };
  const b = { intervencaoId: 'i2', acaoPrescrita: 'Orientar alimentação', tipo: 'padrao' as const };
  return {
    id: 'p1', pacienteId: 'paciente-ficticio', enfermeiroId: 'e1', status: 'em_andamento', etapaAtual: 5,
    dataInicio: null as unknown as ProcessoEnfermagem['dataInicio'], sessoesDeTrabalho: [],
    avaliacao: { coletaDeDadosSubjetivos: 'Consulta fictícia.', exameFisico: { Temperatura: 36 }, nhbsAfetadas: [] },
    diagnostico: { diagnosticosSelecionados: [{ id: 'd1', tituloDiagnostico: 'Diagnóstico fictício' }] },
    planejamento: { diagnosticosPlanejados: [{ diagnosticoId: 'd1', tituloDiagnostico: 'Diagnóstico fictício', ordemPrioridade: 1, resultadoPlanejadoId: 'r1', resultadoEsperadoSelecionado: 'Resultado fictício', intervencoesSelecionadas: [a, b] }] },
    implementacao: { 'Diagnóstico fictício': { intervencoes: [{ ...a, implementadoNestaConsulta: true, quemExecuta: 'Enfermeiro' }, { ...b, implementadoNestaConsulta: true, quemExecuta: 'Cuidador/Familiar' }] } },
    evolucao: { resumoGerado: '' },
  };
}

test('ordem salva prevalece, diagnóstico novo entra ao final e permanece após reabertura', () => {
  const selecionados = [{ id: 'a', tituloDiagnostico: 'A' }, { id: 'b', tituloDiagnostico: 'B' }, { id: 'c', tituloDiagnostico: 'C' }];
  const salvos = [{ diagnosticoId: 'b', tituloDiagnostico: 'B', ordemPrioridade: 1, intervencoesSelecionadas: [] }, { diagnosticoId: 'a', tituloDiagnostico: 'A', ordemPrioridade: 2, intervencoesSelecionadas: [] }];
  const alinhados = alinharDiagnosticosPlanejados(selecionados, salvos);
  assert.deepEqual(alinhados.map((item) => item.diagnosticoId), ['b', 'a', 'c']);
  assert.deepEqual(alinharDiagnosticosPlanejados(selecionados, JSON.parse(JSON.stringify(alinhados))).map((item) => item.ordemPrioridade), [1, 2, 3]);
  const teclado = reordenarDiagnosticosPlanejados(alinhados, 0, 2);
  assert.deepEqual(teclado.map((item) => item.diagnosticoId), ['a', 'c', 'b']);
  assert.deepEqual(alinharDiagnosticosPlanejados(selecionados, teclado).map((item) => item.diagnosticoId), ['a', 'c', 'b']);
});

test('instâncias iguais em texto mantêm IDs, executores e respostas independentes', () => {
  const atual = processo();
  const itens = obterIntervencoesDaConsulta(atual);
  assert.deepEqual(itens.map((item) => item.id), ['d1::i1', 'd1::i2']);
  assert.deepEqual(itens.map((item) => item.implementada?.quemExecuta), ['Enfermeiro', 'Cuidador/Familiar']);
  atual.evolucao.respostasIntervencoes = { [itens[0].id]: { diagnosticoId: 'd1', classificacao: 'parcial', observacao: 'Observado.' } };
  const reaberto = JSON.parse(JSON.stringify(atual)) as ProcessoEnfermagem;
  assert.deepEqual(conciliarEvolucao(reaberto).respostasIntervencoes, atual.evolucao.respostasIntervencoes);
});

test('observação compartilhada mantém um texto e vínculos editáveis a duas ações', () => {
  const atual = processo();
  const ids = obterIntervencoesDaConsulta(atual).map((item) => item.id);
  atual.evolucao.observacoesCompartilhadas = [{ id: 'o1', texto: 'Compreensão demonstrada.', intervencaoIds: ids }];
  assert.equal(conciliarEvolucao(atual).observacoesCompartilhadas?.length, 1);
  atual.implementacao['Diagnóstico fictício'].intervencoes[1].implementadoNestaConsulta = false;
  assert.deepEqual(conciliarEvolucao(atual).observacoesCompartilhadas?.[0].intervencaoIds, [ids[0]]);
});

test('respostas e avaliações órfãs são removidas; texto final é invalidado', () => {
  const atual = processo();
  atual.evolucao = {
    resumoGerado: 'texto antigo',
    respostasIntervencoes: { 'd1::i1': { diagnosticoId: 'd1', classificacao: 'favoravel' }, 'd1::i2': { diagnosticoId: 'd1', classificacao: 'parcial' } },
    avaliacoesResultados: { [referenciaResultado('d1', 'r1')]: { diagnosticoId: 'd1', resultadoTitulo: 'Resultado fictício', classificacao: 'nao_avaliavel' } },
  };
  atual.planejamento.diagnosticosPlanejados[0].intervencoesSelecionadas.pop();
  atual.planejamento.diagnosticosPlanejados[0].resultadoPlanejadoId = 'r2';
  const conciliada = conciliarEvolucao(atual);
  assert.deepEqual(Object.keys(conciliada.respostasIntervencoes || {}), ['d1::i1']);
  assert.deepEqual(conciliada.avaliacoesResultados, {});
  assert.equal(conciliada.resumoGerado, '');
});

test('sem intervenção realizada e sem síntese a Evolução visitada libera revisão sem ação fictícia', () => {
  const atual = processo();
  atual.implementacao['Diagnóstico fictício'].intervencoes.forEach((item) => { item.implementadoNestaConsulta = false; delete item.quemExecuta; });
  assert.deepEqual(calcularEtapasCompletadas(atual), [1, 2, 3, 4, 5]);
  assert.deepEqual(obterIntervencoesDaConsulta(atual).filter((item) => item.executada), []);
  assert.deepEqual(conciliarEvolucao(atual), atual.evolucao);
});

test('intervenções legadas sem ID conservam referência por posição sem modificar o processo', () => {
  const atual = processo();
  delete atual.planejamento.diagnosticosPlanejados[0].intervencoesSelecionadas[0].intervencaoId;
  delete atual.implementacao['Diagnóstico fictício'].intervencoes[0].intervencaoId;
  assert.equal(obterIntervencoesDaConsulta(atual)[0].id, referenciaIntervencao('d1', undefined, 0));
  assert.equal(atual.planejamento.diagnosticosPlanejados[0].intervencoesSelecionadas[0].intervencaoId, undefined);
});

test('tela distingue ação não realizada, executor de terceiro e todos os campos opcionais', async () => {
  const { default: EtapaEvolucao } = await import('@/components/processo-enfermagem/EtapaEvolucao');
  const atual = processo();
  atual.implementacao['Diagnóstico fictício'].intervencoes[0].implementadoNestaConsulta = false;
  const html = renderToStaticMarkup(React.createElement(EtapaEvolucao, { processo: atual, paciente: {} as never, onUpdateEvolucao: () => {} }));
  assert.match(html, /Não realizada nesta consulta/);
  assert.match(html, /Executor: Cuidador\/Familiar/);
  assert.equal((html.match(/Resposta observada \(opcional\)/g) || []).length, 1);
  assert.match(html, /Ainda não avaliável/);
  assert.match(html, /Síntese clínica da consulta \(opcional\)/);
});
