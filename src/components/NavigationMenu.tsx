
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
  Settings,
  GraduationCap,
  Clock,
  Baby
} from "lucide-react";
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
}

const NavigationMenuComponent: React.FC<NavigationMenuComponentProps> = ({
  activeItem,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { verificarAdmin } = useAutenticacao();
  const [isAdmin, setIsAdmin] = useState(false);
  const [modulosAtivos, setModulosAtivos] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setIsAdmin(verificarAdmin());
  }, [verificarAdmin]);

  // Buscar módulos ativos
  useEffect(() => {
    const carregarModulosAtivos = async () => {
      try {
        const modulos = await buscarModulosAtivos();
        setModulosAtivos(modulos.map(m => m.nome));
      } catch (error) {
        console.error("Erro ao carregar módulos ativos:", error);
        setModulosAtivos([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarModulosAtivos();
  }, []);

  // Lista de itens de menu com suas propriedades
  const menuItems: MenuItem[] = [
    {
      id: "home",
      title: "Página Inicial",
      icon: Home,
      href: "/dashboard",
      adminOnly: false,
    },
    {
      id: "processo-enfermagem",
      title: "Processo de Enfermagem",
      icon: ClipboardCheck,
      href: "/processo-enfermagem",
      adminOnly: false,
    },
    {
      id: "protocolos",
      title: "Protocolos de Enfermagem",
      icon: BookOpen,
      href: "/protocolos",
      adminOnly: false,
    },
    {
      id: "perinatal",
      title: "Acompanhamento Perinatal",
      icon: Baby,
      href: "/acompanhamento-perinatal",
      adminOnly: false,
      moduloNome: "acompanhamento-perinatal"
    },
    {
      id: "pops",
      title: "POPs",
      icon: FileText,
      href: "/pops",
      adminOnly: false,
      moduloNome: "pops"
    },
    {
      id: "feridas",
      title: "Matriciamento de Feridas",
      icon: Bandage,
      href: "/feridas",
      adminOnly: false,
      moduloNome: "feridas"
    },
    {
      id: "minicurso-cipe",
      title: "Minicurso CIPE",
      icon: GraduationCap,
      href: "/minicurso-cipe",
      adminOnly: false,
      moduloNome: "minicurso-cipe"
    },
    {
      id: "timeline",
      title: "Nossa História",
      icon: Clock,
      href: "/timeline",
      adminOnly: false,
    },
    {
      id: "gerenciamento-enfermagem",
      title: "Gerenciamento de Conteúdos",
      icon: Settings,
      href: "/gerenciamento-enfermagem",
      adminOnly: true,
    },
    {
      id: "noticias",
      title: "Notícias",
      icon: Newspaper,
      href: "/noticias",
      adminOnly: false,
      moduloNome: "noticias"
    },
    {
      id: "sugestoes",
      title: "Sugestões",
      icon: Lightbulb,
      href: "/sugestoes",
      adminOnly: false,
    },
    {
      id: "sobre",
      title: "Sobre Nós",
      icon: Info,
      href: "/timeline",
      adminOnly: false,
    },
    {
      id: "faq",
      title: "F.A.Q.",
      icon: HelpCircle,
      href: "/faq",
      adminOnly: false,
      moduloNome: "faq"
    },
    {
      id: "gestao-usuarios",
      title: "Gestão de Usuários",
      icon: Users,
      href: "/gestao-usuarios",
      adminOnly: true,
    },
  ];

  // Filtrar os itens do menu com base no perfil do usuário e módulos ativos
  const filteredMenuItems = menuItems.filter((item) => {
    // Item acessível apenas para admin
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    
    // Item com controle de módulo
    if (item.moduloNome && !isAdmin) {
      return modulosAtivos.includes(item.moduloNome);
    }
    
    // Item sem restrições
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
