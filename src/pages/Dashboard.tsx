import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAutenticacao } from '@/services/autenticacao';
import { motion } from 'framer-motion';
import { ClipboardCheck, FileText, Bandage, BookOpen, Newspaper, Lightbulb, Info, HelpCircle, GraduationCap, Baby, ArrowRight, MessageSquare, Settings, BarChart, Users, User, AlertCircle, Loader } from 'lucide-react';
import { obterHistoricoAcessos } from '@/services/bancodados/logAcessosDB';
import { buscarModulosDisponiveis } from '@/services/bancodados/modulosDB';
import { ModuloDisponivel } from '@/types/modulos';
import { FeedbackPopup } from '@/components/dashboard/FeedbackPopup';
import Header from '@/components/Header';
import MainFooter from '@/components/MainFooter';
import * as LucideIcons from "lucide-react";
import { SessaoUsuario } from '@/types/usuario';
import { NPSPopup } from '@/components/dashboard/NPSPopup';
import LoadingOverlay from '@/components/LoadingOverlay';
const containerVariants = {
  hidden: {
    opacity: 0
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};
const itemVariants = {
  hidden: {
    y: 20,
    opacity: 0
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
};
const moduloIconMap: Record<string, React.ElementType> = {
  "processo-enfermagem": ClipboardCheck,
  "pops": FileText,
  "feridas": Bandage,
  "protocolos": BookOpen,
  "noticias": Newspaper,
  "sugestoes": Lightbulb,
  "timeline": Info,
  "faq": HelpCircle,
  "minicurso-cipe": GraduationCap
};
const Dashboard = () => {
  const {
    obterSessao
  } = useAutenticacao();
  const {
    toast
  } = useToast();
  const sessao = obterSessao();
  const [userName, setUserName] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showNPSPopup, setShowNPSPopup] = useState(false);
  const [accessCount, setAccessCount] = useState(0);
  const [modulos, setModulos] = useState<ModuloDisponivel[]>([]);
  const [modulosAtivos, setModulosAtivos] = useState<ModuloDisponivel[]>([]);
  const [modulosInativos, setModulosInativos] = useState<ModuloDisponivel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atuaSMS, setAtuaSMS] = useState(false);

  useEffect(() => {
    const sessao = obterSessao();
    if (sessao?.nomeUsuario) {
      const firstName = sessao.nomeUsuario.split(" ")[0];
      setUserName(firstName);
    }

    // Verificar se usuário atua na SMS
    try {
      if (sessao && sessao.usuario) {
        setAtuaSMS(!!sessao.usuario.atuaSMS);
      }
    } catch (error) {
      console.error("Erro ao verificar atuaSMS:", error);
    }
    
    const checkAccessCount = async () => {
      if (sessao?.uid) {
        try {
          // Obter o histórico de acessos para contar
          const acessos = await obterHistoricoAcessos(sessao.uid);
          const count = acessos.length;
          setAccessCount(count);

          // Check if access count is a multiple of 5 to show NPS popup
          // Mostrar pesquisa NPS a cada 5 acessos
          if (count > 0 && count % 5 === 0) {
            setShowNPSPopup(true);
          }
        } catch (error) {
          console.error("Erro ao verificar quantidade de acessos:", error);
        }
      }
    };
    
    checkAccessCount();
  }, [obterSessao]);

  useEffect(() => {
    const carregarModulos = async () => {
      setCarregando(true);
      try {
        const modulosData = await buscarModulosDisponiveis();
        setModulos(modulosData);

        // Separar módulos ativos e inativos
        const ativos = modulosData.filter(m => m.ativo);
        const inativos = modulosData.filter(m => !m.ativo);
        setModulosAtivos(ativos);
        setModulosInativos(inativos);
      } catch (error) {
        console.error("Erro ao carregar módulos:", error);
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
    const isAdmin = sessao?.tipoUsuario === "Administrador";
    return modulos.filter(modulo => {
      // Administradores podem ver tudo
      if (isAdmin) return true;

      // Verificar regras de visibilidade
      if (modulo.visibilidade === 'admin') return false;
      if (modulo.visibilidade === 'sms' && !atuaSMS) return false;
      return true;
    });
  };

  // Filtrar módulos para exibição no dashboard
  const modulosParaDashboard = filtrarModulosPorVisibilidade(modulosAtivos).filter(modulo => modulo.exibirNoDashboard !== false);

  // Show loading spinner while modules are being loaded
  if (carregando) {
    return <LoadingOverlay />;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {showFeedback && sessao && <FeedbackPopup />}

      {showNPSPopup && <NPSPopup onClose={() => setShowNPSPopup(false)} accessCount={accessCount} />}

      <motion.main initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.5
    }} className="flex-grow container mx-auto px-4 py-8">
        {/* Hero Banner Section */}
        <motion.div initial={{
        y: 20,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        duration: 0.6
      }} className="mb-8">
          <Card className="overflow-hidden">
            <div className="relative flex flex-col md:flex-row">
              <div className="p-6 md:p-8 md:w-[60%] bg-gradient-to-r from-csae-green-50 to-white">
                <motion.div initial={{
                x: -20,
                opacity: 0
              }} animate={{
                x: 0,
                opacity: 1
              }} transition={{
                delay: 0.3
              }}>
                  {userName && <p className="text-csae-green-700 font-medium mb-2">
                      Olá, {userName}!
                    </p>}
                  <h2 className="text-2xl md:text-3xl font-bold text-csae-green-700 mb-3">
                    Bem-vindo(a) ao Portal CSAE Floripa 2.0
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Agradecemos sua participação! Esta ferramenta foi
                    desenvolvida para apoiar as práticas de enfermagem e
                    melhorar a qualidade do atendimento. Sua opinião é
                    importante para nosso aprimoramento contínuo.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link to="/timeline">
                      <Button variant="default" className="bg-csae-green-600 hover:bg-csae-green-700 transition-all duration-300 group">
                        Conhecer nossa história
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Link to="/sugestoes">
                      <Button variant="outline" className="border-csae-green-300 text-csae-green-700 hover:bg-csae-green-50 group">
                        Deixar uma sugestão
                        <MessageSquare className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-[-2px]" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>
              <div className="md:w-[40%] bg-csae-green-100 flex items-center justify-center p-0">
                
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Admin Panel - only visible for admin users */}
        {sessao && sessao.tipoUsuario === "Administrador" && <motion.div initial={{
        y: 20,
        opacity: 0
      }} animate={{
        y: 0,
        opacity: 1
      }} transition={{
        delay: 0.2,
        duration: 0.5
      }} className="mb-8">
            <Card className="border-l-4 border-l-amber-400">
              <CardHeader className="pb-2">
                <CardTitle className="text-csae-green-700 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Painel do Administrador
                </CardTitle>
                <CardDescription>
                  Ferramentas exclusivas para gestão do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white hover:bg-csae-green-50 transition-colors duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="mr-2 h-5 w-5 text-csae-green-600" />
                      Gestão de Usuários
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Gerencie usuários, configure permissões e visualize
                      estatísticas de utilização
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-csae-green-600 hover:bg-csae-green-700" onClick={() => window.location.href = "/gestao-usuarios"}>
                      <User className="mr-2 h-4 w-4" />
                      Acessar
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-white hover:bg-csae-green-50 transition-colors duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BarChart className="mr-2 h-5 w-5 text-csae-green-600" />
                      Relatórios de Uso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Visualize estatísticas de acesso, utilização e métricas de
                      desempenho do sistema
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-csae-green-600 hover:bg-csae-green-700" onClick={() => window.location.href = "/relatorios"}>
                      <BarChart className="mr-2 h-4 w-4" />
                      Visualizar
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-white hover:bg-csae-green-50 transition-colors duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Settings className="mr-2 h-5 w-5 text-csae-green-600" />
                      Gerenciamento de Conteúdos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Atualize protocolos, diagnósticos, intervenções e
                      conteúdos educacionais
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-csae-green-600 hover:bg-csae-green-700" onClick={() => window.location.href = "/gerenciamento-enfermagem"}>
                      <Settings className="mr-2 h-4 w-4" />
                      Gerenciar
                    </Button>
                  </CardFooter>
                </Card>
              </CardContent>
            </Card>
          </motion.div>}

        {/* Tools Section */}
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
              
              {(modulosInativos.length > 0 || carregando) && <TabsTrigger value="coming-soon">
                  Atualizações Futuras{" "}
                  {modulosInativos.length > 0 && <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-700 border-amber-200">
                      {modulosInativos.length}
                    </Badge>}
                </TabsTrigger>}
            </TabsList>

            <TabsContent value="all">
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modulosParaDashboard.filter(modulo => modulo.categoria === "clinico" || modulo.categoria === "educacional" || modulo.categoria === "gestao").map(modulo => <ModuloCard key={modulo.id} modulo={modulo} isAdmin={sessao?.tipoUsuario === "Administrador"} />)}
              </motion.div>
            </TabsContent>

            <TabsContent value="clinical">
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modulosParaDashboard.filter(modulo => modulo.categoria === "clinico").map(modulo => <ModuloCard key={modulo.id} modulo={modulo} isAdmin={sessao?.tipoUsuario === "Administrador"} />)}
              </motion.div>
            </TabsContent>

            <TabsContent value="educational">
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modulosParaDashboard.filter(modulo => modulo.categoria === "educacional").map(modulo => <ModuloCard key={modulo.id} modulo={modulo} isAdmin={sessao?.tipoUsuario === "Administrador"} />)}
              </motion.div>
            </TabsContent>

            <TabsContent value="management">
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modulosParaDashboard.filter(modulo => modulo.categoria === "gestao").map(modulo => <ModuloCard key={modulo.id} modulo={modulo} isAdmin={sessao?.tipoUsuario === "Administrador"} />)}
              </motion.div>
            </TabsContent>
            
            {(modulosInativos.length > 0 || carregando) && <TabsContent value="coming-soon">
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-amber-800">Recursos em desenvolvimento</h3>
                      <p className="text-sm text-amber-700">
                        Estas funcionalidades estão sendo preparadas e estarão disponíveis em breve. Fique atento às atualizações!
                      </p>
                    </div>
                  </div>
                </div>
                
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {modulosInativos.map(modulo => <ModuloInativoCard key={modulo.id} modulo={modulo} />)}
                </motion.div>
              </TabsContent>}
          </Tabs>
        </div>
      </motion.main>

      <MainFooter />
    </div>;
};

