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
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
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
  await assertSucceeds(updateDoc(ticketRef, {
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
