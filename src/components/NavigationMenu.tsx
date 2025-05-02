import React, { useState, useEffect } from "react";
import {
  NavigationMenu as NavigationMenuRoot,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { useAutenticacao } from "@/services/autenticacao";
import { buscarModulosAtivos } from "@/services/bancodados/usuarioDB";
import { BriefcaseIcon, ClipboardIcon, FileIcon, FileTypeIcon } from "lucide-react";

interface ModuloDisponivel {
  id: string;
  nome: string;
  link: string;
  icone: any;
}

export function NavigationMenu() {
  const { usuario } = useAutenticacao();
  const [modulos, setModulos] = useState<ModuloDisponivel[]>([]);
  
  useEffect(() => {
    const carregarModulos = async () => {
      try {
        if (usuario) {
          // Substitua por buscarModulosAtivos se buscarModulosVisiveis não estiver disponível
          const modulosDisponiveis = await buscarModulosAtivos(usuario.uid);
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
    { name: "Dashboard", href: "/dashboard", icon: BriefcaseIcon },
    { name: "Processo de Enfermagem", href: "/processo-enfermagem", icon: ClipboardIcon },
    { name: "Protocolos", href: "/protocolos", icon: FileIcon },
    { name: "POPs", href: "/pops", icon: FileTypeIcon },
    // Removidas as entradas para o Acompanhamento Perinatal e Minicurso CIPE
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
                {React.createElement(modulo.icone, { className: "w-4 h-4" })}
                {modulo.nome}
              </a>
            </Button>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenuRoot>
  );
}
