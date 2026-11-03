import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, ref, uploadBytes } from 'firebase/storage';

const projectId = 'demo-csaefloripa';
let environment: RulesTestEnvironment;

const profile = (uid: string, statusAcesso = 'Liberado', extra: Record<string, unknown> = {}) => ({
  uid,
  email: `${uid}@example.test`,
  dadosPessoais: {
    nomeCompleto: 'Profissional de Teste', rg: '123', cpf: '12345678900', rua: 'Rua Teste', numero: '1',
    bairro: 'Centro', cidade: 'Florianópolis', uf: 'SC', cep: '88000000',
  },
  dadosProfissionais: { formacao: 'Enfermeiro', atuaSMS: true },
  termoResponsabilidadeAceito: true,
  termoResponsabilidadeData: new Date('2026-01-01T00:00:00Z'),
  dataCadastro: new Date('2026-01-01T00:00:00Z'),
  ehAdmin: false,
  gestorConteudos: false,
  tipoUsuario: 'Comum',
  statusAcesso,
  paginasPermitidas: ['ProcessoEnfermagem'],
  ...extra,
});

async function seedProfile(uid: string, statusAcesso = 'Liberado', extra: Record<string, unknown> = {}) {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'usuarios', uid), profile(uid, statusAcesso, extra));
  });
}

before(async () => {
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    storage: { rules: readFileSync('storage.rules', 'utf8') },
  });
});

beforeEach(async () => {
  await environment.clearFirestore();
});

after(async () => {
  await environment.cleanup();
});

test('visitante não lê coleções privadas e não envia arquivos', async () => {
  const db = environment.unauthenticatedContext().firestore();
  const storage = environment.unauthenticatedContext().storage();
  await assertFails(getDocs(collection(db, 'usuarios')));
  await assertFails(getDocs(collection(db, 'pacientesProcessoEnfermagem')));
  await assertFails(uploadBytes(ref(storage, 'protocolos/publico.png'), new Uint8Array([1]), { contentType: 'image/png' }));
});

test('sugestões legadas e novas preservam autoria e isolamento', async () => {
  await seedProfile('autor');
  await seedProfile('outro');
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const autor = environment.authenticatedContext('autor').firestore();
  const outro = environment.authenticatedContext('outro').firestore();
  const gestor = environment.authenticatedContext('gestor').firestore();
  const legado = { textoIntervencao: 'Orientar atividade', tituloResultadoVinculado: 'Mobilidade', autorId: 'autor', autorNome: 'Autor', dataCriacao: new Date() };
  await assertSucceeds(setDoc(doc(autor, 'intervencoesAutorais', 'legado'), legado));
  await assertSucceeds(setDoc(doc(autor, 'intervencoesAutorais', 'nova'), {
    ...legado, dataCriacao: serverTimestamp(), identificadorSugestao: 'nova', status: 'aguardando',
    diagnosticoOrigemId: 'diagnostico', tituloDiagnosticoOrigem: 'Diagnóstico', tituloResultadoOrigem: 'Mobilidade',
    autorNomeResolvido: 'Profissional de Teste', origemStatus: 'confirmada',
  }));
  await assertFails(setDoc(doc(autor, 'intervencoesAutorais', 'origem-forjada'), {
    ...legado, dataCriacao: serverTimestamp(), identificadorSugestao: 'origem-forjada', status: 'aguardando',
    origemStatus: 'confirmada', diagnosticoOrigemId: '',
  }));
  await assertFails(setDoc(doc(autor, 'intervencoesAutorais', 'nome-forjado'), {
    ...legado, dataCriacao: serverTimestamp(), identificadorSugestao: 'nome-forjado', status: 'aguardando',
    autorNomeResolvido: 'Nome falsificado',
  }));
  await assertSucceeds(getDoc(doc(autor, 'intervencoesAutorais', 'nova')));
  await assertFails(getDoc(doc(outro, 'intervencoesAutorais', 'nova')));
  await assertSucceeds(getDocs(collection(gestor, 'intervencoesAutorais')));
  await assertFails(updateDoc(doc(autor, 'intervencoesAutorais', 'nova'), { status: 'aprovada' }));
  await assertFails(updateDoc(doc(autor, 'intervencoesAutorais', 'nova'), { autorNomeResolvido: 'Outro nome' }));
  await assertFails(setDoc(doc(outro, 'intervencoesAutorais', 'forjada'), { ...legado, autorId: 'autor' }));
  await assertFails(setDoc(doc(autor, 'intervencoesAutorais', 'falsa'), { ...legado, status: 'aprovada' }));
  await assertFails(setDoc(doc(autor, 'intervencoesAutorais', 'nova'), { ...legado }));
});

