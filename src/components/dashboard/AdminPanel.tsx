
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Settings, Users, User, BarChart } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ delay: 0.2, duration: 0.5 }}
      className="mb-8"
    >
      <Card className="border-l-4 border-l-amber-400">
        <CardHeader className="pb-2">
          <CardTitle className="text-csae-green-700 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Painel do Administrador
          </CardTitle>
          <CardDescription>
            Ferramentas exclusivas para gestão do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white hover:bg-csae-green-50 transition-colors duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="mr-2 h-5 w-5 text-csae-green-600" />
                Gestão de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Gerencie usuários, configure permissões e visualize
                estatísticas de utilização
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-csae-green-600 hover:bg-csae-green-700" 
                onClick={() => window.location.href = "/gestao-usuarios"}
              >
                <User className="mr-2 h-4 w-4" />
                Acessar
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white hover:bg-csae-green-50 transition-colors duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <BarChart className="mr-2 h-5 w-5 text-csae-green-600" />
                Relatórios de Uso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Visualize estatísticas de acesso, utilização e métricas de
                desempenho do sistema
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-csae-green-600 hover:bg-csae-green-700" 
                onClick={() => window.location.href = "/relatorios"}
              >
                <BarChart className="mr-2 h-4 w-4" />
                Visualizar
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white hover:bg-csae-green-50 transition-colors duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Settings className="mr-2 h-5 w-5 text-csae-green-600" />
                Gerenciamento de Conteúdos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Atualize protocolos, diagnósticos, intervenções e
                conteúdos educacionais
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-csae-green-600 hover:bg-csae-green-700" 
                onClick={() => window.location.href = "/gerenciamento-enfermagem"}
              >
                <Settings className="mr-2 h-4 w-4" />
                Gerenciar
              </Button>
            </CardFooter>
          </Card>
        </CardContent>
      </Card>
    </motion.div>
  );
};
