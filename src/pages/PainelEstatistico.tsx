
import React from 'react';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, TrendingUp, Users, Activity } from 'lucide-react';

const PainelEstatistico = () => {
  return (
    <AuthenticatedLayout>
      <div className="space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-csae-green-900 tracking-tight flex items-center gap-3">
            <BarChart className="w-8 h-8 text-csae-green-600" />
            Painel Estatístico
          </h1>
          <p className="text-gray-600 font-medium">
            Visão global de métricas e indicadores de produção da rede municipal de Florianópolis.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Section 1: User Demographics */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-csae-green-600" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-csae-green-100 rounded-lg text-csae-green-600 group-hover:bg-csae-green-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-bold text-csae-green-900">
                  Quem são nossos usuários?
                </CardTitle>
              </div>
              <CardDescription>
                Distribuição demográfica e perfil dos profissionais cadastrados no portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center border-t border-gray-100 bg-gray-50/30">
              <div className="flex flex-col items-center gap-4 text-gray-400">
                <Activity className="w-12 h-12 animate-pulse" />
                <p className="text-sm font-medium">Processando indicadores biométricos...</p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Production Metrics */}
          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <CardTitle className="text-xl font-bold text-csae-green-900">
                  O que a enfermagem de Florianópolis está produzindo?
                </CardTitle>
              </div>
              <CardDescription>
                Métricas de Processos de Enfermagem, diagnósticos e intervenções realizadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center border-t border-gray-100 bg-gray-50/30">
              <div className="flex flex-col items-center gap-4 text-gray-400">
                <Activity className="w-12 h-12 animate-pulse" />
                <p className="text-sm font-medium">Consolidando registros clínicos...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default PainelEstatistico;
