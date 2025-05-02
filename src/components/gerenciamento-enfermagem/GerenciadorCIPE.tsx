
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GerenciadorEixoCipe from './cipe/GerenciadorEixoCipe';
import GerenciadorCasosClinicos from './cipe/GerenciadorCasosClinicos';

const GerenciadorCIPE = () => {
  const [activeTab, setActiveTab] = useState("foco");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-csae-green-700">Gerenciamento de Termos CIPE</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 md:grid-cols-8 gap-2">
          <TabsTrigger value="foco">Foco</TabsTrigger>
          <TabsTrigger value="julgamento">Julgamento</TabsTrigger>
          <TabsTrigger value="meios">Meios</TabsTrigger>
          <TabsTrigger value="acao">Ação</TabsTrigger>
          <TabsTrigger value="tempo">Tempo</TabsTrigger>
          <TabsTrigger value="localizacao">Localização</TabsTrigger>
          <TabsTrigger value="cliente">Cliente</TabsTrigger>
          <TabsTrigger value="casos-clinicos">Casos Clínicos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="foco">
          <GerenciadorEixoCipe eixo="Foco" arrayName="arrayFoco" />
        </TabsContent>
        
        <TabsContent value="julgamento">
          <GerenciadorEixoCipe eixo="Julgamento" arrayName="arrayJulgamento" />
        </TabsContent>
        
        <TabsContent value="meios">
          <GerenciadorEixoCipe eixo="Meios" arrayName="arrayMeios" />
        </TabsContent>
        
        <TabsContent value="acao">
          <GerenciadorEixoCipe eixo="Ação" arrayName="arrayAcao" />
        </TabsContent>
        
        <TabsContent value="tempo">
          <GerenciadorEixoCipe eixo="Tempo" arrayName="arrayTempo" />
        </TabsContent>
        
        <TabsContent value="localizacao">
          <GerenciadorEixoCipe eixo="Localização" arrayName="arrayLocalizacao" />
        </TabsContent>
        
        <TabsContent value="cliente">
          <GerenciadorEixoCipe eixo="Cliente" arrayName="arrayCliente" />
        </TabsContent>
        
        <TabsContent value="casos-clinicos">
          <GerenciadorCasosClinicos />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GerenciadorCIPE;
