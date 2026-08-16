import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Database, Users, BarChart, ArrowRight, Clock, LifeBuoy, Headphones } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { buscarUsuariosAguardando } from '@/services/bancodados';
import { useSupportNotifications } from '@/contexts/SupportNotificationsContext';

const NavigationCards = () => {
  const { sessionData } = useAuth();
  const { respostasNaoVisualizadas, itensNovosSuporte } = useSupportNotifications();
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
      disabled: false,
    },
    {
      id: 'gestao-conteudos',
      title: 'Gestão de Conteúdos',
      description: 'Área administrativa para gerenciar e atualizar os conteúdos do banco de dados do sistema.',
      icon: Database,
      href: '/gestao-conteudos',
      disabled: false,
      allowedPageId: 'GestaoConteudos',
    },
    {
      id: 'gestao-usuarios',
      title: 'Gestão de Usuários',
      description: 'Painel de controle para administrar profissionais cadastrados e suas permissões no sistema.',
      icon: Users,
      href: '/gestao-usuarios',
      disabled: false,
      allowedPageId: 'GestaoUsuarios',
      badge: usuariosAguardandoCount !== null && usuariosAguardandoCount > 0 ? {
        text: `${usuariosAguardandoCount} aguardando`,
        variant: 'warning'
      } : null
    },
    {
      id: 'painel-estatistico',
      title: 'Painel Estatístico',
      description: 'Módulo de Business Intelligence com visão global de métricas e indicadores de produção da rede.',
      icon: BarChart,
      href: '/painel-estatistico',
      disabled: false,
      allowedPageId: 'PainelEstatistico',
    },
    {
      id: 'central-ajuda',
      title: 'Central de Ajuda',
      description: 'Relate problemas técnicos, envie sugestões de melhoria e avalie o Portal CSAE.',
      icon: LifeBuoy,
      href: '/ajuda',
      disabled: false,
      notificationCount: respostasNaoVisualizadas,
    },
    {
      id: 'gestao-suporte',
      title: 'Gestão de Suporte',
      description: 'Painel administrativo para responder tickets, gerenciar sugestões e visualizar avaliações NPS.',
      icon: Headphones,
      href: '/gestao-suporte',
      disabled: false,
      allowedPageId: 'GestaoSuporte',
      notificationCount: itensNovosSuporte,
    },
  ];

  const filteredItems = navigationItems.filter(item => {
    if (!item.allowedPageId) return true;
    const ehAdmin = sessionData?.ehAdmin === true;
    const paginasPermitidas = sessionData?.paginasPermitidas || [];
    return ehAdmin || paginasPermitidas.includes(item.allowedPageId);
  });

  return (
    <section aria-labelledby="navigation-heading">
      <div className="mb-6">
        <h2 id="navigation-heading" className="text-xl font-bold text-csae-green-900 tracking-tight">
          Ferramentas Disponíveis
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Acesse os módulos do sistema
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {filteredItems.map((item) => {
          const IconComponent = item.icon;

          const cardContent = (
            <div
              className={`flex items-center gap-5 px-5 py-4 rounded-2xl border transition-all duration-300 ${
                item.disabled
                  ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200'
                  : 'bg-white border-gray-100 shadow-sm hover:shadow-lg hover:border-csae-green-200 hover:-translate-y-0.5 cursor-pointer group'
              }`}
            >
              {/* Left — Icon */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  item.disabled
                    ? 'bg-gray-200 text-gray-400'
                    : 'bg-csae-green-100 text-csae-green-600 group-hover:bg-csae-green-600 group-hover:text-white'
                }`}
              >
                <IconComponent className="w-6 h-6" />
              </div>

              {/* Center — Title + Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3

                    className={`text-sm font-bold leading-tight ${
                      item.disabled ? 'text-gray-500' : 'text-csae-green-900'
                    }`}
                  >
                    {item.title}
                  </h3>
                  {item.badge && (
                    <span className="flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse leading-none">
                      <Clock className="w-3 h-3" />
                      {item.badge.text}
                    </span>
                  )}
                  {Boolean(item.notificationCount) && (
                    <span className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white shadow-sm">
                      {item.notificationCount > 99 ? '99+' : item.notificationCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Right — Action Button */}
              <div className="flex-shrink-0">
                <Button
                  disabled={item.disabled}
                  size="sm"
                  className={`h-9 px-4 text-xs font-bold transition-all ${
                    item.disabled
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'csae-btn-primary shadow-sm hover:shadow-md'
                  }`}
                  aria-label={`${item.disabled ? 'Funcionalidade em construção' : 'Acessar'} ${item.title}`}
                >
                  {item.disabled ? 'Em breve' : 'Acessar'}
                  {!item.disabled && <ArrowRight className="w-3.5 h-3.5 ml-1.5" />}
                </Button>
              </div>
            </div>
          );

          return item.disabled ? (
            <div key={item.id}>
              {cardContent}
            </div>
          ) : (
            <Link key={item.id} to={item.href} className="block group">
              {cardContent}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default NavigationCards;
