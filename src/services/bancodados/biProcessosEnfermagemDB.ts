import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { differenceInYears } from 'date-fns';
import { db } from '@/services/firebase';
import { agregarRegistrosProducao, type EstatisticasProducao, type RegistroProducao } from '@/utils/painelEstatistico';
import {
  CACHE_PROCESSOS_SCHEMA_VERSION,
  cacheProducaoValido,
  normalizarExecutores,
  particionarRegistrosPorTamanho,
  removerUndefined,
  tentarPersistirCache,
} from '@/utils/painelEstatisticoCache';

export type { EstatisticasProducao, ItemRanking, ItemTemporal, RaioXUsuario, RegistroProducao, UsuarioRanking } from '@/utils/painelEstatistico';
export { agregarRegistrosProducao } from '@/utils/painelEstatistico';

export interface EstatisticasProcessoEnfermagem extends EstatisticasProducao {
  porLotacao: Record<string, EstatisticasProducao>;
  lotacoesUnicas: string[];
  registrosProducao: RegistroProducao[];
  registroChunks: number;
  lotacaoDocumentos: Array<{ id: string; lotacao: string }>;
  schemaVersion?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ultimaAtualizacao?: any;
}

function idDocumentoLotacao(lotacao: string): string {
  return encodeURIComponent(lotacao).slice(0, 500);
}

async function lerAgregadosLotacoes(
  cacheDocRef: ReturnType<typeof doc>,
  referencias: Array<{ id: string; lotacao: string }>,
): Promise<Record<string, EstatisticasProducao>> {
  const snapshots = await Promise.all(referencias.map((item) => getDoc(doc(collection(cacheDocRef, 'lotacoes'), item.id))));
  const porLotacao: Record<string, EstatisticasProducao> = {};
  snapshots.forEach((snapshot, index) => {
    if (!snapshot.exists()) throw new Error(`Cache da lotação ${referencias[index].lotacao} está incompleto.`);
    porLotacao[referencias[index].lotacao] = snapshot.data().agregado as EstatisticasProducao;
  });
  return porLotacao;
}

export async function obterRegistrosProducaoCache(totalChunks: number): Promise<RegistroProducao[]> {
  if (totalChunks <= 0) return [];
  const cacheDocRef = doc(db, 'estatisticas', 'painel_processos');
  const snapshots = await Promise.all(Array.from({ length: totalChunks }, (_, index) =>
    getDoc(doc(collection(cacheDocRef, 'registros'), `chunk-${String(index).padStart(4, '0')}`))));
  const registros: RegistroProducao[] = [];
  snapshots.forEach((snapshot, index) => {
    if (!snapshot.exists()) throw new Error(`Chunk ${index} do cache de produção não foi encontrado.`);
    registros.push(...((snapshot.data().registros || []) as RegistroProducao[]));
  });
  return registros;
}

async function persistirCacheSegmentado(stats: EstatisticasProcessoEnfermagem): Promise<void> {
  const cacheDocRef = doc(db, 'estatisticas', 'painel_processos');
  const chunks = particionarRegistrosPorTamanho(stats.registrosProducao);
  await Promise.all([
    ...stats.lotacaoDocumentos.map(({ id, lotacao }) => setDoc(
      doc(collection(cacheDocRef, 'lotacoes'), id),
      removerUndefined({ schemaVersion: CACHE_PROCESSOS_SCHEMA_VERSION, lotacao, agregado: stats.porLotacao[lotacao] }),
    )),
    ...chunks.map((registros, index) => setDoc(
      doc(collection(cacheDocRef, 'registros'), `chunk-${String(index).padStart(4, '0')}`),
      { schemaVersion: CACHE_PROCESSOS_SCHEMA_VERSION, index, registros },
    )),
  ]);
  const { porLotacao: _porLotacao, registrosProducao: _registros, ultimaAtualizacao: _atualizacao, ...compacto } = stats;
  await setDoc(cacheDocRef, {
    ...removerUndefined({
    ...compacto,
    registroChunks: chunks.length,
    schemaVersion: CACHE_PROCESSOS_SCHEMA_VERSION,
    }),
    ultimaAtualizacao: serverTimestamp(),
  });
}

