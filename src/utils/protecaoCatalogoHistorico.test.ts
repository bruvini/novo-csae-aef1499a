import test from 'node:test';
import assert from 'node:assert/strict';
import { validarAtualizacaoVital, validarAtualizacaoExame, validarAtualizacaoSistema } from './protecaoCatalogoHistorico';

test('sinal vital pode receber novas faixas, não pode mudar sua chave histórica', () => {
  assert.doesNotThrow(() => validarAtualizacaoVital({sinalVitalNome:'Pressão Arterial Sistólica (PAS)'},{sinalVitalNome:'Pressão Arterial Sistólica (PAS)'}));
  assert.throws(() => validarAtualizacaoVital({sinalVitalNome:'Pressão Arterial Sistólica (PAS)'},{sinalVitalNome:'Pressão Sistólica'}),/renomear/);
});
test('exame permite acrescentar componentes sem remover ou renomear os antigos', () => {
  const antes={nomeExame:'Sorologia para Sífilis',componentes:[{componenteAnalisado:'Treponêmico',resultados:[{resultadoClassificatorio:'Reagente'},{resultadoClassificatorio:'Não Reagente'}]}]};
  const depois={nomeExame:'Sorologia para Sífilis',componentes:[...antes.componentes,{componenteAnalisado:'VDRL',resultados:[]}]};
  assert.doesNotThrow(() => validarAtualizacaoExame(antes,depois));
  assert.throws(()=>validarAtualizacaoExame(antes,{nomeExame:'Sorologia Sífilis',componentes:antes.componentes}),/renomeie/);
  assert.throws(()=>validarAtualizacaoExame(antes,{nomeExame:antes.nomeExame,componentes:[]}),/componentes/);
  assert.throws(()=>validarAtualizacaoExame(antes,{nomeExame:antes.nomeExame,componentes:[{componenteAnalisado:'Treponêmico',resultados:[{resultadoClassificatorio:'Reagente'}]}]}),/resultados classificatórios/);
});
test('revisão de sistemas preserva nome do exame, achados e opções legadas',()=>{
  const antigo={nomeSistema:'Sistema tegumentar',exames:[{nomeExame:'Inspeção cutânea',achados:[{descricaoAchado:'Coloração da pele',opcoes:[{textoOpcao:'Ictérica'},{textoOpcao:'Normal'}]}]}]};
  assert.doesNotThrow(()=>validarAtualizacaoSistema(antigo,{nomeSistema:antigo.nomeSistema,exames:[...antigo.exames,{nomeExame:'Palpação',achados:[]}]}));
  assert.throws(()=>validarAtualizacaoSistema(antigo,{nomeSistema:antigo.nomeSistema,exames:[]}),/exames físicos/);
  assert.throws(()=>validarAtualizacaoSistema(antigo,{nomeSistema:antigo.nomeSistema,exames:[{nomeExame:'Inspeção cutânea',achados:[{descricaoAchado:'Coloração da pele',opcoes:[{textoOpcao:'Normal'}]}]}]}),/opções/);
});
