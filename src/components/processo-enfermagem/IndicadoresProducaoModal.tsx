import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';
import { 
  ClipboardList, 
  Activity, 
  Target, 
  FileText, 
  Calendar, 
  Clock, 
  User,
  TrendingUp,
  Layout
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IndicadoresProducaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IndicadoresProducaoModal: React.FC<IndicadoresProducaoModalProps> = ({
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

  useEffect(() => {
    if (open && user) {
      loadStats();
    }
  }, [open, user]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'pacientesProcessoEnfermagem'),
        where('uidUsuario', '==', user?.uid)
      );
      const snapshot = await getDocs(q);
      
      const stats = {
        totalProcessos: 0,
        diagnosticos: {} as any,
        resultados: {} as any,
        intervencoes: {} as any,
        nhbs: {} as any,
        protocolos: {} as any,
        pacientes: [] as any[],
        porDiaSemana: [0, 0, 0, 0, 0, 0, 0], // D, S, T, Q, Q, S, S
        porHora: Array(24).fill(0),
        porMes: {} as any
      };

      snapshot.forEach((doc) => {
        const paciente = doc.data();
        const processos = paciente.processosEnfermagem || [];
        
        stats.pacientes.push({
          nome: paciente.nomeCompleto,
          total: processos.length
        });

        processos.forEach((p: any) => {
          stats.totalProcessos++;
          
          // Diagnósticos e Protocolos
          p.diagnostico?.diagnosticosSelecionados?.forEach((d: any) => {
            stats.diagnosticos[d.tituloDiagnostico] = (stats.diagnosticos[d.tituloDiagnostico] || 0) + 1;
            
            // Tentar inferir protocolos/subconjuntos
            d.subconjuntos?.forEach((s: any) => {
                const prot = s.tituloSubconjunto || s.tipoSubconjunto;
                if (prot) {
                   stats.protocolos[prot] = (stats.protocolos[prot] || 0) + 1;
                }
            });
          });

          // Resultados
          p.planejamento?.diagnosticosPlanejados?.forEach((dp: any) => {
             if (dp.resultadoEsperadoSelecionado) {
                stats.resultados[dp.resultadoEsperadoSelecionado] = (stats.resultados[dp.resultadoEsperadoSelecionado] || 0) + 1;
             }
             dp.intervencoesSelecionadas?.forEach((i: any) => {
                stats.intervencoes[i.acaoPrescrita] = (stats.intervencoes[i.acaoPrescrita] || 0) + 1;
             });
          });

          // NHBs
          p.avaliacao?.nhbsAfetadas?.forEach((n: any) => {
             const nhbNome = n.nhb;
             if (nhbNome) {
               stats.nhbs[nhbNome] = (stats.nhbs[nhbNome] || 0) + 1;
             }
          });

          // Temporal
          if (p.dataInicio) {
            const dt = p.dataInicio.toDate();
            stats.porDiaSemana[dt.getDay()]++;
            stats.porHora[getHours(dt)]++;
          }

          if (p.dataConclusao && p.status === 'concluido') {
             const dtc = p.dataConclusao.toDate();
             const mesAno = format(dtc, 'MMM/yy', { locale: ptBR });
             stats.porMes[mesAno] = (stats.porMes[mesAno] || 0) + 1;
          }
        });
      });

      // Formatar para exibição
      const formatMapToSortedList = (map: any) => 
        Object.entries(map)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => (b.value as number) - (a.value as number))
          .slice(0, 10);

      setData({
        ...stats,
        diagnosticosTop: formatMapToSortedList(stats.diagnosticos),
        resultadosTop: formatMapToSortedList(stats.resultados),
        intervencoesTop: formatMapToSortedList(stats.intervencoes),
        nhbsTop: formatMapToSortedList(stats.nhbs),
        protocolosTop: formatMapToSortedList(stats.protocolos),
        pacientesTop: stats.pacientes.sort((a, b) => b.total - a.total).slice(0, 10),
        chartDiaSemana: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((name, i) => ({
          name, 
          value: stats.porDiaSemana[i]
        })),
        chartHora: stats.porHora.map((value, i) => ({
           name: `${i}h`,
           value
        })),
        chartMes: Object.entries(stats.porMes).map(([name, value]) => ({ name, value }))
      });
    } catch (error) {
      console.error('Erro ao carregar indicadores:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatItem = ({ label, value, icon: Icon, colorClass }: any) => (
    <Card className={`overflow-hidden border-none shadow-md ${colorClass}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="w-8 h-8 opacity-20" />
      </CardContent>
    </Card>
  );

  const TopList = ({ title, list, icon: Icon }: any) => (
    <div className="space-y-3">
      <h4 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h4>
      <div className="space-y-2">
        {list?.length > 0 ? (
          list.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 group hover:bg-white hover:shadow-sm transition-all">
              <span className="text-xs font-medium text-gray-800 line-clamp-1 flex-1 pr-2">{item.name || item.nome}</span>
              <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {item.value || item.total}
              </span>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-400 italic">Sem registros suficientes</p>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="p-6 bg-white border-b shadow-sm shrink-0">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                   <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                   <DialogTitle className="text-2xl font-bold text-slate-800">Indicadores de Produção</DialogTitle>
                   <p className="text-sm text-slate-500">Relatório analítico de Sistematização da Assistência</p>
                </div>
             </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="text-slate-500 font-medium anim-pulse">Processando dados analíticos...</p>
             </div>
          ) : data ? (
            <div className="space-y-8 pb-10">
              {/* KPIs de Produção */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatItem 
                  label="Processos Realizados" 
                  value={data.totalProcessos} 
                  icon={ClipboardList} 
                  colorClass="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
                />
                <StatItem 
                   label="Pacientes Atendidos" 
                   value={data.pacientes.length} 
                   icon={User} 
                   colorClass="bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                />
                <StatItem 
                   label="Diagnósticos Únicos" 
                   value={Object.keys(data.diagnosticos).length} 
                   icon={Activity} 
                   colorClass="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                />
                <StatItem 
                   label="Protocolos Aplicados" 
                   value={Object.keys(data.protocolos).length} 
                   icon={Layout} 
                   colorClass="bg-gradient-to-br from-amber-500 to-amber-600 text-white"
                />
              </div>

              {/* Gráficos de Distribuição Temporal */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          Processos por Dia da Semana
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="h-48">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.chartDiaSemana}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                             <YAxis fontSize={10} axisLine={false} tickLine={false} />
                             <RechartsTooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f1f5f9' }}
                             />
                             <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                          </BarChart>
                       </ResponsiveContainer>
                    </CardContent>
                 </Card>

                 <Card>
                    <CardHeader className="pb-2">
                       <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          Distribuição por Horário (Início)
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="h-48">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.chartHora}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis dataKey="name" fontSize={9} axisLine={false} tickLine={false} interval={2} />
                             <YAxis fontSize={10} axisLine={false} tickLine={false} />
                             <RechartsTooltip />
                             <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                       </ResponsiveContainer>
                    </CardContent>
                 </Card>
              </div>

              {/* Listas de Top Desempenho */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-white p-6 rounded-xl border shadow-sm">
                <TopList title="Top 10 Diagnósticos" list={data.diagnosticosTop} icon={Activity} />
                <TopList title="Top 10 Resultados" list={data.resultadosTop} icon={Target} />
                <TopList title="Top 10 Intervenções" list={data.intervencoesTop} icon={FileText} />
                <TopList title="NHBs mais Afetadas" list={data.nhbsTop} icon={Activity} />
                <TopList title="Protocolos Utilizados" list={data.protocolosTop} icon={Layout} />
                <TopList title="Pacientes / Evoluções" list={data.pacientesTop} icon={User} />
              </div>

              {/* Evolução de Conclusão Mensal */}
              <Card>
                 <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-emerald-600" />
                       Conclusões de Processos de Enfermagem
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="h-64">
                    {data.chartMes.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.chartMes}>
                             <XAxis dataKey="name" fontSize={10} />
                             <YAxis fontSize={10} />
                             <RechartsTooltip />
                             <Bar dataKey="value" fill="#10b981" barSize={50} radius={[4, 4, 0, 0]}>
                                {data.chartMes.map((_: any, index: number) => (
                                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    ) : (
                       <div className="flex items-center justify-center h-full text-slate-400 italic">
                          Dados insuficientes para gerar histórico mensal
                       </div>
                    )}
                 </CardContent>
              </Card>

            </div>
          ) : (
            <div className="text-center p-12">
               <ClipboardList className="w-16 h-16 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-500">Nenhum dado produtivo encontrado para gerar o relatório.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default IndicadoresProducaoModal;
