
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Database, Users, ArrowRight } from 'lucide-react';

const NavigationCards = () => {
  const navigationItems = [
    {
      id: 'processo-enfermagem',
      title: 'Processo de Enfermagem',
      description: 'Ferramenta completa para realizar e acompanhar o Processo de Enfermagem com base nas melhores práticas científicas.',
      icon: Heart,
      href: '#',
      status: 'Em construção',
      disabled: true,
    },
    {
      id: 'gestao-conteudos',
      title: 'Gestão de Conteúdos',
      description: 'Área administrativa para gerenciar e atualizar os conteúdos do banco de dados do sistema.',
      icon: Database,
      href: '/gestao-conteudos',
      status: 'Disponível',
      disabled: false,
    },
    {
      id: 'gestao-usuarios',
      title: 'Gestão de Usuários',
      description: 'Painel de controle para administrar profissionais cadastrados e suas permissões no sistema.',
      icon: Users,
      href: '/gestao-usuarios',
      status: 'Disponível',
      disabled: false,
    },
  ];

  return (
    <section className="py-12 bg-gray-50" aria-labelledby="navigation-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 id="navigation-heading" className="text-2xl sm:text-3xl font-bold text-csae-green-800 mb-2">
            Principais Funcionalidades
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore as ferramentas desenvolvidas especialmente para otimizar seu trabalho como profissional de enfermagem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            
            const cardContent = (
              <Card className={`h-full transition-all duration-300 ${
                item.disabled 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:shadow-lg hover:scale-105 cursor-pointer'
              }`}>
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                    item.disabled ? 'bg-gray-200' : 'bg-csae-green-100'
                  }`}>
                    <IconComponent className={`w-8 h-8 ${
                      item.disabled ? 'text-gray-400' : 'text-csae-green-600'
                    }`} />
                  </div>
                  <CardTitle className={`text-xl ${
                    item.disabled ? 'text-gray-500' : 'text-csae-green-800'
                  }`}>
                    {item.title}
                  </CardTitle>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    item.disabled 
                      ? 'bg-gray-200 text-gray-600' 
                      : 'bg-csae-green-100 text-csae-green-800'
                  }`}>
                    {item.status}
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {item.description}
                  </p>
                  <Button
                    disabled={item.disabled}
                    className={`w-full ${
                      item.disabled 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'csae-btn-primary'
                    }`}
                    aria-label={`${item.disabled ? 'Funcionalidade em construção' : 'Acessar'} ${item.title}`}
                  >
                    {item.disabled ? 'Em breve' : 'Acessar'}
                    {!item.disabled && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </CardContent>
              </Card>
            );

            return item.disabled ? (
              <div key={item.id}>
                {cardContent}
              </div>
            ) : (
              <Link key={item.id} to={item.href} className="block">
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
