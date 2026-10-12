
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, FileText, Target, Zap, Heart, TestTube, ClipboardCheck } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import { getSinaisVitaisCount } from '@/services/bancodados/sinaisVitaisDB';
import { getExamesCount } from '@/services/bancodados/examesDB';

interface IndicadoresData {
  totalDiagnosticos: number;
  totalSubconjuntos: number;
  totalResultados: number;
  totalIntervencoes: number;
  totalSinaisVitais: number;
  totalExames: number;
  totalSistemas: number;
  totalExamesFisicos: number;
}

const IndicadoresConteudo = () => {
  const [indicadores, setIndicadores] = useState<IndicadoresData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarIndicadores = async () => {
      try {
        setLoading(true);

        // Buscar total de diagnósticos
        const diagnosticosSnapshot = await getDocs(collection(db, 'rolEnfermagem'));
        const totalDiagnosticos = diagnosticosSnapshot.size;

        // Buscar total de subconjuntos
        const subconjuntosSnapshot = await getDocs(collection(db, 'subconjuntosEnfermagem'));
        const totalSubconjuntos = subconjuntosSnapshot.size;

        // Buscar total de sinais vitais
        const totalSinaisVitais = await getSinaisVitaisCount();

        // Buscar total de exames
        const totalExames = await getExamesCount();

        // Sistemas e exames físicos estruturados para revisão por sistema
        const sistemasSnapshot = await getDocs(collection(db, 'RevisaoSistemas'));
        const totalSistemas = sistemasSnapshot.size;
        const totalExamesFisicos = sistemasSnapshot.docs.reduce((quantidade, sistema) => {
          const exames = sistema.data().exames;
          return quantidade + (Array.isArray(exames) ? exames.length : 0);
        }, 0);

        // Calcular total de resultados esperados e intervenções
        let totalResultados = 0;
        let totalIntervencoes = 0;

        diagnosticosSnapshot.docs.forEach(doc => {
          const diagnostico = doc.data() as Diagnostico;
          if (diagnostico.resultadosEsperados) {
            totalResultados += diagnostico.resultadosEsperados.length;
            
            diagnostico.resultadosEsperados.forEach(resultado => {
              if (resultado.intervencoes) {
                totalIntervencoes += resultado.intervencoes.length;
              }
            });
          }
        });

        setIndicadores({
          totalDiagnosticos,
          totalSubconjuntos,
          totalResultados,
          totalIntervencoes,
          totalSinaisVitais,
          totalExames,
          totalSistemas,
          totalExamesFisicos
        });
      } catch (error) {
        console.error('Erro ao carregar indicadores:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarIndicadores();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-4 mb-6">
        {[...Array(7)].map((_, i) => (
          <Card key={i} className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!indicadores) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Erro ao carregar indicadores
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Diagnósticos",
      value: indicadores.totalDiagnosticos,
      description: "Diagnósticos cadastrados",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "Total de Subconjuntos",
      value: indicadores.totalSubconjuntos,
      description: "Subconjuntos disponíveis",
      icon: Activity,
      color: "text-green-600"
    },
    {
      title: "Resultados Esperados",
      value: indicadores.totalResultados,
      description: "Resultados definidos",
      icon: Target,
      color: "text-orange-600"
    },
    {
      title: "Total de Intervenções",
      value: indicadores.totalIntervencoes,
      description: "Intervenções cadastradas",
      icon: Zap,
      color: "text-purple-600"
    },
    {
      title: "Total de Sinais Vitais",
      value: indicadores.totalSinaisVitais,
      description: "Sinais vitais cadastrados",
      icon: Heart,
      color: "text-red-600"
    },
    {
      title: "Total de Exames",
      value: indicadores.totalExames,
      description: "Exames cadastrados",
      icon: TestTube,
      color: "text-cyan-600"
    },
    {
      title: "Revisão de Sistemas",
      value: indicadores.totalSistemas,
      description: `${indicadores.totalExamesFisicos} exames físicos estruturados`,
      icon: ClipboardCheck,
      color: "text-teal-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7 gap-4 mb-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index} className="min-w-0 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <IconComponent className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default IndicadoresConteudo;
