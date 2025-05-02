
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { useAutenticacao } from "@/services/autenticacao";
import { buscarModulosAtivos } from "@/services/bancodados/modulosDB";
import { ModuloDisponivel } from "@/types/modulos";

interface NavigationMenuComponentProps {
  activeItem?: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: React.ElementType;
  href: string;
  adminOnly: boolean;
  moduloNome?: string;
  visibilidade?: 'todos' | 'admin' | 'sms';
}

const NavigationMenuComponent: React.FC<NavigationMenuComponentProps> = ({
  activeItem,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { verificarAdmin } = useAutenticacao();
  const [isAdmin, setIsAdmin] = useState(false);
  const [modulosDinamicos, setModulosDinamicos] = useState<MenuItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atuaSMS, setAtuaSMS] = useState(false);

  useEffect(() => {
    setIsAdmin(verificarAdmin());

    // Verificar se usuário atua na SMS
    try {
      const dadosUsuario = localStorage.getItem('usuario');
      if (dadosUsuario) {
        const usuario = JSON.parse(dadosUsuario);
        setAtuaSMS(usuario.atuaSMS === true);
      }
    } catch (error) {
      console.error("Erro ao verificar atuaSMS:", error);
    }
  }, [verificarAdmin]);

  // Buscar módulos ativos
  useEffect(() => {
    const carregarModulosAtivos = async () => {
      try {
        const modulos = await buscarModulosAtivos();
        
        // Converter para o formato MenuItem
        const menuItems: MenuItem[] = modulos
          .filter(m => m.exibirNavbar !== false) // Exibir somente os marcados para mostrar na navbar
          .map(m => ({
            id: m.nome,
            title: m.titulo,
            // @ts-ignore - Acessar dinamicamente os ícones
            icon: m.icone ? LucideIcons[m.icone] || LucideIcons.FileText : LucideIcons.FileText,
            href: m.slug || `/${m.nome}`,
            adminOnly: m.visibilidade === 'admin',
            moduloNome: m.nome,
            visibilidade: m.visibilidade
          }));
        
        setModulosDinamicos(menuItems);
      } catch (error) {
        console.error("Erro ao carregar módulos ativos:", error);
      } finally {
        setCarregando(false);
      }
    };

    carregarModulosAtivos();
  }, []);

  // Lista de itens de menu fixos e essenciais
  const menuItemsFixos: MenuItem[] = [
    {
      id: "home",
      title: "Página Inicial",
      icon: LucideIcons.Home,
      href: "/dashboard",
      adminOnly: false,
    },
    {
      id: "processo-enfermagem",
      title: "Processo de Enfermagem",
      icon: LucideIcons.ClipboardCheck,
      href: "/processo-enfermagem",
      adminOnly: false,
    },
    {
      id: "protocolos",
      title: "Protocolos de Enfermagem",
      icon: LucideIcons.BookOpen,
      href: "/protocolos",
      adminOnly: false,
    },
    {
      id: "pops",
      title: "POPs",
      icon: LucideIcons.FileText,
      href: "/pops",
      adminOnly: false,
      moduloNome: "pops"
    },
    {
      id: "timeline",
      title: "Nossa História",
      icon: LucideIcons.Clock,
      href: "/timeline",
      adminOnly: false,
    },
    {
      id: "gerenciamento-enfermagem",
      title: "Gerenciamento de Conteúdos",
      icon: LucideIcons.Settings,
      href: "/gerenciamento-enfermagem",
      adminOnly: true,
    },
    {
      id: "sugestoes",
      title: "Sugestões",
      icon: LucideIcons.Lightbulb,
      href: "/sugestoes",
      adminOnly: false,
    },
    {
      id: "gestao-usuarios",
      title: "Gestão de Usuários",
      icon: LucideIcons.Users,
      href: "/gestao-usuarios",
      adminOnly: true,
    },
  ];

  // Combinar itens de menu fixos com dinâmicos
  // Evitar duplicatas (se um módulo dinâmico tiver mesmo ID que um fixo, o dinâmico prevalece)
  const fixosIds = new Set(menuItemsFixos.map(item => item.id));
  const modulosFiltrados = modulosDinamicos.filter(item => !fixosIds.has(item.id));
  
  const allMenuItems = [...menuItemsFixos, ...modulosFiltrados];
  
  // Filtrar os itens do menu com base no perfil do usuário
  const filteredMenuItems = allMenuItems.filter((item) => {
    // Item acessível apenas para admin
    if ((item.adminOnly || item.visibilidade === 'admin') && !isAdmin) {
      return false;
    }
    
    // Item com visibilidade SMS
    if (item.visibilidade === 'sms' && !isAdmin && !atuaSMS) {
      return false;
    }
    
    return true;
  });

  if (carregando) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 w-full bg-white border-b border-csae-green-100 shadow-sm">
      <div className="container mx-auto overflow-x-auto">
        <NavigationMenu className="py-1 max-w-full justify-start">
          <NavigationMenuList className="flex-nowrap">
            {filteredMenuItems.map((item) => (
              <NavigationMenuItem key={item.id}>
                <NavigationMenuLink asChild>
                  <Link
                    to={item.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "px-3 py-1.5 h-auto whitespace-nowrap",
                      activeItem === item.id || currentPath === item.href
                        ? "bg-csae-green-50 text-csae-green-700 font-medium"
                        : "text-gray-700"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span className="text-sm">{item.title}</span>
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};

export default NavigationMenuComponent;
