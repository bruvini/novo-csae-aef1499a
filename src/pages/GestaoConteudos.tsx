
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import TabelaSubconjuntos from '@/components/gestao-conteudos/TabelaSubconjuntos';
import TabelaDiagnosticos from '@/components/gestao-conteudos/TabelaDiagnosticos';
import TabelaSinaisVitais from '@/components/gestao-conteudos/TabelaSinaisVitais';
import TabelaExames from '@/components/gestao-conteudos/TabelaExames';
import IndicadoresConteudo from '@/components/gestao-conteudos/IndicadoresConteudo';

const GestaoConteudos = () => {
  const handleLogout = () => {
    console.log('Logout functionality to be implemented');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <Header 
            userName="Enf. Maria Silva"
            onLogout={handleLogout}
          />
          
          <main className="flex-1 bg-gray-50">
            <div className="container mx-auto px-4 py-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-csae-green-700 mb-2">
                  Gestão de Conteúdos
                </h1>
                <p className="text-gray-600">
                  Central de controle para cadastro dos conteúdos do processo de enfermagem
                </p>
              </div>

              {/* Indicadores */}
              <IndicadoresConteudo />

              {/* Bloco de Orientações */}
              <Card className="shadow-md mb-6">
                <CardHeader>
                  <CardTitle className="text-xl text-csae-green-700">Orientações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Em desenvolvimento. Esta área será destinada à explicação do uso dos conteúdos nesta ferramenta.
                  </p>
                </CardContent>
              </Card>

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

                    {/* Aba Exame Físico */}
                    <TabsContent value="exame-fisico" className="space-y-4">
                      <Tabs defaultValue="sinais-vitais" orientation="horizontal">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                          <TabsTrigger value="sinais-vitais">Sinais Vitais</TabsTrigger>
                          <TabsTrigger value="exames-diagnosticos">Exames Diagnósticos</TabsTrigger>
                        </TabsList>

                        {/* Sub-aba Sinais Vitais */}
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

                        {/* Sub-aba Exames Diagnósticos */}
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

                    {/* Aba Subconjuntos */}
                    <TabsContent value="subconjuntos" className="space-y-6">
                      <TabelaSubconjuntos />
                    </TabsContent>

                    {/* Aba Diagnósticos de Enfermagem */}
                    <TabsContent value="diagnosticos" className="space-y-6">
                      <TabelaDiagnosticos />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </main>
          
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default GestaoConteudos;
