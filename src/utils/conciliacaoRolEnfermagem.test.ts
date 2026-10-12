import assert from 'node:assert/strict';
import test from 'node:test';
import {
  conciliarRol, type InventarioDiagnostico, type LinhaFonteRol, type LinhaRol,
} from './conciliacaoRolEnfermagem';

const doc: InventarioDiagnostico = {
  projeto: 'csaefloripa', modo: 'somente_leitura', geradoEmUTC: '2026-10-11T12:00:00Z',
  colecoes: {
    subconjuntosEnfermagem: [{ id: 'nhb1', tipoSubconjunto: 'nhb', tituloSubconjunto: 'Conforto' }],
    rolEnfermagem: [
      {
        id: 'diag-2026-1', tituloDiagnostico: 'Dor aguda',
        descricaoDiagnostico: 'Sensação dolorosa presente.',
        subconjuntos: [{ tipoSubconjunto: 'nhb', tituloSubconjunto: 'Conforto' }],
        resultadosEsperados: [{
          tituloResultado: 'Dor controlada', descricaoResultado: 'Reduzir desconforto',
          intervencoes: [
            { acaoEnfermeiro: 'Avalio dor', acaoPrescrita: 'Avaliar dor', materiaisDeApoio: [] },
            { acaoEnfermeiro: 'Oriento descanso', acaoPrescrita: 'Orientar descanso', materiaisDeApoio: [] },
          ],
        }],
      },
      {
        id: 'diag-historico', tituloDiagnostico: 'Diagnóstico histórico',
        descricaoDiagnostico: 'Não está na planilha, mas não deve ser excluído.',
        subconjuntos: [], resultadosEsperados: [],
      },
    ],
  },
};
const linha = (line: number, enfermeiro: string, prescrita: string): LinhaRol => ({
  linha: line, tituloDiagnostico: 'Dor aguda',
  descricaoDiagnostico: 'Sensação dolorosa presente.',
  tipoSubconjunto1: 'nhb', tituloSubconjunto1: 'Conforto',
  tipoSubconjunto2: '', tituloSubconjunto2: '',
  tituloResultado: 'Dor controlada', descricaoResultado: 'Reduzir desconforto',
  acaoEnfermeiro: enfermeiro, acaoPrescrita: prescrita,
  tituloMaterialApoio: '', urlMaterialApoio: '',
});
const fonte = (): LinhaFonteRol => ({
  principal: [
    linha(2, 'Avalio dor', 'Avaliar dor'),
    linha(3, 'Oriento descanso', 'Orientar descanso'),
    linha(4, 'Oriento descanso', 'Orientar descanso'), // repetição não é novo diagnóstico
  ],
  diagnosticosResultados: [{ linha: 2, diagnostico: 'Dor aguda', resultado: 'Dor controlada' }],
  resultadosIntervencoes: [
    { linha: 2, resultado: 'Dor controlada', intervencao: 'Avaliar dor' },
    { linha: 3, resultado: 'Dor controlada', intervencao: 'Orientar descanso' },
  ],
});
test('agrega três linhas em um diagnóstico e duas intervenções; preserva ID e histórico', () => {
  const report = conciliarRol(doc, fonte());
  assert.equal(report.contagens.linhasPrincipais, 3);
  assert.equal(report.contagens.diagnosticosDistintosFonte, 1);
  assert.equal(report.contagens.intervencoesRelacionadasFonte, 2);
  assert.equal(report.contagens.diagnosticosFirestore, 2);
  const diag = report.itens.find(x => x.tituloDiagnostico === 'Dor aguda');
  assert.equal(diag?.decisao, 'comparacao-sem-pendencia-aparente');
  assert.deepEqual(diag?.documentosFirebase, ['diag-2026-1']);
  assert.deepEqual(diag?.linhasOrigem, [2,3,4]);
  const historico = report.itens.find(x => x.tituloDiagnostico === 'Diagnóstico histórico');
  assert.equal(historico?.decisao, 'apenas-firebase');
});
test('vínculos de resultados, NHBs e intervenção inconsistentes geram revisão, jamais inserção', () => {
  const fs = fonte();
  fs.principal[1].acaoPrescrita = 'Intervenção nova';
  fs.principal[0].tituloSubconjunto1 = 'NHB não cadastrada';
  fs.principal[0].tituloResultado = 'Resultado diferente';
  const report = conciliarRol(doc, fs);
  const item = report.itens.find(x => x.tituloDiagnostico === 'Dor aguda')!;
  assert.equal(item.decisao, 'revisao-csae');
  assert.ok(item.alertas.some(a => a.tipo === 'vinculo-nhb-divergente'));
  assert.ok(item.alertas.some(a => a.tipo === 'resultado-a-conferir'));
  assert.ok(item.alertas.some(a => a.tipo === 'fonte-inconsistente'));
});
test('duplicados do Firestore são identificados sem consolidar documentos ou IDs', () => {
  const duplicate: InventarioDiagnostico = structuredClone(doc);
  duplicate.colecoes.rolEnfermagem.push({
    ...structuredClone(duplicate.colecoes.rolEnfermagem[0]),
    id:'diag-2026-2', tituloDiagnostico: 'DOR   AGUDA',
  });
  const report = conciliarRol(duplicate, fonte());
  const item = report.itens.find(x => x.tituloDiagnostico === 'Dor aguda')!;
  assert.equal(item.decisao, 'revisao-csae');
  assert.deepEqual(item.documentosFirebase, ['diag-2026-1', 'diag-2026-2']);
  assert.ok(item.alertas.some(a => a.tipo === 'duplicidade-no-firebase'));
});
test('inventário de outro projeto ou sem estrutura de vínculos é recusado', () => {
  assert.throws(() => conciliarRol({ ...doc, projeto: 'outro-projeto' }, fonte()), /Inventário clínico inválido/);
  assert.throws(() => conciliarRol({ ...doc, modo: 'escrita' }, fonte()), /Inventário clínico inválido/);
  assert.throws(() => conciliarRol({ ...doc, colecoes: {} } as unknown as InventarioDiagnostico, fonte()), /Inventário clínico inválido/);
});
