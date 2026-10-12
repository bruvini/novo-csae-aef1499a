import assert from 'node:assert/strict';
import test from 'node:test';
import { validarAchadoNovo, validarConteudoExameFisico } from './validacaoCadastroExameFisico';
import type { Achado, ExamePropedeutico } from '@/services/bancodados/revisaoSistemasDB';

const nhbs = ['Segurança emocional', 'Regulação neurológica', 'Sensopercepção', 'Integridade física'];
const achado = (): Achado => ({
  descricaoAchado: 'Agitação psicomotora',
  idadeMinima: null, idadeMaxima: null, idadeUnidade: '',
  criterioSexo: 'Ambos', tipoAchado: 'opcoes',
  nomeAlteracao: '', subconjuntoNHBVinculado: '',
  opcoes: [
    { textoOpcao: 'Ausente', ehAlteracao: false, nomeAlteracao: 'Normal' },
    { textoOpcao: 'Presente', ehAlteracao: true,
      nomeAlteracao: 'Agitação psicomotora', subconjuntoNHBVinculado: 'Segurança emocional' },
  ],
});
const exame = (): ExamePropedeutico => ({
  nomeExame: 'Observação do comportamento', propedeutica: 'Inspeção',
  achados: [achado()],
});
const sistema = () => ({ nomeSistema: 'Avaliação do Estado Mental', exames: [exame()] });

test('cadastro estruturado completo com NHB já existente é válido', () => {
  assert.doesNotThrow(() => validarConteudoExameFisico(sistema(), undefined, nhbs));
});
test('não permitir exames vazios ou sem achados no cadastro final', () => {
  assert.throws(() => validarConteudoExameFisico({ nomeSistema: 'Novo', exames: [] }), /ao menos um exame/);
  assert.throws(() => validarConteudoExameFisico({
    nomeSistema: 'Novo', exames: [{...exame(), achados:[]}],
  }), /não possui achados/);
});
test('não permitir duplicidade de exame, achado e opções com variação de escrita', () => {
  const a = sistema();
  a.exames.push({...exame(), nomeExame:' observação do comportamento '});
  assert.throws(() => validarConteudoExameFisico(a), /duplicados/);
  const b = sistema();
  b.exames[0].achados.push({...achado(), descricaoAchado:'agitação psicomotora'});
  assert.throws(() => validarConteudoExameFisico(b), /achados vazios ou duplicados/);
  const c = achado();
  c.opcoes!.push({textoOpcao:' presente ',ehAlteracao:false});
  assert.throws(() => validarAchadoNovo(c,nhbs), /opções vazias ou duplicadas/);
});
test('não aceitar alteração sem classificação/NHB, ou NHB não cadastrada', () => {
  const a=achado();a.opcoes![1].subconjuntoNHBVinculado='';
  assert.throws(() => validarAchadoNovo(a,nhbs), /Selecione a NHB afetada/);
  a.opcoes![1].subconjuntoNHBVinculado='Diagnóstico novo e inexistente';
  assert.throws(() => validarAchadoNovo(a,nhbs), /não existe no catálogo/);
  a.opcoes![1].subconjuntoNHBVinculado='Regulação neurológica';
  a.opcoes![1].nomeAlteracao='';
  assert.throws(() => validarAchadoNovo(a,nhbs), /classificação/);
});
test('validar faixa etária com zero, sem limites invertidos', () => {
  const a=achado();a.idadeMinima=0;a.idadeMaxima=12;a.idadeUnidade='meses';
  assert.doesNotThrow(() => validarAchadoNovo(a,nhbs));
  a.idadeMinima=13;
  assert.throws(() => validarAchadoNovo(a,nhbs), /Faixa etária invertida/);
  a.idadeMinima=0;a.idadeUnidade='';
  assert.throws(() => validarAchadoNovo(a,nhbs), /unidade etária/);
});
test('preservar itens antigos sem forçar reinterpretação ao acrescentar outro achado', () => {
  const antigo = sistema();
  antigo.exames[0].achados[0].opcoes![1].subconjuntoNHBVinculado = '';
  const novo = structuredClone(antigo);
  novo.exames[0].achados.push({
    ...achado(), descricaoAchado:'Orientação temporal',
    opcoes:[{textoOpcao:'Preservada',ehAlteracao:false},{textoOpcao:'Alterada',ehAlteracao:true,
      nomeAlteracao:'Desorientação',subconjuntoNHBVinculado:'Regulação neurológica'}],
  });
  assert.doesNotThrow(() => validarConteudoExameFisico(novo,antigo,nhbs));
  assert.throws(() => validarConteudoExameFisico(novo,undefined,nhbs), /NHB afetada/);
});
