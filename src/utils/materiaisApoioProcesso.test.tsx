import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { JSDOM } from 'jsdom';
import { fireEvent } from '@testing-library/dom';
import type { DiagnosticoPlanejado, ImplementacaoEnfermagem, IntervencaoImplementada } from '@/types/processoEnfermagem';
import {
  assinaturaEntregas, atualizarEntrega, conciliarImplementacao, criarIntervencaoConsulta, invalidarResumoAoAlterarEntrega,
  linhasMateriaisEntregues, linkMaterialSeguro, materiaisAgrupados, materiaisDoProcesso,
} from './materiaisApoioProcesso';

const material = (titulo: string, url = 'https://drive.google.com/file/d/abc/view') => ({ tituloMaterialApoio: titulo, urlMaterialApoio: url });
const plano = (intervencoesSelecionadas: DiagnosticoPlanejado['intervencoesSelecionadas']): DiagnosticoPlanejado => ({ diagnosticoId: 'd1', tituloDiagnostico: 'Diagnóstico de teste', ordemPrioridade: 1, resultadoEsperadoSelecionado: 'Resultado', intervencoesSelecionadas });

test('seleção sem material e autoral preservam comportamento legado', () => {
  const padrao = criarIntervencaoConsulta({ acaoPrescrita: 'Avaliar', acaoEnfermeiro: 'Avalio' }, 'padrao', 'd1|Resultado|0', () => 'p1');
  const autoral = criarIntervencaoConsulta({ acaoPrescrita: 'Orientar', acaoEnfermeiro: '' }, 'autoral', undefined, () => 'a1');
  assert.deepEqual(padrao.materiaisDeApoio, []);
  assert.deepEqual(autoral.materiaisDeApoio, []);
  const implementacao = conciliarImplementacao([plano([padrao, autoral])], {});
  assert.equal(implementacao['Diagnóstico de teste'].intervencoes.length, 2);
  assert.equal(materiaisDoProcesso({ planejamento: { diagnosticosPlanejados: [plano([padrao, autoral])] }, implementacao }).length, 0);
});

test('um e vários materiais recebem IDs distintos; URLs e títulos são preservados', () => {
  const dados = { acaoPrescrita: 'Orientar alimentação', acaoEnfermeiro: 'Oriento alimentação', materiaisDeApoio: [material('Guia 1'), material('Guia 2'), material('Guia 2')] };
  const primeira = criarIntervencaoConsulta(dados, 'padrao', 'd1|Resultado|0', () => 'i1');
  const segunda = criarIntervencaoConsulta({ ...dados, acaoPrescrita: 'Orientar alimentação saudável' }, 'padrao', 'd1|Resultado|1', () => 'i2');
  assert.deepEqual(primeira.materiaisDeApoio?.map(m => m.id), ['i1:m1', 'i1:m2', 'i1:m3']);
  assert.notEqual(primeira.intervencaoId, segunda.intervencaoId);
  assert.equal(primeira.materiaisDeApoio?.[0].urlMaterialApoio, dados.materiaisDeApoio[0].urlMaterialApoio);
  const unico = criarIntervencaoConsulta({ ...dados, materiaisDeApoio: [material('Único')] }, 'padrao', undefined, () => 'i3');
  assert.equal(unico.materiaisDeApoio?.length, 1);
});

test('entrega é opcional, independente da implementação e sobrevive a atualização, navegação e reabertura', () => {
  const selecionada = criarIntervencaoConsulta({ acaoPrescrita: 'Orientar', acaoEnfermeiro: 'Oriento', materiaisDeApoio: [material('A'), material('B')] }, 'padrao', 'd1|Resultado|0', () => 'i1');
  const planejamento = { diagnosticosPlanejados: [plano([selecionada])] };
  const inicial = conciliarImplementacao(planejamento.diagnosticosPlanejados, {});
  const original = inicial['Diagnóstico de teste'].intervencoes[0];
  assert.equal(original.implementadoNestaConsulta, false);
  assert.deepEqual(linhasMateriaisEntregues({ planejamento, implementacao: inicial }), []);
  const um = atualizarEntrega(original, 'i1:m1', true);
  assert.equal(um.implementadoNestaConsulta, false);
  const dois = atualizarEntrega(um, 'i1:m2', true);
  const editada: ImplementacaoEnfermagem = { 'Diagnóstico de teste': { intervencoes: [{ ...dois, quemExecuta: 'Enfermeiro', prazo: 3 }] } };
  const reaberta = JSON.parse(JSON.stringify({ planejamento, implementacao: editada })) as { planejamento: typeof planejamento; implementacao: ImplementacaoEnfermagem };
  const conciliada = conciliarImplementacao(reaberta.planejamento.diagnosticosPlanejados, reaberta.implementacao);
  assert.deepEqual(conciliada['Diagnóstico de teste'].intervencoes[0].materiaisEntreguesIds, ['i1:m1', 'i1:m2']);
  assert.equal(conciliada['Diagnóstico de teste'].intervencoes[0].prazo, 3);
  assert.deepEqual(linhasMateriaisEntregues({ ...reaberta, implementacao: conciliada }), ['Material de apoio entregue: A.', 'Material de apoio entregue: B.']);
  const removida = atualizarEntrega(conciliada['Diagnóstico de teste'].intervencoes[0], 'i1:m1', false);
  assert.deepEqual(removida.materiaisEntreguesIds, ['i1:m2']);
  assert.deepEqual(original.materiaisEntreguesIds, undefined);
  assert.notEqual(assinaturaEntregas(inicial), assinaturaEntregas(editada));
  assert.equal(invalidarResumoAoAlterarEntrega({ resumoGerado: 'texto antigo', julgamentoClinico: 'Mantido' }, inicial, editada).resumoGerado, '');
  assert.equal(invalidarResumoAoAlterarEntrega({ resumoGerado: 'texto atual' }, editada, editada).resumoGerado, 'texto atual');
});