// Card para módulos ativos
const ModuloCard = ({
  modulo,
  isAdmin
}: {
  modulo: ModuloDisponivel;
  isAdmin: boolean;
}) => {
  // Função para renderizar ícones dinamicamente
  const renderIcon = () => {
    if (!modulo.icone) return <FileText className="h-6 w-6" />;

    // @ts-ignore - Ignorar erro de tipagem para acessar dinamicamente os ícones
    const IconComponent = LucideIcons[modulo.icone] || LucideIcons.FileText;
    return <IconComponent className="h-6 w-6" />;
  };

  // Definir as cores do card com base na categoria
  const colorsByCategory: Record<string, string> = {
    "clinico": "bg-green-50 text-green-700",
    "educacional": "bg-blue-50 text-blue-700",
    "gestao": "bg-amber-50 text-amber-700"
  };
  const color = colorsByCategory[modulo.categoria] || "bg-gray-50 text-gray-700";
  return <motion.div variants={itemVariants}>
      <Link to={modulo.slug || `/${modulo.nome}`}>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Card className="h-full bg-white hover:bg-csae-green-50 transition-all duration-300 hover:shadow-md group cursor-pointer border-transparent hover:border-csae-green-200">
              <CardHeader className="pb-2">
                <div className={`rounded-full w-12 h-12 ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  {renderIcon()}
                </div>
                <CardTitle className="text-lg text-csae-green-700 group-hover:text-csae-green-800">
                  {modulo.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{modulo.descricao}</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="p-0 text-csae-green-600 hover:text-csae-green-700 hover:bg-transparent group-hover:translate-x-1 transition-transform">
                  <span>Acessar</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="flex justify-between space-x-4">
              <div>
                <h4 className="text-sm font-semibold">{modulo.titulo}</h4>
                <p className="text-sm text-muted-foreground">
                  {modulo.descricao}
                </p>
                <div className="flex items-center pt-2">
                  <span className="text-xs text-csae-green-600">
                    Clique para acessar
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </Link>
    </motion.div>;
};

// Card para módulos inativos (em desenvolvimento)
const ModuloInativoCard = ({
  modulo
}: {
  modulo: ModuloDisponivel;
}) => {
  // Função para renderizar ícones dinamicamente
  const renderIcon = () => {
    if (!modulo.icone) return <FileText className="h-6 w-6" />;

    // @ts-ignore - Ignorar erro de tipagem para acessar dinamicamente os ícones
    const IconComponent = LucideIcons[modulo.icone] || LucideIcons.FileText;
    return <IconComponent className="h-6 w-6" />;
  };

  // Definir as cores do card com base na categoria
  const colorsByCategory: Record<string, string> = {
    "clinico": "bg-green-50 text-green-700",
    "educacional": "bg-blue-50 text-blue-700",
    "gestao": "bg-amber-50 text-amber-700"
  };
  const color = colorsByCategory[modulo.categoria] || "bg-gray-50 text-gray-700";
  return <motion.div variants={itemVariants}>
      <Card className="h-full bg-gray-50 border-dashed border transition-all">
        <CardHeader className="pb-2">
          <div className={`rounded-full w-12 h-12 ${color} flex items-center justify-center mb-3 opacity-70`}>
            {renderIcon()}
          </div>
          <CardTitle className="text-lg text-gray-600 flex items-center">
            {modulo.titulo}
            <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-700 border-amber-200">
              Em breve
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">{modulo.descricao}</p>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="p-0 text-gray-400 cursor-not-allowed" disabled>
            <span>Em desenvolvimento</span>
            <AlertCircle className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>;
};
export default Dashboard;
