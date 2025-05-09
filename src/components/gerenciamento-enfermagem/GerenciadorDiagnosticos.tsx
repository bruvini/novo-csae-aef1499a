
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiagnosticosTab from './diagnosticos/DiagnosticosTab';
import SubconjuntoTab from './diagnosticos/SubconjuntoTab';

const GerenciadorDiagnosticos = () => {
  const [tipoSubconjuntoSelecionado, setTipoSubconjuntoSelecionado] = useState<'NHB' | 'Protocolo'>('NHB');

  // Fixed function to properly restrict the parameter type
  const handleSubconjuntoTipoChange = (tipo: 'NHB' | 'Protocolo') => {
    setTipoSubconjuntoSelecionado(tipo);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-csae-green-700 mb-6">Gerenciador de Diagnósticos</h2>
      
      <Tabs defaultValue="subconjuntos" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="subconjuntos">Subconjuntos</TabsTrigger>
          <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subconjuntos">
          <SubconjuntoTab 
            tipoSubconjunto={tipoSubconjuntoSelecionado} 
            onTipoChange={handleSubconjuntoTipoChange}
          />
        </TabsContent>
        
        <TabsContent value="diagnosticos">
          <DiagnosticosTab 
            tipoSubconjunto={tipoSubconjuntoSelecionado}
            onTipoChange={handleSubconjuntoTipoChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GerenciadorDiagnosticos;
