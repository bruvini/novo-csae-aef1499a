
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, UploadCloud, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GerenciadorCIPE = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciador CIPE</CardTitle>
          <CardDescription>
            Gerenciamento da Classificação Internacional para a Prática de Enfermagem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>Banco de Dados CIPE</AlertTitle>
            <AlertDescription>
              Esta seção permite gerenciar os termos da Classificação Internacional para a Prática de Enfermagem utilizados no sistema.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
              <UploadCloud className="h-8 w-8 mb-2" />
              <span>Importar Base CIPE</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
              <Download className="h-8 w-8 mb-2" />
              <span>Exportar Base CIPE</span>
            </Button>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Funcionalidade em desenvolvimento. Esta seção permitirá importar, exportar e gerenciar os termos CIPE utilizados no processo de enfermagem.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciadorCIPE;
