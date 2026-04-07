import React, { useEffect, useState, useCallback } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BarChart as BarChartIcon,
  Users,
  Activity,
  Target,
  Clock,
  ArrowRight,
  ListFilter,
  MonitorSmartphone,
  MousePointerClick
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ComposedChart,
  Area,
  CartesianGrid,
  Legend,
  LabelList,
} from 'recharts';
import { obterEstatisticasUsuariosBI, EstatisticasBI, EvolucaoEntry } from '@/services/bancodados/biUsuariosDB';

// ── Paleta de Cores ──────────────────────────────────────────────────────────
const COLORS = ['#059669', '#10b981', '#34d399', '#0f766e', '#14b8a6', '#5eead4', '#0d9488'];
const STATUS_COLORS: Record<string, string> = {
  Liberado: '#059669',
  Aguardando: '#f59e0b',
  Recusado: '#e11d48',
};

// ── Custom Label para Pizza de Situação ────────────────────────────────────
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, value, name,
}: any) => {
  const radius = outerRadius + 30;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
      fontWeight="700"
    >
      {`${name}: ${value}`}
    </text>
  );
};

// ── Custom Tooltip da Evolução ─────────────────────────────────────────────
const EvolucaoTooltip = ({
  active,
  payload,
  label,
  showVariacao,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  showVariacao: boolean;
}) => {
  if (!active || !payload || !payload.length) return null;
  const novos = payload.find((p: any) => p.dataKey === 'novos')?.value ?? 0;
  const acumulado = payload.find((p: any) => p.dataKey === 'acumulado')?.value ?? 0;
  const variacao: number = payload[0]?.payload?.variacaoPercentual ?? 0;

  return (
    <div className="bg-white shadow-xl rounded-xl p-3 border border-gray-100 text-sm min-w-[160px]">
      <p className="font-black text-gray-700 mb-1">{label}</p>
      <p className="text-csae-green-700">
        <span className="font-bold">No Período:</span> {novos}
      </p>
      {acumulado > 0 && (
        <p className="text-csae-green-900">
          <span className="font-bold">Acumulado:</span> {acumulado}
        </p>
      )}
      {showVariacao && variacao !== 0 && (
        <p className={variacao > 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>
          Variação: {variacao > 0 ? '+' : ''}
          {variacao}%
        </p>
      )}
    </div>
  );
};

// ── Tipos de Filtro Temporal ───────────────────────────────────────────────
type ViewMode = 'diario' | 'semanal' | 'mensal' | 'anual';

const VIEW_LABELS: Record<ViewMode, string> = {
  diario: 'Diário',
  semanal: 'Dia da Semana',
  mensal: 'Mensal',
  anual: 'Anual',
};

// ── Componente Principal ───────────────────────────────────────────────────
const PainelEstatistico = () => {
  const [data, setData] = useState<EstatisticasBI | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('mensal');
  const [viewModeAcessos, setViewModeAcessos] = useState<ViewMode>('mensal');
  const [lotacoesOpen, setLotacoesOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await obterEstatisticasUsuariosBI();
        setData(stats);
      } catch (error) {
        console.error('Erro ao carregar dados do BI:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const evolucaoAtiva = useCallback((): EvolucaoEntry[] => {
    if (!data) return [];
    switch (viewMode) {
      case 'diario': return data.evolucaoDiaria || [];
      case 'semanal': return data.evolucaoSemanal || [];
      case 'mensal': return data.evolucaoMensal || [];
      case 'anual': return data.evolucaoAnual || [];
      default: return data.evolucaoMensal || [];
    }
  }, [data, viewMode]);

  const evolucaoAcessosAtiva = useCallback((): EvolucaoEntry[] => {
    if (!data) return [];
    switch (viewModeAcessos) {
      case 'diario': return data.evolucaoAcessosDiaria || [];
      case 'semanal': return data.evolucaoAcessosSemanal || [];
      case 'mensal': return data.evolucaoAcessosMensal || [];
      case 'anual': return data.evolucaoAcessosAnual || [];
      default: return data.evolucaoAcessosMensal || [];
    }
  }, [data, viewModeAcessos]);

  const top10Lotacoes = (data?.todasLotacoes || []).slice(0, 10);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Activity className="w-12 h-12 text-csae-green-600 animate-spin" />
          <p className="text-gray-500 font-medium animate-pulse">Consolidando inteligência de dados...</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-10 pb-20 max-w-7xl mx-auto">
        {/* ── Cabeçalho ── */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-csae-green-900 tracking-tight flex items-center gap-3">
            <BarChartIcon className="w-10 h-10 text-csae-green-600" />
            Painel Estatístico <span className="text-csae-green-500/50">BI</span>
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span>Visão global de métricas e indicadores de produção da rede municipal de Florianópolis.</span>
            {data?.ultimaAtualizacao && (
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                Atualizado:{' '}
                {data.ultimaAtualizacao.toDate
                  ? data.ultimaAtualizacao.toDate().toLocaleDateString('pt-BR')
                  : 'Agora'}
              </span>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 1: QUEM SÃO NOSSOS USUÁRIOS?                             */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-8">
          <div className="border-l-4 border-csae-green-600 pl-6 py-1">
            <h2 className="text-2xl font-black text-csae-green-900 uppercase tracking-wide">
              Quem são nossos usuários?
            </h2>
            <p className="text-gray-500 text-sm">
              Perfil demográfico e comportamento dos profissionais conectados ao portal.
            </p>
          </div>

          {/* ── LINHA 1: BIG NUMBERS (5 CARDS) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            
            {/* Card Cadastros */}
            <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-16 h-16 text-csae-green-900" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="uppercase text-[9px] font-black tracking-widest text-csae-green-600">
                  Solicitações de Cadastro
                </CardDescription>
                <CardTitle className="text-3xl font-black text-csae-green-900">
                  {data?.totalCadastrados || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-[10px] font-semibold text-csae-green-700">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Sendo <span className="font-black mx-1 text-csae-green-900">{data?.totalAprovados || 0}</span> liberados
                </div>
              </CardContent>
            </Card>

            {/* Card Total de Acessos */}
            <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <MonitorSmartphone className="w-16 h-16 text-blue-900" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="uppercase text-[9px] font-black tracking-widest text-blue-600">
                  Acessos à Plataforma
                </CardDescription>
                <CardTitle className="text-3xl font-black text-blue-900">
                  {data?.totalAcessosPlataforma || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-[10px] font-semibold text-blue-700">
                  <MousePointerClick className="w-3 h-3 mr-1" />
                  Sessões totais realizadas
                </div>
              </CardContent>
            </Card>

            {/* Card Média de Acessos */}
            <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-16 h-16 text-emerald-900" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="uppercase text-[9px] font-black tracking-widest text-emerald-600">
                  Média por Usuário
                </CardDescription>
                <CardTitle className="text-3xl font-black text-emerald-900">
                  {data?.mediaAcessosUsuario ? data.mediaAcessosUsuario.toFixed(1) : '0.0'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-[10px] font-semibold text-emerald-700">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Acessos médios / ativo
                </div>
              </CardContent>
            </Card>

            {/* Card Taxa Aprovação */}
            <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target className="w-16 h-16 text-teal-900" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="uppercase text-[9px] font-black tracking-widest text-teal-600">
                  Taxa de Aprovação
                </CardDescription>
                <CardTitle className="text-3xl font-black text-teal-900">
                  {data?.taxaAprovacao || 0}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-teal-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-500 h-full transition-all duration-1000"
                    style={{ width: `${data?.taxaAprovacao || 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Card Tempo Médio */}
            <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock className="w-16 h-16 text-indigo-900" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="uppercase text-[9px] font-black tracking-widest text-indigo-600">
                  Tempo Médio / Liberação
                </CardDescription>
                <CardTitle className="text-3xl font-black text-indigo-900">
                  {data?.tempoMedioLiberacaoHoras || 0}h
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-[10px] font-semibold text-indigo-700">
                  <Activity className="w-3 h-3 mr-1" />
                  Média de horas para ativação
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ── LINHA 2: SITUAÇÃO DOS CADASTROS (Pizza) ── */}
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Situação dos Cadastros</CardTitle>
              <CardDescription>Monitoramento de status de acesso e pendências</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
                  <Pie
                    data={data?.situacaoCadastros}
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    dataKey="valor"
                    nameKey="name"
                    labelLine
                    label={renderCustomizedLabel}
                  >
                    {data?.situacaoCadastros.map((entry, index) => (
                      <Cell
                        key={`sit-${index}`}
                        fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: any, name: any) => [val, name]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ── LINHA 3: CATEGORIA + VÍNCULO SMS (50/50) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut – Categoria */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Profissionais por Categoria</CardTitle>
                <CardDescription>Perfil técnico dos usuários ativos</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.distribuicaoFormacao}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data?.distribuicaoFormacao.map((_, index) => (
                        <Cell key={`form-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pizza – Vínculo SMS */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Vínculo SMS</CardTitle>
                <CardDescription>Proporção de profissionais na rede municipal</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.distribuicaoAtuaSMS}
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#059669" />
                      <Cell fill="#e11d48" />
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ── LINHA 4: TOP 10 LOTAÇÕES + VER TODOS ── */}
          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Top 10 Unidades (Lotação)</CardTitle>
                <CardDescription>Centros de saúde com maior engajamento</CardDescription>
              </div>
              <Dialog open={lotacoesOpen} onOpenChange={setLotacoesOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ListFilter className="w-4 h-4" />
                    Ver Todos
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Todas as Unidades de Lotação</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[480px] pr-4">
                    <TooltipProvider delayDuration={150}>
                      <div className="flex flex-col gap-2 mt-2">
                        {(data?.todasLotacoes || []).map((lot, idx) => (
                          <div
                            key={lot.name}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 hover:bg-csae-green-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-black text-gray-400 w-5 text-right">
                                {idx + 1}
                              </span>
                              
                              <Tooltip>
                                <TooltipTrigger className="cursor-help">
                                  <span className="text-sm font-semibold text-gray-800 underline decoration-dashed underline-offset-2">
                                    {lot.name}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent className="max-h-60 overflow-y-auto bg-gray-900 border-gray-800 text-white p-3 z-[99]">
                                  <div className="font-bold mb-2 pb-2 border-b border-gray-700 text-xs uppercase tracking-wider text-gray-300">
                                    {lot.name} — Usuários
                                  </div>
                                  <ul className="space-y-1.5 min-w-[200px]">
                                    {(data?.usuariosPorLotacao?.[lot.name] || []).map((u, i) => (
                                      <li key={i} className="text-xs flex justify-between gap-4 items-center">
                                        <span className="flex-1 truncate pr-3" title={u.nome}>{u.nome}</span>
                                        <span className="font-mono text-csae-green-400 font-bold whitespace-nowrap bg-gray-800 px-1.5 py-0.5 rounded">
                                          {u.acessos} {u.acessos === 1 ? 'acesso' : 'acessos'}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>

                            </div>
                            <span className="text-sm font-black text-csae-green-700 bg-csae-green-100 px-2 py-0.5 rounded-full">
                              {lot.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TooltipProvider>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="h-[440px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top10Lotacoes}
                  layout="vertical"
                  margin={{ top: 4, right: 50, left: 4, bottom: 4 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={170}
                    tick={{ fontSize: 11, fontWeight: 600 }}
                  />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 700, fill: '#059669' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ── LINHA 5: EVOLUÇÃO DE CADASTROS ── */}
          <Card className="border-none shadow-xl bg-white overflow-hidden w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold">Evolução de Cadastros</CardTitle>
                  <CardDescription>
                    Crescimento da base de dados — vista: <strong>{VIEW_LABELS[viewMode]}</strong>
                  </CardDescription>
                </div>
                {/* Filtros de período */}
                <div className="flex gap-1 flex-wrap">
                  {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-all ${
                        viewMode === mode
                          ? 'bg-csae-green-600 text-white border-csae-green-600 shadow-md'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-csae-green-400 hover:text-csae-green-700'
                      }`}
                    >
                      {VIEW_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolucaoAtiva()} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="colorAcum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    content={<EvolucaoTooltip showVariacao={viewMode === 'mensal' || viewMode === 'anual'} />}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px' }} />
                  
                  {viewMode !== 'semanal' && (
                    <Area
                      type="monotone"
                      dataKey="acumulado"
                      stroke="#059669"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAcum)"
                      name="Total Acumulado"
                    />
                  )}
                  <Bar dataKey="novos" fill="#34d399" barSize={20} name="Novos no Período" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ── LINHA 6: EVOLUÇÃO DE ACESSOS ── */}
          <Card className="border-none shadow-xl bg-white overflow-hidden w-full">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold">Evolução de Acessos</CardTitle>
                  <CardDescription>
                    Distribuição temporal dos acessos à plataforma — vista: <strong>{VIEW_LABELS[viewModeAcessos]}</strong>
                  </CardDescription>
                </div>
                {/* Filtros de período */}
                <div className="flex gap-1 flex-wrap">
                  {(Object.keys(VIEW_LABELS) as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewModeAcessos(mode)}
                      className={`text-xs px-3 py-1.5 rounded-full font-bold border transition-all ${
                        viewModeAcessos === mode
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-blue-400 hover:text-blue-700'
                      }`}
                    >
                      {VIEW_LABELS[mode]}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={evolucaoAcessosAtiva()} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="colorAcumAcessos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    angle={-35}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip
                    content={<EvolucaoTooltip showVariacao={viewModeAcessos === 'mensal' || viewModeAcessos === 'anual'} />}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '12px' }} />
                  
                  {viewModeAcessos !== 'semanal' && (
                    <Area
                      type="monotone"
                      dataKey="acumulado"
                      stroke="#2563eb"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAcumAcessos)"
                      name="Acessos Acumulados"
                    />
                  )}
                  <Bar dataKey="novos" fill="#60a5fa" barSize={20} name="Acessos no Período" radius={[4, 4, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECTION 2: O QUE A ENFERMAGEM ESTÁ PRODUZINDO? (FASE 2)          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-8 opacity-50 grayscale pointer-events-none">
          <div className="border-l-4 border-blue-600 pl-6 py-1">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">
              O que a enfermagem de Florianópolis está produzindo?
            </h2>
            <p className="text-gray-500 text-sm">
              Métricas clínicas e produção sistematizada da rede municipal.
            </p>
          </div>
          <Card className="border-dashed border-2 border-gray-300 shadow-none bg-gray-50">
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-gray-400">
                <Target className="w-12 h-12" />
                <p className="font-bold uppercase tracking-widest text-xs">
                  Módulo em Desenvolvimento — Fase 2
                </p>
                <p className="text-xs max-w-xs text-center">
                  A agregação de dados clínicos (diagnósticos e intervenções) está sendo consolidada pela engenharia.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default PainelEstatistico;
