import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { format, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ── Tipos Exportados ──────────────────────────────────────────────────────────

export interface ItemRanking {
  name: string;
  value: number;
}

export interface ItemTemporal {
  name: string;
  value: number;
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

  // Temporal
  chartDiaSemana: ItemTemporal[];
  chartHora: ItemTemporal[];
  chartMensal: ItemTemporal[];
}

// ── Utilitário interno ────────────────────────────────────────────────────────

function formatMapToRanking(map: Record<string, number>, limit = 10): ItemRanking[] {
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

// ── Tipos Internos (Firestore) ────────────────────────────────────────────────

interface FirestoreTimestamp {
  toDate: () => Date;
}

interface ProcessoEnfermagemDoc {
  status: 'em_andamento' | 'concluido';
  dataInicio: FirestoreTimestamp;
  dataConclusao?: FirestoreTimestamp;
  enfermeiroId: string;
  avaliacao?: {
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
}

// ── Função Principal ─────────────────────────────────────────────────────────

export async function obterEstatisticasProcessoEnfermagem(): Promise<EstatisticasProcessoEnfermagem> {
  const snapshot = await getDocs(collection(db, 'pacientesProcessoEnfermagem'));

  // Acumuladores
  const pacientesComProcesso = new Set<string>();
  const diagnosticosMap: Record<string, number> = {};
  const intervencoesMap: Record<string, number> = {};
  const resultadosMap: Record<string, number> = {};
  const nhbsMap: Record<string, number> = {};
  const porDiaSemana = [0, 0, 0, 0, 0, 0, 0];
  const porHora: number[] = Array(24).fill(0);
  // porMes usa chave 'yyyy-MM' para ordenação cronológica correta
  const porMes: Record<string, { label: string; value: number }> = {};
  const executoresMap: Record<string, number> = { Enfermeiro: 0, 'Equipe/Outros': 0 };
  const temposHoras: number[] = [];

  let totalProcessos = 0;
  let totalConcluidos = 0;
  let totalEmAndamento = 0;
  let totalDiagnosticosContados = 0;

  snapshot.forEach((doc) => {
    const paciente = doc.data();
    const processos: ProcessoEnfermagemDoc[] = paciente.processosEnfermagem || [];

    if (processos.length > 0) {
      pacientesComProcesso.add(doc.id);
    }

    processos.forEach((p) => {
      totalProcessos++;

      // ── Status ──
      if (p.status === 'concluido') {
        totalConcluidos++;

        // Tempo de duração (apenas processos concluídos)
        if (p.dataInicio && p.dataConclusao) {
          try {
            const inicio = p.dataInicio.toDate();
            const fim = p.dataConclusao.toDate();
            const diffHoras = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);
            // Aceitar entre 1 minuto (0.017h) e 30 dias (720h) para evitar outliers
            if (diffHoras > 0.017 && diffHoras < 720) {
              temposHoras.push(diffHoras);
            }
          } catch (_) {
            /* ignora timestamps inválidos */
          }
        }

        // Evolução mensal (apenas concluídos têm dataConclusao confiável)
        if (p.dataConclusao) {
          try {
            const dt = p.dataConclusao.toDate();
            const chaveOrdenacao = format(dt, 'yyyy-MM');
            const labelExibicao = format(dt, "MMM'/'yy", { locale: ptBR });
            if (!porMes[chaveOrdenacao]) {
              porMes[chaveOrdenacao] = { label: labelExibicao, value: 0 };
            }
            porMes[chaveOrdenacao].value++;
          } catch (_) {
            /* ignora timestamps inválidos */
          }
        }
      } else {
        totalEmAndamento++;
      }

      // ── Temporal por dataInicio ──
      if (p.dataInicio) {
        try {
          const dt = p.dataInicio.toDate();
          porDiaSemana[dt.getDay()]++;
          porHora[getHours(dt)]++;
        } catch (_) {
          /* ignora */
        }
      }

      // ── Diagnósticos ──
      const diagsSelecionados = p.diagnostico?.diagnosticosSelecionados || [];
      totalDiagnosticosContados += diagsSelecionados.length;
      diagsSelecionados.forEach((d) => {
        const titulo: string = d.tituloDiagnostico;
        if (titulo) diagnosticosMap[titulo] = (diagnosticosMap[titulo] || 0) + 1;
      });

      // ── NHBs Afetadas ──
      const nhbs = p.avaliacao?.nhbsAfetadas || [];
      nhbs.forEach((n) => {
        if (n.nhb) nhbsMap[n.nhb] = (nhbsMap[n.nhb] || 0) + 1;
      });

      // ── Planejamento: resultados + intervenções ──
      const planejados = p.planejamento?.diagnosticosPlanejados || [];
      planejados.forEach((dp) => {
        if (dp.resultadoEsperadoSelecionado) {
          const r: string = dp.resultadoEsperadoSelecionado;
          resultadosMap[r] = (resultadosMap[r] || 0) + 1;
        }
        const intervencoes = dp.intervencoesSelecionadas || [];
        intervencoes.forEach((i) => {
          if (i.acaoPrescrita) {
            intervencoesMap[i.acaoPrescrita] = (intervencoesMap[i.acaoPrescrita] || 0) + 1;
          }
        });
      });

      // ── Executores ──
      const implementacao = p.implementacao || {};
      Object.values(implementacao).forEach((diag) => {
        const intervs = diag.intervencoes || [];
        intervs.forEach((int) => {
          if (int.implementadoNestaConsulta && int.quemExecuta) {
            const exec: string = int.quemExecuta;
            executoresMap[exec] = (executoresMap[exec] || 0) + 1;
          }
        });
      });
    });
  });

  // ── Pós-processamento ──────────────────────────────────────────────────────

  const tempoMedioHoras =
    temposHoras.length > 0
      ? temposHoras.reduce((a, b) => a + b, 0) / temposHoras.length
      : 0;

  const chartMensalOrdenado = Object.entries(porMes)
    .sort(([a], [b]) => a.localeCompare(b)) // 'yyyy-MM' ordena lexicograficamente = cronologicamente
    .map(([, entry]) => ({ name: entry.label, value: entry.value }));

  return {
    totalProcessos,
    totalProcessosConcluidos: totalConcluidos,
    totalProcessosEmAndamento: totalEmAndamento,
    totalPacientesAtendidos: pacientesComProcesso.size,
    taxaConclusao:
      totalProcessos > 0 ? Math.round((totalConcluidos / totalProcessos) * 100) : 0,

    totalDiagnosticosUnicos: Object.keys(diagnosticosMap).length,
    totalIntervencoesUnicas: Object.keys(intervencoesMap).length,
    totalNhbsUnicas: Object.keys(nhbsMap).length,
    mediaDiagnosticosPorProcesso:
      totalProcessos > 0
        ? parseFloat((totalDiagnosticosContados / totalProcessos).toFixed(1))
        : 0,
    tempoMedioProcessoHoras: parseFloat(tempoMedioHoras.toFixed(1)),

    diagnosticosTop: formatMapToRanking(diagnosticosMap),
    intervencoesTop: formatMapToRanking(intervencoesMap),
    resultadosTop: formatMapToRanking(resultadosMap),
    nhbsTop: formatMapToRanking(nhbsMap),

    distribuicaoStatus: [
      { name: 'Concluídos', value: totalConcluidos },
      { name: 'Em Andamento', value: totalEmAndamento },
    ],
    distribuicaoExecutores: [
      { name: 'Enfermeiro', value: executoresMap['Enfermeiro'] || 0 },
      { name: 'Equipe/Outros', value: executoresMap['Equipe/Outros'] || 0 },
    ],

    chartDiaSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((name, i) => ({
      name,
      value: porDiaSemana[i],
    })),
    chartHora: Array.from({ length: 24 }, (_, i) => ({
      name: `${i}h`,
      value: porHora[i],
    })),
    chartMensal: chartMensalOrdenado,
  };
}
