
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, FileText, Target, Zap } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Diagnostico } from '@/services/bancodados/rolEnfermagemDB';

interface IndicadoresData {
  totalDiagnosticos: number;
  totalSubconjuntos: number;
  totalResultados: number;
  totalIntervencoes: number;
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
          totalIntervencoes
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const IconComponent = card.icon;
        return (
          <Card key={index}>
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
