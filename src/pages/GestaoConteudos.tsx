
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import TabelaSubconjuntos from '@/components/gestao-conteudos/TabelaSubconjuntos';
import TabelaDiagnosticos from '@/components/gestao-conteudos/TabelaDiagnosticos';
import TabelaSinaisVitais from '@/components/gestao-conteudos/TabelaSinaisVitais';
import TabelaExames from '@/components/gestao-conteudos/TabelaExames';
import TabelaRevisaoSistemas from '@/components/gestao-conteudos/TabelaRevisaoSistemas';
import IndicadoresConteudo from '@/components/gestao-conteudos/IndicadoresConteudo';
import { Button } from '@/components/ui/button';

const GestaoConteudos = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" asChild className="mb-4">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-csae-green-700 mb-2">
              Gestão de Conteúdos
            </h1>
            <p className="text-gray-600">
              Central de controle para cadastro dos conteúdos do processo de enfermagem
            </p>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default GestaoConteudos;
