
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, Search, ExternalLink } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ProtocoloEnfermagem } from '@/services/bancodados/tipos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import SimpleFooter from '@/components/SimpleFooter';

const ProtocolosEnfermagemPage = () => {
  const [protocolos, setProtocolos] = useState<ProtocoloEnfermagem[]>([]);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarProtocolos = async () => {
      try {
        const protocolosRef = collection(db, 'protocolosEnfermagem');
        const protocolosSnapshot = await getDocs(protocolosRef);
        const protocolosData = protocolosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ProtocoloEnfermagem[];
        setProtocolos(protocolosData);
      } catch (error) {
        console.error("Erro ao carregar protocolos:", error);
      } finally {
        setCarregando(false);
      }
    };
    
    carregarProtocolos();
  }, []);

  const filtrarProtocolos = () => {
    return protocolos.filter(protocolo => 
      protocolo.nome.toLowerCase().includes(filtroBusca.toLowerCase()) || 
      protocolo.volume.toLowerCase().includes(filtroBusca.toLowerCase()) ||
      protocolo.descricao.toLowerCase().includes(filtroBusca.toLowerCase())
    );
  };

  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'Data não definida';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return 'Data inválida';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <NavigationMenu activeItem="protocolos" />
      
      <main className="flex-grow container max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-csae-green-700 mb-2">
          Biblioteca de Protocolos de Enfermagem
        </h1>
        <p className="text-gray-600 mb-8">
          Acesso aos protocolos oficiais de enfermagem da Secretaria Municipal de Saúde.
        </p>
        
        <div className="flex items-center mb-8">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder="Buscar protocolos..."
              className="pl-10"
              value={filtroBusca}
              onChange={(e) => setFiltroBusca(e.target.value)}
            />
          </div>
        </div>
        
        {carregando ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-csae-green-600"></div>
          </div>
        ) : filtrarProtocolos().length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-xl font-medium text-gray-600">Nenhum protocolo encontrado</h3>
            <p className="text-gray-500 mt-2">
              {filtroBusca ? 'Tente outros termos de busca.' : 'Não há protocolos disponíveis no momento.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtrarProtocolos().map((protocolo) => (
              <Card key={protocolo.id} className="transition-all hover:shadow-md">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-csae-green-600 mb-1">{protocolo.volume}</div>
                      <CardTitle className="text-xl">{protocolo.nome}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-4">
                  <div className="aspect-video bg-gray-100 rounded-md mb-4 flex items-center justify-center overflow-hidden">
                    {protocolo.linkImagem ? (
                      <img 
                        src={protocolo.linkImagem} 
                        alt={`Capa do ${protocolo.nome}`} 
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    ) : (
                      <FileText className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  
                  <CardDescription className="text-sm line-clamp-3 h-14">
                    {protocolo.descricao}
                  </CardDescription>
                </CardContent>
                
                <CardFooter className="flex flex-col items-start pt-0">
                  <div className="flex items-center text-sm text-gray-500 mb-3 w-full">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="mr-2">Publicado:</span>
                    <span className="font-medium">{formatarData(protocolo.dataPublicacao)}</span>
                    
                    {protocolo.dataAtualizacao && (
                      <span className="ml-auto text-xs bg-csae-green-100 text-csae-green-800 px-2 py-0.5 rounded">
                        Atualizado: {formatarData(protocolo.dataAtualizacao)}
                      </span>
                    )}
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => window.open(protocolo.linkPdf, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Protocolo
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <SimpleFooter />
    </div>
  );
};

export default ProtocolosEnfermagemPage;
