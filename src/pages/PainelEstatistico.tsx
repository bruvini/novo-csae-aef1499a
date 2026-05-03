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
  MousePointerClick,
  CheckCircle2,
  ClipboardList,
  Stethoscope,
  HeartPulse,
  Timer,
  TrendingUp,
  Layers,
  Pill,
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
import {
  obterEstatisticasProcessoEnfermagem,
  EstatisticasProcessoEnfermagem,
} from '@/services/bancodados/biProcessosEnfermagemDB';

// ── Paleta de Cores ──────────────────────────────────────────────────────────
const COLORS = ['#059669', '#10b981', '#34d399', '#0f766e', '#14b8a6', '#5eead4', '#0d9488'];
const STATUS_COLORS: Record<string, string> = {
  Liberado: '#059669',
  Aguardando: '#f59e0b',
  Recusado: '#e11d48',
};

// ── Paleta da Seção 2 (Produção Clínica) ─────────────────────────────────
const COLORS_PROD = ['#6366f1', '#8b5cf6', '#a78bfa', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'];
const STATUS_PROCESSO_COLORS: Record<string, string> = {
  'Concluídos': '#059669',
  'Em Andamento': '#f59e0b',
};
const EXECUTOR_COLORS: Record<string, string> = {
  'Enfermeiro': '#6366f1',
  'Equipe/Outros': '#14b8a6',
};

// ── Custom Label para Pizza de Situação ────────────────────────────────────
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, value, name,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  value: number;
  name: string;
}) => {
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
  payload?: Array<{
    dataKey: string;
    value: number;
    payload: { variacaoPercentual?: number };
  }>;
  label?: string;
  showVariacao: boolean;
}) => {
  if (!active || !payload || !payload.length) return null;
  const novos = payload.find((p) => p.dataKey === 'novos')?.value ?? 0;
  const acumulado = payload.find((p) => p.dataKey === 'acumulado')?.value ?? 0;
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
  const [dataProcessos, setDataProcessos] = useState<EstatisticasProcessoEnfermagem | null>(null);
  const [loadingProcessos, setLoadingProcessos] = useState(true);

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

  useEffect(() => {
    const fetchProcessos = async () => {
      try {
        const stats = await obterEstatisticasProcessoEnfermagem();
        setDataProcessos(stats);
      } catch (error) {
        console.error('Erro ao carregar dados de produção:', error);
      } finally {
        setLoadingProcessos(false);
      }
    };
    fetchProcessos();
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
                    formatter={(val: number, name: string) => [val, name]}
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
        {/* SECTION 2: O QUE A ENFERMAGEM ESTÁ PRODUZINDO?                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-8">
          {/* ── Cabeçalho da Seção 2 ── */}
          <div className="border-l-4 border-indigo-600 pl-6 py-1">
            <h2 className="text-2xl font-black text-indigo-900 uppercase tracking-wide">
              O que a enfermagem de Florianópolis está produzindo?
            </h2>
            <p className="text-gray-500 text-sm">
              Indicadores clínicos e operacionais do Processo de Enfermagem na rede municipal.
            </p>
          </div>

          {loadingProcessos ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <HeartPulse className="w-10 h-10 text-indigo-500 animate-pulse" />
              <p className="text-gray-400 font-medium text-sm animate-pulse">
                Consolidando dados clínicos...
              </p>
            </div>
          ) : !dataProcessos || dataProcessos.totalProcessos === 0 ? (
            <Card className="border-dashed border-2 border-indigo-200 shadow-none bg-indigo-50/50">
              <CardContent className="h-[260px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-indigo-300">
                  <ClipboardList className="w-12 h-12" />
                  <p className="font-bold uppercase tracking-widest text-xs text-indigo-400">
                    Nenhum processo de enfermagem registrado ainda
                  </p>
                  <p className="text-xs max-w-xs text-center text-indigo-400">
                    Assim que os enfermeiros registrarem processos na ferramenta, os indicadores aparecerão aqui.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* ── LINHA 1: KPIs PRINCIPAIS (5 CARDS) ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">

                {/* Total de Processos */}
                <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <ClipboardList className="w-16 h-16 text-indigo-900" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardDescription className="uppercase text-[9px] font-black tracking-widest text-indigo-600">
                      Total de Processos
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-indigo-900">
                      {dataProcessos.totalProcessos}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-[10px] font-semibold text-indigo-700">
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Realizados na plataforma
                    </div>
                  </CardContent>
                </Card>

                {/* Concluídos */}
                <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle2 className="w-16 h-16 text-emerald-900" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardDescription className="uppercase text-[9px] font-black tracking-widest text-emerald-600">
                      Processos Concluídos
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-emerald-900">
                      {dataProcessos.totalProcessosConcluidos}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-1000"
                        style={{ width: `${dataProcessos.taxaConclusao}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Em Andamento */}
                <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity className="w-16 h-16 text-amber-900" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardDescription className="uppercase text-[9px] font-black tracking-widest text-amber-600">
                      Em Andamento
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-amber-900">
                      {dataProcessos.totalProcessosEmAndamento}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-[10px] font-semibold text-amber-700">
                      <Activity className="w-3 h-3 mr-1" />
                      Processos ativos agora
                    </div>
                  </CardContent>
                </Card>

                {/* Pacientes Atendidos */}
                <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users className="w-16 h-16 text-violet-900" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardDescription className="uppercase text-[9px] font-black tracking-widest text-violet-600">
                      Pacientes Atendidos
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-violet-900">
                      {dataProcessos.totalPacientesAtendidos}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-[10px] font-semibold text-violet-700">
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Com pelo menos 1 processo
                    </div>
                  </CardContent>
                </Card>

                {/* Taxa de Conclusão */}
                <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Target className="w-16 h-16 text-teal-900" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardDescription className="uppercase text-[9px] font-black tracking-widest text-teal-600">
                      Taxa de Conclusão
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-teal-900">
                      {dataProcessos.taxaConclusao}%
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-teal-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-500 h-full transition-all duration-1000"
                        style={{ width: `${dataProcessos.taxaConclusao}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── LINHA 2: KPIs CLÍNICOS (4 CARDS) ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

                {/* Tempo Médio */}
                <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Timer className="w-14 h-14 text-blue-900" />
                  </div>
                  <CardHeader className="pb-1">
                    <CardDescription className="uppercase text-[9px] font-black tracking-widest text-blue-600">
                      Tempo Médio / Processo
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-blue-900">
                      {dataProcessos.tempoMedioProcessoHoras > 0
                        ? `${dataProcessos.tempoMedioProcessoHoras}h`
                        : '—'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-[10px] font-semibold text-blue-700">
                      <Clock className="w-3 h-3 mr-1" />
                      Do início à conclusão
                    </div>
                  </CardContent>
                </Card>

                {/* Diagnósticos Únicos */}
                <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Stethoscope className="w-14 h-14 text-indigo-900" />
                  </div>
                  <CardHeader className="pb-1">
                    <CardDescription className="uppercase text-[9px] font-black tracking-widest text-indigo-600">
                      Diagnósticos Únicos
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-indigo-900">
                      {dataProcessos.totalDiagnosticosUnicos}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-[10px] font-semibold text-indigo-700">
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Diagnósticos distintos utilizados
                    </div>
                  </CardContent>
                </Card>

                {/* Intervenções Únicas */}
                <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Pill className="w-14 h-14 text-purple-900" />
                  </div>
                  <CardHeader className="pb-1">
                    <CardDescription className="uppercase text-[9px] font-black tracking-widest text-purple-600">
                      Intervenções Únicas
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-purple-900">
                      {dataProcessos.totalIntervencoesUnicas}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-[10px] font-semibold text-purple-700">
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Ações prescritas distintas
                    </div>
                  </CardContent>
                </Card>

                {/* Média Diagnósticos / Processo */}
                <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Layers className="w-14 h-14 text-rose-900" />
                  </div>
                  <CardHeader className="pb-1">
                    <CardDescription className="uppercase text-[9px] font-black tracking-widest text-rose-600">
                      Média Diag. / Processo
                    </CardDescription>
                    <CardTitle className="text-3xl font-black text-rose-900">
                      {dataProcessos.mediaDiagnosticosPorProcesso}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-[10px] font-semibold text-rose-700">
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Diagnósticos por consulta
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ── LINHA 3: STATUS DOS PROCESSOS + NHBs (50/50) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Donut: Status dos Processos */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Status dos Processos</CardTitle>
                    <CardDescription>Distribuição entre concluídos e em andamento</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataProcessos.distribuicaoStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={115}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                          }
                        >
                          {dataProcessos.distribuicaoStatus.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={STATUS_PROCESSO_COLORS[entry.name] || COLORS_PROD[0]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Donut: NHBs Mais Afetadas */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">NHBs Mais Afetadas</CardTitle>
                    <CardDescription>
                      Necessidades Humanas Básicas identificadas na Avaliação
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    {dataProcessos.nhbsTop.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Nenhum dado de NHB registrado ainda
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={dataProcessos.nhbsTop.slice(0, 6)}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={95}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) =>
                              percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                            }
                          >
                            {dataProcessos.nhbsTop.slice(0, 6).map((_, index) => (
                              <Cell key={index} fill={COLORS_PROD[index % COLORS_PROD.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(val, name) => [val, name]}
                            contentStyle={{
                              borderRadius: '12px',
                              border: 'none',
                              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── LINHA 4: TOP 10 DIAGNÓSTICOS (largura total) ── */}
              <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-indigo-600" />
                    Top 10 Diagnósticos de Enfermagem
                  </CardTitle>
                  <CardDescription>
                    Diagnósticos mais frequentes em toda a rede municipal
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {dataProcessos.diagnosticosTop.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      Nenhum diagnóstico registrado ainda
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dataProcessos.diagnosticosTop}
                        layout="vertical"
                        margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={220}
                          tick={{ fontSize: 11, fontWeight: 600, fill: '#374151' }}
                        />
                        <RechartsTooltip cursor={{ fill: '#f5f3ff' }} />
                        <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]}>
                          <LabelList
                            dataKey="value"
                            position="right"
                            style={{ fontSize: 11, fontWeight: 700, fill: '#6366f1' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* ── LINHA 5: TOP INTERVENÇÕES + TOP RESULTADOS (50/50) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top 10 Intervenções */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Pill className="w-5 h-5 text-purple-600" />
                      Top 10 Intervenções Prescritas
                    </CardTitle>
                    <CardDescription>Ações de enfermagem mais frequentes</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {dataProcessos.intervencoesTop.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Nenhuma intervenção registrada ainda
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dataProcessos.intervencoesTop}
                          layout="vertical"
                          margin={{ top: 4, right: 50, left: 8, bottom: 4 }}
                        >
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={180}
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#374151' }}
                          />
                          <RechartsTooltip cursor={{ fill: '#faf5ff' }} />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                            <LabelList
                              dataKey="value"
                              position="right"
                              style={{ fontSize: 10, fontWeight: 700, fill: '#8b5cf6' }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Top 10 Resultados */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Target className="w-5 h-5 text-teal-600" />
                      Top 10 Resultados Esperados
                    </CardTitle>
                    <CardDescription>Outcomes mais planejados no processo</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    {dataProcessos.resultadosTop.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Nenhum resultado registrado ainda
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={dataProcessos.resultadosTop}
                          layout="vertical"
                          margin={{ top: 4, right: 50, left: 8, bottom: 4 }}
                        >
                          <XAxis type="number" hide />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={180}
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#374151' }}
                          />
                          <RechartsTooltip cursor={{ fill: '#f0fdfa' }} />
                          <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]}>
                            <LabelList
                              dataKey="value"
                              position="right"
                              style={{ fontSize: 10, fontWeight: 700, fill: '#0d9488' }}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── LINHA 6: EXECUTOR DAS INTERVENÇÕES + NHBs DETALHADAS (50/50) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Quem Executa as Intervenções */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Executor das Intervenções</CardTitle>
                    <CardDescription>Proporção de ações por responsável</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dataProcessos.distribuicaoExecutores.filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, percent }) =>
                            percent > 0.03 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                          }
                        >
                          {dataProcessos.distribuicaoExecutores.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={EXECUTOR_COLORS[entry.name] || COLORS_PROD[0]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* NHBs — Lista Detalhada */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <HeartPulse className="w-5 h-5 text-rose-600" />
                      NHBs por Frequência
                    </CardTitle>
                    <CardDescription>Ranking completo de necessidades identificadas</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px] overflow-y-auto">
                    {dataProcessos.nhbsTop.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        Nenhum dado de NHB registrado ainda
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dataProcessos.nhbsTop.map((nhb, idx) => (
                          <div
                            key={nhb.name}
                            className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50 hover:bg-indigo-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-black text-gray-400 w-5 text-right">
                                {idx + 1}
                              </span>
                              <span className="text-sm font-semibold text-gray-800">{nhb.name}</span>
                            </div>
                            <span className="text-sm font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                              {nhb.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* ── LINHA 7: POR DIA DA SEMANA + POR HORÁRIO (50/50) ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Por Dia da Semana */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Processos por Dia da Semana
                    </CardTitle>
                    <CardDescription>Quando os enfermeiros mais utilizam a ferramenta</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dataProcessos.chartDiaSemana} margin={{ top: 4, right: 20, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{ fill: '#f5f3ff' }} />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Processos">
                          <LabelList dataKey="value" position="top" style={{ fontSize: 10, fontWeight: 700, fill: '#6366f1' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Por Horário */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Timer className="w-5 h-5 text-indigo-600" />
                      Distribuição por Horário de Início
                    </CardTitle>
                    <CardDescription>Horários de maior atividade clínica</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dataProcessos.chartHora}
                        margin={{ top: 4, right: 10, left: 0, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 9, fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                          interval={2}
                        />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip cursor={{ fill: '#f5f3ff' }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Processos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* ── LINHA 8: EVOLUÇÃO MENSAL DE CONCLUSÕES (largura total) ── */}
              <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Evolução Mensal de Processos Concluídos
                  </CardTitle>
                  <CardDescription>
                    Produção sistematizada ao longo do tempo na rede municipal
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[360px]">
                  {dataProcessos.chartMensal.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                      Nenhum processo concluído ainda para gerar histórico mensal
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={dataProcessos.chartMensal}
                        margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                      >
                        <defs>
                          <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                          contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#6366f1"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorProd)"
                          name="Conclusões no Mês"
                        />
                        <Bar
                          dataKey="value"
                          fill="#a78bfa"
                          barSize={18}
                          radius={[4, 4, 0, 0]}
                          name="Conclusões no Mês"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default PainelEstatistico;
