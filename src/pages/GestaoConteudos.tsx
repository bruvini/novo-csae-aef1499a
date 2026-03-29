
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import TabelaSubconjuntos from '@/components/gestao-conteudos/TabelaSubconjuntos';
import TabelaDiagnosticos from '@/components/gestao-conteudos/TabelaDiagnosticos';
import TabelaSinaisVitais from '@/components/gestao-conteudos/TabelaSinaisVitais';
import TabelaExames from '@/components/gestao-conteudos/TabelaExames';
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

        {/* Indicadores */}
        <IndicadoresConteudo />

        {/* Bloco Principal: Conteúdos */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-csae-green-700">
              Conteúdos do Processo de Enfermagem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="exame-fisico" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="exame-fisico">Exame Físico</TabsTrigger>
                <TabsTrigger value="subconjuntos">Subconjuntos</TabsTrigger>
                <TabsTrigger value="diagnosticos">Diagnósticos de Enfermagem</TabsTrigger>
              </TabsList>

              <TabsContent value="exame-fisico" className="space-y-4">
                <Tabs defaultValue="sinais-vitais" orientation="horizontal">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="sinais-vitais">Sinais Vitais</TabsTrigger>
                    <TabsTrigger value="exames-diagnosticos">Exames Diagnósticos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="sinais-vitais">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Sinais Vitais</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <TabelaSinaisVitais />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="exames-diagnosticos">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Exames Diagnósticos</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <TabelaExames />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="subconjuntos" className="space-y-6">
                <TabelaSubconjuntos />
              </TabsContent>

              <TabsContent value="diagnosticos" className="space-y-6">
                <TabelaDiagnosticos />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GestaoConteudos;
