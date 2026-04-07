
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// Incrementar sempre que o schema dos dados mudar
const SCHEMA_VERSION = 2;

export interface EvolucaoEntry {
  name: string;
  novos: number;
  acumulado: number;
  variacaoPercentual?: number;
}

export interface EstatisticasBI {
  schemaVersion?: number;
  ultimaAtualizacao: any;
  totalCadastrados: number;
  totalAprovados: number;
  taxaAprovacao: number;
  tempoMedioLiberacaoHoras: number;
  distribuicaoFormacao: { name: string; value: number }[];
  distribuicaoAtuaSMS: { name: string; value: number }[];
  todasLotacoes: { name: string; value: number }[];
  situacaoCadastros: { name: string; valor: number }[];
  evolucaoDiaria: EvolucaoEntry[];
  evolucaoSemanal: EvolucaoEntry[];
  evolucaoMensal: EvolucaoEntry[];
  evolucaoAnual: EvolucaoEntry[];
}

const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function calcVariacao(atual: number, anterior: number): number {
  if (anterior === 0) return 0;
  return Number((((atual - anterior) / anterior) * 100).toFixed(1));
}

function calcAcumuladoComVariacao(entries: { key: string; novos: number }[]): EvolucaoEntry[] {
  let acum = 0;
  return entries.map((e, i) => {
    acum += e.novos;
    const anterior = i > 0 ? entries[i - 1].novos : 0;
    return {
      name: e.key,
      novos: e.novos,
      acumulado: acum,
      variacaoPercentual: i > 0 ? calcVariacao(e.novos, anterior) : 0,
    };
  });
}

