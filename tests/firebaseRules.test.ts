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
    batch.update(doc(db, 'intervencoesAutorais', 'avaliar'), { avaliacaoQualidade: { atomicidadeStatus: 'unica', avaliadorId: 'gestor', avaliadoEm: serverTimestamp(), versaoCriterios: versao }, ultimaDecisaoId: id });
    batch.set(doc(db, 'decisoesIntervencoes', id), { sugestaoId: 'avaliar', statusAnterior: 'aguardando', statusNovo: 'aguardando', tipo: 'avaliar', avaliadorId: 'gestor', destinos: [], justificativa: '', dataHora: serverTimestamp() });
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

test('preparação permanece aguardando; publicação exige homologação e decisão atômica', async () => {
  await seedProfile('autor');
  await seedProfile('gestor', 'Liberado', { gestorConteudos: true, paginasPermitidas: ['GestaoConteudos'] });
  const autor = environment.authenticatedContext('autor').firestore();
  const gestor = environment.authenticatedContext('gestor').firestore();
  await assertSucceeds(setDoc(doc(autor, 'intervencoesAutorais', 's1'), {
    textoIntervencao: 'Orientar atividade', tituloResultadoVinculado: 'Mobilidade', autorId: 'autor', autorNome: 'Autor',
    dataCriacao: serverTimestamp(), identificadorSugestao: 's1', status: 'aguardando',
  }));
  const preparacao = { acaoPrescrita: 'Orientar atividade física', acaoEnfermeiro: 'Oriento atividade física', destinos: [
    { diagnosticoId: 'd1', tituloDiagnostico: 'Mobilidade', tituloResultado: 'Mobilidade melhorada' },
    { diagnosticoId: 'd2', tituloDiagnostico: 'Autocuidado', tituloResultado: 'Autocuidado preservado' },
  ] };
  const sugestao = doc(gestor, 'intervencoesAutorais', 's1');
  const preparar = writeBatch(gestor);
  preparar.update(sugestao, { status: 'aguardando', preparacao, avaliadorId: 'gestor', avaliadorNome: 'Gestor', dataDecisao: serverTimestamp(), ultimaDecisaoId: 'a1' });
  preparar.set(doc(gestor, 'decisoesIntervencoes', 'a1'), { sugestaoId: 's1', statusAnterior: 'aguardando', statusNovo: 'aguardando', tipo: 'preparar', avaliadorId: 'gestor', destinos: [], justificativa: '', dataHora: serverTimestamp() });
  await assertSucceeds(preparar.commit());
  assert.equal((await getDoc(sugestao)).data()?.status, 'aguardando');
  const publicarSemHomologacao = writeBatch(gestor);
  publicarSemHomologacao.update(sugestao, { status: 'aprovada', avaliadorId: 'gestor', avaliadorNome: 'Gestor', dataDecisao: serverTimestamp(), ultimaDecisaoId: 'a2' });
  publicarSemHomologacao.set(doc(gestor, 'decisoesIntervencoes', 'a2'), { sugestaoId: 's1', statusAnterior: 'aguardando', statusNovo: 'aprovada', tipo: 'publicar', avaliadorId: 'gestor', destinos: preparacao.destinos, justificativa: '', dataHora: serverTimestamp() });
  await assertFails(publicarSemHomologacao.commit());
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'rolEnfermagem', 'd1'), {
      tituloDiagnostico: 'Mobilidade', descricaoDiagnostico: '', subconjuntos: [],
      resultadosEsperados: [{ tituloResultado: 'Mobilidade melhorada', descricaoResultado: '', intervencoes: [] }],
    });
    await setDoc(doc(context.firestore(), 'rolEnfermagem', 'd2'), {
      tituloDiagnostico: 'Autocuidado', descricaoDiagnostico: '', subconjuntos: [],
      resultadosEsperados: [{ tituloResultado: 'Autocuidado preservado', descricaoResultado: '', intervencoes: [] }],
    });
  });
  const completa = { ...preparacao, referenciaDeliberacao: 'Deliberação de teste', dataDeliberacao: '2026-11-02', documentoHomologacao: 'Ata de teste', responsavelValidacao: 'CSAE teste' };
  const publicar = writeBatch(gestor);
  publicar.update(doc(gestor, 'rolEnfermagem', 'd1'), {
    resultadosEsperados: [{ tituloResultado: 'Mobilidade melhorada', descricaoResultado: '', intervencoes: [{ acaoPrescrita: completa.acaoPrescrita, acaoEnfermeiro: completa.acaoEnfermeiro, materiaisDeApoio: [] }] }],
    ultimaSugestaoPublicada: 's1',
  });
  publicar.update(doc(gestor, 'rolEnfermagem', 'd2'), {
    resultadosEsperados: [{ tituloResultado: 'Autocuidado preservado', descricaoResultado: '', intervencoes: [{ acaoPrescrita: completa.acaoPrescrita, acaoEnfermeiro: completa.acaoEnfermeiro, materiaisDeApoio: [] }] }],
    ultimaSugestaoPublicada: 's1',
  });
  publicar.update(sugestao, { status: 'aprovada', preparacao: completa, avaliadorId: 'gestor', avaliadorNome: 'Gestor', dataDecisao: serverTimestamp(), ultimaDecisaoId: 'a3' });
  publicar.set(doc(gestor, 'decisoesIntervencoes', 'a3'), { sugestaoId: 's1', statusAnterior: 'aguardando', statusNovo: 'aprovada', tipo: 'publicar', avaliadorId: 'gestor', destinos: completa.destinos, justificativa: '', dataHora: serverTimestamp() });
  await assertSucceeds(publicar.commit());
  const concorrente = writeBatch(gestor);
  concorrente.update(sugestao, { status: 'aprovada', preparacao: completa, avaliadorId: 'gestor', avaliadorNome: 'Gestor', dataDecisao: serverTimestamp(), ultimaDecisaoId: 'a4' });
  concorrente.set(doc(gestor, 'decisoesIntervencoes', 'a4'), { sugestaoId: 's1', statusAnterior: 'aguardando', statusNovo: 'aprovada', tipo: 'publicar', avaliadorId: 'gestor', destinos: completa.destinos, justificativa: '', dataHora: serverTimestamp() });
  await assertFails(concorrente.commit());
  assert.equal((await getDoc(sugestao)).data()?.status, 'aprovada');
  assert.equal((await getDoc(doc(gestor, 'rolEnfermagem', 'd2'))).data()?.resultadosEsperados[0].intervencoes[0].acaoPrescrita, completa.acaoPrescrita);
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