interface FirestoreTimestamp { toDate: () => Date }
interface ProcessoEnfermagemDoc {
  idProcesso: string;
  status: 'em_andamento' | 'concluido';
  dataInicio: FirestoreTimestamp;
  dataConclusao?: FirestoreTimestamp;
  enfermeiroId: string;
  avaliacao?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exameFisico?: Record<string, any>;
    nhbsAfetadas?: Array<{ parametro: string; nhb: string }>;
  };
  diagnostico?: { diagnosticosSelecionados?: Array<{ id: string; tituloDiagnostico: string }> };
  planejamento?: { diagnosticosPlanejados?: Array<{
    tituloDiagnostico: string;
    resultadoEsperadoSelecionado?: string;
    intervencoesSelecionadas?: Array<{ acaoPrescrita: string; tipo: string }>;
    isPositivo: boolean;
  }> };
  implementacao?: Record<string, { intervencoes?: Array<{
    acaoPrescrita: string;
    implementadoNestaConsulta: boolean;
    quemExecuta?: string[] | string;
  }> }>;
  evolucao?: { intervencoesExecutadas?: Record<string, string[]> };
}

function faixaEtaria(dataNascimento?: Date): string | undefined {
  if (!dataNascimento) return undefined;
  const idade = differenceInYears(new Date(), dataNascimento);
  if (idade <= 18) return '0-18';
  if (idade <= 39) return '19-39';
  if (idade <= 59) return '40-59';
  return '60+';
}

function normalizarSexo(value: unknown): string {
  const sexo = String(value || '').trim().toLocaleLowerCase('pt-BR');
  if (sexo.startsWith('fem')) return 'Feminino';
  if (sexo.startsWith('mas')) return 'Masculino';
  if (!sexo) return 'Não informado';
  return 'Outro';
}

