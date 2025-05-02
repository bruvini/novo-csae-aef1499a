
import React, { useState, useEffect } from 'react';
import { ExternalLink, FileText, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { ProtocoloOperacionalPadrao } from '@/types/pop';
import { buscarProtocolosOperacionaisAtivos } from '@/services/bancodados/popsDB';
import Header from '@/components/Header';
import SimpleFooter from '@/components/SimpleFooter';
import NavigationMenu from '@/components/NavigationMenu';

const POPs = () => {
  const { toast } = useToast();
  const [protocolos, setProtocolos] = useState<ProtocoloOperacionalPadrao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  
  useEffect(() => {
    const carregarProtocolos = async () => {
      setCarregando(true);
      try {
        const protocolosData = await buscarProtocolosOperacionaisAtivos();
        setProtocolos(protocolosData);
      } catch (error) {
        console.error('Erro ao carregar protocolos:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os protocolos operacionais.',
          variant: 'destructive',
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarProtocolos();
  }, [toast]);
  
  // Filtrar protocolos com base no termo de busca
  const protocolosFiltrados = protocolos.filter(protocolo => {
    const termoBuscaLower = termoBusca.toLowerCase();
    return (
      protocolo.titulo.toLowerCase().includes(termoBuscaLower) ||
      (protocolo.elaboradores && protocolo.elaboradores.some(e => e.nome.toLowerCase().includes(termoBuscaLower))) ||
      protocolo.conceito.toLowerCase().includes(termoBuscaLower) ||
      protocolo.numeroEdicao.toLowerCase().includes(termoBuscaLower) ||
      protocolo.codificacao.toLowerCase().includes(termoBuscaLower)
    );
  });
  
  const formatarData = (data: any): string => {
    if (!data) return 'Não definida';
    
    try {
      // Se for um Timestamp ou objeto com toDate()
      if (data.toDate) {
        return format(data.toDate(), 'dd/MM/yyyy', { locale: ptBR });
      } 
      // Se for uma string, retornar como está (assumindo que já está formatada corretamente)
      else if (typeof data === 'string') {
        return data;
      }
      // Se for um Date
      else if (data instanceof Date) {
        return format(data, 'dd/MM/yyyy', { locale: ptBR });
      }
      return 'Data inválida';
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };
  
  const abrirPDF = (url: string) => {
    window.open(url, '_blank');
  };
  
  // Formatar texto de elaboradores
  const formatarElaboradores = (protocolo: ProtocoloOperacionalPadrao): string => {
    if (!protocolo.elaboradores || protocolo.elaboradores.length === 0) {
      return "Não informado";
    }
    
    return protocolo.elaboradores
      .map(e => `${e.nome} - ${e.conselho} ${e.numeroRegistro}`)
      .join(', ');
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <NavigationMenu activeItem="pops" />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-csae-green-700 mb-6">
          Protocolos Operacionais Padrão (POPs)
        </h1>
        
        <div className="mb-6 max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Buscar por título, autor ou conteúdo..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {carregando ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Card key={n} className="border rounded-lg shadow-sm opacity-50">
                <CardHeader className="animate-pulse bg-gray-200 h-24 rounded-t-lg" />
                <CardContent className="pt-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                  <div className="h-20 bg-gray-200 rounded mb-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : protocolosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {protocolosFiltrados.map((protocolo) => (
              <Card 
                key={protocolo.id} 
                className="border overflow-hidden hover:shadow-md transition-all"
              >
                {protocolo.imagemCapa ? (
                  <div className="w-full h-40 bg-blue-100 overflow-hidden">
                    <img
                      src={protocolo.imagemCapa}
                      alt={`Capa do POP ${protocolo.titulo}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/400x200/e2e8f0/64748b?text=Sem+imagem";
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-blue-100 flex items-center justify-center">
                    <FileText className="h-12 w-12 text-blue-300" />
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                        {protocolo.numeroEdicao} - {protocolo.codificacao}
                      </Badge>
                      <CardTitle className="text-lg line-clamp-2">{protocolo.titulo}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ScrollArea className="h-24 mb-3">
                    <p className="text-sm text-gray-700">
                      {protocolo.conceito}
                    </p>
                  </ScrollArea>
                  
                  <div className="text-xs text-gray-600 space-y-1 mb-1">
                    <p>
                      Elaborado por: <span className="font-medium">
                        {protocolo.elaboradores && protocolo.elaboradores.length > 0 
                          ? protocolo.elaboradores.map(e => `${e.nome} (${e.conselho} ${e.numeroRegistro})`).join(', ')
                          : "Não informado"
                        }
                      </span>
                    </p>
                    <p>Implantação: <span className="font-medium">{formatarData(protocolo.dataImplantacao)}</span></p>
                    <p>{protocolo.quantidadePaginas} {protocolo.quantidadePaginas === 1 ? 'página' : 'páginas'}</p>
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Button 
                    onClick={() => abrirPDF(protocolo.linkPdf)}
                    className="w-full bg-csae-green-600 hover:bg-csae-green-700"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visualizar POP
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border rounded-lg border-dashed">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            {termoBusca ? (
              <div>
                <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
                <p className="text-gray-500 mt-1">
                  Nenhum protocolo corresponde à busca "{termoBusca}". Tente outros termos.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium">Nenhum protocolo disponível</h3>
                <p className="text-gray-500 mt-1">
                  Nenhum protocolo operacional padrão foi cadastrado no sistema.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      
      <SimpleFooter />
    </div>
  );
};

export default POPs;
