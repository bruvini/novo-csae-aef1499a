import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Database, Users, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { buscarUsuariosAguardando } from '@/services/bancodados';

const NavigationCards = () => {
  const { sessionData } = useAuth();
  const [usuariosAguardandoCount, setUsuariosAguardandoCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      if (sessionData?.ehAdmin) {
        try {
          const usuarios = await buscarUsuariosAguardando();
          setUsuariosAguardandoCount(usuarios.length);
        } catch (error) {
          console.error("Erro ao buscar contagem de usuários:", error);
        }
      }
    };
    fetchCount();
  }, [sessionData]);

  const navigationItems = [
    {
      id: 'processo-enfermagem',
      title: 'Processo de Enfermagem',
      description: 'Ferramenta completa para realizar e acompanhar o Processo de Enfermagem com base nas melhores práticas científicas.',
      icon: Heart,
      href: '/processo-enfermagem',
      status: 'Disponível',
      disabled: false,
      roles: ['any'],
    },
    {
      id: 'gestao-conteudos',
      title: 'Gestão de Conteúdos',
      description: 'Área administrativa para gerenciar e atualizar os conteúdos do banco de dados do sistema.',
      icon: Database,
      href: '/gestao-conteudos',
      status: 'Disponível',
      disabled: false,
      roles: ['gestor', 'admin'],
    },
    {
      id: 'gestao-usuarios',
      title: 'Gestão de Usuários',
      description: 'Painel de controle para administrar profissionais cadastrados e suas permissões no sistema.',
      icon: Users,
      href: '/gestao-usuarios',
      status: 'Disponível',
      disabled: false,
      roles: ['admin'],
      badge: usuariosAguardandoCount !== null && usuariosAguardandoCount > 0 ? {
        text: `${usuariosAguardandoCount} aguardando`,
        variant: 'warning'
      } : null
    },
  ];

  const filteredItems = navigationItems.filter(item => {
    if (item.roles.includes('any')) return true;
    if (item.roles.includes('admin') && sessionData?.ehAdmin) return true;
    if (item.roles.includes('gestor') && (sessionData?.gestorConteudos || sessionData?.ehAdmin)) return true;
    return false;
  });

  return (
    <section className="py-12 bg-gray-50" aria-labelledby="navigation-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 id="navigation-heading" className="text-2xl sm:text-4xl font-extrabold text-csae-green-900 mb-3 tracking-tight">
            Principais Funcionalidades
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg">
            Explore as ferramentas desenvolvidas especialmente para otimizar seu trabalho como profissional de enfermagem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {filteredItems.map((item) => {
            const IconComponent = item.icon;
            
            const cardContent = (
              <Card className={`h-full flex flex-col transition-all duration-300 border-none shadow-sm ${
                item.disabled 
                  ? 'opacity-60 cursor-not-allowed bg-gray-50' 
                  : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-white border-t-4 border-t-csae-green-600'
              }`}>
                <CardHeader className="text-center pb-2">
                  <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                    item.disabled ? 'bg-gray-200 text-gray-400' : 'bg-csae-green-100 text-csae-green-600 group-hover:bg-csae-green-600 group-hover:text-white'
                  }`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <CardTitle className={`text-xl font-bold tracking-tight ${
                    item.disabled ? 'text-gray-500' : 'text-csae-green-900'
                  }`}>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center flex-1 flex flex-col px-6 pb-6">
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-4 min-h-[24px]">
                    <div className={`inline-block px-3 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                      item.disabled 
                        ? 'bg-gray-200 text-gray-600' 
                        : 'bg-csae-green-100 text-csae-green-800'
                    }`}>
                      {item.status}
                    </div>
                    {item.badge && (
                      <div className="flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        <Clock className="w-3 h-3" />
                        {item.badge.text}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-8 leading-relaxed text-sm flex-1">
                    {item.description}
                  </p>
                  
                  <div className="mt-auto">
                    <Button
                      disabled={item.disabled}
                      className={`w-full h-11 text-sm font-bold transition-all ${
                        item.disabled 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'csae-btn-primary shadow-md hover:shadow-lg'
                      }`}
                      aria-label={`${item.disabled ? 'Funcionalidade em construção' : 'Acessar'} ${item.title}`}
                    >
                      {item.disabled ? 'Em breve' : 'Acessar'}
                      {!item.disabled && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );

            return item.disabled ? (
              <div key={item.id}>
                {cardContent}
              </div>
            ) : (
              <Link key={item.id} to={item.href} className="block h-full group">
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default NavigationCards;