export async function obterEstatisticasProcessoEnfermagem(): Promise<EstatisticasProcessoEnfermagem | null> {
  const cacheDocRef = doc(db, 'estatisticas', 'painel_processos');
  try {
    const cacheSnap = await getDoc(cacheDocRef);
    if (cacheSnap.exists()) {
      const data = cacheSnap.data();
      if (cacheProducaoValido(data)) {
        const lotacaoDocumentos = data.lotacaoDocumentos as Array<{ id: string; lotacao: string }>;
        const porLotacao = await lerAgregadosLotacoes(cacheDocRef, lotacaoDocumentos);
        console.log(`BI Processos: Cache segmentado válido (schema v${CACHE_PROCESSOS_SCHEMA_VERSION}).`);
        return { ...data, porLotacao, registrosProducao: [] } as unknown as EstatisticasProcessoEnfermagem;
      }
    }
  } catch (error) {
    console.warn('BI Processos: cache indisponível ou incompleto; recalculando pelas fontes.', error);
  }

  console.warn('BI Processos: recalculando agregados globais e por lotação...');
  const [pacientesSnapshot, usuariosSnapshot, rolSnapshot] = await Promise.all([
    getDocs(collection(db, 'pacientesProcessoEnfermagem')),
    getDocs(collection(db, 'usuarios')),
    getDocs(collection(db, 'rolEnfermagem')),
  ]);
  const usuariosMap: Record<string, { nome: string; lotacao: string }> = {};
  usuariosSnapshot.forEach((usuarioDoc) => {
    const data = usuarioDoc.data();
    const usuario = {
      nome: data.dadosPessoais?.nomeCompleto || data.nomeCompleto || data.dadosPessoais?.nome || 'Nome indisponível',
      lotacao: String(data.dadosProfissionais?.lotacao || data.lotacao || 'Sem lotação').trim(),
    };
    usuariosMap[usuarioDoc.id] = usuario;
    if (data.uid && data.uid !== usuarioDoc.id) usuariosMap[data.uid] = usuario;
  });
  const subconjuntoPorDiagnostico: Record<string, string> = {};
  rolSnapshot.forEach((rolDoc) => {
    const data = rolDoc.data();
    if (data.tituloDiagnostico && data.subconjuntos?.[0]?.tipoSubconjunto) {
      subconjuntoPorDiagnostico[data.tituloDiagnostico] = data.subconjuntos[0].tipoSubconjunto;
    }
  });

  const registrosProducao: RegistroProducao[] = [];
  let pacienteSequencia = 0;
  let processosIgnorados = 0;
  pacientesSnapshot.forEach((pacienteDoc) => {
    pacienteSequencia += 1;
    const paciente = pacienteDoc.data();
    const pacienteChave = `p${pacienteSequencia}`;
    const nascimento = paciente.dataNascimento?.toDate?.();
    const processos = Array.isArray(paciente.processosEnfermagem) ? paciente.processosEnfermagem as ProcessoEnfermagemDoc[] : [];
    processos.forEach((processo) => {
      try {
      const dataInicio = processo.dataInicio?.toDate?.();
      const dataConclusao = processo.dataConclusao?.toDate?.();
      const dataReferencia = dataConclusao || dataInicio;
      if (!dataReferencia) return;
      const usuario = usuariosMap[processo.enfermeiroId] || { nome: 'Usuário externo', lotacao: 'Sem lotação' };
      const nhbsAfetadas = Array.isArray(processo.avaliacao?.nhbsAfetadas) ? processo.avaliacao.nhbsAfetadas : [];
      const nhbs = nhbsAfetadas.map((item) => item?.nhb).filter(Boolean);
      const diagnosticosSelecionados = Array.isArray(processo.diagnostico?.diagnosticosSelecionados) ? processo.diagnostico.diagnosticosSelecionados : [];
      const diagnosticos = diagnosticosSelecionados.map((item) => item?.tituloDiagnostico).filter(Boolean);
      const planejados = Array.isArray(processo.planejamento?.diagnosticosPlanejados) ? processo.planejamento.diagnosticosPlanejados : [];
      const resultados = planejados.map((item) => item.resultadoEsperadoSelecionado).filter((item): item is string => Boolean(item));
      const intervencoesPrescritas = planejados.flatMap((item) => (item.intervencoesSelecionadas || [])
        .map((intervencao) => intervencao.acaoPrescrita).filter(Boolean));
      const intervencoesAplicadas: string[] = [];
      const executores: string[] = [];
      Object.values(processo.implementacao || {}).forEach((grupo) => (grupo.intervencoes || []).forEach((intervencao) => {
        if (!intervencao.implementadoNestaConsulta) return;
        if (intervencao.acaoPrescrita) intervencoesAplicadas.push(intervencao.acaoPrescrita);
        executores.push(...normalizarExecutores(intervencao.quemExecuta));
      }));
      const duracaoHoras = dataInicio && dataConclusao ? (dataConclusao.getTime() - dataInicio.getTime()) / 3_600_000 : undefined;
      registrosProducao.push({
        id: processo.idProcesso,
        usuarioId: processo.enfermeiroId,
        usuarioNome: usuario.nome,
        lotacao: usuario.lotacao,
        pacienteChave,
        pacienteSexo: normalizarSexo(paciente.sexo),
        ...(faixaEtaria(nascimento) ? { pacienteFaixaEtaria: faixaEtaria(nascimento) } : {}),
        status: processo.status,
        dataReferencia: dataReferencia.toISOString(),
        ...(dataInicio ? { dataInicioReferencia: dataInicio.toISOString() } : {}),
        ...(dataConclusao ? { dataConclusaoReferencia: dataConclusao.toISOString() } : {}),
        ...(duracaoHoras !== undefined && duracaoHoras > 0 && duracaoHoras < 720 ? { duracaoHoras } : {}),
        exameFisico: Object.keys(processo.avaliacao?.exameFisico || {}),
        nhbs,
        diagnosticos,
        subconjuntos: diagnosticos.map((item) => subconjuntoPorDiagnostico[item]).filter(Boolean),
        resultados,
        intervencoesPrescritas,
        intervencoesAplicadas,
        executores,
        acoesEnfermeiro: Object.values(processo.evolucao?.intervencoesExecutadas || {}).flat(),
      });
      } catch (error) {
        processosIgnorados += 1;
        console.warn('BI Processos: processo legado incompatível ignorado.', { idProcesso: processo?.idProcesso, error });
      }
    });
  });
  if (processosIgnorados > 0) console.warn(`BI Processos: ${processosIgnorados} processo(s) ignorado(s) durante o cálculo.`);

  const lotacoesUnicas = [...new Set(registrosProducao.map((registro) => registro.lotacao).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const porLotacao = Object.fromEntries(lotacoesUnicas.map((lotacao) => [
    lotacao,
    agregarRegistrosProducao(registrosProducao.filter((registro) => registro.lotacao === lotacao)),
  ]));
  const lotacaoDocumentos = lotacoesUnicas.map((lotacao) => ({ id: idDocumentoLotacao(lotacao), lotacao }));
  const registroChunks = particionarRegistrosPorTamanho(registrosProducao).length;
  const stats: EstatisticasProcessoEnfermagem = {
    ...agregarRegistrosProducao(registrosProducao),
    porLotacao,
    lotacoesUnicas,
    lotacaoDocumentos,
    registrosProducao,
    registroChunks,
    schemaVersion: CACHE_PROCESSOS_SCHEMA_VERSION,
    ultimaAtualizacao: new Date(),
  };
  await tentarPersistirCache(
    () => persistirCacheSegmentado(stats),
    (error) => console.error('BI Processos: falha ao persistir cache; dados calculados serão exibidos.', error),
  );
  return stats;
}