test('desmembramento é atômico, auditado e restrito a gestor; original não pode ser decidido duas vezes', async () => {
  await seedProfile('autor');
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  await seedProfile('revogado', 'Revogado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const autor = environment.authenticatedContext('autor').firestore();
  const gestor = environment.authenticatedContext('gestor').firestore();
  const revogado = environment.authenticatedContext('revogado').firestore();
  const original = { textoIntervencao: 'Avaliar adesão e orientar retorno', tituloResultadoVinculado: 'Adesão', autorId: 'autor', autorNome: 'Autor', dataCriacao: serverTimestamp(), identificadorSugestao: 'origem', status: 'aguardando' };
  await assertSucceeds(setDoc(doc(autor, 'intervencoesAutorais', 'origem'), original));
  const montar = (db: typeof gestor, auditoria: string) => {
    const batch = writeBatch(db);
    batch.update(doc(db, 'intervencoesAutorais', 'origem'), { divisao: { grupoId: 'origem', derivadasIds: ['origem-d1', 'origem-d2'], revisorId: 'gestor', revisorNome: 'Gestor', dataHora: serverTimestamp() }, ultimaDecisaoId: auditoria });
    for (const [index, textoIntervencao] of ['Avaliar adesão', 'Orientar retorno'].entries()) {
      batch.set(doc(db, 'intervencoesAutorais', `origem-d${index + 1}`), {
        textoIntervencao, tituloResultadoVinculado: 'Adesão', tituloResultadoOrigem: '', diagnosticoOrigemId: '', tituloDiagnosticoOrigem: '',
        autorId: 'autor', autorNome: 'Autor', status: 'aguardando', tipoRegistro: 'derivada', dataCriacao: serverTimestamp(),
        derivacao: { originalId: 'origem', grupoId: 'origem', ordem: index + 1, revisorId: 'gestor', dataHora: serverTimestamp() },
      });
    }
    batch.set(doc(db, 'decisoesIntervencoes', auditoria), { sugestaoId: 'origem', statusAnterior: 'aguardando', statusNovo: 'aguardando', tipo: 'desmembrar', avaliadorId: 'gestor', destinos: [], justificativa: '', dataHora: serverTimestamp() });
    return batch.commit();
  };
  await assertFails(montar(autor, 'ilegal'));
  await assertFails(montar(revogado, 'revogado'));
  await assertSucceeds(montar(gestor, 'auditoria-1'));
  assert.equal((await getDoc(doc(gestor, 'intervencoesAutorais', 'origem'))).data()?.textoIntervencao, original.textoIntervencao);
  assert.equal((await getDoc(doc(gestor, 'intervencoesAutorais', 'origem-d1'))).data()?.status, 'aguardando');
  await assertFails(montar(gestor, 'auditoria-2'));
  await assertFails(updateDoc(doc(gestor, 'intervencoesAutorais', 'origem'), { status: 'rejeitada' }));
  await assertFails(updateDoc(doc(autor, 'intervencoesAutorais', 'origem-d1'), { textoIntervencao: 'Alterado' }));
});

test('avaliação técnica parcial exige gestor, versão, timestamp e auditoria imutável', async () => {
  await seedProfile('autor');
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const autor = environment.authenticatedContext('autor').firestore();
  const gestor = environment.authenticatedContext('gestor').firestore();
  await assertSucceeds(setDoc(doc(autor, 'intervencoesAutorais', 'avaliar'), { textoIntervencao: 'Orientar retorno', tituloResultadoVinculado: 'Adesão', autorId: 'autor', autorNome: 'Autor', dataCriacao: serverTimestamp(), identificadorSugestao: 'avaliar', status: 'aguardando' }));
  const avaliacao = (db: typeof gestor, id: string, versao = 'experimental-v1') => {
    const batch = writeBatch(db);
    const qualidade = { atomicidadeStatus: 'unica', avaliadorId: 'gestor', avaliadoEm: serverTimestamp(), versaoCriterios: versao };
    batch.update(doc(db, 'intervencoesAutorais', 'avaliar'), { avaliacaoQualidade: qualidade, ultimaDecisaoId: id });
    batch.set(doc(db, 'decisoesIntervencoes', id), { sugestaoId: 'avaliar', statusAnterior: 'aguardando', statusNovo: 'aguardando', tipo: 'avaliar', avaliadorId: 'gestor', destinos: [], justificativa: '', avaliacaoQualidade: qualidade, dataHora: serverTimestamp() });
    return batch.commit();
  };
  await assertFails(avaliacao(autor, 'autor-1'));
  await assertFails(avaliacao(gestor, 'versao-invalida', 'inventada'));
  await assertSucceeds(avaliacao(gestor, 'avaliacao-1'));
  assert.equal((await getDoc(doc(gestor, 'intervencoesAutorais', 'avaliar'))).data()?.avaliacaoQualidade.atomicidadeStatus, 'unica');
  await assertFails(updateDoc(doc(gestor, 'decisoesIntervencoes', 'avaliacao-1'), { tipo: 'rejeitar' }));
});

test('duas divisões concorrentes da mesma origem não geram propostas duplicadas', async () => {
  await seedProfile('autor');
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const autor = environment.authenticatedContext('autor').firestore();
  const gestor = environment.authenticatedContext('gestor').firestore();
  await assertSucceeds(setDoc(doc(autor, 'intervencoesAutorais', 'concorrente'), { textoIntervencao: 'Avaliar e orientar', tituloResultadoVinculado: 'Adesão', autorId: 'autor', autorNome: 'Autor', dataCriacao: serverTimestamp(), identificadorSugestao: 'concorrente', status: 'aguardando' }));
  const preparar = (auditoria: string) => {
    const batch = writeBatch(gestor);
    batch.update(doc(gestor, 'intervencoesAutorais', 'concorrente'), { divisao: { grupoId: 'concorrente', derivadasIds: ['concorrente-d1', 'concorrente-d2'], revisorId: 'gestor', revisorNome: 'Gestor', dataHora: serverTimestamp() }, ultimaDecisaoId: auditoria });
    for (let ordem = 1; ordem <= 2; ordem++) batch.set(doc(gestor, 'intervencoesAutorais', `concorrente-d${ordem}`), { textoIntervencao: ordem === 1 ? 'Avaliar adesão' : 'Orientar retorno', tituloResultadoVinculado: 'Adesão', tituloResultadoOrigem: '', diagnosticoOrigemId: '', tituloDiagnosticoOrigem: '', autorId: 'autor', autorNome: 'Autor', status: 'aguardando', tipoRegistro: 'derivada', dataCriacao: serverTimestamp(), derivacao: { originalId: 'concorrente', grupoId: 'concorrente', ordem, revisorId: 'gestor', dataHora: serverTimestamp() } });
    batch.set(doc(gestor, 'decisoesIntervencoes', auditoria), { sugestaoId: 'concorrente', statusAnterior: 'aguardando', statusNovo: 'aguardando', tipo: 'desmembrar', avaliadorId: 'gestor', destinos: [], justificativa: '', dataHora: serverTimestamp() });
    return batch.commit();
  };
  const resultados = await Promise.allSettled([preparar('concorrente-a'), preparar('concorrente-b')]);
  assert.equal(resultados.filter(resultado => resultado.status === 'fulfilled').length, 1);
  assert.equal((await getDocs(collection(gestor, 'intervencoesAutorais'))).size, 3);
});

test('gestor registra preparação e rejeição auditadas; revogado e enfermeiro não decidem', async () => {
  await seedProfile('autor');
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  await seedProfile('revogado', 'Revogado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const autor = environment.authenticatedContext('autor').firestore();
  const gestor = environment.authenticatedContext('gestor').firestore();
  const revogado = environment.authenticatedContext('revogado').firestore();
  const original = { textoIntervencao: 'Orientar atividade', tituloResultadoVinculado: 'Mobilidade', autorId: 'autor', autorNome: 'Autor', dataCriacao: serverTimestamp(), identificadorSugestao: 'item', status: 'aguardando', diagnosticoOrigemId: 'd', tituloDiagnosticoOrigem: 'Diagnóstico', tituloResultadoOrigem: 'Mobilidade' };
  await assertSucceeds(setDoc(doc(autor, 'intervencoesAutorais', 'item'), original));
  await assertFails(getDoc(doc(revogado, 'intervencoesAutorais', 'item')));
  const audit = doc(gestor, 'decisoesIntervencoes', 'decisao');
  const sugestao = doc(gestor, 'intervencoesAutorais', 'item');
  const batch = writeBatch(gestor);
  batch.update(sugestao, { status: 'rejeitada', categoriaRejeicao: 'Duplicada', justificativaRejeicao: 'Já consta em análise', avaliadorId: 'gestor', avaliadorNome: 'Gestor', dataDecisao: serverTimestamp(), ultimaDecisaoId: 'decisao' });
  batch.set(audit, { sugestaoId: 'item', statusAnterior: 'aguardando', statusNovo: 'rejeitada', tipo: 'rejeitar', avaliadorId: 'gestor', destinos: [], justificativa: 'Já consta em análise', dataHora: serverTimestamp() });
  await assertSucceeds(batch.commit());
  const saved = (await getDoc(sugestao)).data()!;
  assert.equal(saved.textoIntervencao, 'Orientar atividade');
  assert.equal(saved.status, 'rejeitada');
  assert.ok(saved.dataDecisao);
  await assertFails(updateDoc(audit, { justificativa: 'Alterada' }));
  await assertFails(updateDoc(sugestao, { status: 'aprovada' }));
  await assertFails(setDoc(doc(autor, 'decisoesIntervencoes', 'indevida'), { sugestaoId: 'item' }));
  await assertFails(updateDoc(doc(revogado, 'intervencoesAutorais', 'item'), { status: 'aprovada' }));
});

test('biblioteca canônica publica com múltiplos destinos sem homologação manual e mantém acesso de leitura seguro', async () => {
  await seedProfile('autor');
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const autor = environment.authenticatedContext('autor').firestore();
  const gestor = environment.authenticatedContext('gestor').firestore();
  await assertSucceeds(setDoc(doc(autor, 'intervencoesAutorais', 's1'), { textoIntervencao: 'Orientar atividade', tituloResultadoVinculado: 'Mobilidade', autorId: 'autor', autorNome: 'Autor', dataCriacao: serverTimestamp(), identificadorSugestao: 's1', status: 'aguardando' }));
  const destinos = Array.from({ length: 6 }, (_, index) => ({ diagnosticoId: `d${index}`, tituloDiagnostico: `Diagnóstico ${index}`, tituloResultado: `Resultado ${index}`, resultadoIndice: 0 }));
  const preparacao = { acaoPrescrita: 'Orientar atividade física', acaoEnfermeiro: 'Oriento atividade física', destinos, modoDisponibilidade: 'resultados_especificos', materiaisDeApoio: [] };
  const bibliotecaId = 'sugestao-s1';
  const sugestao = doc(gestor, 'intervencoesAutorais', 's1');
  const batch = writeBatch(gestor);
  batch.update(sugestao, { status: 'aprovada', preparacao, intervencaoBibliotecaId: bibliotecaId, avaliadorId: 'gestor', avaliadorNome: 'Gestor', dataDecisao: serverTimestamp(), ultimaDecisaoId: 'a1' });
  batch.set(doc(gestor, 'intervencoesBiblioteca', bibliotecaId), { acaoPrescrita: preparacao.acaoPrescrita, acaoEnfermeiro: preparacao.acaoEnfermeiro, materiaisDeApoio: [], modoDisponibilidade: 'resultados_especificos', destinos, status: 'disponivel', versao: 1, sugestoesOrigemIds: ['s1'], criadoPorUid: 'gestor', criadoPorNome: 'Gestor', criadoEm: serverTimestamp(), publicadoEm: serverTimestamp() });
  batch.set(doc(gestor, 'decisoesIntervencoes', 'a1'), { sugestaoId: 's1', statusAnterior: 'aguardando', statusNovo: 'aprovada', tipo: 'publicar', avaliadorId: 'gestor', destinos, justificativa: '', intervencaoBibliotecaId: bibliotecaId, dataHora: serverTimestamp() });
  await assertSucceeds(batch.commit());
  const profissional = environment.authenticatedContext('autor').firestore();
  await assertSucceeds(getDoc(doc(profissional, 'intervencoesBiblioteca', bibliotecaId)));
  await assertFails(setDoc(doc(profissional, 'intervencoesBiblioteca', 'nao-autorizada'), { status: 'disponivel' }));
  await assertFails(updateDoc(doc(gestor, 'intervencoesBiblioteca', bibliotecaId), { acaoPrescrita: 'Texto adulterado' }));
  assert.equal((await getDoc(sugestao)).data()?.intervencaoBibliotecaId, bibliotecaId);
});

test('publicação transversal não aceita destinos e só fica acessível após decisão registrada', async () => {
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const gestor = environment.authenticatedContext('gestor').firestore();
  const invalida = writeBatch(gestor);
  invalida.set(doc(gestor, 'intervencoesBiblioteca', 'transversal-invalida'), { acaoPrescrita: 'Orientar', acaoEnfermeiro: 'Oriento', materiaisDeApoio: [], modoDisponibilidade: 'transversal', destinos: [{ diagnosticoId: 'd', tituloDiagnostico: 'D', tituloResultado: 'R' }], status: 'disponivel', versao: 1, sugestoesOrigemIds: ['s'], criadoPorUid: 'gestor', criadoPorNome: 'Gestor', criadoEm: serverTimestamp(), publicadoEm: serverTimestamp() });
  await assertFails(invalida.commit());
  await assertFails(setDoc(doc(gestor, 'operacoesDecisoesIntervencoes', 'falsa'), { tipo: 'publicar', status: 'concluida' }));
});

test('aprovação em grupo só ativa a biblioteca depois de auditar todas as decisões selecionadas', async () => {
  await seedProfile('autor-a');
  await seedProfile('autor-b');
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const autorA = environment.authenticatedContext('autor-a').firestore();
  const autorB = environment.authenticatedContext('autor-b').firestore();
  const gestor = environment.authenticatedContext('gestor').firestore();
  const ids = ['s-a', 's-b'];
  for (const [db, id, uid] of [[autorA, 's-a', 'autor-a'], [autorB, 's-b', 'autor-b']] as const) {
    await assertSucceeds(setDoc(doc(db, 'intervencoesAutorais', id), { textoIntervencao: 'Orientar mobilidade', tituloResultadoVinculado: 'Mobilidade', autorId: uid, autorNome: uid, dataCriacao: serverTimestamp(), identificadorSugestao: id, status: 'aguardando' }));
  }
  const operationId = 'grupo-operacao-teste';
  const libraryId = 'operacao-grupo-operacao-teste';
  const operation = doc(gestor, 'operacoesDecisoesIntervencoes', operationId);
  const library = doc(gestor, 'intervencoesBiblioteca', libraryId);
  const start = writeBatch(gestor);
  start.set(operation, { tipo: 'publicar', status: 'preparando', sugestaoIds: ids, concluidasIds: [], intervencaoBibliotecaId: libraryId, criadoPorUid: 'gestor', criadoPorNome: 'Gestor', criadoEm: serverTimestamp() });
  start.set(library, { acaoPrescrita: 'Orientar mobilidade', acaoEnfermeiro: 'Oriento mobilidade', materiaisDeApoio: [], modoDisponibilidade: 'transversal', destinos: [], status: 'preparando', versao: 1, sugestoesOrigemIds: ids, grupoOperacaoId: operationId, criadoPorUid: 'gestor', criadoPorNome: 'Gestor', criadoEm: serverTimestamp(), publicadoEm: null });
  await assertSucceeds(start.commit());
  await assertFails(getDoc(doc(autorA, 'intervencoesBiblioteca', libraryId)));
  const preparacao = { acaoPrescrita: 'Orientar mobilidade', acaoEnfermeiro: 'Oriento mobilidade', modoDisponibilidade: 'transversal', destinos: [], materiaisDeApoio: [] };
  for (const id of ids) {
    await runTransaction(gestor, async transaction => {
      const sugestao = doc(gestor, 'intervencoesAutorais', id);
      const audit = doc(collection(gestor, 'decisoesIntervencoes'));
      transaction.update(sugestao, { status: 'aprovada', preparacao, intervencaoBibliotecaId: libraryId, grupoOperacaoId: operationId, avaliadorId: 'gestor', avaliadorNome: 'Gestor', dataDecisao: serverTimestamp(), ultimaDecisaoId: audit.id });
      transaction.set(audit, { sugestaoId: id, statusAnterior: 'aguardando', statusNovo: 'aprovada', tipo: 'publicar_grupo', avaliadorId: 'gestor', destinos: [], justificativa: '', grupoOperacaoId: operationId, idsAfetados: ids, intervencaoBibliotecaId: libraryId, dataHora: serverTimestamp() });
      transaction.update(operation, { concluidasIds: arrayUnion(id) });
    });
  }
  const finish = writeBatch(gestor);
  finish.update(library, { status: 'disponivel', publicadoEm: serverTimestamp() });
  finish.update(operation, { status: 'concluida', concluidaEm: serverTimestamp() });
  await assertSucceeds(finish.commit());
  assert.equal((await getDoc(library)).data()?.status, 'disponivel');
  assert.deepEqual((await getDoc(operation)).data()?.concluidasIds.sort(), [...ids].sort());
  await assertSucceeds(getDoc(doc(autorA, 'intervencoesBiblioteca', libraryId)));
});

test('gestor pode vincular sugestões pendentes a publicação existente sem alterar seu conteúdo clínico', async () => {
  await seedProfile('autor-link');
  await seedProfile('gestor-link', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const autor = environment.authenticatedContext('autor-link').firestore();
  const gestor = environment.authenticatedContext('gestor-link').firestore();
  const ids = ['s-link-1', 's-link-2'];
  for (const id of ids) await assertSucceeds(setDoc(doc(autor, 'intervencoesAutorais', id), {
    textoIntervencao: 'Orientar mobilidade', tituloResultadoVinculado: 'Mobilidade', tituloResultadoOrigem: 'Mobilidade',
    diagnosticoOrigemId: 'd-link', tituloDiagnosticoOrigem: 'Mobilidade prejudicada', autorId: 'autor-link', autorNome: 'Autor',
    dataCriacao: serverTimestamp(), identificadorSugestao: id, status: 'aguardando',
  }));
  const libraryId = 'publicacao-existente';
  const operationId = 'grupo-vincular-teste';
  const destinos = [{ diagnosticoId: 'd-link', tituloDiagnostico: 'Mobilidade prejudicada', tituloResultado: 'Mobilidade', resultadoIndice: 0 }];
  const preparacao = { acaoPrescrita: 'Orientar mobilidade', acaoEnfermeiro: 'Oriento mobilidade', destinos, modoDisponibilidade: 'resultados_especificos', materiaisDeApoio: [] };
  await environment.withSecurityRulesDisabled(async context => setDoc(doc(context.firestore(), 'intervencoesBiblioteca', libraryId), {
    ...preparacao, status: 'disponivel', versao: 1, sugestoesOrigemIds: ['s-original'], criadoPorUid: 'gestor-link',
    criadoPorNome: 'Gestor', criadoEm: serverTimestamp(), publicadoEm: serverTimestamp(),
  }));
  const operation = doc(gestor, 'operacoesDecisoesIntervencoes', operationId);
  await assertSucceeds(setDoc(operation, { tipo: 'vincular', status: 'preparando', sugestaoIds: ids, concluidasIds: [], intervencaoBibliotecaId: libraryId, criadoPorUid: 'gestor-link', criadoPorNome: 'Gestor', criadoEm: serverTimestamp() }));
  for (const id of ids) {
    const batch = writeBatch(gestor);
    const auditId = `audit-${id}`;
    batch.update(doc(gestor, 'intervencoesBiblioteca', libraryId), { sugestoesOrigemIds: arrayUnion(id), ultimaOperacaoVinculoId: operationId });
    batch.update(doc(gestor, 'intervencoesAutorais', id), { status: 'aprovada', preparacao, intervencaoBibliotecaId: libraryId, grupoOperacaoId: operationId, avaliadorId: 'gestor-link', avaliadorNome: 'Gestor', dataDecisao: serverTimestamp(), ultimaDecisaoId: auditId });
    batch.set(doc(gestor, 'decisoesIntervencoes', auditId), { sugestaoId: id, statusAnterior: 'aguardando', statusNovo: 'aprovada', tipo: 'vincular_grupo', avaliadorId: 'gestor-link', destinos, justificativa: '', grupoOperacaoId: operationId, idsAfetados: ids, intervencaoBibliotecaId: libraryId, dataHora: serverTimestamp() });
    batch.update(operation, { concluidasIds: arrayUnion(id) });
    await assertSucceeds(batch.commit());
  }
  await assertSucceeds(updateDoc(operation, { status: 'concluida', concluidaEm: serverTimestamp() }));
  const updatedLibrary = (await getDoc(doc(gestor, 'intervencoesBiblioteca', libraryId))).data();
  assert.equal(updatedLibrary?.acaoPrescrita, 'Orientar mobilidade');
  assert.deepEqual(updatedLibrary?.destinos, destinos);
  assert.deepEqual(updatedLibrary?.sugestoesOrigemIds.sort(), ['s-original', ...ids].sort());
  const usuarioComum = environment.authenticatedContext('autor-link').firestore();
  await assertFails(updateDoc(doc(usuarioComum, 'intervencoesBiblioteca', libraryId), { sugestoesOrigemIds: arrayUnion('indevida') }));
});
test('novo cadastro só cria o próprio perfil como pendente, sem permissões elevadas', async () => {
  const db = environment.authenticatedContext('novo', { email: 'novo@example.test' }).firestore();
  const data = profile('novo', 'Aguardando');
  data.paginasPermitidas = [];
  await assertSucceeds(setDoc(doc(db, 'usuarios', 'novo'), {
    ...data,
    termoResponsabilidadeData: serverTimestamp(),
    dataCadastro: serverTimestamp(),
  }));
  const dbMalicioso = environment.authenticatedContext('novo-admin', { email: 'novo-admin@example.test' }).firestore();
  await assertFails(setDoc(doc(dbMalicioso, 'usuarios', 'novo-admin'), {
    ...profile('novo-admin', 'Liberado', { ehAdmin: true, tipoUsuario: 'Administrador' }),
    termoResponsabilidadeData: serverTimestamp(),
    dataCadastro: serverTimestamp(),
  }));
  const forgedProfileDb = environment.authenticatedContext('novo-legado', { email: 'novo-legado@example.test' }).firestore();
  await assertFails(setDoc(doc(forgedProfileDb, 'usuarios', 'novo-legado'), {
    ...profile('novo-legado', 'Aguardando', { versaoPermissoes: 999, paginasPermitidas: [] }),
    termoResponsabilidadeData: serverTimestamp(),
    dataCadastro: serverTimestamp(),
  }));
});

test('pendente lê somente o próprio perfil e não acessa catálogos nem se aprova', async () => {
  await seedProfile('pendente', 'Aguardando');
  const db = environment.authenticatedContext('pendente', { email: 'pendente@example.test' }).firestore();
  await assertSucceeds(getDoc(doc(db, 'usuarios', 'pendente')));
  await assertFails(getDocs(collection(db, 'SinaisVitais')));
  await assertFails(updateDoc(doc(db, 'usuarios', 'pendente'), { statusAcesso: 'Liberado' }));
  await assertFails(getDoc(doc(db, 'usuarios', 'outro')));
});

test('profissional aprovado lê e altera somente os próprios pacientes', async () => {
  await seedProfile('enfermeiro-a');
  await seedProfile('enfermeiro-b');
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'pacientesProcessoEnfermagem', 'paciente-a'), {
      nomeCompleto: 'Paciente A', dataNascimento: new Date('1980-01-01T00:00:00Z'), sexo: 'Feminino',
      dataCadastro: new Date('2026-01-01T00:00:00Z'), uidUsuario: 'enfermeiro-a', processosEnfermagem: [],
    });
    await setDoc(doc(context.firestore(), 'pacientesProcessoEnfermagem', 'paciente-b'), {
      nomeCompleto: 'Paciente B', dataNascimento: new Date('1980-01-01T00:00:00Z'), sexo: 'Masculino',
      dataCadastro: new Date('2026-01-01T00:00:00Z'), uidUsuario: 'enfermeiro-b', processosEnfermagem: [],
    });
  });
  const db = environment.authenticatedContext('enfermeiro-a').firestore();
  await assertSucceeds(getDocs(query(collection(db, 'pacientesProcessoEnfermagem'), where('uidUsuario', '==', 'enfermeiro-a'))));
  await assertFails(getDocs(collection(db, 'pacientesProcessoEnfermagem')));
  await assertFails(getDoc(doc(db, 'pacientesProcessoEnfermagem', 'paciente-b')));
  await assertFails(updateDoc(doc(db, 'pacientesProcessoEnfermagem', 'paciente-b'), { nomeCompleto: 'Invadido' }));
  await assertFails(setDoc(doc(db, 'pacientesProcessoEnfermagem', 'paciente-falso'), {
    nomeCompleto: 'Paciente Falso', dataNascimento: new Date('1980-01-01T00:00:00Z'), sexo: 'Masculino',
    dataCadastro: serverTimestamp(), uidUsuario: 'enfermeiro-b', processosEnfermagem: [],
  }));
});

