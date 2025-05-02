
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
import { buscarModulosVisiveis } from "@/services/bancodados/modulosDB";
import { ModuloDisponivel } from "@/types/modulos";
import { ElementType } from "react";

interface NavigationMenuComponentProps {
  activeItem?: string;
}

interface MenuItem {
  id: string;
  title: string;
  icon: ElementType;
  href: string;
  adminOnly: boolean;
  moduloNome?: string;
}

// Mapa de ícones fixos para referência
const iconMap: {[key: string]: keyof typeof LucideIcons} = {
  "processo-enfermagem": "ClipboardCheck",
  "protocolos": "BookOpen",
  "pops": "FileText",
  "feridas": "Bandage",
  "minicurso-cipe": "GraduationCap",
  "acompanhamento-perinatal": "Baby",
  "timeline": "Clock",
  "sugestoes": "Lightbulb",
  "noticias": "Newspaper",
  "faq": "HelpCircle",
  "gerenciamento-enfermagem": "Settings",
  "gestao-usuarios": "Users"
};

const NavigationMenuComponent: React.FC<NavigationMenuComponentProps> = ({
  activeItem,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { verificarAdmin, obterSessao } = useAutenticacao();
  const [isAdmin, setIsAdmin] = useState(false);
  const [modulosVisiveis, setModulosVisiveis] = useState<ModuloDisponivel[]>([]);
  const [itensMenu, setItensMenu] = useState<MenuItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const sessao = obterSessao();
  const atuaSMS = sessao?.atuaSMS === true;

  // Verificar se é admin
  useEffect(() => {
    setIsAdmin(verificarAdmin());
  }, [verificarAdmin]);

  // Buscar módulos visíveis
  useEffect(() => {
    const carregarModulosVisiveis = async () => {
      try {
        const modulos = await buscarModulosVisiveis(isAdmin, atuaSMS);
        setModulosVisiveis(modulos.filter(m => m.exibirNavbar));
      } catch (error) {
        console.error("Erro ao carregar módulos visíveis:", error);
        setModulosVisiveis([]);
      } finally {
        setCarregando(false);
      }
    };

    carregarModulosVisiveis();
  }, [isAdmin, atuaSMS]);

  // Converter módulos em itens de menu
  useEffect(() => {
    const converterModulosParaMenu = () => {
      // Itens fixos do menu
      const fixedItems: MenuItem[] = [
        {
          id: "home",
          title: "Página Inicial",
          icon: LucideIcons.Home as ElementType,
          href: "/dashboard",
          adminOnly: false,
        }
      ];

      // Converter os módulos visíveis em itens de menu
      const moduloItems = modulosVisiveis.map(modulo => {
        // Determinar o ícone a ser usado
        let IconComponent: ElementType;
        
        if (modulo.icone && LucideIcons[modulo.icone as keyof typeof LucideIcons]) {
          IconComponent = LucideIcons[modulo.icone as keyof typeof LucideIcons] as ElementType;
        } else if (iconMap[modulo.nome]) {
          IconComponent = LucideIcons[iconMap[modulo.nome]] as ElementType;
        } else {
          // Fallback para Settings se o ícone não for encontrado
          IconComponent = LucideIcons.Settings as ElementType;
        }

        return {
          id: modulo.nome,
          title: modulo.titulo,
          icon: IconComponent,
          href: `/${modulo.nome}`,
          adminOnly: modulo.visibilidade === 'admin',
          moduloNome: modulo.nome
        };
      });

      // Adicionar itens fixos de Admin
      const adminItems: MenuItem[] = isAdmin ? [
        {
          id: "gerenciamento-enfermagem",
          title: "Gerenciamento de Conteúdos",
          icon: LucideIcons.Settings as ElementType,
          href: "/gerenciamento-enfermagem",
          adminOnly: true,
        },
        {
          id: "gestao-usuarios",
          title: "Gestão de Usuários",
          icon: LucideIcons.Users as ElementType,
          href: "/gestao-usuarios",
          adminOnly: true,
        }
      ] : [];

      setItensMenu([...fixedItems, ...moduloItems, ...adminItems]);
    };

    converterModulosParaMenu();
  }, [modulosVisiveis, isAdmin]);

  if (carregando) {
    return null;
  }

  return (
    <div className="sticky top-0 z-10 w-full bg-white border-b border-csae-green-100 shadow-sm">
      <div className="container mx-auto overflow-x-auto">
        <NavigationMenu className="py-1 max-w-full justify-start">
          <NavigationMenuList className="flex-nowrap">
            {itensMenu.map((item) => (
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
