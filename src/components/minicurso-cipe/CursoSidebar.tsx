
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { ProgressoCursoCipe } from '@/types/cipe';

interface CursoSidebarProps {
  ativo: string;
  progresso: ProgressoCursoCipe | null;
}

interface ModuloItem {
  id: string;
  titulo: string;
  href: string;
  completado: boolean;
  submenu?: ModuloItem[];
}

const CursoSidebar: React.FC<CursoSidebarProps> = ({ ativo, progresso }) => {
  const [modulos, setModulos] = useState<ModuloItem[]>([]);

  useEffect(() => {
    if (progresso) {
      setModulos([
        {
          id: 'introducao',
          titulo: 'Introdução sobre a CIPE',
          href: '#introducao',
          completado: progresso.moduloIntroducao
        },
        {
          id: 'eixos',
          titulo: 'Eixos de Classificação',
          href: '#eixos',
          completado: progresso.moduloEixos.concluido,
          submenu: [
            { 
              id: 'eixos-foco', 
              titulo: 'Foco', 
              href: '#eixos-foco', 
              completado: progresso.moduloEixos.foco 
            },
            { 
              id: 'eixos-julgamento', 
              titulo: 'Julgamento', 
              href: '#eixos-julgamento', 
              completado: progresso.moduloEixos.julgamento 
            },
            { 
              id: 'eixos-meios', 
              titulo: 'Meios', 
              href: '#eixos-meios', 
              completado: progresso.moduloEixos.meios 
            },
            { 
              id: 'eixos-acao', 
              titulo: 'Ação', 
              href: '#eixos-acao', 
              completado: progresso.moduloEixos.acao 
            },
            { 
              id: 'eixos-tempo', 
              titulo: 'Tempo', 
              href: '#eixos-tempo', 
              completado: progresso.moduloEixos.tempo 
            },
            { 
              id: 'eixos-localizacao', 
              titulo: 'Localização', 
              href: '#eixos-localizacao', 
              completado: progresso.moduloEixos.localizacao 
            },
            { 
              id: 'eixos-cliente', 
              titulo: 'Cliente', 
              href: '#eixos-cliente', 
              completado: progresso.moduloEixos.cliente 
            }
          ]
        },
        {
          id: 'elaboracao',
          titulo: 'Elaboração de Afirmativas',
          href: '#elaboracao',
          completado: progresso.moduloElaboracao.concluido,
          submenu: [
            { 
              id: 'elaboracao-diagnosticos', 
              titulo: 'Diagnósticos de Enfermagem', 
              href: '#elaboracao-diagnosticos', 
              completado: progresso.moduloElaboracao.diagnosticos 
            },
            { 
              id: 'elaboracao-acoes', 
              titulo: 'Ações de Enfermagem', 
              href: '#elaboracao-acoes', 
              completado: progresso.moduloElaboracao.acoes 
            },
            { 
              id: 'elaboracao-resultados', 
              titulo: 'Resultados de Enfermagem', 
              href: '#elaboracao-resultados', 
              completado: progresso.moduloElaboracao.resultados 
            }
          ]
        },
        {
          id: 'exercicios',
          titulo: 'Exercícios de Fixação',
          href: '#exercicios',
          completado: progresso.moduloExercicios
        }
      ]);
    }
  }, [progresso]);

  return (
    <div className="w-full md:w-64 lg:w-72 shrink-0 border-r border-csae-green-100 bg-csae-green-50/20">
      <ScrollArea className="h-full py-6 pr-6">
        <h3 className="px-6 text-lg font-semibold text-csae-green-700 mb-4">
          Navegação do Curso
        </h3>
        <div className="space-y-1 pl-2">
          {modulos.map((modulo) => (
            <div key={modulo.id} className="space-y-1">
              <Button
                asChild
                variant="ghost"
                className={cn(
                  "w-full justify-start pl-6 font-medium",
                  ativo === modulo.id ? "bg-csae-green-100 text-csae-green-900" : "text-gray-700 hover:bg-csae-green-50"
                )}
                disabled={!progresso}
              >
                <Link to={modulo.href} className="flex items-center w-full gap-2">
                  {modulo.titulo}
                  {modulo.completado && <Check className="h-4 w-4 text-csae-green-700" />}
                </Link>
              </Button>

              {modulo.submenu && modulo.submenu.length > 0 && (
                <div className="pl-6 space-y-1">
                  {modulo.submenu.map((subitem) => (
                    <Button
                      key={subitem.id}
                      asChild
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-start font-normal",
                        ativo === subitem.id ? "bg-csae-green-100 text-csae-green-900" : "text-gray-600 hover:bg-csae-green-50"
                      )}
                      disabled={!progresso}
                    >
                      <Link to={subitem.href} className="flex items-center w-full gap-2">
                        {subitem.titulo}
                        {subitem.completado && <Check className="h-3 w-3 text-csae-green-700" />}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CursoSidebar;