test('perfil próprio permite apenas atualizar dados pessoais e trilha de acesso, nunca privilégios', async () => {
  await seedProfile('titular');
  const db = environment.authenticatedContext('titular').firestore();
  await assertSucceeds(updateDoc(doc(db, 'usuarios', 'titular'), {
    totalAcessos: increment(1),
    ultimoAcesso: serverTimestamp(),
    historicoAcesso: [{ dataHora: new Date(), ip: 'N/A' }],
  }));
  await assertFails(updateDoc(doc(db, 'usuarios', 'titular'), { paginasPermitidas: ['GestaoSuporte'] }));
  await assertFails(updateDoc(doc(db, 'usuarios', 'titular'), { ehAdmin: true, tipoUsuario: 'Administrador' }));
});

test('administrador gerencia perfis de terceiros, mas não altera os próprios privilégios', async () => {
  await seedProfile('admin', 'Liberado', { ehAdmin: true, tipoUsuario: 'Administrador' });
  await seedProfile('alvo');
  const db = environment.authenticatedContext('admin').firestore();
  await assertSucceeds(getDocs(collection(db, 'usuarios')));
  await assertSucceeds(updateDoc(doc(db, 'usuarios', 'alvo'), { statusAcesso: 'Revogado', dataRevogacao: serverTimestamp(), revogadoPorUid: 'admin' }));
  await assertFails(updateDoc(doc(db, 'usuarios', 'admin'), { ehAdmin: false, tipoUsuario: 'Comum' }));
});

