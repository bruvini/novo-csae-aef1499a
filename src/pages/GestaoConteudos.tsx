
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import ModalCadastroSubconjunto from '@/components/gestao-conteudos/ModalCadastroSubconjunto';
import TabelaSubconjuntos from '@/components/gestao-conteudos/TabelaSubconjuntos';

const GestaoConteudos = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-csae-green-700 mb-2">
            Gestão de Conteúdos
          </h1>
          <p className="text-gray-600">
            Central de controle para cadastro dos conteúdos do processo de enfermagem
          </p>
        </div>

        {/* Bloco de Orientações */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-csae-green-700">Orientações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Em desenvolvimento. Esta área será destinada à explicação do uso dos conteúdos nesta ferramenta.
            </p>
          </CardContent>
        </Card>

        {/* Bloco de Indicadores */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-csae-green-700">Indicadores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Indicadores em desenvolvimento.
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
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="exame-fisico">Exame Físico</TabsTrigger>
                <TabsTrigger value="diagnosticos">Diagnósticos de Enfermagem</TabsTrigger>
              </TabsList>

              {/* Aba Exame Físico */}
              <TabsContent value="exame-fisico" className="space-y-4">
                <Tabs defaultValue="sinais-vitais" orientation="horizontal">
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="sinais-vitais">Sinais Vitais</TabsTrigger>
                    <TabsTrigger value="exames-diagnosticos">Exames Diagnósticos</TabsTrigger>
                    <TabsTrigger value="sistemas-corpo">Sistemas do Corpo Humano</TabsTrigger>
                  </TabsList>

                  {/* Sub-aba Sinais Vitais */}
                  <TabsContent value="sinais-vitais">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Sinais Vitais</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="outline" className="h-8 w-8">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cadastrar SSVV</p>
                          </TooltipContent>
                        </Tooltip>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-500 text-center py-8">
                          Conteúdo dos Sinais Vitais será implementado aqui.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Sub-aba Exames Diagnósticos */}
                  <TabsContent value="exames-diagnosticos">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Exames Diagnósticos</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="outline" className="h-8 w-8">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cadastrar Exames</p>
                          </TooltipContent>
                        </Tooltip>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-500 text-center py-8">
                          Conteúdo dos Exames Diagnósticos será implementado aqui.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Sub-aba Sistemas do Corpo Humano */}
                  <TabsContent value="sistemas-corpo">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Sistemas do Corpo Humano</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="outline" className="h-8 w-8">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cadastrar Propedêuticas</p>
                          </TooltipContent>
                        </Tooltip>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-500 text-center py-8">
                          Conteúdo dos Sistemas do Corpo Humano será implementado aqui.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Aba Diagnósticos de Enfermagem */}
              <TabsContent value="diagnosticos" className="space-y-4">
                <Tabs defaultValue="subconjuntos" orientation="horizontal">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="subconjuntos">Subconjuntos</TabsTrigger>
                    <TabsTrigger value="diagnosticos-enfermagem">Diagnósticos</TabsTrigger>
                  </TabsList>

                  {/* Sub-aba Subconjuntos */}
                  <TabsContent value="subconjuntos" className="space-y-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Subconjuntos</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <ModalCadastroSubconjunto />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cadastrar Subconjuntos</p>
                          </TooltipContent>
                        </Tooltip>
                      </CardHeader>
                      <CardContent>
                        <TabelaSubconjuntos />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Sub-aba Diagnósticos de Enfermagem */}
                  <TabsContent value="diagnosticos-enfermagem">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Diagnósticos de Enfermagem</CardTitle>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="icon" variant="outline" className="h-8 w-8">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cadastrar Diagnósticos de Enfermagem</p>
                          </TooltipContent>
                        </Tooltip>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-500 text-center py-8">
                          Conteúdo dos Diagnósticos de Enfermagem será implementado aqui.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GestaoConteudos;
