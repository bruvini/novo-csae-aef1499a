import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardDescription, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useToast } from '@/hooks/use-toast';
import { useAutenticacao } from '@/services/autenticacao';
import { motion } from 'framer-motion';
import { 
  ClipboardCheck, FileText, Bandage, BookOpen, Newspaper, 
  Lightbulb, Info, HelpCircle, GraduationCap, Baby, 
  ArrowRight, MessageSquare, Settings, BarChart, Users, User
} from 'lucide-react';
import { obterHistoricoAcessos } from '@/services/bancodados/logAcessosDB';
import { FeedbackPopup } from '@/components/dashboard/FeedbackPopup';

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

const toolsData = [
  {
    id: 1,
    title: "Processo de Enfermagem",
    description: "Acesse e gerencie os processos de enfermagem",
    icon: ClipboardCheck,
    href: "/processo-enfermagem",
    color: "bg-green-50 text-green-700",
  },
  {
    id: 2,
    title: "Protocolos Operacionais Padrão (POPs)",
    description: "Consulte os POPs atualizados",
    icon: FileText,
    href: "/pops",
    color: "bg-blue-50 text-blue-700",
  },
  {
    id: 3,
    title: "Matriciamento de Feridas",
    description: "Gerencie casos e consulte orientações",
    icon: Bandage,
    href: "/feridas",
    color: "bg-amber-50 text-amber-700",
  },
  {
    id: 4,
    title: "Protocolos de Enfermagem",
    description: "Acesse os protocolos vigentes",
    icon: BookOpen,
    href: "/protocolos",
    color: "bg-purple-50 text-purple-700",
  },
  {
    id: 5,
    title: "Notícias",
    description: "Acompanhe as últimas atualizações",
    icon: Newspaper,
    href: "/noticias",
    color: "bg-indigo-50 text-indigo-700",
  },
  {
    id: 6,
    title: "Sugestões",
    description: "Compartilhe suas ideias conosco",
    icon: Lightbulb,
    href: "/sugestoes",
    color: "bg-yellow-50 text-yellow-700",
  },
  {
    id: 7,
    title: "Sobre Nós",
    description: "Conheça nossa comissão",
    icon: Info,
    href: "/timeline",
    color: "bg-rose-50 text-rose-700",
  },
  {
    id: 8,
    title: "F.A.Q.",
    description: "Dúvidas frequentes",
    icon: HelpCircle,
    href: "/faq",
    color: "bg-orange-50 text-orange-700",
  },
  {
    id: 9,
    title: "Minicurso CIPE",
    description: "Aprenda a utilizar o Processo de Enfermagem com CIPE",
    icon: GraduationCap,
    href: "/minicurso-cipe",
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    id: 10,
    title: "Acompanhamento Perinatal",
    description: "Gestão integral do cuidado à gestante, puérpera e criança",
    icon: Baby,
    href: "/acompanhamento-perinatal",
    color: "bg-pink-50 text-pink-700",
  },
];

const Dashboard = () => {
  const { obterSessao, usuario } = useAutenticacao();
  const sessao = obterSessao();
  const [userName, setUserName] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [accessCount, setAccessCount] = useState(0);

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      {showFeedback && usuario && (
        <FeedbackPopup 
          userName={userName}
          accessCount={accessCount} 
          uid={usuario.uid}
          onClose={() => setShowFeedback(false)} 
        />
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
            <BookOpen className="mr-2 h-5 w-5" />
            Ferramentas disponíveis
          </h2>

          <Tabs defaultValue="all" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="clinical">Clínicas</TabsTrigger>
              <TabsTrigger value="educational">Educacionais</TabsTrigger>
              <TabsTrigger value="management">Gestão</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {toolsData.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="clinical">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {toolsData
                  .filter((tool) => [1, 3, 4, 10].includes(tool.id))
                  .map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="educational">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {toolsData
                  .filter((tool) => [2, 5, 7, 8, 9].includes(tool.id))
                  .map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="management">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {toolsData
                  .filter((tool) => [6].includes(tool.id))
                  .map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.main>

      <MainFooter />
    </div>
  );
};

const ToolCard = ({ tool }: { tool: any }) => {
  const IconComponent = tool.icon;

  return (
    <motion.div variants={itemVariants}>
      <Link to={tool.href}>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Card className="h-full bg-white hover:bg-csae-green-50 transition-all duration-300 hover:shadow-md group cursor-pointer border-transparent hover:border-csae-green-200">
              <CardHeader className="pb-2">
                <div
                  className={`rounded-full w-12 h-12 ${tool.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg text-csae-green-700 group-hover:text-csae-green-800">
                  {tool.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{tool.description}</p>
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
                <h4 className="text-sm font-semibold">{tool.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {tool.description}
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

export default Dashboard;
