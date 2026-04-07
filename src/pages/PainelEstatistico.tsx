
import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart as BarChartIcon, TrendingUp, Users, Activity, Target, Clock, ArrowRight } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, 
  LineChart, Line, AreaChart, Area, Treemap
} from 'recharts';
import { obterEstatisticasUsuariosBI, EstatisticasBI } from '@/services/bancodados/biUsuariosDB';

const COLORS = ['#059669', '#10b981', '#34d399', '#0f766e', '#14b8a6', '#5eead4', '#0d9488'];

const PainelEstatistico = () => {
  const [data, setData] = useState<EstatisticasBI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await obterEstatisticasUsuariosBI();
        setData(stats);
      } catch (error) {
        console.error("Erro ao carregar dados do BI:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      <div className="space-y-12 pb-20 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-csae-green-900 tracking-tight flex items-center gap-3">
            <BarChartIcon className="w-10 h-10 text-csae-green-600" />
            Painel Estatístico <span className="text-csae-green-500/50">BI</span>
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span>Visão global de métricas e indicadores de produção da rede municipal de Florianópolis.</span>
            {data?.ultimaAtualizacao && (
              <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                Atualizado em: {data.ultimaAtualizacao.toDate ? data.ultimaAtualizacao.toDate().toLocaleDateString() : 'Agora'}
              </span>
            )}
          </div>
        </div>

        {/* --- SECTION 1: QUEM SÃO NOSSOS USUÁRIOS? --- */}
        <div className="flex flex-col gap-10">
          <div className="border-l-4 border-csae-green-600 pl-6 py-1">
            <h2 className="text-2xl font-black text-csae-green-900 uppercase tracking-wide">Quem são nossos usuários?</h2>
            <p className="text-gray-500 text-sm">Perfil demográfico e comportamento dos profissionais conectados ao portal.</p>
          </div>

          {/* LINHA 1: BIG NUMBERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-20 h-20 text-csae-green-900" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="uppercase text-[10px] font-black tracking-widest text-csae-green-600">Total de Profissionais</CardDescription>
                <CardTitle className="text-4xl font-black text-csae-green-900">{data?.totalCadastrados || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs font-semibold text-csae-green-700">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Usuários únicos cadastrados
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Target className="w-20 h-20 text-emerald-900" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="uppercase text-[10px] font-black tracking-widest text-emerald-600">Taxa de Aprovação</CardDescription>
                <CardTitle className="text-4xl font-black text-emerald-900">{data?.taxaAprovacao || 0}%</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-1000" 
                    style={{ width: `${data?.taxaAprovacao || 0}%` }} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock className="w-20 h-20 text-blue-900" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="uppercase text-[10px] font-black tracking-widest text-blue-600">Tempo Médio de Liberação</CardDescription>
                <CardTitle className="text-4xl font-black text-blue-900">
                  {data?.tempoMedioLiberacaoHoras || 0}h
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs font-semibold text-blue-700">
                  <Activity className="w-3 h-3 mr-1" />
                  Média de horas para ativação
                </div>
              </CardContent>
            </Card>
          </div>

          {/* LINHA 2: PERFIL PROFISSIONAL */}
          <div className="flex flex-col gap-8">
            <Card className="border-none shadow-xl bg-white overflow-hidden w-full">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Profissionais por Categoria</CardTitle>
                <CardDescription>Perfil técnico dos usuários ativos</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.distribuicaoFormacao}
                      cx="50%" cy="50%"
                      innerRadius={100}
                      outerRadius={140}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data?.distribuicaoFormacao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white overflow-hidden w-full">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Vínculo SMS</CardTitle>
                <CardDescription>Proporção de profissionais na rede municipal</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.distribuicaoAtuaSMS}
                      cx="50%" cy="50%"
                      outerRadius={140}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#059669" />
                      <Cell fill="#e11d48" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* LINHA 3: GEOGRAFIA */}
          <div className="flex flex-col gap-8">
            <Card className="border-none shadow-xl bg-white overflow-hidden w-full">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Top 10 Unidades (Lotação)</CardTitle>
                <CardDescription>Centros de saúde com maior engajamento</CardDescription>
              </CardHeader>
              <CardContent className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.topLotacoes} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11, fontWeight: 600 }} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white overflow-hidden w-full">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Onde moram nossos profissionais</CardTitle>
                <CardDescription>Distribuição por bairro de residência</CardDescription>
              </CardHeader>
              <CardContent className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.distribuicaoBairros}>
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="value" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* LINHA 4: SÉRIE TEMPORAL */}
          <Card className="border-none shadow-xl bg-white overflow-hidden w-full">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Evolução de Cadastros</CardTitle>
              <CardDescription>Crescimento da base de dados e novos usuários por mês</CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.evolucaoCadastros}>
                  <defs>
                    <linearGradient id="colorAcum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="acumulado" stroke="#059669" fillOpacity={1} fill="url(#colorAcum)" name="Total Acumulado" strokeWidth={3} />
                  <Bar dataKey="novos" fill="#34d399" barSize={40} name="Novos no Mês" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* LINHA 5: GOVERNANÇA */}
          <div className="flex flex-col gap-8">
             <Card className="border-none shadow-xl bg-white overflow-hidden w-full">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Níveis de Acesso</CardTitle>
                <CardDescription>Divisão de papéis de governança no sistema</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={data?.niveisAcesso}
                    dataKey="value"
                    aspectRatio={16 / 9}
                    stroke="#fff"
                    fill="#0d9488"
                  />
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-white overflow-hidden w-full">
              <CardHeader>
                <CardTitle className="text-lg font-bold">Situação dos Cadastros</CardTitle>
                <CardDescription>Monitoramento de status de acesso e pendências</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.situacaoCadastros}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="valor" fill="#0f766e" radius={[10, 10, 0, 0]} barSize={80}>
                      {data?.situacaoCadastros.map((entry, index) => (
                        <Cell key={`situacao-${index}`} fill={entry.name === 'Liberado' ? '#059669' : entry.name === 'Aguardando' ? '#f59e0b' : '#e11d48'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* --- SECTION 2: O QUE A ENFERMAGEM ESTÁ PRODUZINDO? (SKELETON) --- */}
        <div className="flex flex-col gap-8 opacity-50 grayscale pointer-events-none">
          <div className="border-l-4 border-blue-600 pl-6 py-1">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-wide">O que a enfermagem de Florianópolis está produzindo?</h2>
            <p className="text-gray-500 text-sm">Métricas clínicas e produção sistematizada da rede municipal.</p>
          </div>
          
          <Card className="border-dashed border-2 border-gray-300 shadow-none bg-gray-50">
            <CardContent className="h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 text-gray-400">
                <Target className="w-12 h-12" />
                <p className="font-bold uppercase tracking-widest text-xs">Módulo em Desenvolvimento - Fase 2</p>
                <p className="text-xs max-w-xs text-center">A agregação de dados clínicos (diagnósticos e intervenções) está sendo consolidada pela engenharia.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default PainelEstatistico;