test('somente gestor de conteúdo aprovado grava catálogo clínico', async () => {
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['ProcessoEnfermagem', 'GestaoConteudos'] });
  await seedProfile('comum');
  const gestorDb = environment.authenticatedContext('gestor').firestore();
  const comumDb = environment.authenticatedContext('comum').firestore();
  await assertSucceeds(getDocs(collection(comumDb, 'SinaisVitais')));
  const sinalVital = {
    sinalVitalNome: 'Pressão arterial',
    sinalVitalDescricao: 'Aferição da pressão arterial.',
    unidadeMedida: 'mmHg',
    valoresDeReferencia: [],
  };
  await assertSucceeds(setDoc(doc(gestorDb, 'SinaisVitais', 'pressao'), sinalVital));
  await assertFails(setDoc(doc(comumDb, 'SinaisVitais', 'nao-autorizado'), sinalVital));
});

test('reserva de identidades é atômica, privada e não pode ser adulterada', async () => {
  await seedProfile('gestorA', 'Liberado', {
    gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'],
  });
  await seedProfile('gestorB', 'Liberado', {
    gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'],
  });
  await seedProfile('comum');
  const a = environment.authenticatedContext('gestorA').firestore();
  const b = environment.authenticatedContext('gestorB').firestore();
  const comum = environment.authenticatedContext('comum').firestore();
  const chave = 'parametro--pressao-arterial-pas';
  const bloqueio = doc(a, 'identidadesCatalogoClinico', chave);
  const valores = {
    sinalVitalNome: 'Pressão Arterial Sistólica (PAS)',
    sinalVitalDescricao: 'Teste de concorrência.',
    unidadeMedida: 'mmHg',
    valoresDeReferencia: [],
  };
  const registrar = async (dbGestor: typeof a, id: string) => runTransaction(dbGestor, async transacao => {
    const keyRef = doc(dbGestor, 'identidadesCatalogoClinico', chave);
    const reserva = await transacao.get(keyRef);
    if (reserva.exists()) throw new Error('Identidade reservada');
    transacao.set(keyRef, {
      chave, colecaoOrigem: 'SinaisVitais', documentoId: id, criadoEm: serverTimestamp(),
    });
    transacao.set(doc(dbGestor, 'SinaisVitais', id), valores);
  });
  const resultados = await Promise.allSettled([
    registrar(a, 'clinico-a'),
    registrar(b, 'clinico-b'),
  ]);
  assert.equal(resultados.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await getDocs(collection(a, 'SinaisVitais'))).size, 1);
  await assertSucceeds(getDoc(bloqueio));
  await assertFails(getDoc(doc(comum, bloqueio.path)));
  await assertFails(setDoc(doc(comum, 'identidadesCatalogoClinico', 'parametro--fraude'), {
    chave: 'parametro--fraude', colecaoOrigem: 'SinaisVitais',
    documentoId: 'qualquer', criadoEm: serverTimestamp(),
  }));
  await assertFails(updateDoc(bloqueio, { documentoId: 'modificado' }));
  await assertFails(deleteDoc(bloqueio));
  await assertFails(getDocs(collection(a, 'identidadesCatalogoClinico')));
  await assertFails(deleteDoc(doc(a, 'SinaisVitais', 'clinico-a')));
  await assertFails(deleteDoc(doc(a, 'SinaisVitais', 'clinico-b')));
});

