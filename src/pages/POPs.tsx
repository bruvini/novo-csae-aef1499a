
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useToast } from "@/hooks/use-toast";
import { useAutenticacao } from "@/services/autenticacao";
import Header from '@/components/Header';
import SimpleFooter from '@/components/SimpleFooter';
import { NavigationMenu } from '@/components/NavigationMenu';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';

const POPs = () => {
  const { toast } = useToast();
  const { verificarAutenticacao } = useAutenticacao();

  const [termoBusca, setTermoBusca] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('lista');

  React.useEffect(() => {
    verificarAutenticacao();
  }, [verificarAutenticacao]);

  return (
    <>
      <Helmet>
        <title>POPs | CSAE</title>
      </Helmet>

      <div className="flex flex-col min-h-screen">
        <Header />
        <NavigationMenu />

        <main className="container mx-auto px-4 py-8 flex-grow">
          <h1 className="text-3xl font-semibold mb-6 text-csae-green-700">
            Protocolos Operacionais Padrão (POPs)
          </h1>

          <div className="flex items-center justify-between mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <input
                type="search"
                placeholder="Buscar POPs..."
                className="pl-9 pr-3 py-2 border rounded-md w-full focus:outline-none focus:ring focus:border-csae-green-300"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
              />
            </div>

            <Button className="bg-csae-green-600 hover:bg-csae-green-700">
              Adicionar POP
            </Button>
          </div>

          <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="lista">Lista de POPs</TabsTrigger>
              <TabsTrigger value="categorias">Categorias</TabsTrigger>
            </TabsList>

            <TabsContent value="lista">
              <div>
                <p>Lista de Protocolos Operacionais Padrão.</p>
              </div>
            </TabsContent>

            <TabsContent value="categorias">
              <div>
                <p>Categorias de Protocolos Operacionais Padrão.</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
        
        <SimpleFooter />
      </div>
    </>
  );
};

export default POPs;
