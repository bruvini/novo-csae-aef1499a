import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import { differenceInYears } from 'date-fns';
import { db } from '@/services/firebase';
import { agregarRegistrosProducao, type EstatisticasProducao, type RegistroProducao } from '@/utils/painelEstatistico';

export type { EstatisticasProducao, ItemRanking, ItemTemporal, RaioXUsuario, RegistroProducao, UsuarioRanking } from '@/utils/painelEstatistico';
export { agregarRegistrosProducao } from '@/utils/painelEstatistico';

const SCHEMA_VERSION = 8;

export interface EstatisticasProcessoEnfermagem extends EstatisticasProducao {
  porLotacao: Record<string, EstatisticasProducao>;
  lotacoesUnicas: string[];
  registrosProducao: RegistroProducao[];
  schemaVersion?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ultimaAtualizacao?: any;
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
      const ultimaAtualizacao = data.ultimaAtualizacao?.toDate?.();
      const cacheValido = data.schemaVersion === SCHEMA_VERSION
        && ultimaAtualizacao
        && Date.now() - ultimaAtualizacao.getTime() < 12 * 60 * 60 * 1000
        && data.porLotacao
        && Array.isArray(data.registrosProducao);
      if (cacheValido) {
        console.log(`BI Processos: Cache válido (schema v${SCHEMA_VERSION}). Custo: 1 leitura.`);
        return data as EstatisticasProcessoEnfermagem;
      }
      await deleteDoc(cacheDocRef).catch(() => undefined);
    }
  } catch (error) {
    console.error('Erro ao ler cache do BI de processos:', error);
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
  pacientesSnapshot.forEach((pacienteDoc) => {
    pacienteSequencia += 1;
    const paciente = pacienteDoc.data();
    const pacienteChave = `p${pacienteSequencia}`;
    const nascimento = paciente.dataNascimento?.toDate?.();
    ((paciente.processosEnfermagem || []) as ProcessoEnfermagemDoc[]).forEach((processo) => {
      const dataInicio = processo.dataInicio?.toDate?.();
      const dataConclusao = processo.dataConclusao?.toDate?.();
      const dataReferencia = dataConclusao || dataInicio;
      if (!dataReferencia) return;
      const usuario = usuariosMap[processo.enfermeiroId] || { nome: 'Usuário externo', lotacao: 'Sem lotação' };
      const nhbs = (processo.avaliacao?.nhbsAfetadas || []).map((item) => item.nhb).filter(Boolean);
      const diagnosticos = (processo.diagnostico?.diagnosticosSelecionados || []).map((item) => item.tituloDiagnostico).filter(Boolean);
      const planejados = processo.planejamento?.diagnosticosPlanejados || [];
      const resultados = planejados.map((item) => item.resultadoEsperadoSelecionado).filter((item): item is string => Boolean(item));
      const intervencoesPrescritas = planejados.flatMap((item) => (item.intervencoesSelecionadas || [])
        .map((intervencao) => intervencao.acaoPrescrita).filter(Boolean));
      const intervencoesAplicadas: string[] = [];
      const executores: string[] = [];
      Object.values(processo.implementacao || {}).forEach((grupo) => (grupo.intervencoes || []).forEach((intervencao) => {
        if (!intervencao.implementadoNestaConsulta) return;
        if (intervencao.acaoPrescrita) intervencoesAplicadas.push(intervencao.acaoPrescrita);
        if (intervencao.quemExecuta) executores.push(...(Array.isArray(intervencao.quemExecuta) ? intervencao.quemExecuta : [intervencao.quemExecuta]));
      }));
      const duracaoHoras = dataInicio && dataConclusao ? (dataConclusao.getTime() - dataInicio.getTime()) / 3_600_000 : undefined;
      registrosProducao.push({
        id: processo.idProcesso,
        usuarioId: processo.enfermeiroId,
        usuarioNome: usuario.nome,
        lotacao: usuario.lotacao,
        pacienteChave,
        pacienteSexo: normalizarSexo(paciente.sexo),
        pacienteFaixaEtaria: faixaEtaria(nascimento),
        status: processo.status,
        dataReferencia: dataReferencia.toISOString(),
        dataInicioReferencia: dataInicio?.toISOString(),
        dataConclusaoReferencia: dataConclusao?.toISOString(),
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
    });
  });

  const lotacoesUnicas = [...new Set(registrosProducao.map((registro) => registro.lotacao).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const porLotacao = Object.fromEntries(lotacoesUnicas.map((lotacao) => [
    lotacao,
    agregarRegistrosProducao(registrosProducao.filter((registro) => registro.lotacao === lotacao)),
  ]));
  const stats: EstatisticasProcessoEnfermagem = {
    ...agregarRegistrosProducao(registrosProducao),
    porLotacao,
    lotacoesUnicas,
    registrosProducao,
    schemaVersion: SCHEMA_VERSION,
    ultimaAtualizacao: serverTimestamp(),
  };
  await setDoc(cacheDocRef, stats);
  return stats;
}