test('Firestore não permite excluir catálogos com chaves históricas, mesmo ao gestor', async () => {
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const dbGestor = environment.authenticatedContext('gestor').firestore();
  await assertSucceeds(getDocs(collection(dbGestor, 'ExamesLabImagem')));
  await assertSucceeds(setDoc(doc(dbGestor, 'ExamesLabImagem', 'laboratorio'), {
    nomeExame: 'Teste de laboratório', descricaoExame: 'Exemplo.',
    tipoExame: 'Laboratorial', componentes: [],
  }));
  await assertFails(deleteDoc(doc(dbGestor, 'ExamesLabImagem', 'laboratorio')));
  await assertSucceeds(setDoc(doc(dbGestor, 'RevisaoSistemas', 'sistema'), {
    nomeSistema: 'Sistema de teste', descricaoSistema: 'Exemplo.', exames: [],
  }));
  await assertFails(deleteDoc(doc(dbGestor, 'RevisaoSistemas', 'sistema')));
});

test('tickets e sugestões ficam limitados ao autor; suporte lê e responde sem alterar o autor', async () => {
  await seedProfile('autor');
  await seedProfile('outro');
  await seedProfile('suporte', 'Liberado', { paginasPermitidas: ['GestaoSuporte'] });
  const authorDb = environment.authenticatedContext('autor').firestore();
  const otherDb = environment.authenticatedContext('outro').firestore();
  const supportDb = environment.authenticatedContext('suporte').firestore();
  const ticketRef = doc(collection(authorDb, 'tickets_suporte'));
  await assertSucceeds(setDoc(ticketRef, {
    usuarioId: 'autor', nomeUsuario: 'Profissional de Teste', moduloAferido: 'Processo', descricao: 'Relato',
    status: 'Aberto', visualizadoPeloSuporte: false, dataCriacao: serverTimestamp(),
  }));
  await assertSucceeds(getDocs(query(collection(authorDb, 'tickets_suporte'), where('usuarioId', '==', 'autor'))));
  await assertFails(getDocs(collection(otherDb, 'tickets_suporte')));
  await assertSucceeds(getDocs(collection(supportDb, 'tickets_suporte')));
  const supportTicketRef = doc(supportDb, ticketRef.path);
  await assertSucceeds(updateDoc(supportTicketRef, {
    respostaAdmin: 'Retorno', visualizadoPeloSuporte: true, respostaVisualizadaPeloUsuario: false,
    dataRespostaAdmin: serverTimestamp(),
  }));
  await assertFails(updateDoc(ticketRef, { usuarioId: 'outro' }));
  await assertFails(deleteDoc(ticketRef));
});

test('nota NPS é registrada pelo usuário autenticado e não pode ser atribuída a outra pessoa', async () => {
  await seedProfile('avaliador');
  const db = environment.authenticatedContext('avaliador').firestore();
  await assertSucceeds(setDoc(doc(collection(db, 'pesquisas_nps')), {
    usuarioId: 'avaliador', nomeUsuario: 'Profissional', notaGeral: 8, notaUsabilidade: 9,
    notaPerformance: 8, dataCriacao: serverTimestamp(),
  }));
  await assertFails(setDoc(doc(collection(db, 'pesquisas_nps')), {
    usuarioId: 'avaliador', nomeUsuario: 'Profissional', notaGeral: 4, notaUsabilidade: 5,
    notaPerformance: 5, dataCriacao: serverTimestamp(),
  }));
  await assertSucceeds(setDoc(doc(collection(db, 'pesquisas_nps')), {
    usuarioId: 'avaliador', nomeUsuario: 'Profissional', notaGeral: 4, notaUsabilidade: 5,
    notaPerformance: 5, comentario: 'Como podemos melhorar?', dataCriacao: serverTimestamp(),
  }));
  await assertFails(setDoc(doc(collection(db, 'pesquisas_nps')), {
    usuarioId: 'outra-pessoa', nomeUsuario: 'Outra', notaGeral: 8, notaUsabilidade: 9,
    notaPerformance: 8, dataCriacao: serverTimestamp(),
  }));
});

test('Storage exige aprovação para leitura e papel de conteúdo para gravação', async () => {
  await seedProfile('aprovado');
  await seedProfile('pendente', 'Aguardando');
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['ProcessoEnfermagem', 'GestaoConteudos'] });
  const approvedStorage = environment.authenticatedContext('aprovado').storage();
  const pendingStorage = environment.authenticatedContext('pendente').storage();
  const managerStorage = environment.authenticatedContext('gestor').storage();
  const file = new Uint8Array([137, 80, 78, 71]);
  await assertFails(uploadBytes(ref(pendingStorage, 'protocolos/capa.png'), file, { contentType: 'image/png' }));
  await assertFails(uploadBytes(ref(approvedStorage, 'protocolos/capa.png'), file, { contentType: 'image/png' }));
  await assertSucceeds(uploadBytes(ref(managerStorage, 'protocolos/capa.png'), file, { contentType: 'image/png' }));
  await assertSucceeds(deleteObject(ref(managerStorage, 'protocolos/capa.png')));
});


test('metadados de perfis legados permanecem íntegros sem conceder novas páginas', async () => {
  await seedProfile('admin-legado', 'Liberado', { ehAdmin: true, tipoUsuario: 'Administrador' });
  await seedProfile('enfermeiro-legado', 'Liberado', {
    paginasPermitidas: ['ProcessoEnfermagem', 'Dashboard', 'CentralAjuda'],
    versaoPermissoes: 1,
    historicoRevisoes: [],
    analisadoPor: 'Comissão CSAE',
    analisadoPorUid: 'admin-legado',
    dataAtualizacaoDadosPessoais: new Date('2026-08-20T00:00:00Z'),
  });
  const dbAdmin = environment.authenticatedContext('admin-legado').firestore();
  const dbOwner = environment.authenticatedContext('enfermeiro-legado').firestore();
  await assertFails(updateDoc(doc(dbOwner, 'usuarios', 'enfermeiro-legado'), {
    paginasPermitidas: ['GestaoSuporte'],
  }));
  await assertSucceeds(updateDoc(doc(dbAdmin, 'usuarios', 'enfermeiro-legado'), {
    statusAcesso: 'Revogado',
    dataRevogacao: serverTimestamp(),
    revogadoPorUid: 'admin-legado',
  }));
  const updated = await getDoc(doc(dbAdmin, 'usuarios', 'enfermeiro-legado'));
  assert.equal(updated.data()?.versaoPermissoes, 1);
  assert.deepEqual(updated.data()?.paginasPermitidas, ['ProcessoEnfermagem', 'Dashboard', 'CentralAjuda']);
});


