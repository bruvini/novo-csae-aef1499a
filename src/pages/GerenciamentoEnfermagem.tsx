
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import SimpleFooter from '@/components/SimpleFooter';
import { NavigationMenu } from '@/components/NavigationMenu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GerenciadorPOPs from '@/components/gerenciamento-enfermagem/GerenciadorPOPs';
import GerenciadorModulos from '@/components/gerenciamento-enfermagem/GerenciadorModulos';
import GerenciadorCIPE from '@/components/gerenciamento-enfermagem/GerenciadorCIPE';

const GerenciamentoEnfermagem = () => {
  return (
    <>
      <Helmet>
        <title>Gerenciamento do Sistema | CSAE</title>
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Header />
        
        <NavigationMenu />

        <main className="container mx-auto py-8 flex-grow px-4">
          <h1 className="text-3xl font-semibold text-csae-green-700 mb-6">
            Gerenciamento do Sistema
          </h1>

          <Tabs defaultValue="modulos" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="modulos">Módulos</TabsTrigger>
              <TabsTrigger value="pops">POPs</TabsTrigger>
              <TabsTrigger value="cipe">CIPE</TabsTrigger>
            </TabsList>

            <TabsContent value="modulos">
              <GerenciadorModulos />
            </TabsContent>
            
            <TabsContent value="pops">
              <GerenciadorPOPs />
            </TabsContent>
            
            <TabsContent value="cipe">
              <GerenciadorCIPE />
            </TabsContent>
          </Tabs>
        </main>

        <SimpleFooter />
      </div>
    </>
  );
};

export default GerenciamentoEnfermagem;
