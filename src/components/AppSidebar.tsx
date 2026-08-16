import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, Database, Users, BarChart, LifeBuoy, Headphones } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportNotifications } from '@/contexts/SupportNotificationsContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navigationItems = [
  { title: 'Página Inicial', url: '/dashboard', icon: Home },
  { title: 'Processo de Enfermagem', url: '/processo-enfermagem', icon: Heart },
  { title: 'Gestão de Conteúdos', url: '/gestao-conteudos', icon: Database, allowedPageId: 'GestaoConteudos' },
  { title: 'Gestão de Usuários', url: '/gestao-usuarios', icon: Users, allowedPageId: 'GestaoUsuarios' },
  { title: 'Painel Estatístico', url: '/painel-estatistico', icon: BarChart, allowedPageId: 'PainelEstatistico' },
  { title: 'Central de Ajuda', url: '/ajuda', icon: LifeBuoy },
  { title: 'Gestão de Suporte', url: '/gestao-suporte', icon: Headphones, allowedPageId: 'GestaoSuporte' },
];

export function AppSidebar() {
  const { sessionData } = useAuth();
  const { respostasNaoVisualizadas, itensNovosSuporte } = useSupportNotifications();
  
  const filteredItems = navigationItems.filter(item => {
    if (!item.allowedPageId) return true;
    const ehAdmin = sessionData?.ehAdmin === true;
    const paginasPermitidas = sessionData?.paginasPermitidas || [];
    return ehAdmin || paginasPermitidas.includes(item.allowedPageId);
  });

  return (
    <Sidebar 
      className="border-r border-csae-green-200"
      collapsible="icon"
    >
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-csae-green-800 font-semibold px-4 py-3 h-auto">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5 px-2">
              {filteredItems.map((item) => {
                const IconComponent = item.icon;
                const notificationCount = item.url === '/ajuda'
                  ? respostasNaoVisualizadas
                  : item.url === '/gestao-suporte'
                    ? itensNovosSuporte
                    : 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="p-0 h-auto">
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full ${
                            isActive
                              ? 'bg-csae-green-600 text-white shadow-md font-bold'
                              : 'text-gray-600 hover:bg-csae-green-50 hover:text-csae-green-700'
                          }`
                        }
                      >
                        <IconComponent className="w-5 h-5 shrink-0" />
                        <span className="text-sm truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                    {notificationCount > 0 && (
                      <SidebarMenuBadge className="bg-red-600 text-white hover:bg-red-600">
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
