
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, Database, Users } from 'lucide-react';
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
  { title: 'Página Inicial', url: '/', icon: Home },
  { title: 'Processo de Enfermagem', url: '/processo-enfermagem', icon: Heart },
  { title: 'Gestão de Conteúdos', url: '/gestao-conteudos', icon: Database },
  { title: 'Gestão de Usuários', url: '/gestao-usuarios', icon: Users },
];

export function AppSidebar() {
  return (
    <Sidebar 
      className="w-64 border-r border-csae-green-200"
      collapsible="offcanvas"
    >
      <SidebarContent className="bg-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-csae-green-800 font-semibold px-4 py-3">
            Navegação Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-3">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                            isActive
                              ? 'bg-csae-green-100 text-csae-green-800 font-medium'
                              : 'text-gray-600 hover:bg-csae-green-50 hover:text-csae-green-700'
                          }`
                        }
                      >
                        <IconComponent className="w-5 h-5" />
                        <span className="text-sm">{item.title}</span>
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
