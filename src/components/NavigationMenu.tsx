
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Home,
  ClipboardCheck,
  FileText,
  Bandage,
  BookOpen,
  Newspaper,
  Lightbulb,
  Info,
  HelpCircle,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationMenuComponentProps {
  activeItem?: string;
}

const NavigationMenuComponent: React.FC<NavigationMenuComponentProps> = ({ activeItem }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const menuItems = [
    {
      id: 'home',
      title: 'Página Inicial',
      icon: Home,
      href: '/dashboard'
    },
    {
      id: 'processo-enfermagem',
      title: 'Processo de Enfermagem',
      icon: ClipboardCheck,
      href: '/processo-enfermagem'
    },
    {
      id: 'pops',
      title: 'POPs',
      icon: FileText,
      href: '/pops'
    },
    {
      id: 'feridas',
      title: 'Matriciamento de Feridas',
      icon: Bandage,
      href: '/feridas'
    },
    {
      id: 'protocolos',
      title: 'Protocolos de Enfermagem',
      icon: BookOpen,
      href: '/protocolos'
    },
    {
      id: 'noticias',
      title: 'Notícias',
      icon: Newspaper,
      href: '/noticias'
    },
    {
      id: 'sugestoes',
      title: 'Sugestões',
      icon: Lightbulb,
      href: '/sugestoes'
    },
    {
      id: 'sobre',
      title: 'Sobre a CSAE',
      icon: Info,
      href: '/sobre'
    },
    {
      id: 'faq',
      title: 'F.A.Q.',
      icon: HelpCircle,
      href: '/faq'
    },
    {
      id: 'gestao-usuarios',
      title: 'Gestão de Usuários',
      icon: Users,
      href: '/gestao-usuarios'
    },
  ];

  return (
    <div className="sticky top-0 z-10 w-full bg-white border-b border-csae-green-100 shadow-sm">
      <div className="container mx-auto overflow-x-auto">
        <NavigationMenu className="py-1 max-w-full justify-start">
          <NavigationMenuList className="flex-nowrap">
            {menuItems.map((item) => (
              <NavigationMenuItem key={item.id}>
                <Link to={item.href}>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "px-3 py-1.5 h-auto whitespace-nowrap",
                      (activeItem === item.id || currentPath === item.href) 
                        ? "bg-csae-green-50 text-csae-green-700 font-medium" 
                        : "text-gray-700"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span className="text-sm">{item.title}</span>
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};

export default NavigationMenuComponent;
