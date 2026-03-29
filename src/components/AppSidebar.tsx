import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, Database, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navigationItems = [
  { title: 'Página Inicial', url: '/dashboard', icon: Home, roles: ['any'] },
  { title: 'Processo de Enfermagem', url: '/processo-enfermagem', icon: Heart, roles: ['any'] },
  { title: 'Gestão de Conteúdos', url: '/gestao-conteudos', icon: Database, roles: ['gestor', 'admin'] },
  { title: 'Gestão de Usuários', url: '/gestao-usuarios', icon: Users, roles: ['admin'] },
];

export function AppSidebar() {
  const { sessionData } = useAuth();
  
  const filteredItems = navigationItems.filter(item => {
    if (item.roles.includes('any')) return true;
    if (item.roles.includes('admin') && sessionData?.ehAdmin) return true;
    if (item.roles.includes('gestor') && (sessionData?.gestorConteudos || sessionData?.ehAdmin)) return true;
    return false;
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
