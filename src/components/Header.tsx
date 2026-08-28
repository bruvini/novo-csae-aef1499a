import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Home,
  Heart,
  Database,
  Users,
  BarChart as BarChartIcon,
  LifeBuoy,
  Headphones,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportNotifications } from "@/contexts/SupportNotificationsContext";
import { cn } from "@/lib/utils";

const Header = () => {
  const { sessionData, logout } = useAuth();
  const { respostasNaoVisualizadas, itensNovosSuporte } =
    useSupportNotifications();

  const navigationItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    {
      title: "Processo de Enfermagem",
      url: "/processo-enfermagem",
      icon: Heart,
    },
    {
      title: "Gestão de Conteúdos",
      url: "/gestao-conteudos",
      icon: Database,
      allowedPageId: "GestaoConteudos",
    },
    {
      title: "Gestão de Usuários",
      url: "/gestao-usuarios",
      icon: Users,
      allowedPageId: "GestaoUsuarios",
    },
    {
      title: "Painel Estatístico",
      url: "/painel-estatistico",
      icon: BarChartIcon,
      allowedPageId: "PainelEstatistico",
    },
    {
      title: "Central de Ajuda",
      url: "/ajuda",
      icon: LifeBuoy,
      notificationCount: respostasNaoVisualizadas,
    },
    {
      title: "Gestão de Suporte",
      url: "/gestao-suporte",
      icon: Headphones,
      allowedPageId: "GestaoSuporte",
      notificationCount: itensNovosSuporte,
    },
  ];

  const filteredItems = navigationItems.filter((item) => {
    if (!item.allowedPageId) return true;
    const ehAdmin = sessionData?.ehAdmin === true;
    const paginasPermitidas = sessionData?.paginasPermitidas || [];
    return ehAdmin || paginasPermitidas.includes(item.allowedPageId);
  });

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col bg-white border-b border-csae-green-200">
      {/* Container Principal: Logo e Ações */}
      <div className="w-full bg-white px-4 h-16 flex items-center justify-between border-b border-gray-100 shadow-sm sm:px-8">
        <div className="flex items-center space-x-4">
          <NavLink
            to="/dashboard"
            className="flex items-center space-x-3 group"
          >
            <div className="h-10 flex items-center justify-center overflow-hidden">
              <img
                src="/logo_csae.png"
                alt="CSAE Floripa Logo"
                className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-csae-green-800 tracking-tight leading-tight">
                Portal CSAE
              </h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">
                Florianópolis v2.0
              </p>
            </div>
          </NavLink>
        </div>

        {/* User Info and Logout */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {sessionData && (
            <NavLink
              to="/perfil"
              className="hidden md:flex items-center space-x-2 text-sm text-gray-700 bg-csae-green-50/50 px-3 py-1.5 rounded-full border border-csae-green-100/50 hover:bg-csae-green-100 transition-colors"
              title="Abrir meu perfil"
            >
              <div className="w-6 h-6 bg-csae-green-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                {sessionData.nomeCompleto.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium whitespace-nowrap">
                {sessionData.nomeCompleto.split(" ")[0]}
              </span>
            </NavLink>
          )}
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
            aria-label="Sair"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>

      {/* Barra de Navegação Horizontal */}
      <nav className="w-full bg-white overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center px-4 md:px-8 h-12">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.url}
                to={item.url}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-2 px-6 h-full border-b-2 transition-all duration-200 text-sm font-medium whitespace-nowrap",
                    isActive
                      ? "border-csae-green-600 text-csae-green-700 bg-csae-green-50/50"
                      : "border-transparent text-gray-500 hover:text-csae-green-600 hover:bg-gray-50",
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.title}</span>
                {Boolean(item.notificationCount) && (
                  <span
                    className="inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white shadow-sm"
                    aria-label={`${item.notificationCount} notificação(ões) não visualizada(s)`}
                  >
                    {item.notificationCount > 99
                      ? "99+"
                      : item.notificationCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

export default Header;
