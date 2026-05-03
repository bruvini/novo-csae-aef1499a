import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { 
  format, 
  getHours, 
  differenceInYears, 
  startOfDay, 
  startOfMonth, 
  startOfYear,
  isSameMonth,
  subMonths,
  isSameYear,
  subYears,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Incrementar sempre que o schema dos dados mudar
const SCHEMA_VERSION = 4;

export interface ItemRanking {
  name: string;
  value: number;
}

export interface ItemTemporal {
  name: string;
  value: number;
  acumulado?: number;
  variacaoPercentual?: number;
}

export interface RaioXUsuario {
  totalPacientes: number;
  processosAtivos: number;
  processosConcluidos: number;
  tempoMedioHoras: number;
  topDiagnosticos: string[];
  topNHBs: string[];
  topIntervencoes: string[];
  executorMaisFrequente?: string;
}

export interface UsuarioRanking extends ItemRanking {
  id: string;
  lotacao: string;
  raioX: RaioXUsuario;
}

export interface EstatisticasProcessoEnfermagem {
  // KPIs principais
  totalProcessos: number;
  totalProcessosConcluidos: number;
  totalProcessosEmAndamento: number;
  totalPacientesAtendidos: number;
  taxaConclusao: number;

  // KPIs clínicos
  totalDiagnosticosUnicos: number;
  totalIntervencoesUnicas: number;
  totalNhbsUnicas: number;
  mediaDiagnosticosPorProcesso: number;
  tempoMedioProcessoHoras: number;

  // Rankings clínicos (top 10)
  diagnosticosTop: ItemRanking[];
  intervencoesTop: ItemRanking[];
  resultadosTop: ItemRanking[];
  nhbsTop: ItemRanking[];

  // Distribuições
  distribuicaoStatus: ItemRanking[];
  distribuicaoExecutores: ItemRanking[];

  // Phase 3: Perfil do Paciente
  perfilPacientes: {
    sexo: ItemRanking[];
    faixasEtarias: ItemRanking[];
  };

  // Phase 3: Rankings de Produtividade
  rankingUsuarios: UsuarioRanking[];
  rankingLotacoes: ItemRanking[];

  // Phase 3: Etapas do PE
  etapasPE: {
    avaliacao: { physical: ItemRanking[]; nhbs: ItemRanking[] };
    diagnostico: { top: ItemRanking[]; subset: ItemRanking[] };
    planejamento: { results: ItemRanking[]; prescribed: ItemRanking[] };
    implementacao: { applied: ItemRanking[]; executors: ItemRanking[] };
    evolucao: { nurseApplied: ItemRanking[] };
  };

  // Phase 3: Temporal Avançado
  temporalAvancado: {
    hora: ItemTemporal[];
    diario: ItemTemporal[];
    diaSemana: ItemTemporal[];
    mensal: ItemTemporal[];
    anual: ItemTemporal[];
  };

  schemaVersion?: number;
  ultimaAtualizacao?: any;
}

// ── Utilitários Internos ──────────────────────────────────────────────────────

function formatMapToRanking(map: Record<string, number>, limit = 10): ItemRanking[] {
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function calcularVariacao(atual: number, anterior: number): number {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return Math.round(((atual - anterior) / anterior) * 100);
}

// ── Tipos Internos (Firestore) ────────────────────────────────────────────────

interface FirestoreTimestamp {
  toDate: () => Date;
}

interface ProcessoEnfermagemDoc {
  idProcesso: string;
  status: 'em_andamento' | 'concluido';
  dataInicio: FirestoreTimestamp;
  dataConclusao?: FirestoreTimestamp;
  enfermeiroId: string;
  avaliacao?: {
    exameFisico?: Record<string, any>;
    nhbsAfetadas: Array<{ parametro: string; nhb: string }>;
  };
  diagnostico?: {
    diagnosticosSelecionados: Array<{ id: string; tituloDiagnostico: string }>;
  };
  planejamento?: {
    diagnosticosPlanejados: Array<{
      tituloDiagnostico: string;
      resultadoEsperadoSelecionado?: string;
      intervencoesSelecionadas: Array<{ acaoPrescrita: string; tipo: string }>;
      isPositivo: boolean;
    }>;
  };
  implementacao?: Record<
    string,
    {
      intervencoes: Array<{
        acaoPrescrita: string;
        implementadoNestaConsulta: boolean;
        quemExecuta?: 'Enfermeiro' | 'Equipe/Outros';
      }>;
    }
  >;
  evolucao?: {
    intervencoesExecutadas?: Record<string, string[]>;
  };
}

// ── Função Principal ─────────────────────────────────────────────────────────

export async function obterEstatisticasProcessoEnfermagem(): Promise<EstatisticasProcessoEnfermagem | null> {
  const cacheDocRef = doc(db, 'estatisticas', 'painel_processos');

  try {
    const cacheSnap = await getDoc(cacheDocRef);
    if (cacheSnap.exists()) {
      const data = cacheSnap.data();
      const ultimaAtualizacao = data.ultimaAtualizacao?.toDate();
      const agora = new Date();
      const dozeHorasEmMs = 12 * 60 * 60 * 1000;

      if (data.schemaVersion === SCHEMA_VERSION && ultimaAtualizacao && (agora.getTime() - ultimaAtualizacao.getTime() < dozeHorasEmMs)) {
        console.log('BI Processos: Cache válido. Custo: 1 leitura.');
        return data as EstatisticasProcessoEnfermagem;
      }
      await deleteDoc(cacheDocRef).catch(() => {});
    }
  } catch (e) {
    console.error('Erro ao ler cache:', e);
  }

  console.warn('BI Processos: Recalculando estatísticas...');

  const [pacientesSnapshot, usuariosSnapshot, rolSnapshot] = await Promise.all([
    getDocs(collection(db, 'pacientesProcessoEnfermagem')),
    getDocs(collection(db, 'usuarios')),
    getDocs(collection(db, 'rolEnfermagem'))
  ]);

  // 1. Mapeamentos Auxiliares
  const usuariosMap: Record<string, { nome: string; lotacao: string }> = {};
  usuariosSnapshot.forEach(doc => {
    const d = doc.data();
    // Prioriza o campo 'uid' se existir, senão usa o doc.id (padrão)
    const actualUid = d.uid || doc.id;
    usuariosMap[actualUid] = {
      nome: d.dadosPessoais?.nomeCompleto || 'Usuário Desconhecido',
      lotacao: d.dadosProfissionais?.lotacao || 'Sem Lotação'
    };
  });

  const rolMap: Record<string, string> = {};
  rolSnapshot.forEach(doc => {
    const d = doc.data();
    if (d.tituloDiagnostico && d.subconjuntos?.length > 0) {
      rolMap[d.tituloDiagnostico] = d.subconjuntos[0].tipoSubconjunto;
    }
  });

  // 2. Acumuladores
  const pacientesComProcesso = new Set<string>();
  const diagnosticosMap: Record<string, number> = {};
  const intervencoesMap: Record<string, number> = {};
  const resultadosMap: Record<string, number> = {};
  const nhbsMap: Record<string, number> = {};
  
  // Phase 3: Perfil Paciente
  const sexoMap: Record<string, number> = { Masculino: 0, Feminino: 0, Outro: 0 };
  const idadeMap: Record<string, number> = { 
    '0-18': 0, '19-39': 0, '40-59': 0, '60+': 0 
  };

  // Phase 3: Produtividade
  const rankingUserMap: Record<string, { 
    concluidos: number; 
    ativos: number; 
    pacientes: Set<string>;
    tempos: number[];
    diags: Record<string, number>;
    nhbs: Record<string, number>;
    intervs: Record<string, number>;
    executores: Record<string, number>;
  }> = {};
  const rankingLotacaoMap: Record<string, number> = {};

  // Phase 3: Etapas
  const exameFisicoMap: Record<string, number> = {};
  const subsetMap: Record<string, number> = {};
  const interAppliedMap: Record<string, number> = {};
  const nurseAppliedMap: Record<string, number> = {};

  // Temporal
  const porDiaSemana = [0, 0, 0, 0, 0, 0, 0];
  const porHora: number[] = Array(24).fill(0);
  const porDia: Record<string, number> = {};
  const porMes: Record<string, number> = {};
  const porAno: Record<string, number> = {};
  
  const executoresGeral: Record<string, number> = { Enfermeiro: 0, 'Equipe/Outros': 0 };
  const temposHoras: number[] = [];

  let totalProcessos = 0;
  let totalConcluidos = 0;
  let totalEmAndamento = 0;
  let totalDiagnosticosContados = 0;

  // 3. Processamento
  pacientesSnapshot.forEach((doc) => {
    const paciente = doc.data();
    const processos: ProcessoEnfermagemDoc[] = paciente.processosEnfermagem || [];
    const dataNasc = paciente.dataNascimento?.toDate();
    const sexo = paciente.sexo || 'Não Informado';

    if (processos.length > 0) {
      pacientesComProcesso.add(doc.id);
      if (sexoMap[sexo] !== undefined) sexoMap[sexo]++;
      else if (sexo !== 'Não Informado') sexoMap['Outro']++;

      if (dataNasc) {
        const idade = differenceInYears(new Date(), dataNasc);
        if (idade <= 18) idadeMap['0-18']++;
        else if (idade <= 39) idadeMap['19-39']++;
        else if (idade <= 59) idadeMap['40-59']++;
        else idadeMap['60+']++;
      }
    }

    processos.forEach((p) => {
      totalProcessos++;
      const userId = p.enfermeiroId;
      const userMeta = usuariosMap[userId];
      
      if (!rankingUserMap[userId]) {
        rankingUserMap[userId] = { 
          concluidos: 0, ativos: 0, pacientes: new Set(), tempos: [],
          diags: {}, nhbs: {}, intervs: {}, executores: {} 
        };
      }
      const uStats = rankingUserMap[userId];
      uStats.pacientes.add(doc.id);

      const dtInicio = p.dataInicio?.toDate();
      const dtConclusao = p.dataConclusao?.toDate();

      if (p.status === 'concluido') {
        totalConcluidos++;
        uStats.concluidos++;
        if (userMeta) rankingLotacaoMap[userMeta.lotacao] = (rankingLotacaoMap[userMeta.lotacao] || 0) + 1;

        if (dtInicio && dtConclusao) {
          const diff = (dtConclusao.getTime() - dtInicio.getTime()) / (1000 * 60 * 60);
          if (diff > 0 && diff < 720) {
            temposHoras.push(diff);
            uStats.tempos.push(diff);
          }
        }

        if (dtConclusao) {
          const dKey = format(dtConclusao, 'yyyy-MM-dd');
          const mKey = format(dtConclusao, 'yyyy-MM');
          const aKey = format(dtConclusao, 'yyyy');
          porDia[dKey] = (porDia[dKey] || 0) + 1;
          porMes[mKey] = (porMes[mKey] || 0) + 1;
          porAno[aKey] = (porAno[aKey] || 0) + 1;
        }
      } else {
        totalEmAndamento++;
        uStats.ativos++;
      }

      if (dtInicio) {
        porDiaSemana[dtInicio.getDay()]++;
        porHora[getHours(dtInicio)]++;
      }

      // Etapa 1: Avaliação
      const nhbs = p.avaliacao?.nhbsAfetadas || [];
      nhbs.forEach(n => {
        if (n.nhb) {
          nhbsMap[n.nhb] = (nhbsMap[n.nhb] || 0) + 1;
          uStats.nhbs[n.nhb] = (uStats.nhbs[n.nhb] || 0) + 1;
        }
      });
      const ef = p.avaliacao?.exameFisico || {};
      Object.keys(ef).forEach(key => exameFisicoMap[key] = (exameFisicoMap[key] || 0) + 1);

      // Etapa 2: Diagnóstico
      const diags = p.diagnostico?.diagnosticosSelecionados || [];
      totalDiagnosticosContados += diags.length;
      diags.forEach(d => {
        const t = d.tituloDiagnostico;
        if (t) {
          diagnosticosMap[t] = (diagnosticosMap[t] || 0) + 1;
          uStats.diags[t] = (uStats.diags[t] || 0) + 1;
          const sub = rolMap[t];
          if (sub) subsetMap[sub] = (subsetMap[sub] || 0) + 1;
        }
      });

      // Etapa 3: Planejamento
      const planejado = p.planejamento?.diagnosticosPlanejados || [];
      planejado.forEach(dp => {
        if (dp.resultadoEsperadoSelecionado) resultadosMap[dp.resultadoEsperadoSelecionado] = (resultadosMap[dp.resultadoEsperadoSelecionado] || 0) + 1;
        dp.intervencoesSelecionadas?.forEach(i => {
          if (i.acaoPrescrita) {
            intervencoesMap[i.acaoPrescrita] = (intervencoesMap[i.acaoPrescrita] || 0) + 1;
            uStats.intervs[i.acaoPrescrita] = (uStats.intervs[i.acaoPrescrita] || 0) + 1;
          }
        });
      });

      // Etapa 4: Implementação
      const impl = p.implementacao || {};
      Object.values(impl).forEach(d => {
        d.intervencoes?.forEach(i => {
          if (i.implementadoNestaConsulta && i.quemExecuta) {
            executoresGeral[i.quemExecuta]++;
            uStats.executores[i.quemExecuta] = (uStats.executores[i.quemExecuta] || 0) + 1;
            interAppliedMap[i.acaoPrescrita] = (interAppliedMap[i.acaoPrescrita] || 0) + 1;
          }
        });
      });

      // Etapa 5: Evolução (Ações Enfermeiro)
      const evol = p.evolucao?.intervencoesExecutadas || {};
      Object.values(evol).forEach(list => {
        list.forEach(acao => {
          nurseAppliedMap[acao] = (nurseAppliedMap[acao] || 0) + 1;
        });
      });
    });
  });

  // 4. Rankings de Produtividade com Raio-X
  const rankingUsuarios: UsuarioRanking[] = Object.entries(rankingUserMap)
    .map(([id, s]) => {
      const meta = usuariosMap[id];
      const tMedio = s.tempos.length > 0 ? s.tempos.reduce((a, b) => a + b, 0) / s.tempos.length : 0;
      const freqExec = Object.entries(s.executores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      
      return {
        id,
        name: meta?.nome || 'Usuário Externo',
        lotacao: meta?.lotacao || 'Sem Lotação',
        value: s.concluidos,
        raioX: {
          totalPacientes: s.pacientes.size,
          processosAtivos: s.ativos,
          processosConcluidos: s.concluidos,
          tempoMedioHoras: parseFloat(tMedio.toFixed(1)),
          topDiagnosticos: Object.entries(s.diags).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]),
          topNHBs: Object.entries(s.nhbs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]),
          topIntervencoes: Object.entries(s.intervs).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]),
          executorMaisFrequente: freqExec
        }
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 5. Cálculos Temporais Avançados
  const buildTemporal = (map: Record<string, number>, isMonthly = false, isYearly = false) => {
    const keys = Object.keys(map).sort();
    let acum = 0;
    return keys.map((k, i) => {
      acum += map[k];
      const prev = i > 0 ? map[keys[i-1]] : 0;
      return {
        name: isMonthly ? format(parseISO(k + '-01'), 'MMM/yy', { locale: ptBR }) : k,
        value: map[k],
        acumulado: acum,
        variacaoPercentual: (isMonthly || isYearly) ? calcularVariacao(map[k], prev) : 0
      };
    }).slice(-12); // Limitar a 12 meses/anos
  };

  const chartDiario: ItemTemporal[] = [];
  let acumD = 0;
  Object.keys(porDia).sort().slice(-30).forEach(d => {
    acumD += porDia[d];
    chartDiario.push({ name: format(parseISO(d), 'dd/MM'), value: porDia[d], acumulado: acumD });
  });

  const stats: EstatisticasProcessoEnfermagem = {
    schemaVersion: SCHEMA_VERSION,
    ultimaAtualizacao: serverTimestamp(),
    totalProcessos,
    totalProcessosConcluidos: totalConcluidos,
    totalProcessosEmAndamento: totalEmAndamento,
    totalPacientesAtendidos: pacientesComProcesso.size,
    taxaConclusao: totalProcessos > 0 ? Math.round((totalConcluidos / totalProcessos) * 100) : 0,

    totalDiagnosticosUnicos: Object.keys(diagnosticosMap).length,
    totalIntervencoesUnicas: Object.keys(intervencoesMap).length,
    totalNhbsUnicas: Object.keys(nhbsMap).length,
    mediaDiagnosticosPorProcesso: totalProcessos > 0 ? parseFloat((totalDiagnosticosContados / totalProcessos).toFixed(1)) : 0,
    tempoMedioProcessoHoras: parseFloat((temposHoras.reduce((a, b) => a + b, 0) / (temposHoras.length || 1)).toFixed(1)),

    diagnosticosTop: formatMapToRanking(diagnosticosMap),
    intervencoesTop: formatMapToRanking(intervencoesMap),
    resultadosTop: formatMapToRanking(resultadosMap),
    nhbsTop: formatMapToRanking(nhbsMap),

    distribuicaoStatus: [
      { name: 'Concluídos', value: totalConcluidos },
      { name: 'Em Andamento', value: totalEmAndamento },
    ],
    distribuicaoExecutores: formatMapToRanking(executoresGeral),

    perfilPacientes: {
      sexo: Object.entries(sexoMap).filter(x => x[1] > 0).map(([name, value]) => ({ name, value })),
      faixasEtarias: Object.entries(idadeMap).map(([name, value]) => ({ name, value })),
    },

    rankingUsuarios,
    rankingLotacoes: formatMapToRanking(rankingLotacaoMap),

    etapasPE: {
      avaliacao: {
        physical: formatMapToRanking(exameFisicoMap),
        nhbs: formatMapToRanking(nhbsMap)
      },
      diagnostico: {
        top: formatMapToRanking(diagnosticosMap),
        subset: formatMapToRanking(subsetMap)
      },
      planejamento: {
        results: formatMapToRanking(resultadosMap),
        prescribed: formatMapToRanking(intervencoesMap)
      },
      implementacao: {
        applied: formatMapToRanking(interAppliedMap),
        executors: formatMapToRanking(executoresGeral)
      },
      evolucao: {
        nurseApplied: formatMapToRanking(nurseAppliedMap)
      }
    },

    temporalAvancado: {
      hora: Array.from({ length: 24 }, (_, i) => ({ name: `${i}h`, value: porHora[i] })),
      diario: chartDiario,
      diaSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((name, i) => ({ name, value: porDiaSemana[i] })),
      mensal: buildTemporal(porMes, true),
      anual: buildTemporal(porAno, false, true)
    }
  };

  await setDoc(cacheDocRef, stats);
  return stats;
}