test('cache segmentado de produção: administrador pode ler e salvar, profissional não pode', async () => {
  await seedProfile('gestor-bi', 'Liberado', { ehAdmin: true, tipoUsuario: 'Administrador' });
  await seedProfile('profissional', 'Liberado');
  const adminDb = environment.authenticatedContext('gestor-bi').firestore();
  const nurseDb = environment.authenticatedContext('profissional').firestore();
  const chunksRef = doc(adminDb, 'estatisticas/painel_processos/registros/chunk-0000');
  const unitRef = doc(adminDb, 'estatisticas/painel_processos/lotacoes/centro');
  await assertSucceeds(setDoc(chunksRef, { schemaVersion: 9, index: 0, registros: [{ usuarioId: 'uid-exemplo' }] }));
  await assertSucceeds(setDoc(unitRef, { schemaVersion: 9, lotacao: 'Centro', agregado: { totalProcessos: 1 } }));
  await assertSucceeds(getDoc(chunksRef));
  await assertSucceeds(getDoc(unitRef));
  await assertFails(getDoc(doc(nurseDb, chunksRef.path)));
  await assertFails(getDoc(doc(nurseDb, unitRef.path)));
  await assertFails(setDoc(doc(nurseDb, chunksRef.path), { schemaVersion: 9, index: 0, registros: [] }));
  await assertFails(getDoc(doc(environment.unauthenticatedContext().firestore(), chunksRef.path)));
});



test('eventos de login exigem identidade, timestamp e incremento atômico e são imutáveis', async () => {
  await seedProfile('enfermeiro', 'Liberado', { totalAcessos: 200, historicoAcesso: Array.from({ length: 200 }, () => ({ dataHora: new Date('2026-01-01') })) });
  await seedProfile('outro');
  await seedProfile('admin', 'Liberado', { ehAdmin: true });
  const db = environment.authenticatedContext('enfermeiro').firestore();
  const evento = doc(db, 'eventosAcesso', 'enfermeiro_201');
  await assertFails(setDoc(evento, { uid: 'enfermeiro', numero: 201, dia: '2026-11-02', dataHora: serverTimestamp() }));
  const batch = writeBatch(db);
  batch.update(doc(db, 'usuarios', 'enfermeiro'), { totalAcessos: 201, ultimoAcesso: serverTimestamp() });
  batch.set(evento, { uid: 'enfermeiro', numero: 201, dia: '2026-11-02', dataHora: serverTimestamp() });
  batch.set(doc(db, 'acessosDiarios', '2026-11-02'), { dia: '2026-11-02', total: 1, ultimoEvento: 'enfermeiro_201' });
  await assertSucceeds(batch.commit());
  await assertFails(getDoc(evento));
  await assertFails(updateDoc(evento, { numero: 202 }));
  await assertFails(deleteDoc(evento));
  await assertFails(setDoc(evento, { uid: 'enfermeiro', numero: 201, dia: '2026-11-02', dataHora: serverTimestamp() }));
  await assertFails(setDoc(doc(db, 'eventosAcesso', 'outro_1'), { uid: 'outro', numero: 1, dia: '2026-11-02', dataHora: serverTimestamp() }));
  const admin = environment.authenticatedContext('admin').firestore();
  await assertSucceeds(getDocs(collection(admin, 'eventosAcesso')));
  await assertSucceeds(getDocs(collection(admin, 'acessosDiarios')));
  await assertFails(setDoc(doc(db, 'acessosDiarios', '2026-11-03'), { dia: '2026-11-03', total: 10, ultimoEvento: 'enfermeiro_201' }));
  const segundo = writeBatch(db);
  segundo.update(doc(db, 'usuarios', 'enfermeiro'), { totalAcessos: 202, ultimoAcesso: serverTimestamp() });
  segundo.set(doc(db, 'eventosAcesso', 'enfermeiro_202'), { uid: 'enfermeiro', numero: 202, dia: '2026-11-02', dataHora: serverTimestamp() });
  segundo.update(doc(db, 'acessosDiarios', '2026-11-02'), { total: 2, ultimoEvento: 'enfermeiro_202' });
  await assertSucceeds(segundo.commit());
  await assertFails(getDocs(collection(db, 'acessosDiarios')));
  const revogado = environment.authenticatedContext('outro').firestore();
  await assertFails(getDocs(collection(revogado, 'eventosAcesso')));
});