export async function obterEstatisticasUsuariosBI(): Promise<EstatisticasBI | null> {
  const cacheDocRef = doc(db, 'estatisticas', 'painel_usuarios');

  try {
    const cacheSnap = await getDoc(cacheDocRef);
    if (cacheSnap.exists()) {
      const data = cacheSnap.data();
      const ultimaAtualizacao = data.ultimaAtualizacao?.toDate();
      const agora = new Date();
      const seisHorasEmMs = 6 * 60 * 60 * 1000;

      // Validar schema version e campos obrigatórios
      const cacheValido =
        data.schemaVersion === SCHEMA_VERSION &&
        ultimaAtualizacao &&
        agora.getTime() - ultimaAtualizacao.getTime() < seisHorasEmMs &&
        Array.isArray(data.todasLotacoes) &&
        Array.isArray(data.evolucaoMensal) &&
        typeof data.totalAprovados === 'number';

      if (cacheValido) {
        console.log('BI: Cache válido (schema v' + SCHEMA_VERSION + '). Custo: 1 leitura.');
        return data as EstatisticasBI;
      } else {
        console.warn('BI: Cache desatualizado (schema mismatch ou campos faltando). Recalculando...');
        await deleteDoc(cacheDocRef).catch(() => {});
      }
    }
  } catch (error) {
    console.error('Erro ao ler cache de BI:', error);
  }

  console.warn('BI: Cache expirado ou inexistente. Recalculando métricas globais...');

  try {
    const usuariosSnap = await getDocs(collection(db, 'usuarios'));
    const totalDocs = usuariosSnap.size;
    if (totalDocs === 0) return null;

    let aprovados = 0;
    let somaHorasLiberacao = 0;
    let countComDataAprovacao = 0;

    const mapFormacao: Record<string, number> = {};
    const mapAtuaSMS: Record<string, number> = { Sim: 0, Não: 0 };
    const mapLotacao: Record<string, number> = {};
    const mapSituacao: Record<string, number> = { Liberado: 0, Aguardando: 0, Recusado: 0 };

    // Mapas para séries temporais
    const mapDiario: Record<string, number> = {};
    const mapSemanal: Record<string, number> = {};
    const mapMensal: Record<string, number> = {};
    const mapAnual: Record<string, number> = {};

    usuariosSnap.forEach((uDoc) => {
      const data = uDoc.data();

      // Status
      const status = (data.statusAcesso || '').toLowerCase().trim();
      if (status === 'liberado' || status === 'aprovado') {
        aprovados++;
        mapSituacao['Liberado']++;
      } else if (status === 'recusado' || status === 'rejeitado') {
        mapSituacao['Recusado']++;
      } else {
        mapSituacao['Aguardando']++;
      }

      // Tempo de liberação
      if (data.dataCadastro && data.dataAprovacao) {
        const dCad = data.dataCadastro.toDate();
        const dAprov = data.dataAprovacao.toDate();
        const diffHoras = (dAprov.getTime() - dCad.getTime()) / (1000 * 60 * 60);
        if (diffHoras >= 0) {
          somaHorasLiberacao += diffHoras;
          countComDataAprovacao++;
        }
      }

      // Formação
      const form = data.dadosProfissionais?.formacao || 'Não Informado';
      mapFormacao[form] = (mapFormacao[form] || 0) + 1;

      // Atua SMS
      const atua = data.dadosProfissionais?.atuaSMS === true ? 'Sim' : 'Não';
      mapAtuaSMS[atua]++;

      // Lotação
      const lot = (data.dadosProfissionais?.lotacao || 'Não Informado').trim();
      mapLotacao[lot] = (mapLotacao[lot] || 0) + 1;

      // Evolução temporal
      if (data.dataCadastro) {
        const date: Date = data.dataCadastro.toDate();

        // Diária: dd/MM/yyyy
        const dia = date.getDate().toString().padStart(2, '0');
        const mes = (date.getMonth() + 1).toString().padStart(2, '0');
        const ano = date.getFullYear().toString();
        const keyDiario = `${dia}/${mes}/${ano}`;
        mapDiario[keyDiario] = (mapDiario[keyDiario] || 0) + 1;

        // Semanal: Dia da semana PT-BR
        const keySemanal = DIAS_SEMANA[date.getDay()];
        mapSemanal[keySemanal] = (mapSemanal[keySemanal] || 0) + 1;

        // Mensal: MM/yyyy
        const keyMensal = `${mes}/${ano}`;
        mapMensal[keyMensal] = (mapMensal[keyMensal] || 0) + 1;

        // Anual: yyyy
        mapAnual[ano] = (mapAnual[ano] || 0) + 1;
      }
    });

    // --- Séries Temporais ---
    // Diária (ordenar cronologicamente)
    const evolucaoDiaria = calcAcumuladoComVariacao(
      Object.entries(mapDiario)
        .sort((a, b) => {
          const [da, ma, ya] = a[0].split('/');
          const [db2, mb, yb] = b[0].split('/');
          return new Date(`${ya}-${ma}-${da}`).getTime() - new Date(`${yb}-${mb}-${db2}`).getTime();
        })
        .map(([key, novos]) => ({ key, novos }))
    );

    // Semanal (ordenar por índice do dia)
    const evolucaoSemanal = DIAS_SEMANA.filter((d) => mapSemanal[d] !== undefined).map((dia) => ({
      name: dia,
      novos: mapSemanal[dia] || 0,
      acumulado: 0,
      variacaoPercentual: 0,
    }));

    // Mensal (ordenar cronologicamente MM/YYYY)
    const evolucaoMensal = calcAcumuladoComVariacao(
      Object.entries(mapMensal)
        .sort((a, b) => {
          const [ma, ya] = a[0].split('/');
          const [mb, yb] = b[0].split('/');
          return new Date(`${ya}-${ma}-01`).getTime() - new Date(`${yb}-${mb}-01`).getTime();
        })
        .map(([key, novos]) => ({ key, novos }))
    );

    // Anual (ordenar cronologicamente)
    const evolucaoAnual = calcAcumuladoComVariacao(
      Object.entries(mapAnual)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([key, novos]) => ({ key, novos }))
    );

    const todasLotacoes = Object.entries(mapLotacao)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    const stats: EstatisticasBI = {
      schemaVersion: SCHEMA_VERSION,
      ultimaAtualizacao: serverTimestamp(),
      totalCadastrados: totalDocs,
      totalAprovados: aprovados,
      taxaAprovacao: Number(((aprovados / totalDocs) * 100).toFixed(1)),
      tempoMedioLiberacaoHoras:
        countComDataAprovacao > 0
          ? Number((somaHorasLiberacao / countComDataAprovacao).toFixed(1))
          : 0,
      distribuicaoFormacao: Object.entries(mapFormacao).map(([name, value]) => ({ name, value })),
      distribuicaoAtuaSMS: Object.entries(mapAtuaSMS).map(([name, value]) => ({ name, value })),
      todasLotacoes,
      situacaoCadastros: Object.entries(mapSituacao).map(([name, valor]) => ({ name, valor })),
      evolucaoDiaria,
      evolucaoSemanal,
      evolucaoMensal,
      evolucaoAnual,
    };

    // Salvar cache (sem serverTimestamp em arrays aninhados — só no root)
    await setDoc(cacheDocRef, stats);
    return stats;
  } catch (error) {
    console.error('Erro ao gerar estatísticas de BI:', error);
    return null;
  }
}
