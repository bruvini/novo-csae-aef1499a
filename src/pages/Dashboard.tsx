
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAutenticacao } from '@/hooks/useAutenticacao';
import { motion } from 'framer-motion';
import { obterHistoricoAcessos } from '@/services/bancodados/logAcessosDB';
import { buscarModulosDisponiveis } from '@/services/bancodados/modulosDB';
import { ModuloDisponivel } from '@/types/modulos';
import { FeedbackPopup } from '@/components/dashboard/FeedbackPopup';
import { NPSPopup } from '@/components/dashboard/NPSPopup';
import Header from '@/components/Header';
import MainFooter from '@/components/MainFooter';
import LoadingOverlay from '@/components/LoadingOverlay';
import { DashboardBanner } from '@/components/dashboard/DashboardBanner';
import { AdminPanel } from '@/components/dashboard/AdminPanel';
import { ModuloCard, ModuloInativoCard } from '@/components/dashboard/ModuloCards';
import { containerVariants } from '@/components/dashboard/animations';
import { ClipboardCheck, FileText, BookOpen } from 'lucide-react';

const Dashboard = () => {
  const { obterSessao } = useAutenticacao();
  const { toast } = useToast();
  
  const [sessao, setSessao] = useState(null);
  const [userName, setUserName] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showNPSPopup, setShowNPSPopup] = useState(false);
  const [accessCount, setAccessCount] = useState(0);
  const [modulos, setModulos] = useState<ModuloDisponivel[]>([]);
  const [modulosAtivos, setModulosAtivos] = useState<ModuloDisponivel[]>([]);
  const [modulosInativos, setModulosInativos] = useState<ModuloDisponivel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atuaSMS, setAtuaSMS] = useState(false);

  // Gerenciar sessão de forma controlada
  useEffect(() => {
    try {
      const sessaoAtual = obterSessao();
      setSessao(sessaoAtual);
      
      if (sessaoAtual?.nomeUsuario) {
        const firstName = sessaoAtual.nomeUsuario.split(" ")[0];
        setUserName(firstName);
      }

      // Verificar se usuário atua na SMS
      if (sessaoAtual?.usuario?.atuaSMS) {
        setAtuaSMS(true);
      }
    } catch (error) {
      console.error("Erro ao obter sessão:", error);
    }
  }, [obterSessao]);

  // Gerenciar contagem de acessos
  useEffect(() => {
    const checkAccessCount = async () => {
      if (sessao?.uid) {
        try {
          const acessos = await obterHistoricoAcessos(sessao.uid);
          const count = acessos.length;
          setAccessCount(count);

          // Mostrar pesquisa NPS a cada 5 acessos
          if (count > 0 && count % 5 === 0) {
            setShowNPSPopup(true);
          }
        } catch (error) {
          console.error("Erro ao verificar quantidade de acessos:", error);
        }
      }
    };
    
    if (sessao) {
      checkAccessCount();
    }
  }, [sessao]);

  // Carregar módulos
  useEffect(() => {
    const carregarModulos = async () => {
      setCarregando(true);
      try {
        const modulosData = await buscarModulosDisponiveis();
        
        // Garantir que modulosData é um array válido
        const modulosValidos = Array.isArray(modulosData) ? modulosData : [];
        setModulos(modulosValidos);

        // Separar módulos ativos e inativos com proteção
        const ativos = modulosValidos.filter(m => m && m.ativo === true);
        const inativos = modulosValidos.filter(m => m && m.ativo === false);
        setModulosAtivos(ativos);
        setModulosInativos(inativos);
      } catch (error) {
        console.error("Erro ao carregar módulos:", error);
        
        // Em caso de erro, definir arrays vazios para evitar undefined
        setModulos([]);
        setModulosAtivos([]);
        setModulosInativos([]);
        
        toast({
          title: "Erro",
          description: "Não foi possível carregar as funcionalidades do sistema.",
          variant: "destructive"
        });
      } finally {
        setCarregando(false);
      }
    };
    carregarModulos();
  }, [toast]);

  // Filtrar módulos com base na visibilidade e permissões do usuário
  const filtrarModulosPorVisibilidade = (modulos: ModuloDisponivel[]) => {
    if (!sessao || !Array.isArray(modulos)) return [];
    
    const isAdmin = sessao.tipoUsuario === "Administrador";
    return modulos.filter(modulo => {
      // Verificar se o módulo é válido
      if (!modulo || typeof modulo !== 'object') return false;
      
      // Administradores podem ver tudo
      if (isAdmin) return true;

      // Verificar regras de visibilidade
      if (modulo.visibilidade === 'admin') return false;
      if (modulo.visibilidade === 'sms' && !atuaSMS) return false;
      return true;
    });
  };

  // Filtrar módulos para exibição no dashboard com proteções
  const modulosParaDashboard = filtrarModulosPorVisibilidade(modulosAtivos)
    .filter(modulo => modulo && modulo.exibirNoDashboard !== false);

  // Função para renderizar módulos com proteção contra arrays vazios
  const renderizarModulos = (modulosFiltrados: ModuloDisponivel[], categoria?: string) => {
    if (!Array.isArray(modulosFiltrados)) {
      return (
        <div className="text-center py-10 text-gray-500">
          <p>Erro ao carregar módulos</p>
        </div>
      );
    }

    const modulosParaRender = categoria 
      ? modulosFiltrados.filter(modulo => modulo && modulo.categoria === categoria)
      : modulosFiltrados;

    if (modulosParaRender.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          <p>Nenhum módulo disponível nesta categoria</p>
        </div>
      );
    }

    return (
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {modulosParaRender.map(modulo => {
          // Verificar se o módulo é válido antes de renderizar
          if (!modulo || !modulo.id) {
            console.warn('Módulo inválido encontrado:', modulo);
            return null;
          }
          
          return (
            <ModuloCard 
              key={modulo.id} 
              modulo={modulo} 
              isAdmin={sessao?.tipoUsuario === "Administrador"} 
            />
          );
        })}
      </motion.div>
    );
  };

  // Show loading spinner while modules are being loaded
  if (carregando) {
    return <LoadingOverlay />;
  }

  // Se não há sessão, retornar null para evitar renderização
  if (!sessao) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {showFeedback && <FeedbackPopup />}
      {showNPSPopup && <NPSPopup onClose={() => setShowNPSPopup(false)} accessCount={accessCount} />}

      <motion.main 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.5 }}
        className="flex-grow container mx-auto px-4 py-8"
      >
        <DashboardBanner userName={userName} />

        {sessao?.tipoUsuario === 'Administrador' && (
          <AdminPanel />
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-csae-green-700 mb-6 flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Ferramentas disponíveis
          </h2>

          <Tabs defaultValue="all" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="clinical">Clínicas</TabsTrigger>
              <TabsTrigger value="educational">Educacionais</TabsTrigger>
              <TabsTrigger value="management">Gestão</TabsTrigger>
              
              {(Array.isArray(modulosInativos) && modulosInativos.length > 0) && (
                <TabsTrigger value="coming-soon">
                  Atualizações Futuras{" "}
                  <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-700 border-amber-200">
                    {modulosInativos.length}
                  </Badge>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="all">
              {renderizarModulos(modulosParaDashboard)}
            </TabsContent>

            <TabsContent value="clinical">
              {renderizarModulos(modulosParaDashboard, "clinico")}
            </TabsContent>

            <TabsContent value="educational">
              {renderizarModulos(modulosParaDashboard, "educacional")}
            </TabsContent>

            <TabsContent value="management">
              {renderizarModulos(modulosParaDashboard, "gestao")}
            </TabsContent>
            
            {(Array.isArray(modulosInativos) && modulosInativos.length > 0) && (
              <TabsContent value="coming-soon">
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <div>
                      <h3 className="font-medium text-amber-800">Recursos em desenvolvimento</h3>
                      <p className="text-sm text-amber-700">
                        Estas funcionalidades estão sendo preparadas e estarão disponíveis em breve. Fique atento às atualizações!
                      </p>
                    </div>
                  </div>
                </div>
                
                <motion.div 
                  variants={containerVariants} 
                  initial="hidden" 
                  animate="visible" 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {modulosInativos.map(modulo => {
                    if (!modulo || !modulo.id) {
                      console.warn('Módulo inativo inválido encontrado:', modulo);
                      return null;
                    }
                    return (
                      <ModuloInativoCard key={modulo.id} modulo={modulo} />
                    );
                  })}
                </motion.div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </motion.main>

      <MainFooter />
    </div>
  );
};

export default Dashboard;
