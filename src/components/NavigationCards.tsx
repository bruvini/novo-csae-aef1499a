import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Database, Users, BarChart, Clock, LifeBuoy, Headphones } from 'lucide-react';
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
    if (item.allowedPageId === 'PainelEstatistico' || item.allowedPageId === 'GestaoUsuarios') return ehAdmin;
    const paginasPermitidas = sessionData?.paginasPermitidas || [];
    return ehAdmin || paginasPermitidas.includes(item.allowedPageId);
  });

  return (
    <section aria-labelledby="navigation-heading" className="min-w-0">
      <div className="mb-5">
        <h2 id="navigation-heading" className="text-xl font-bold tracking-tight text-csae-green-900">
          Ferramentas Disponíveis
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Acesse os módulos do sistema
        </p>
      </div>

      {/* Grades de aplicativos: duas colunas em telas estreitas, três quando há espaço. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {filteredItems.map((item) => {
          const IconComponent = item.icon;

          const cardContent = (
            <div
              className={`relative flex h-full min-h-[205px] flex-col items-center rounded-2xl border px-3 pb-5 pt-7 text-center transition-all duration-200 sm:min-h-[214px] sm:px-4 ${ 
                item.disabled
                  ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500 opacity-70'
                  : 'border-gray-100 bg-white shadow-sm group-hover:-translate-y-0.5 group-hover:border-csae-green-200 group-hover:shadow-lg group-focus-visible:border-csae-green-500'
              }`}
            >
              {/* Indicadores não alteram as permissões de acesso do módulo. */}
              {(item.badge || Boolean(item.notificationCount)) && (
                <div className="absolute right-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap justify-end gap-1">
                  {item.badge && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[9px] font-bold leading-none text-amber-900">
                      <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {item.badge.text}
                    </span>
                  )}
                  {Boolean(item.notificationCount) && (
                    <span
                      className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white"
                      aria-label={`${item.notificationCount} notificações não visualizadas`}
                    >
                      {item.notificationCount > 99 ? '99+' : item.notificationCount}
                    </span>
                  )}
                </div>
              )}
              <div
                className={`mb-3 mt-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-colors sm:h-16 sm:w-16 ${ 
                  item.disabled
                    ? 'bg-gray-200 text-gray-500'
                    : 'bg-csae-green-100 text-csae-green-700 group-hover:bg-csae-green-600 group-hover:text-white'
                }`}
              >
                <IconComponent className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-bold leading-snug text-csae-green-900 sm:text-base">
                {item.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-gray-500 sm:text-xs">
                {item.description}
              </p>
            </div>
          );

          return item.disabled ? (
            <div key={item.id} aria-disabled="true" className="h-full">
              {cardContent}
            </div>
          ) : (
            <Link
              key={item.id}
              to={item.href}
              className="group block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-csae-green-600 focus-visible:ring-offset-2"
              aria-label={`Acessar ${item.title}`}
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default NavigationCards;