test('documentos legais: publicação pública, revisão imutável e duplicação fiel', async () => {
  await seedProfile('admin-legal', 'Liberado', { ehAdmin: true, tipoUsuario: 'Administrador' });
  await seedProfile('enfermeira-legal');
  await seedProfile('gestora-conteudo', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const admin = environment.authenticatedContext('admin-legal').firestore();
  const nurse = environment.authenticatedContext('enfermeira-legal').firestore();
  const contentManager = environment.authenticatedContext('gestora-conteudo').firestore();
  const guest = environment.unauthenticatedContext().firestore();
  const stateRef = (db: typeof admin) => doc(db, 'documentosLegais', 'terms');
  const revisionRef = (db: typeof admin, id: string) => doc(db, 'documentosLegais', 'terms', 'revisoes', id);
  const texto = { introducao: 'Este documento organiza o uso.', secoes: [{ titulo: 'Uso', corpo: 'Apenas perfis autorizados.' }] };

  const snapshot = (id: string, versao: number, revisao: number, situacao: string, operacao: string, anteriorId: string, conteudo = texto) => ({
    tipo: 'terms', versao, revisao, situacao, operacao, anteriorId, conteudo,
    autorUid: 'admin-legal', criadoEm: serverTimestamp(),
    ...(situacao === 'publicada' ? { publicadoEm: serverTimestamp() } : {}),
  });

  const primeiraversao = writeBatch(admin);
  primeiraversao.set(stateRef(admin), { publicadaId: '', rascunhoId: 'v1-r0', sequencia: 1, ultimaAcao: 'criada', atualizadoPor: 'admin-legal', atualizadoEm: serverTimestamp() });
  primeiraversao.set(revisionRef(admin, 'v1-r0'), snapshot('v1-r0', 1, 0, 'rascunho', 'criada', ''));
  await assertSucceeds(primeiraversao.commit());

  await assertSucceeds(getDoc(stateRef(guest)));
  await assertFails(getDoc(revisionRef(guest, 'v1-r0')));
  await assertFails(getDoc(revisionRef(nurse, 'v1-r0')));
  await assertFails(getDocs(collection(guest, 'documentosLegais', 'terms', 'revisoes')));
  await assertFails(setDoc(revisionRef(contentManager, 'ilegal'), snapshot('ilegal', 1, 1, 'publicada', 'publicada', 'v1-r0')));
  await assertFails(updateDoc(revisionRef(admin, 'v1-r0'), { conteudo: { introducao: 'mudou' } }));
  await assertFails(deleteDoc(revisionRef(admin, 'v1-r0')));

  const publicar1 = writeBatch(admin);
  publicar1.set(revisionRef(admin, 'v1-r1'), snapshot('v1-r1', 1, 1, 'publicada', 'publicada', 'v1-r0'));
  publicar1.update(stateRef(admin), { publicadaId: 'v1-r1', rascunhoId: '', ultimaAcao: 'publicada', atualizadoPor: 'admin-legal', atualizadoEm: serverTimestamp() });
  await assertSucceeds(publicar1.commit());
  await assertSucceeds(getDoc(revisionRef(guest, 'v1-r1')));
  await assertFails(getDoc(revisionRef(guest, 'v1-r0')));
  await assertFails(getDocs(collection(guest, 'documentosLegais', 'terms', 'revisoes')));

  const duplicar = writeBatch(admin);
  duplicar.set(revisionRef(admin, 'v2-r0'), snapshot('v2-r0', 2, 0, 'rascunho', 'criada', 'v1-r1'));
  duplicar.update(stateRef(admin), { publicadaId: 'v1-r1', rascunhoId: 'v2-r0', sequencia: 2, ultimaAcao: 'criada', atualizadoPor: 'admin-legal', atualizadoEm: serverTimestamp() });
  await assertSucceeds(duplicar.commit());
  // O usuário continua vendo a versão 1 enquanto a 2 é editada.
  await assertSucceeds(getDoc(revisionRef(guest, 'v1-r1')));
  await assertFails(getDoc(revisionRef(guest, 'v2-r0')));

  const textoEditado = { ...texto, introducao: 'Texto revisado em uma nova versão.' };
  const editar2 = writeBatch(admin);
  editar2.set(revisionRef(admin, 'v2-r1'), snapshot('v2-r1', 2, 1, 'rascunho', 'editada', 'v2-r0', textoEditado));
  editar2.update(stateRef(admin), { rascunhoId: 'v2-r1', ultimaAcao: 'editada', atualizadoPor: 'admin-legal', atualizadoEm: serverTimestamp() });
  await assertSucceeds(editar2.commit());
  const versaoAnterior = await getDoc(revisionRef(admin, 'v2-r0'));
  assert.equal(versaoAnterior.data()?.conteudo.introducao, texto.introducao);

  const publicar2 = writeBatch(admin);
  publicar2.set(revisionRef(admin, 'v2-r2'), snapshot('v2-r2', 2, 2, 'publicada', 'publicada', 'v2-r1', textoEditado));
  publicar2.update(stateRef(admin), { publicadaId: 'v2-r2', rascunhoId: '', ultimaAcao: 'publicada', atualizadoPor: 'admin-legal', atualizadoEm: serverTimestamp() });
  await assertSucceeds(publicar2.commit());
  assert.equal((await getDoc(revisionRef(guest, 'v2-r2'))).data()?.conteudo.introducao, textoEditado.introducao);
  await assertFails(getDoc(revisionRef(guest, 'v1-r1')));
  await assertSucceeds(getDocs(collection(admin, 'documentosLegais', 'terms', 'revisoes')));
});

test('documentos legais: não permite publicar texto diferente do rascunho nem pular auditoria', async () => {
  await seedProfile('admin-legal', 'Liberado', { ehAdmin: true, tipoUsuario: 'Administrador' });
  const admin = environment.authenticatedContext('admin-legal').firestore();
  const state = doc(admin, 'documentosLegais', 'privacy');
  const first = doc(admin, 'documentosLegais', 'privacy', 'revisoes', 'v1-r0');
  const conteudo = { introducao: 'Informações de privacidade.', secoes: [{ titulo: 'Dados', corpo: 'Condições do tratamento.' }] };
  const batch = writeBatch(admin);
  batch.set(state, { publicadaId: '', rascunhoId: 'v1-r0', sequencia: 1, ultimaAcao: 'criada', atualizadoPor: 'admin-legal', atualizadoEm: serverTimestamp() });
  batch.set(first, { tipo: 'privacy', versao: 1, revisao: 0, situacao: 'rascunho', operacao: 'criada', anteriorId: '', conteudo, autorUid: 'admin-legal', criadoEm: serverTimestamp() });
  await assertSucceeds(batch.commit());
  await assertFails(updateDoc(state, { publicadaId: 'v1-r1', rascunhoId: '', ultimaAcao: 'publicada', atualizadoPor: 'admin-legal', atualizadoEm: serverTimestamp() }));
  const invalid = writeBatch(admin);
  invalid.set(doc(admin, 'documentosLegais', 'privacy', 'revisoes', 'v1-r1'), { tipo: 'privacy', versao: 1, revisao: 1, situacao: 'publicada', operacao: 'publicada', anteriorId: 'v1-r0', conteudo: { ...conteudo, introducao: 'Texto trocado sem revisão' }, autorUid: 'admin-legal', criadoEm: serverTimestamp(), publicadoEm: serverTimestamp() });
  invalid.update(state, { publicadaId: 'v1-r1', rascunhoId: '', ultimaAcao: 'publicada', atualizadoPor: 'admin-legal', atualizadoEm: serverTimestamp() });
  await assertFails(invalid.commit());
});

test('linha do tempo antiga volta a ser pública, mas somente administradores podem editar', async () => {
  await seedProfile('admin-timeline', 'Liberado', { ehAdmin: true, tipoUsuario: 'Administrador' });
  await seedProfile('enfermeiro-timeline');
  const admin = environment.authenticatedContext('admin-timeline').firestore();
  const nurse = environment.authenticatedContext('enfermeiro-timeline').firestore();
  const guest = environment.unauthenticatedContext().firestore();
  const id = 'marco-2022';
  const evt = {
    dataEvento: new Date('2022-10-01T15:00:00Z'), titulo: 'Lançamento do portal',
    subtitulo: 'Primeiro piloto', textoRedacao: 'Um capítulo do Portal CSAE Floripa.',
    foto: 'https://example.com/foto.jpg', legendaFoto: 'Equipe', autoriaFoto: 'Acervo da equipe',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    criadoPor: 'admin-timeline', atualizadoPor: 'admin-timeline',
  };
  await assertFails(setDoc(doc(guest, 'timelineEvents', id), evt));
  await assertFails(setDoc(doc(nurse, 'timelineEvents', id), evt));
  await assertSucceeds(setDoc(doc(admin, 'timelineEvents', id), evt));
  await assertSucceeds(getDocs(collection(guest, 'timelineEvents')));
  await assertSucceeds(getDoc(doc(guest, 'timelineEvents', id)));
  await assertFails(updateDoc(doc(nurse, 'timelineEvents', id), { titulo: 'Editado' }));
  await assertFails(deleteDoc(doc(guest, 'timelineEvents', id)));
  await assertFails(updateDoc(doc(admin, 'timelineEvents', id), { createdAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(doc(admin, 'timelineEvents', id), {
    titulo: 'Lançamento revisado', updatedAt: serverTimestamp(), atualizadoPor: 'admin-timeline',
  }));
  await assertSucceeds(deleteDoc(doc(admin, 'timelineEvents', id)));
  await assertFails(getDoc(doc(guest, 'usuarios', 'enfermeiro-timeline')));
});

test('linha do tempo mantém compatibilidade com eventos legados sem campos de auditoria', async () => {
  await seedProfile('admin-timeline', 'Liberado', { ehAdmin: true, tipoUsuario: 'Administrador' });
  const admin = environment.authenticatedContext('admin-timeline').firestore();
  const guest = environment.unauthenticatedContext().firestore();
  await environment.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'timelineEvents', 'legado'), {
      dataEvento: new Date('2018-08-01T12:00:00Z'),
      titulo: 'Projeto inicial', subtitulo: 'História do portal',
      textoRedacao: 'O trabalho iniciou antes da versão 2.0.',
      foto: 'https://example.com/2018.png', legendaFoto: 'Reunião', autoriaFoto: 'Equipe',
    });
  });
  await assertSucceeds(getDoc(doc(guest, 'timelineEvents', 'legado')));
  await assertSucceeds(updateDoc(doc(admin, 'timelineEvents', 'legado'), {
    subtitulo: 'Marco histórico', updatedAt: serverTimestamp(), atualizadoPor: 'admin-timeline',
  }));
});

test('historiasPortal permite ler registros antigos somente a usuários autorizados', async () => {
  await seedProfile('admin-historia', 'Liberado', { ehAdmin: true, tipoUsuario: 'Administrador' });
  await seedProfile('enfermeira-historia');
  const admin = environment.authenticatedContext('admin-historia').firestore();
  const profissional = environment.authenticatedContext('enfermeira-historia').firestore();
  const visitante = environment.unauthenticatedContext().firestore();
  await environment.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'historiasPortal', 'marco-2022'), {
      titulo: 'Onde tudo começou: uma ideia, um desafio e a vontade de inovar',
      descricao: 'O Portal CSAE começou em agosto de 2022 com o apoio da comissão.',
      dataOrdenacao: '2022-08', dataReferencia: '08/2022',
      criadoEm: new Date('2026-10-26T21:25:00Z'),
      atualizadoEm: new Date('2026-10-26T21:25:00Z'),
      criadoPorUid: 'admin-historia', atualizadoPorUid: 'admin-historia',
      curtidasPor: ['admin-historia'],
    });
  });
  const hist = doc(admin, 'historiasPortal', 'marco-2022');
  await assertSucceeds(getDocs(collection(profissional, 'historiasPortal')));
  await assertSucceeds(getDoc(doc(profissional, hist.path)));
  await assertFails(getDoc(doc(visitante, hist.path)));
  await assertFails(getDocs(collection(visitante, 'historiasPortal')));
  await assertSucceeds(updateDoc(hist, {
    titulo: 'Origem do Portal CSAE', atualizadoEm: serverTimestamp(),
    atualizadoPorUid: 'admin-historia',
  }));
  await assertFails(updateDoc(doc(profissional, hist.path), { descricao: 'Conteúdo indevido' }));
  await assertFails(updateDoc(hist, { criadoPorUid: 'outro', atualizadoEm: serverTimestamp(), atualizadoPorUid: 'admin-historia' }));
});

