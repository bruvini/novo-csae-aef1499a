import React from 'react';
import Header from '@/components/Header';
import MainFooter from '@/components/MainFooter';
import MenuCard from '@/components/MenuCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ClipboardCheck, 
  FileText, 
  Bandage, 
  BookOpen, 
  Newspaper, 
  Lightbulb,  // Corrected from LightBulb to Lightbulb
  Info, 
  HelpCircle, 
  Users, 
  BarChart
} from 'lucide-react';
import { useAutenticacao } from '@/services/autenticacao';

const Dashboard = () => {
  // Obtemos a sessão salva que contém os dados do usuário autenticado.
  const { obterSessao } = useAutenticacao();
  const sessao = obterSessao();

  // Dados dos cards de menu
  const menuItems = [
    {
      id: 1,
      title: 'Processo de Enfermagem',
      description: 'Acesse e gerencie os processos de enfermagem',
      icon: ClipboardCheck,
      href: '/processo-enfermagem'
    },
    {
      id: 2,
      title: 'Protocolos Operacionais Padrão (POPs)',
      description: 'Consulte os POPs atualizados',
      icon: FileText,
      href: '/pops'
    },
    {
      id: 3,
      title: 'Matriciamento de Feridas',
      description: 'Gerencie casos e consulte orientações',
      icon: Bandage,
      href: '/feridas'
    },
    {
      id: 4,
      title: 'Protocolos de Enfermagem',
      description: 'Acesse os protocolos vigentes',
      icon: BookOpen,
      href: '/protocolos'
    },
    {
      id: 5,
      title: 'Notícias',
      description: 'Acompanhe as últimas atualizações',
      icon: Newspaper,
      href: '/noticias'
    },
    {
      id: 6,
      title: 'Sugestões',
      description: 'Compartilhe suas ideias conosco',
      icon: Lightbulb,
      href: '/sugestoes'
    },
    {
      id: 7,
      title: 'Sobre a CSAE',
      description: 'Conheça nossa comissão',
      icon: Info,
      href: '/sobre'
    },
    {
      id: 8,
      title: 'F.A.Q.',
      description: 'Dúvidas frequentes',
      icon: HelpCircle,
      href: '/faq'
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-csae-light">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Bloco de Agradecimento */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-csae-green-700">Agradecemos sua participação!</CardTitle>
            <CardDescription className="text-base">
              Obrigado por utilizar o Portal CSAE Floripa 2.0. Ajude-nos a melhorar compartilhando esta ferramenta com seus colegas enfermeiros. Sua opinião é muito importante - não deixe de participar da pesquisa de satisfação quando aparecer o aviso.
            </CardDescription>
          </CardHeader>
        </Card>
        
        {/* Seção para Administradores - exibida somente se o tipoUsuario for 'Administrador' */}
        {sessao && sessao.tipoUsuario === 'Administrador' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-csae-green-700">Ferramentas Exclusivas para Administradores</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button 
                className="bg-csae-green-600 hover:bg-csae-green-700 flex items-center gap-2"
                onClick={() => window.location.href = '/gestao-usuarios'}
              >
                <Users className="h-4 w-4" />
                Gestão de Usuários
              </Button>
              <Button 
                variant="outline"
                className="text-csae-green-700 border-csae-green-300 hover:bg-csae-green-50 flex items-center gap-2"
                onClick={() => window.location.href = '/relatorios'}
              >
                <BarChart className="h-4 w-4" />
                Relatórios de Uso
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Cards de Menu */}
        <h2 className="text-2xl font-semibold text-csae-green-700 mb-6">Ferramentas disponíveis</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {menuItems.map((item) => (
            <MenuCard
              key={item.id}
              title={item.title}
              description={item.description}
              icon={item.icon}
              href={item.href}
            />
          ))}
        </div>
      </main>
      
      <MainFooter />
    </div>
  );
};

export default Dashboard;
