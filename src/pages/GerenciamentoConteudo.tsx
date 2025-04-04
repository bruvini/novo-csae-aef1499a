
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Database, FilePlus, Save, Trash2, Edit, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import MainFooter from '@/components/MainFooter';
import { useToast } from '@/hooks/use-toast';

const GerenciamentoConteudo = () => {
  const [activeTab, setActiveTab] = useState("diagnosticos");
  const { toast } = useToast();
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const notifyEmDesenvolvimento = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Esta funcionalidade está em desenvolvimento e será disponibilizada em breve.",
      duration: 5000,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <NavigationMenu activeItem="gerenciamento-conteudo" />
      
      <main className="flex-1 container max-w-screen-xl mx-auto my-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-csae-green-700">
            Gerenciamento de Conteúdo
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie diagnósticos, intervenções, protocolos e outros conteúdos utilizados no sistema.
          </p>
        </div>
        
        <Tabs defaultValue="diagnosticos" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="diagnosticos">Diagnósticos NANDA</TabsTrigger>
            <TabsTrigger value="intervencoes">Intervenções NIC</TabsTrigger>
            <TabsTrigger value="nhbs">Necessidades Humanas Básicas</TabsTrigger>
            <TabsTrigger value="protocolos">Protocolos Institucionais</TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagnosticos">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Diagnósticos NANDA</span>
                  <Button onClick={notifyEmDesenvolvimento}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Novo Diagnóstico
                  </Button>
                </CardTitle>
                <CardDescription>
                  Gerencie os diagnósticos de enfermagem NANDA disponíveis no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-csae-green-50 p-10 rounded-lg text-center">
                  <Database className="mx-auto h-12 w-12 text-csae-green-500 mb-4" />
                  <h3 className="text-xl font-semibold text-csae-green-700 mb-2">
                    Funcionalidade em desenvolvimento
                  </h3>
                  <p className="text-csae-green-600 max-w-md mx-auto">
                    Esta área permitirá o gerenciamento dinâmico de diagnósticos NANDA que serão utilizados no processo de enfermagem.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="intervencoes">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Intervenções NIC</span>
                  <Button onClick={notifyEmDesenvolvimento}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Nova Intervenção
                  </Button>
                </CardTitle>
                <CardDescription>
                  Gerencie as intervenções de enfermagem NIC disponíveis no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-csae-green-50 p-10 rounded-lg text-center">
                  <Database className="mx-auto h-12 w-12 text-csae-green-500 mb-4" />
                  <h3 className="text-xl font-semibold text-csae-green-700 mb-2">
                    Funcionalidade em desenvolvimento
                  </h3>
                  <p className="text-csae-green-600 max-w-md mx-auto">
                    Esta área permitirá o gerenciamento dinâmico das intervenções NIC que serão utilizadas no processo de enfermagem.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="nhbs">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Necessidades Humanas Básicas</span>
                  <Button onClick={notifyEmDesenvolvimento}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Nova NHB
                  </Button>
                </CardTitle>
                <CardDescription>
                  Gerencie as categorias de Necessidades Humanas Básicas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-csae-green-50 p-10 rounded-lg text-center">
                  <Database className="mx-auto h-12 w-12 text-csae-green-500 mb-4" />
                  <h3 className="text-xl font-semibold text-csae-green-700 mb-2">
                    Funcionalidade em desenvolvimento
                  </h3>
                  <p className="text-csae-green-600 max-w-md mx-auto">
                    Esta área permitirá o gerenciamento dinâmico das categorias de Necessidades Humanas Básicas que serão utilizadas no processo de enfermagem.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="protocolos">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Protocolos Institucionais</span>
                  <Button onClick={notifyEmDesenvolvimento}>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Novo Protocolo
                  </Button>
                </CardTitle>
                <CardDescription>
                  Gerencie os protocolos institucionais disponíveis no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-csae-green-50 p-10 rounded-lg text-center">
                  <Database className="mx-auto h-12 w-12 text-csae-green-500 mb-4" />
                  <h3 className="text-xl font-semibold text-csae-green-700 mb-2">
                    Funcionalidade em desenvolvimento
                  </h3>
                  <p className="text-csae-green-600 max-w-md mx-auto">
                    Esta área permitirá o gerenciamento dinâmico dos protocolos institucionais que serão utilizados no processo de enfermagem.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <MainFooter />
    </div>
  );
};

export default GerenciamentoConteudo;
