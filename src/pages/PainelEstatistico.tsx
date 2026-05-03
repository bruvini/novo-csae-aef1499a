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
  UsuarioRanking,
  ItemTemporal
} from '@/services/bancodados/biProcessosEnfermagemDB';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

// ── Custom Tooltip da Produção ─────────────────────────────────────────────
const ProducaoTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    payload: { variacaoPercentual?: number };
  }>;
  label?: string;
}) => {
  if (!active || !payload || !payload.length) return null;
  const valor = (payload.find((p) => p.dataKey === 'value') || payload.find((p) => p.dataKey === 'novos'))?.value ?? 0;
  const acumulado = payload.find((p) => p.dataKey === 'acumulado')?.value ?? 0;
  const variacao: number = payload[0]?.payload?.variacaoPercentual ?? 0;

  return (
    <div className="bg-white shadow-xl rounded-xl p-3 border border-indigo-100 text-sm min-w-[160px]">
      <p className="font-black text-indigo-900 mb-1">{label}</p>
      <p className="text-indigo-600">
        <span className="font-bold">No Período:</span> {valor}
      </p>
      {acumulado > 0 && (
        <p className="text-indigo-400">
          <span className="font-bold">Acumulado:</span> {acumulado}
        </p>
      )}
      {variacao !== 0 && (
        <p className={variacao > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
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
  const [selectedUser, setSelectedUser] = useState<UsuarioRanking | null>(null);
  const [raioXOpen, setRaioXOpen] = useState(false);
  const [temporalView, setTemporalView] = useState<'hora' | 'diario' | 'diaSemana' | 'mensal' | 'anual'>('mensal');

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
                    content={<ProducaoTooltip />}
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
                    content={<ProducaoTooltip />}
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
          <div className="border-l-4 border-indigo-600 pl-6 py-1">
            <h2 className="text-2xl font-black text-indigo-900 uppercase tracking-wide">
              O que a enfermagem de Florianópolis está produzindo?
            </h2>
            <p className="text-gray-500 text-sm">
              Fase 3: Inteligência de Produção por Etapas, Perfil de Pacientes e Rankings de Produtividade.
            </p>
          </div>

          {loadingProcessos ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <HeartPulse className="w-10 h-10 text-indigo-500 animate-pulse" />
              <p className="text-gray-400 font-medium text-sm animate-pulse">
                Consolidando inteligência de produção...
              </p>
            </div>
          ) : !dataProcessos || dataProcessos.totalProcessos === 0 ? (
            <div className="p-10 border-2 border-dashed rounded-3xl text-center space-y-4 bg-indigo-50/20 border-indigo-200">
               <ClipboardList className="w-12 h-12 text-indigo-300 mx-auto" />
               <p className="text-indigo-900 font-bold">Nenhum dado clínico processado ainda.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* ── Bloco 0: KPIs e Gráfico Temporal Unificado ── */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-indigo-600 text-white border-none shadow-xl">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardDescription className="text-indigo-100 text-[10px] font-bold uppercase tracking-wider">Total de Processos</CardDescription>
                        {dataProcessos.temporalAvancado.mensal.length > 0 && (
                          <div className="bg-white/20 px-2 py-0.5 rounded-full text-[9px] font-black">
                            {dataProcessos.temporalAvancado.mensal[dataProcessos.temporalAvancado.mensal.length-1].variacaoPercentual > 0 ? '+' : ''}
                            {dataProcessos.temporalAvancado.mensal[dataProcessos.temporalAvancado.mensal.length-1].variacaoPercentual}%
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-3xl font-black">{dataProcessos.totalProcessos}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-[10px] opacity-80">Registros totais na base</CardContent>
                  </Card>
                  <Card className="bg-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardDescription className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Concluídos</CardDescription>
                        <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black">ESTÁVEL</div>
                      </div>
                      <CardTitle className="text-3xl font-black text-gray-900">{dataProcessos.totalProcessosConcluidos}</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <div className="flex items-center gap-2">
                          <div className="flex-1 bg-emerald-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full" style={{ width: `${dataProcessos.taxaConclusao}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600">{dataProcessos.taxaConclusao}%</span>
                       </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-amber-600 text-[10px] font-bold uppercase tracking-wider">Tempo Médio</CardDescription>
                      <CardTitle className="text-3xl font-black text-gray-900">{dataProcessos.tempoMedioProcessoHoras}h</CardTitle>
                    </CardHeader>
                    <CardContent className="text-[10px] text-gray-500">Média de duração (Conclusão - Início)</CardContent>
                  </Card>
                  <Card className="bg-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-indigo-600 text-[10px] font-bold uppercase tracking-wider">Pacientes Atendidos</CardDescription>
                      <CardTitle className="text-3xl font-black text-gray-900">{dataProcessos.totalPacientesAtendidos}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-[10px] text-gray-500">Indivíduos únicos com processo</CardContent>
                  </Card>
                </div>

                <Card className="border-none shadow-2xl bg-white overflow-hidden">
                  <CardHeader className="flex flex-col md:flex-row items-center justify-between border-b bg-gray-50/50 gap-4">
                    <div>
                      <CardTitle className="text-lg font-black text-indigo-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" /> Evolução de Produção Clínica
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-bold tracking-widest text-indigo-500">Processos concluídos por período</CardDescription>
                    </div>
                    <Tabs value={temporalView} onValueChange={(v: any) => setTemporalView(v)} className="w-full md:w-auto">
                      <TabsList className="bg-indigo-100/50 p-1 w-full md:w-auto">
                        <TabsTrigger value="hora" className="text-[10px] px-3 py-1 font-bold">Hora</TabsTrigger>
                        <TabsTrigger value="diario" className="text-[10px] px-3 py-1 font-bold">Dia</TabsTrigger>
                        <TabsTrigger value="diaSemana" className="text-[10px] px-3 py-1 font-bold">Semana</TabsTrigger>
                        <TabsTrigger value="mensal" className="text-[10px] px-3 py-1 font-bold">Mês</TabsTrigger>
                        <TabsTrigger value="anual" className="text-[10px] px-3 py-1 font-bold">Ano</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </CardHeader>
                  <CardContent className="p-6 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={dataProcessos.temporalAvancado[temporalView]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip content={<ProducaoTooltip />} />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={temporalView === 'diario' ? 12 : 30} name="Processos" />
                        {['diario', 'mensal', 'anual'].includes(temporalView) && (
                          <Area type="monotone" dataKey="acumulado" fill="#6366f1" fillOpacity={0.05} stroke="#818cf8" strokeWidth={2} name="Acumulado" />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* ── Perfil dos Pacientes ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-md font-black text-gray-800 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" /> Perfil Demográfico (Sexo)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={dataProcessos.perfilPacientes.sexo} 
                            cx="50%" cy="50%" 
                            innerRadius={60} outerRadius={100} 
                            paddingAngle={8} dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {dataProcessos.perfilPacientes.sexo.map((_, i) => (
                              <Cell key={`sex-${i}`} fill={i === 0 ? '#6366f1' : i === 1 ? '#f43f5e' : '#94a3b8'} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                 </Card>
                 <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-md font-black text-gray-800 flex items-center gap-2">
                        <Timer className="w-4 h-4 text-violet-500" /> Faixa Etária dos Atendidos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataProcessos.perfilPacientes.faixasEtarias} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 12, fontWeight: 700 }} />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                          <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                 </Card>
              </div>

              {/* ── Etapa 1: Avaliação ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-700">
                  <div className="bg-indigo-100 p-2 rounded-lg font-black text-xs">01</div>
                  <h3 className="font-black uppercase tracking-widest text-xs">Etapa: Avaliação</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-none shadow-xl h-[450px]">
                    <CardHeader><CardTitle className="text-sm font-bold">Top 10 Parâmetros de Exame Físico</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataProcessos.etapasPE.avaliacao.physical} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 10, fontWeight: 600 }} />
                          <Bar dataKey="value" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                          <RechartsTooltip />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-xl h-[450px]">
                    <CardHeader><CardTitle className="text-sm font-bold">Top 10 Necessidades (NHBs) Afetadas</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataProcessos.etapasPE.avaliacao.nhbs} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 10, fontWeight: 600 }} />
                          <Bar dataKey="value" fill="#818cf8" radius={[0, 4, 4, 0]} />
                          <RechartsTooltip />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ── Etapa 2: Diagnóstico ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-rose-700">
                  <div className="bg-rose-100 p-2 rounded-lg font-black text-xs">02</div>
                  <h3 className="font-black uppercase tracking-widest text-xs">Etapa: Diagnóstico</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-none shadow-xl h-[450px]">
                    <CardHeader><CardTitle className="text-sm font-bold">Top 10 Diagnósticos de Enfermagem</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataProcessos.etapasPE.diagnostico.top} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 10, fontWeight: 600 }} />
                          <Bar dataKey="value" fill="#e11d48" radius={[0, 4, 4, 0]} />
                          <RechartsTooltip />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-xl h-[450px]">
                    <CardHeader><CardTitle className="text-sm font-bold">Distribuição por Subconjunto</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataProcessos.etapasPE.diagnostico.subset} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 10, fontWeight: 600 }} />
                          <Bar dataKey="value" fill="#fb7185" radius={[0, 4, 4, 0]} />
                          <RechartsTooltip />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ── Etapa 3: Planejamento ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <div className="bg-emerald-100 p-2 rounded-lg font-black text-xs">03</div>
                  <h3 className="font-black uppercase tracking-widest text-xs">Etapa: Planejamento</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-none shadow-xl h-[450px]">
                    <CardHeader><CardTitle className="text-sm font-bold">Top 10 Resultados Esperados (NOC)</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataProcessos.etapasPE.planejamento.results} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 10, fontWeight: 600 }} />
                          <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]} />
                          <RechartsTooltip />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-xl h-[450px]">
                    <CardHeader><CardTitle className="text-sm font-bold">Top 10 Intervenções Prescritas (NIC)</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataProcessos.etapasPE.planejamento.prescribed} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 10, fontWeight: 600 }} />
                          <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                          <RechartsTooltip />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ── Etapa 4: Implementação ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-cyan-700">
                  <div className="bg-cyan-100 p-2 rounded-lg font-black text-xs">04</div>
                  <h3 className="font-black uppercase tracking-widest text-xs">Etapa: Implementação</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2 border-none shadow-xl h-[450px]">
                    <CardHeader><CardTitle className="text-sm font-bold">Intervenções Aplicadas na Consulta</CardTitle></CardHeader>
                    <CardContent className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataProcessos.etapasPE.implementacao.applied} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 9, fontWeight: 600 }} />
                          <Bar dataKey="value" fill="#0891b2" radius={[0, 4, 4, 0]} />
                          <RechartsTooltip />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  <Card className="border-none shadow-xl h-[450px]">
                    <CardHeader><CardTitle className="text-sm font-bold">Distribuição de Executor</CardTitle></CardHeader>
                    <CardContent className="h-[350px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={dataProcessos.etapasPE.implementacao.executors} 
                            cx="50%" cy="50%" 
                            innerRadius={50} outerRadius={80} 
                            dataKey="value" 
                            label={({ name }) => name}
                          >
                            <Cell fill="#0891b2" />
                            <Cell fill="#22d3ee" />
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* ── Etapa 5: Evolução ── */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <div className="bg-blue-100 p-2 rounded-lg font-black text-xs">05</div>
                  <h3 className="font-black uppercase tracking-widest text-xs">Etapa: Evolução</h3>
                </div>
                <Card className="border-none shadow-xl h-[450px]">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" /> Ações Exclusivas do Enfermeiro (Tempo Presente)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dataProcessos.etapasPE.evolucao.nurseApplied} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={200} tick={{ fontSize: 10, fontWeight: 600 }} />
                        <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} />
                        <RechartsTooltip />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* ── Rankings Finais ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="border-none shadow-2xl bg-white overflow-hidden">
                    <CardHeader className="bg-indigo-900 text-white">
                      <CardTitle className="text-md font-black flex items-center gap-2">
                        <Users className="w-5 h-5" /> Top 10 Enfermeiros (Produtividade)
                      </CardTitle>
                      <CardDescription className="text-indigo-200 text-xs">Clique para abrir o Raio-X</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[450px] pt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={dataProcessos.rankingUsuarios} 
                          layout="vertical"
                          onClick={(state) => {
                            if (state && state.activePayload) {
                              setSelectedUser(state.activePayload[0].payload);
                              setRaioXOpen(true);
                            }
                          }}
                        >
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fontWeight: 700, fill: '#1e1b4b' }} />
                          <Bar dataKey="value" fill="#4338ca" radius={[0, 6, 6, 0]} cursor="pointer">
                            <LabelList dataKey="value" position="right" style={{ fontWeight: 'bold', fontSize: 12 }} />
                          </Bar>
                          <RechartsTooltip cursor={{ fill: '#eef2ff' }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                 </Card>

                 <Card className="border-none shadow-2xl bg-white overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white">
                      <CardTitle className="text-md font-black flex items-center gap-2">
                        <Layers className="w-5 h-5" /> Top 10 Lotações (Produção)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[450px] pt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataProcessos.rankingLotacoes} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 10, fontWeight: 600 }} />
                          <Bar dataKey="value" fill="#334155" radius={[0, 6, 6, 0]}>
                            <LabelList dataKey="value" position="right" style={{ fontWeight: 'bold', fontSize: 11 }} />
                          </Bar>
                          <RechartsTooltip cursor={{ fill: '#f1f5f9' }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                 </Card>
              </div>

            </div>
          )}
        </div>

        {/* ── Modal Raio-X do Usuário ── */}
        <Dialog open={raioXOpen} onOpenChange={setRaioXOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
            {selectedUser && (
              <>
                <DialogHeader className="p-8 bg-indigo-950 text-white shrink-0 relative">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <HeartPulse className="w-24 h-24" />
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <DialogTitle className="text-3xl font-black">{selectedUser.name}</DialogTitle>
                      <p className="text-indigo-400 font-bold text-sm flex items-center gap-2">
                        <Target className="w-4 h-4" /> {selectedUser.lotacao}
                      </p>
                    </div>
                    <div className="bg-indigo-900/50 p-4 rounded-2xl text-center border border-indigo-800 shadow-xl min-w-[120px]">
                       <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500 mb-1">Processos</p>
                       <p className="text-4xl font-black text-white leading-none">{selectedUser.value}</p>
                    </div>
                  </div>
                </DialogHeader>
                <ScrollArea className="flex-1 bg-gray-50">
                   <div className="p-8 space-y-8">
                      {/* Scorecards de Produtividade */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:border-indigo-200 transition-all">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500">Pacientes</p>
                          <p className="text-2xl font-black text-indigo-900">{selectedUser.raioX.totalPacientes}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:border-amber-200 transition-all">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-amber-500">Em Andamento</p>
                          <p className="text-2xl font-black text-amber-600">{selectedUser.raioX.processosAtivos}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:border-emerald-200 transition-all">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-emerald-500">Concluídos</p>
                          <p className="text-2xl font-black text-emerald-600">{selectedUser.raioX.processosConcluidos}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 group hover:border-indigo-200 transition-all">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-indigo-500">Tempo Médio</p>
                          <p className="text-2xl font-black text-indigo-600">{selectedUser.raioX.tempoMedioHoras}h</p>
                        </div>
                      </div>

                      {/* Preferências Clínicas */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                           <h4 className="text-xs font-black uppercase text-rose-600 flex items-center gap-2 tracking-widest">
                             <Stethoscope className="w-4 h-4" /> Diagnósticos
                           </h4>
                           <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-2">
                             {selectedUser.raioX.topDiagnosticos.map((d, i) => (
                               <div key={i} className="text-[11px] font-bold text-gray-700 bg-rose-50/50 p-2.5 rounded-lg border-l-4 border-rose-500 truncate">{d}</div>
                             ))}
                             {selectedUser.raioX.topDiagnosticos.length === 0 && <p className="text-gray-400 text-[10px] italic">Sem dados registrados</p>}
                           </div>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-xs font-black uppercase text-amber-600 flex items-center gap-2 tracking-widest">
                             <Activity className="w-4 h-4" /> Necessidades
                           </h4>
                           <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-2">
                             {selectedUser.raioX.topNHBs.map((n, i) => (
                               <div key={i} className="text-[11px] font-bold text-gray-700 bg-amber-50/50 p-2.5 rounded-lg border-l-4 border-amber-500 truncate">{n}</div>
                             ))}
                             {selectedUser.raioX.topNHBs.length === 0 && <p className="text-gray-400 text-[10px] italic">Sem dados registrados</p>}
                           </div>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-xs font-black uppercase text-indigo-600 flex items-center gap-2 tracking-widest">
                             <Pill className="w-4 h-4" /> Intervenções
                           </h4>
                           <div className="bg-white rounded-2xl shadow-sm border p-4 space-y-2">
                             {selectedUser.raioX.topIntervencoes.map((int, i) => (
                               <div key={i} className="text-[11px] font-bold text-gray-700 bg-indigo-50/50 p-2.5 rounded-lg border-l-4 border-indigo-500 truncate">{int}</div>
                             ))}
                             <div className="pt-2 mt-2 border-t text-[10px] text-gray-400 flex items-center justify-between">
                               <span>Executor Freq:</span>
                               <span className="font-black text-indigo-600 uppercase">{selectedUser.raioX.executorMaisFrequente}</span>
                             </div>
                           </div>
                        </div>
                      </div>
                   </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </AuthenticatedLayout>
  );
};

export default PainelEstatistico;
