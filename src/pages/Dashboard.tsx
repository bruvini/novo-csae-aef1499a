import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAutenticacao } from '@/services/autenticacao';
import { buscarModulosAtivos } from '@/services/bancodados/modulosDB';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as LucideIcons from 'lucide-react';
import { AlertCircle, Users, AlertTriangle, Info, LayoutDashboard, ArrowRight, Calendar, BookOpen } from 'lucide-react';
import { ElementType, ComponentType } from 'react';  // Import ElementType properly
import { ModuloDashboard } from '@/services/bancodados/modulosDB';

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const { usuario, verificarAdmin } = useAutenticacao();
  const [visibleModules, setVisibleModules] = useState<ModuloDashboard[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadModules = async () => {
      setLoading(true);
      try {
        const modules = await buscarModulosAtivos();
        setVisibleModules(modules);
      } catch (error) {
        console.error("Erro ao carregar módulos:", error);
        toast({
          title: "Erro ao carregar módulos",
          description: "Tente novamente mais tarde.",
          variant: "destructive",
        });
        setVisibleModules([]);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  useEffect(() => {
    setIsAdmin(verificarAdmin());
  }, [verificarAdmin]);

  // Lista de módulos disponíveis atualizada para remover os módulos que não existem mais
  const modulos = [
    {
      id: 'processo-enfermagem',
      nome: 'Processo de Enfermagem',
      descricao: 'Registre e acompanhe o processo de enfermagem',
      icone: ClipboardIcon,
      link: '/processo-enfermagem',
      cor: 'bg-blue-500'
    },
    {
      id: 'protocolos',
      nome: 'Protocolos',
      descricao: 'Consulte protocolos de enfermagem',
      icone: FileIcon,
      link: '/protocolos',
      cor: 'bg-green-500'
    },
    {
      id: 'pops',
      nome: 'POPs',
      descricao: 'Procedimentos operacionais padrão',
      icone: FileTypeIcon,
      link: '/pops',
      cor: 'bg-amber-500'
    },
    // Removidas as entradas para o Acompanhamento Perinatal e Minicurso CIPE
  ];

  // Placeholder data for alerts
  const alerts = [
    {
      id: 1,
      title: "Próxima Reunião de Equipe",
      description: "Lembre-se da reunião de equipe agendada para amanhã às 10h.",
      type: "info",
    },
    {
      id: 2,
      title: "Atualização Urgente",
      description: "Por favor, atualize o protocolo de segurança até o final da semana.",
      type: "warning",
    },
  ];

  // Placeholder data for quick actions
  const quickActions = [
    {
      id: 1,
      title: "Novo Paciente",
      description: "Adicionar um novo paciente ao sistema.",
      icon: "UserPlus",
      link: "/novo-paciente",
    },
    {
      id: 2,
      title: "Agendar Consulta",
      description: "Agendar uma nova consulta para um paciente existente.",
      icon: "CalendarPlus",
      link: "/agendar-consulta",
    },
  ];

  // Fix for icon rendering
  const renderIconFromName = (iconName: string): JSX.Element => {
    const IconComponent = (LucideIcons[iconName as keyof typeof LucideIcons] || LucideIcons.Box) as ComponentType<any>;
    return <IconComponent className="h-5 w-5 text-csae-green-600" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto my-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Carregando...</AlertTitle>
          <AlertDescription>Aguarde enquanto os módulos são carregados.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | CSAE</title>
      </Helmet>

      <div className="container mx-auto my-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <LayoutDashboard className="h-8 w-8 text-csae-green-600" />
              <h1 className="text-2xl font-bold tracking-tight text-csae-green-800">
                Dashboard
              </h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {usuario ? (
                  <>
                    Bem-vindo(a),{" "}
                    <span className="font-medium">{usuario.displayName || usuario.email}</span>!
                  </>
                ) : (
                  "Bem-vindo(a)!"
                )}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          <Tabs defaultValue="modules" className="space-y-4">
            <TabsList>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
              {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
            </TabsList>

            <TabsContent value="modules" className="space-y-4">
              <h2 className="text-lg font-semibold text-csae-green-700">
                Acesso Rápido aos Módulos
              </h2>
              <p className="text-sm text-gray-500">
                Selecione um módulo para acessar suas funcionalidades.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleModules.map((module) => {
                  // Cast icon component to ComponentType
                  const IconComponent = module.icone
                    ? (LucideIcons[module.icone as keyof typeof LucideIcons] as ComponentType<any>)
                    : (LucideIcons.Box as ComponentType<any>);

                  return (
                    <Card key={module.id} className="hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <IconComponent className="h-5 w-5 text-csae-green-600" />
                          {module.titulo}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">{module.descricao}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2"></CardContent>
                      <CardFooter>
                        <Button asChild className="w-full">
                          <Link to={`/${module.nome}`}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Acessar
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <h2 className="text-lg font-semibold text-csae-green-700">
                Alertas e Notificações
              </h2>
              <p className="text-sm text-gray-500">
                Fique por dentro das últimas atualizações e lembretes importantes.
              </p>

              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Alert key={alert.id} variant={alert.type}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </Alert>
                ))}
                {alerts.length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Sem alertas no momento</AlertTitle>
                    <AlertDescription>
                      Verifique novamente mais tarde para novas notificações.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="space-y-4">
                <h2 className="text-lg font-semibold text-csae-green-700">
                  Ações Administrativas
                </h2>
                <p className="text-sm text-gray-500">
                  Acesso rápido para gerenciar o sistema.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <Card key={action.id} className="hover:shadow-md transition-all">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {renderIconFromName(action.icon)}
                          {action.title}
                        </CardTitle>
                        <CardDescription>{action.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2"></CardContent>
                      <CardFooter>
                        <Button asChild className="w-full">
                          <Link to={action.link}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Acessar
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
