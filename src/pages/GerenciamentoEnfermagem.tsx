
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from '@/components/Header';
import SimpleFooter from '@/components/SimpleFooter';
import NavigationMenu from '@/components/NavigationMenu';
import GerenciadorSinaisVitais from '@/components/gerenciamento-enfermagem/GerenciadorSinaisVitais';
import GerenciadorExamesLaboratoriais from '@/components/gerenciamento-enfermagem/GerenciadorExamesLaboratoriais';
import GerenciadorRevisaoSistemas from '@/components/gerenciamento-enfermagem/GerenciadorRevisaoSistemas';
import GerenciadorDiagnosticos from '@/components/gerenciamento-enfermagem/GerenciadorDiagnosticos';
import GerenciadorProtocolos from '@/components/gerenciamento-enfermagem/GerenciadorProtocolos';
import GerenciadorModulos from '@/components/gerenciamento-enfermagem/GerenciadorModulos';
import GerenciadorPOPs from '@/components/gerenciamento-enfermagem/GerenciadorPOPs';
import LoadingOverlay from '@/components/LoadingOverlay';

const GerenciamentoEnfermagem = () => {
  const [activeTab, setActiveTab] = useState("sinais-vitais");
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {loading && <LoadingOverlay />}
      
      <Header />
      <NavigationMenu activeItem="gerenciamento-enfermagem" />
      
      <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-csae-green-700 mb-6">
          Gerenciamento de Conteúdos do Processo de Enfermagem
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex min-w-max">
              <TabsTrigger value="sinais-vitais">Sinais Vitais</TabsTrigger>
              <TabsTrigger value="exames-laboratoriais">Exames Laboratoriais</TabsTrigger>
              <TabsTrigger value="revisao-sistemas">Revisão de Sistemas</TabsTrigger>
              <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
              <TabsTrigger value="protocolos">Protocolos de Enfermagem</TabsTrigger>
              <TabsTrigger value="pops">POPs</TabsTrigger>
              <TabsTrigger value="modulos">Módulos</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="sinais-vitais">
            <GerenciadorSinaisVitais />
          </TabsContent>
          
          <TabsContent value="exames-laboratoriais">
            <GerenciadorExamesLaboratoriais />
          </TabsContent>
          
          <TabsContent value="revisao-sistemas">
            <GerenciadorRevisaoSistemas />
          </TabsContent>
          
          <TabsContent value="diagnosticos">
            <GerenciadorDiagnosticos />
          </TabsContent>

          <TabsContent value="protocolos">
            <GerenciadorProtocolos />
          </TabsContent>

          <TabsContent value="pops">
            <GerenciadorPOPs />
          </TabsContent>

          <TabsContent value="modulos">
            <GerenciadorModulos />
          </TabsContent>
        </Tabs>
      </main>
      
      <SimpleFooter />
    </div>
  );
};

export default GerenciamentoEnfermagem;
