
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
import * as LucideIcons from 'lucide-react';
import { 
  ArrowRight, MessageSquare, Settings, BarChart, Users, User,
  AlertCircle
} from 'lucide-react';
import { obterHistoricoAcessos } from '@/services/bancodados/logAcessosDB';
import { buscarModulosVisiveis } from '@/services/bancodados/modulosDB';
import { ModuloDisponivel } from '@/types/modulos';
import { FeedbackPopup } from '@/components/dashboard/FeedbackPopup';
import Header from '@/components/Header';
import MainFooter from '@/components/MainFooter';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

// Mapa de ícones por nome do módulo
const iconMap: {[key: string]: keyof typeof LucideIcons} = {
  "processo-enfermagem": "ClipboardCheck",
  "pops": "FileText",
  "feridas": "Bandage",
  "protocolos": "BookOpen",
  "noticias": "Newspaper",
  "sugestoes": "Lightbulb",
  "timeline": "Clock",
  "faq": "HelpCircle",
  "minicurso-cipe": "GraduationCap",
  "acompanhamento-perinatal": "Baby",
};

const Dashboard = () => {
  const { obterSessao, usuario, verificarAdmin } = useAutenticacao();
  const { toast } = useToast();
  const sessao = obterSessao();
  const [userName, setUserName] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [accessCount, setAccessCount] = useState(0);
  const [modulos, setModulos] = useState<ModuloDisponivel[]>([]);
  const [modulosAtivos, setModulosAtivos] = useState<ModuloDisponivel[]>([]);
  const [modulosInativos, setModulosInativos] = useState<ModuloDisponivel[]>([]);
  const [modulosFiltrados, setModulosFiltrados] = useState<ModuloDisponivel[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("all");
  const [carregando, setCarregando] = useState(true);
  const isAdmin = verificarAdmin();
  const atuaSMS = sessao?.atuaSMS === true;
  
  useEffect(() => {
    const sessao = obterSessao();
    if (sessao?.nomeUsuario) {
      const firstName = sessao.nomeUsuario.split(" ")[0];
      setUserName(firstName);
    }

    const checkAccessCount = async () => {
      if (usuario?.uid) {
        const acessos = await obterHistoricoAcessos(usuario.uid);
        const count = acessos.length;
        setAccessCount(count);
        
        if (count > 0 && count % 5 === 0) {
          setShowFeedback(true);
        }
      }
    };

    checkAccessCount();
  }, [obterSessao, usuario]);

  useEffect(() => {
    const carregarModulos = async () => {
      setCarregando(true);
      try {
        const modulosData = await buscarModulosVisiveis(isAdmin, atuaSMS);
        setModulos(modulosData);
        
        // Separar módulos ativos e inativos, mas que são para exibir no dashboard
        const ativos = modulosData.filter(m => m.ativo && m.exibirDashboard);
        const inativos = modulosData.filter(m => !m.ativo && m.exibirDashboard);
        
        setModulosAtivos(ativos);
        setModulosInativos(inativos);
        setModulosFiltrados(ativos); // Por padrão, mostra os ativos
      } catch (error) {
        console.error("Erro ao carregar módulos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as funcionalidades do sistema.",
          variant: "destructive",
        });
      } finally {
        setCarregando(false);
      }
    };
    
    carregarModulos();
  }, [toast, isAdmin, atuaSMS]);

  // Filtrar módulos por categoria
  useEffect(() => {
    if (filtroCategoria === "all") {
      setModulosFiltrados(modulosAtivos);
    } else if (filtroCategoria === "coming-soon") {
      setModulosFiltrados(modulosInativos);
    } else {
      setModulosFiltrados(
        modulosAtivos.filter(m => m.categoria === filtroCategoria)
      );
    }
  }, [filtroCategoria, modulosAtivos, modulosInativos]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {showFeedback && usuario && (
        <FeedbackPopup />
      )}

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-grow container mx-auto px-4 py-8"
      >
        {/* Hero Banner Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="overflow-hidden">
            <div className="relative flex flex-col md:flex-row">
              <div className="p-6 md:p-8 md:w-[60%] bg-gradient-to-r from-csae-green-50 to-white">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {userName && (
                    <p className="text-csae-green-700 font-medium mb-2">
                      Olá, {userName}!
                    </p>
                  )}
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
                      <Button
                        variant="default"
                        className="bg-csae-green-600 hover:bg-csae-green-700 transition-all duration-300 group"
                      >
                        Conhecer nossa história
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                    <Link to="/sugestoes">
                      <Button
                        variant="outline"
                        className="border-csae-green-300 text-csae-green-700 hover:bg-csae-green-50 group"
                      >
                        Deixar uma sugestão
                        <MessageSquare className="ml-2 h-4 w-4 transition-transform group-hover:translate-y-[-2px]" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              </div>
              <div className="md:w-[40%] p-4 flex items-center justify-center">
                <img
                  src="/lovable-uploads/a3616818-d7e5-4c43-bcf2-e813b28f2a1e.png"
                  alt="Enfermeira com laptop mostrando o Portal CSAE"
                  className="w-full h-auto object-contain max-h-64"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Admin Panel - only visible for admin users */}
        {sessao && sessao.tipoUsuario === "Administrador" && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
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
                    <Button
                      className="w-full bg-csae-green-600 hover:bg-csae-green-700"
                      onClick={() =>
                        (window.location.href = "/gestao-usuarios")
                      }
                    >
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
                    <Button
                      className="w-full bg-csae-green-600 hover:bg-csae-green-700"
                      onClick={() => (window.location.href = "/relatorios")}
                    >
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
                    <Button
                      className="w-full bg-csae-green-600 hover:bg-csae-green-700"
                      onClick={() =>
                        (window.location.href = "/gerenciamento-enfermagem")
                      }
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Gerenciar
                    </Button>
                  </CardFooter>
                </Card>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tools Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-csae-green-700 mb-6 flex items-center">
            <LucideIcons.BookOpen className="mr-2 h-5 w-5" />
            Ferramentas disponíveis
          </h2>

          <Tabs defaultValue="all" className="mb-6" value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="clinico">Clínicas</TabsTrigger>
              <TabsTrigger value="educacional">Educacionais</TabsTrigger>
              <TabsTrigger value="gestao">Gestão</TabsTrigger>
              
              {/* Mostrar a aba de atualizações futuras apenas se houver módulos inativos */}
              {(modulosInativos.length > 0 || carregando) && (
                <TabsTrigger value="coming-soon">
                  Atualizações Futuras{" "}
                  {modulosInativos.length > 0 && (
                    <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-700 border-amber-200">
                      {modulosInativos.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Tab content */}
            {filtroCategoria !== "coming-soon" ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {modulosFiltrados.map((modulo) => (
                  <ModuloCard key={modulo.id} modulo={modulo} isAdmin={isAdmin} />
                ))}
                
                {modulosFiltrados.length === 0 && !carregando && (
                  <div className="col-span-full p-8 text-center border rounded-lg border-dashed">
                    <LucideIcons.Search className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <h3 className="text-lg font-medium mb-1">Nenhum módulo disponível</h3>
                    <p className="text-gray-500">
                      Não há módulos disponíveis para esta categoria.
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              // Coming soon tab
              <>
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
                
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {modulosInativos.map((modulo) => (
                    <ModuloInativoCard key={modulo.id} modulo={modulo} />
                  ))}
                  
                  {modulosInativos.length === 0 && !carregando && (
                    <div className="col-span-full p-8 text-center border rounded-lg border-dashed">
                      <LucideIcons.Check className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                      <h3 className="text-lg font-medium mb-1">Sem atualizações pendentes</h3>
                      <p className="text-gray-500">
                        Não há módulos em desenvolvimento no momento.
                      </p>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </Tabs>
        </div>
      </motion.main>

      <MainFooter />
    </div>
  );
};

// Card para módulos ativos
const ModuloCard = ({ modulo, isAdmin }: { modulo: ModuloDisponivel, isAdmin: boolean }) => {
  // Determinar o ícone a ser usado
  let IconComponent: React.ElementType;
  
  if (modulo.icone && LucideIcons[modulo.icone as keyof typeof LucideIcons]) {
    IconComponent = LucideIcons[modulo.icone as keyof typeof LucideIcons];
  } else if (iconMap[modulo.nome]) {
    IconComponent = LucideIcons[iconMap[modulo.nome]];
  } else {
    // Fallback para Settings se o ícone não for encontrado
    IconComponent = LucideIcons.Settings;
  }

  // Definir as cores do card com base na categoria
  const colorsByCategory: Record<string, string> = {
    "clinico": "bg-green-50 text-green-700",
    "educacional": "bg-blue-50 text-blue-700",
    "gestao": "bg-amber-50 text-amber-700"
  };
  
  const color = colorsByCategory[modulo.categoria] || "bg-gray-50 text-gray-700";

  return (
    <motion.div variants={itemVariants}>
      <Link to={`/${modulo.nome}`}>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Card className="h-full bg-white hover:bg-csae-green-50 transition-all duration-300 hover:shadow-md group cursor-pointer border-transparent hover:border-csae-green-200">
              <CardHeader className="pb-2">
                <div
                  className={`rounded-full w-12 h-12 ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg text-csae-green-700 group-hover:text-csae-green-800">
                  {modulo.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{modulo.descricao}</p>
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  className="p-0 text-csae-green-600 hover:text-csae-green-700 hover:bg-transparent group-hover:translate-x-1 transition-transform"
                >
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
    </motion.div>
  );
};

// Card para módulos inativos (em desenvolvimento)
const ModuloInativoCard = ({ modulo }: { modulo: ModuloDisponivel }) => {
  // Determinar o ícone a ser usado
  let IconComponent: React.ElementType;
  
  if (modulo.icone && LucideIcons[modulo.icone as keyof typeof LucideIcons]) {
    IconComponent = LucideIcons[modulo.icone as keyof typeof LucideIcons];
  } else if (iconMap[modulo.nome]) {
    IconComponent = LucideIcons[iconMap[modulo.nome]];
  } else {
    // Fallback para Settings se o ícone não for encontrado
    IconComponent = LucideIcons.Settings;
  }

  // Definir as cores do card com base na categoria
  const colorsByCategory: Record<string, string> = {
    "clinico": "bg-green-50 text-green-700",
    "educacional": "bg-blue-50 text-blue-700",
    "gestao": "bg-amber-50 text-amber-700"
  };
  
  const color = colorsByCategory[modulo.categoria] || "bg-gray-50 text-gray-700";

  return (
    <motion.div variants={itemVariants}>
      <Card className="h-full bg-gray-50 border-dashed border transition-all">
        <CardHeader className="pb-2">
          <div
            className={`rounded-full w-12 h-12 ${color} flex items-center justify-center mb-3 opacity-70`}
          >
            <IconComponent className="h-6 w-6" />
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
          <Button
            variant="ghost"
            className="p-0 text-gray-400 cursor-not-allowed"
            disabled
          >
            <span>Em desenvolvimento</span>
            <AlertCircle className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default Dashboard;
