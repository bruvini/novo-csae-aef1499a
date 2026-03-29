
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import TabelaSubconjuntos from '@/components/gestao-conteudos/TabelaSubconjuntos';
import TabelaDiagnosticos from '@/components/gestao-conteudos/TabelaDiagnosticos';
import TabelaSinaisVitais from '@/components/gestao-conteudos/TabelaSinaisVitais';
import TabelaExames from '@/components/gestao-conteudos/TabelaExames';
import TabelaRevisaoSistemas from '@/components/gestao-conteudos/TabelaRevisaoSistemas';
import IndicadoresConteudo from '@/components/gestao-conteudos/IndicadoresConteudo';
import { Button } from '@/components/ui/button';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const GestaoConteudos = () => {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header da Página */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-6 h-6 text-csae-green-600" />
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Gestão de Conteúdos
            </h1>
          </div>
          <p className="text-gray-500 font-medium">
            Manutenção dos bancos de dados do Processo de Enfermagem
          </p>
        </div>

        {/* Indicadores */}
        <IndicadoresConteudo />

        {/* Bloco Principal: Conteúdos */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-100">
            <CardTitle className="text-xl text-csae-green-800">
              Conteúdos do Processo de Enfermagem
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="exame-fisico" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b bg-gray-50/50 p-0 h-12">
                <TabsTrigger 
                  value="exame-fisico" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-csae-green-600 data-[state=active]:bg-white h-12 px-6"
                >
                  Exame Físico
                </TabsTrigger>
                <TabsTrigger 
                  value="subconjuntos"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-csae-green-600 data-[state=active]:bg-white h-12 px-6"
                >
                  Subconjuntos
                </TabsTrigger>
                <TabsTrigger 
                  value="diagnosticos"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-csae-green-600 data-[state=active]:bg-white h-12 px-6"
                >
                  Diagnósticos de Enfermagem
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="exame-fisico" className="mt-0 space-y-4">
                  <Tabs defaultValue="sinais-vitais" orientation="horizontal">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100/50 p-1">
                      <TabsTrigger value="sinais-vitais">Sinais Vitais</TabsTrigger>
                      <TabsTrigger value="exames-diagnosticos">Exames Diagnósticos</TabsTrigger>
                      <TabsTrigger value="revisao-sistemas">Revisão de Sistemas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="sinais-vitais" className="mt-0">
                      <TabelaSinaisVitais />
                    </TabsContent>

                    <TabsContent value="exames-diagnosticos" className="mt-0">
                      <TabelaExames />
                    </TabsContent>

                    <TabsContent value="revisao-sistemas" className="mt-0">
                      <TabelaRevisaoSistemas />
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="subconjuntos" className="mt-0">
                  <TabelaSubconjuntos />
                </TabsContent>

                <TabsContent value="diagnosticos" className="mt-0">
                  <TabelaDiagnosticos />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
};

export default GestaoConteudos;