test('curtidas do histórico são isoladas por UID e preservam o documento original', async () => {
  await seedProfile('enfermeira-historia');
  await seedProfile('outra-enfermeira');
  const enfermeira = environment.authenticatedContext('enfermeira-historia').firestore();
  const outro = environment.authenticatedContext('outra-enfermeira').firestore();
  await environment.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'historiasPortal', 'marco'), {
      titulo: 'História original', descricao: 'Um acontecimento importante do portal.',
      dataOrdenacao: '2022-08', dataReferencia: '08/2022',
      curtidasPor: ['outra-enfermeira'],
    });
  });
  const docRef = doc(enfermeira, 'historiasPortal', 'marco');
  await assertSucceeds(updateDoc(docRef, { curtidasPor: arrayUnion('enfermeira-historia') }));
  assert.deepEqual((await getDoc(docRef)).data()?.curtidasPor, ['outra-enfermeira', 'enfermeira-historia']);
  await assertFails(updateDoc(docRef, { curtidasPor: arrayUnion('falso-uid') }));
  await assertFails(updateDoc(docRef, { curtidasPor: [] }));
  await assertFails(updateDoc(docRef, { descricao: 'Alteração indevida', curtidasPor: arrayUnion('enfermeira-historia') }));
  await assertSucceeds(updateDoc(docRef, { curtidasPor: arrayRemove('enfermeira-historia') }));
  await assertFails(deleteDoc(doc(outro, 'historiasPortal', 'marco')));
});

test('somente admin cria histórias e atualização de endereço não altera identidade ou vínculo', async () => {
  await seedProfile('admin-historia', 'Liberado', { ehAdmin: true, tipoUsuario: 'Administrador' });
  await seedProfile('titular-endereco');
  const admin = environment.authenticatedContext('admin-historia').firestore();
  const titular = environment.authenticatedContext('titular-endereco').firestore();
  const novo = {
    titulo: 'Um novo capítulo do portal',
    descricao: 'Marco institucional para registrar a história do CSAE.',
    dataOrdenacao: '2026-11', dataReferencia: '11/2026',
    subtitulo: '', foto: '', legendaFoto: '', autoriaFoto: '',
    curtidasPor: [], criadoEm: serverTimestamp(), atualizadoEm: serverTimestamp(),
    criadoPorUid: 'admin-historia', atualizadoPorUid: 'admin-historia',
  };
  await assertFails(setDoc(doc(titular, 'historiasPortal', 'evento-novo'), novo));
  await assertSucceeds(setDoc(doc(admin, 'historiasPortal', 'evento-novo'), novo));
  await assertSucceeds(updateDoc(doc(titular, 'usuarios', 'titular-endereco'), { 'dadosPessoais.rua': 'Rua Atualizada' }));
  await assertFails(updateDoc(doc(titular, 'usuarios', 'titular-endereco'), { 'dadosPessoais.cpf': '11111111111' }));
  await assertFails(updateDoc(doc(titular, 'usuarios', 'titular-endereco'), { 'dadosProfissionais.atuaSMS': false }));
  await assertFails(updateDoc(doc(titular, 'usuarios', 'titular-endereco'), { 'dadosProfissionais.matricula': '123' }));
});

test('profissional não altera diretamente formação e abre revisão com suspensão atômica', async () => {
  await seedProfile('revisado', 'Liberado', { dadosProfissionais: { formacao: 'Residente de Enfermagem', atuaSMS: true, dataInicioResidencia: '2024-02-01' } });
  const self = environment.authenticatedContext('revisado').firestore();
  const perfil = doc(self, 'usuarios', 'revisado');
  await assertFails(updateDoc(perfil, { 'dadosProfissionais.formacao': 'Enfermeiro' }));
  await assertFails(updateDoc(perfil, { statusAcesso: 'AguardandoRevisaoCadastro' }));
  await assertSucceeds(updateDoc(perfil, {
    dadosProfissionaisPropostos: { formacao: 'Enfermeiro', atuaSMS: true },
    statusAcesso: 'AguardandoRevisaoCadastro',
    alteracaoCadastralPendente: true,
    dataAlteracaoCadastral: serverTimestamp(),
  }));
  await assertFails(updateDoc(perfil, { 'dadosProfissionais.formacao': 'Enfermeiro' }));
  await assertSucceeds(getDoc(perfil)); // acesso aos próprios dados durante revisão
});

test('administrador decide revisão profissional e não aprova a própria alteração', async () => {
  await seedProfile('admin', 'Liberado', { ehAdmin: true, tipoUsuario: 'Administrador' });
  await seedProfile('revisado', 'AguardandoRevisaoCadastro', {
    dadosProfissionais: { formacao: 'Residente de Enfermagem', atuaSMS: true, dataInicioResidencia: '2024-02-01' },
    dadosProfissionaisPropostos: { formacao: 'Enfermeiro', atuaSMS: true },
    alteracaoCadastralPendente: true, dataAlteracaoCadastral: new Date('2026-10-01T00:00:00Z'),
  });
  const admin = environment.authenticatedContext('admin').firestore();
  const docRef = doc(admin, 'usuarios', 'revisado');
  await assertFails(updateDoc(docRef, { dadosProfissionais: { formacao: 'Enfermeiro', atuaSMS: true } }));
  await assertSucceeds(updateDoc(docRef, {
    dadosProfissionais: { formacao: 'Enfermeiro', atuaSMS: true },
    dadosProfissionaisAnteriores: { formacao: 'Residente de Enfermagem', atuaSMS: true, dataInicioResidencia: '2024-02-01' },
    alteracaoCadastralPendente: false,
    statusAcesso: 'Liberado',
    dataAprovacao: serverTimestamp(),
    dataRevisaoCadastral: serverTimestamp(),
    revisadoPorUid: 'admin',
    resultadoRevisaoCadastral: 'Aprovada',
    historicoRevisoes: [{
      dadosAnteriores: { formacao: 'Residente de Enfermagem', atuaSMS: true, dataInicioResidencia: '2024-02-01' },
      dadosPropostos: { formacao: 'Enfermeiro', atuaSMS: true }, decisao: 'Aprovada',
      motivo: '', revisadoEm: new Date(), revisadoPorUid: 'admin',
      solicitadoEm: new Date('2026-10-01T00:00:00Z'),
    }],
  }));
  assert.equal((await getDoc(docRef)).data()?.statusAcesso, 'Liberado');
});

test('usuário atualiza documentos pessoais com autenticação recente, sem mudar privilégios', async () => {
  await seedProfile('conta');
  const habitual = environment.authenticatedContext('conta').firestore();
  const recently = environment.authenticatedContext('conta', { auth_time: Math.floor(Date.now()/1000) }).firestore();
  const perfil = doc(habitual, 'usuarios', 'conta');
  await assertFails(updateDoc(perfil, { 'dadosPessoais.cpf': '12345678901', dataAtualizacaoDadosPessoais: serverTimestamp() }));
  await assertSucceeds(updateDoc(doc(recently, 'usuarios', 'conta'), {
    'dadosPessoais.cpf': '12345678901', dataAtualizacaoDadosPessoais: serverTimestamp(),
  }));
  await assertFails(updateDoc(doc(recently, 'usuarios', 'conta'), { ehAdmin: true }));
});

test('e-mail só sincroniza no perfil após confirmação no Firebase Auth', async () => {
  await seedProfile('conta');
  const naoVerificado = environment.authenticatedContext('conta', { email: 'novo@exemplo.com', email_verified: false }).firestore();
  const verificado = environment.authenticatedContext('conta', { email: 'novo@exemplo.com', email_verified: true }).firestore();
  await assertFails(updateDoc(doc(naoVerificado, 'usuarios', 'conta'), { email: 'novo@exemplo.com' }));
  await assertSucceeds(updateDoc(doc(verificado, 'usuarios', 'conta'), { email: 'novo@exemplo.com' }));
  await assertFails(updateDoc(doc(verificado, 'usuarios', 'conta'), { email: 'qualquer@exemplo.com' }));
});
