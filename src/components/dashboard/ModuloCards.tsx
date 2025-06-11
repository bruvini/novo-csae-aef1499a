
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, AlertCircle } from 'lucide-react';
import { ModuloDisponivel } from '@/types/modulos';
import { itemVariants } from './animations';
import * as LucideIcons from "lucide-react";

interface ModuloCardProps {
  modulo: ModuloDisponivel;
  isAdmin: boolean;
}

export const ModuloCard: React.FC<ModuloCardProps> = ({ modulo, isAdmin }) => {
  // Função para renderizar ícones dinamicamente
  const renderIcon = () => {
    if (!modulo.icone) return <FileText className="h-6 w-6" />;

    // @ts-ignore - Ignorar erro de tipagem para acessar dinamicamente os ícones
    const IconComponent = LucideIcons[modulo.icone] || LucideIcons.FileText;
    return <IconComponent className="h-6 w-6" />;
  };

  // Definir as cores do card com base na categoria
  const colorsByCategory: Record<string, string> = {
    "clinico": "bg-green-50 text-green-700",
    "educacional": "bg-blue-50 text-blue-700",
    "gestao": "bg-amber-50 text-amber-700"
  };
  
  const color = colorsByCategory[modulo.categoria] || "bg-gray-50 text-gray-700";
  
  return (
    <motion.div variants={itemVariants}>
      <Link to={modulo.slug || `/${modulo.nome}`}>
        <HoverCard>
          <HoverCardTrigger asChild>
            <Card className="h-full bg-white hover:bg-csae-green-50 transition-all duration-300 hover:shadow-md group cursor-pointer border-transparent hover:border-csae-green-200">
              <CardHeader className="pb-2">
                <div className={`rounded-full w-12 h-12 ${color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  {renderIcon()}
                </div>
                <CardTitle className="text-lg text-csae-green-700 group-hover:text-csae-green-800">
                  {modulo.titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{modulo.descricao}</p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="p-0 text-csae-green-600 hover:text-csae-green-700 hover:bg-transparent group-hover:translate-x-1 transition-transform"
                >
                  <span>Acessar</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <div className="flex justify-between space-x-4">
              <div>
                <h4 className="text-sm font-semibold">{modulo.titulo}</h4>
                <p className="text-sm text-muted-foreground">
                  {modulo.descricao}
                </p>
                <div className="flex items-center pt-2">
                  <span className="text-xs text-csae-green-600">
                    Clique para acessar
                  </span>
                </div>
              </div>
            </div>
          </HoverCardContent>
        </HoverCard>
      </Link>
    </motion.div>
  );
};

export const ModuloInativoCard: React.FC<{modulo: ModuloDisponivel}> = ({ modulo }) => {
  // Função para renderizar ícones dinamicamente
  const renderIcon = () => {
    if (!modulo.icone) return <FileText className="h-6 w-6" />;

    // @ts-ignore - Ignorar erro de tipagem para acessar dinamicamente os ícones
    const IconComponent = LucideIcons[modulo.icone] || LucideIcons.FileText;
    return <IconComponent className="h-6 w-6" />;
  };

  // Definir as cores do card com base na categoria
  const colorsByCategory: Record<string, string> = {
    "clinico": "bg-green-50 text-green-700",
    "educacional": "bg-blue-50 text-blue-700",
    "gestao": "bg-amber-50 text-amber-700"
  };
  
  const color = colorsByCategory[modulo.categoria] || "bg-gray-50 text-gray-700";
  
  return (
    <motion.div variants={itemVariants}>
      <Card className="h-full bg-gray-50 border-dashed border transition-all">
        <CardHeader className="pb-2">
          <div className={`rounded-full w-12 h-12 ${color} flex items-center justify-center mb-3 opacity-70`}>
            {renderIcon()}
          </div>
          <CardTitle className="text-lg text-gray-600 flex items-center">
            {modulo.titulo}
            <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-700 border-amber-200">
              Em breve
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">{modulo.descricao}</p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="ghost" 
            className="p-0 text-gray-400 cursor-not-allowed" 
            disabled
          >
            <span>Em desenvolvimento</span>
            <AlertCircle className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
