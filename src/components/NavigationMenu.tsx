
import React, { useState, useEffect } from "react";
import {
  NavigationMenu as NavigationMenuRoot,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { useAutenticacao } from "@/services/autenticacao";
import { buscarModulosAtivos } from "@/services/bancodados/modulosDB";
import { ModuloDisponivel } from "@/types/modulos";
import { Clipboard, FileText, FileType } from "lucide-react";
import { ElementType } from "react";
import * as LucideIcons from 'lucide-react';

interface NavigationMenuProps {
  activeItem?: string;
}

export function NavigationMenu({ activeItem }: NavigationMenuProps) {
  const { usuario } = useAutenticacao();
  const [modulos, setModulos] = useState<ModuloDisponivel[]>([]);
  
  useEffect(() => {
    const carregarModulos = async () => {
      try {
        if (usuario) {
          // Use buscarModulosAtivos
          const modulosDisponiveis = await buscarModulosAtivos();
          setModulos(modulosDisponiveis);
        }
      } catch (error) {
        console.error("Erro ao carregar módulos:", error);
      }
    };
    
    carregarModulos();
  }, [usuario]);

  // Opções de menu estáticas
  const opcoesMenu = [
    { name: "Dashboard", href: "/dashboard", icon: Clipboard },
    { name: "Processo de Enfermagem", href: "/processo-enfermagem", icon: Clipboard },
    { name: "Protocolos", href: "/protocolos", icon: FileText },
    { name: "POPs", href: "/pops", icon: FileType },
  ];

  return (
    <NavigationMenuRoot className="relative">
      <NavigationMenuList>
        {opcoesMenu.map((opcao, index) => (
          <NavigationMenuItem key={index}>
            <Button variant="ghost" asChild>
              <a href={opcao.href} className="flex items-center gap-2">
                {React.createElement(opcao.icon, { className: "w-4 h-4" })}
                {opcao.name}
              </a>
            </Button>
          </NavigationMenuItem>
        ))}
        {modulos.map((modulo, index) => (
          <NavigationMenuItem key={modulo.id}>
            <Button variant="ghost" asChild>
              <a href={modulo.link} className="flex items-center gap-2">
                {modulo.icone && LucideIcons[modulo.icone as keyof typeof LucideIcons] && (
                  React.createElement(LucideIcons[modulo.icone as keyof typeof LucideIcons] as ElementType, { 
                    className: "w-4 h-4" 
                  })
                )}
                {modulo.nome}
              </a>
            </Button>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenuRoot>
  );
}
