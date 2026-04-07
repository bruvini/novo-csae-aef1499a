
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface EstatisticasBI {
  ultimaAtualizacao: any;
  totalCadastrados: number;
  taxaAprovacao: number;
  tempoMedioLiberacaoHoras: number;
  distribuicaoFormacao: { name: string; value: number }[];
  distribuicaoAtuaSMS: { name: string; value: number }[];
  topLotacoes: { name: string; value: number }[];
  distribuicaoBairros: { name: string; value: number }[];
  evolucaoCadastros: { name: string; novos: number; acumulado: number }[];
  niveisAcesso: { name: string; value: number }[];
  situacaoCadastros: { name: string; valor: number }[];
}

export async function obterEstatisticasUsuariosBI(): Promise<EstatisticasBI | null> {
  const cacheDocRef = doc(db, 'estatisticas', 'painel_usuarios');
  
  try {
    // 1. Tentar ler do cache
    const cacheSnap = await getDoc(cacheDocRef);
    if (cacheSnap.exists()) {
      const data = cacheSnap.data();
      const ultimaAtualizacao = data.ultimaAtualizacao?.toDate();
      const agora = new Date();
      const seisHorasEmMs = 6 * 60 * 60 * 1000;

      if (ultimaAtualizacao && (agora.getTime() - ultimaAtualizacao.getTime() < seisHorasEmMs)) {
        console.log("BI: Retornando estatísticas do cache Firestore (Custo: 1 leitura)");
        return data as EstatisticasBI;
      }
    }
  } catch (error) {
    console.error("Erro ao ler cache de BI:", error);
  }

  // 2. Se não houver cache válido, recalcular tudo (client-side aggregation)
  console.warn("BI: Cache expirado ou inexistente. Recalculando métricas globais...");
  
  try {
    const usuariosSnap = await getDocs(collection(db, 'usuarios'));
    const totalDocs = usuariosSnap.size;
    
    if (totalDocs === 0) return null;

    let liberados = 0;
    let somaHorasLiberacao = 0;
    let countComDataAprovacao = 0;

    const mapFormacao: Record<string, number> = {};
    const mapAtuaSMS: Record<string, number> = { 'Sim': 0, 'Não': 0 };
    const mapLotacao: Record<string, number> = {};
    const mapBairro: Record<string, number> = {};
    const mapEvolucao: Record<string, number> = {};
    const mapNiveis: Record<string, number> = { 'Admin': 0, 'Gestor': 0, 'Padrão': 0 };
    const mapSituacao: Record<string, number> = { 'Liberado': 0, 'Aguardando': 0, 'Recusado': 0 };

    usuariosSnap.forEach(uDoc => {
      const data = uDoc.data();
      
      // Status e Aprovação
      const status = (data.statusAcesso || '').toLowerCase().trim();
      if (status === 'liberado' || status === 'aprovado') {
        liberados++;
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
      const lot = data.dadosProfissionais?.lotacao || 'Não Informado';
      mapLotacao[lot] = (mapLotacao[lot] || 0) + 1;

      // Bairro
      const bairro = data.dadosPessoais?.bairro || 'Não Informado';
      mapBairro[bairro] = (mapBairro[bairro] || 0) + 1;

      // Níveis de Acesso
      if (data.ehAdmin) mapNiveis['Admin']++;
      else if (data.gestorConteudos) mapNiveis['Gestor']++;
      else mapNiveis['Padrão']++;

      // Evolução (Ano-Mês)
      if (data.dataCadastro) {
        const date = data.dataCadastro.toDate();
        const mesAno = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        mapEvolucao[mesAno] = (mapEvolucao[mesAno] || 0) + 1;
      }
    });

    // Formatação para Recharts
    const stats: EstatisticasBI = {
      ultimaAtualizacao: serverTimestamp(),
      totalCadastrados: totalDocs,
      taxaAprovacao: Number(((liberados / totalDocs) * 100).toFixed(1)),
      tempoMedioLiberacaoHoras: countComDataAprovacao > 0 ? Number((somaHorasLiberacao / countComDataAprovacao).toFixed(1)) : 0,
      distribuicaoFormacao: Object.entries(mapFormacao).map(([name, value]) => ({ name, value })),
      distribuicaoAtuaSMS: Object.entries(mapAtuaSMS).map(([name, value]) => ({ name, value })),
      topLotacoes: Object.entries(mapLotacao)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value })),
      distribuicaoBairros: Object.entries(mapBairro)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([name, value]) => ({ name, value })),
      evolucaoCadastros: Object.entries(mapEvolucao)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .reduce((acc, [mes, novos]) => {
          const acumulado = (acc.length > 0 ? acc[acc.length - 1].acumulado : 0) + novos;
          acc.push({ name: mes, novos, acumulado });
          return acc;
        }, [] as any[]),
      niveisAcesso: Object.entries(mapNiveis).map(([name, value]) => ({ name, value })),
      situacaoCadastros: Object.entries(mapSituacao).map(([name, valor]) => ({ name, valor }))
    };

    // 3. Salvar no cache
    await setDoc(cacheDocRef, stats);
    return stats;

  } catch (error) {
    console.error("Erro ao gerar estatísticas de BI:", error);
    return null;
  }
}