test('legados sem IDs não recebem materiais retroativamente e mantêm sua implementação', () => {
  const legado = { acaoPrescrita: 'Orientar retorno', tipo: 'padrao' as const };
  const atual: ImplementacaoEnfermagem = { 'Diagnóstico de teste': { intervencoes: [{ ...legado, implementadoNestaConsulta: true, quemExecuta: 'Enfermeiro' }] } };
  const conciliada = conciliarImplementacao([plano([legado])], atual);
  assert.equal(conciliada['Diagnóstico de teste'].intervencoes[0].quemExecuta, 'Enfermeiro');
  assert.equal(materiaisAgrupados({ planejamento: { diagnosticosPlanejados: [plano([legado])] }, implementacao: conciliada }).length, 0);
});

test('texto do prontuário contém apenas entregas declaradas e nenhuma URL', () => {
  const selecionada = criarIntervencaoConsulta({ acaoPrescrita: 'Orientar', acaoEnfermeiro: 'Oriento', materiaisDeApoio: [material('Entregue'), material('Não entregue')] }, 'padrao', undefined, () => 'i1');
  const planejamento = { diagnosticosPlanejados: [plano([selecionada])] };
  const implementacao: ImplementacaoEnfermagem = { 'Diagnóstico de teste': { intervencoes: [atualizarEntrega({ intervencaoId: 'i1', acaoPrescrita: 'Orientar', tipo: 'padrao', implementadoNestaConsulta: false }, 'i1:m1', true)] } };
  const linhas = linhasMateriaisEntregues({ planejamento, implementacao });
  assert.deepEqual(linhas, ['Material de apoio entregue: Entregue.']);
  assert.ok(!linhas.join(' ').includes('https://'));
  assert.equal(materiaisAgrupados({ planejamento, implementacao })[0].materiais[1].entregue, false);
});

test('somente HTTPS válido é clicável; Drive público permanece aceito', () => {
  assert.equal(linkMaterialSeguro('https://drive.google.com/file/d/abc/view'), 'https://drive.google.com/file/d/abc/view');
  assert.equal(linkMaterialSeguro('http://drive.google.com/file/d/abc/view'), null);
  assert.equal(linkMaterialSeguro('javascript:alert(1)'), null);
  assert.equal(linkMaterialSeguro('https://user:pass@example.com/doc'), null);
  assert.equal(linkMaterialSeguro('invalido'), null);
});

test('abrir link não marca entrega; checkbox altera apenas a declaração', async () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://csae.com.br' });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: dom.window });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: dom.window.document });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator });
  for (const nome of ['DocumentFragment', 'HTMLElement', 'Element', 'Node', 'MutationObserver'] as const) {
    Object.defineProperty(globalThis, nome, { configurable: true, value: dom.window[nome] });
  }
  const { render, cleanup } = await import('@testing-library/react');
  const { default: IntervencaoItem } = await import('@/components/processo-enfermagem/IntervencaoItem');
  const alteracoes: IntervencaoImplementada[] = [];
  const entregas: Array<[string, boolean]> = [];
  const intervencao: IntervencaoImplementada = { intervencaoId: 'i1', acaoPrescrita: 'Orientar', tipo: 'padrao', implementadoNestaConsulta: false };
  const tela = render(React.createElement(IntervencaoItem, { intervencao, materiais: [{ id: 'i1:m1', ...material('Guia') }], identificador: 'd1-0', onUpdate: (value: IntervencaoImplementada) => alteracoes.push(value), onMaterialEntregaChange: (id: string, entregue: boolean) => entregas.push([id, entregue]) }));
  const link = tela.getByRole('link', { name: 'Abrir Guia em nova aba' });
  assert.equal(link.getAttribute('target'), '_blank');
  assert.equal(link.getAttribute('rel'), 'noopener noreferrer');
  fireEvent.click(link);
  assert.equal(alteracoes.length, 0);
  assert.equal(entregas.length, 0);
  fireEvent.click(tela.getByRole('checkbox', { name: 'Material entregue: Guia' }));
  assert.deepEqual(entregas, [['i1:m1', true]]);
  assert.equal(alteracoes.length, 0);
  cleanup(); dom.window.close();
});

test('visualização de Evolução e Resumo distingue entregue e não entregue sem expor URL no texto', async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: MateriaisApoioLeitura } = await import('@/components/processo-enfermagem/MateriaisApoioLeitura');
  const html = renderToStaticMarkup(React.createElement(MateriaisApoioLeitura, { materiais: [
    { id: 'm1', ...material('Guia entregue'), entregue: true },
    { id: 'm2', ...material('Guia pendente', 'http://invalido.test'), entregue: false },
  ] }));
  assert.match(html, /Guia entregue/);
  assert.match(html, /Não entregue/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.equal((html.match(/<a /g) || []).length, 1);
});
