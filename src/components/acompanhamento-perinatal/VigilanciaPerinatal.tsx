import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  UserRound, 
  Baby, 
  Calendar, 
  ClipboardList, 
  Plus, 
  UserPlus, 
  ListFilter, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { PacientePerinatal } from '@/services/bancodados/tipos';

interface VigilanciaPerinatalProps {
  paciente: PacientePerinatal;
  onVoltar: () => void;
}

const VigilanciaPerinatal: React.FC<VigilanciaPerinatalProps> = ({ paciente, onVoltar }) => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('dados-clinicos');

  return (
    <div className="space-y-6">
      <Card className="border-csae-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold text-csae-green-800">
            Vigilância Perinatal
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onVoltar}>
            Voltar
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-base text-csae-green-700">
            Acompanhamento clínico detalhado de <strong>{paciente.nome}</strong>.
          </p>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="dados-clinicos">Dados Clínicos</TabsTrigger>
          <TabsTrigger value="consultas-pre-natal">Consultas Pré-Natal</TabsTrigger>
          <TabsTrigger value="consultas-puerperio">Consultas Puerperais</TabsTrigger>
          <TabsTrigger value="consultas-puericultura">Consultas de Puericultura</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dados-clinicos">
          <div>
            <h3 className="text-xl font-semibold mb-4">Dados Clínicos</h3>
            <p>Informações gerais sobre o paciente.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="consultas-pre-natal">
          <div>
            <h3 className="text-xl font-semibold mb-4">Consultas Pré-Natal</h3>
            <p>Histórico e registro das consultas pré-natais.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="consultas-puerperio">
          <div>
            <h3 className="text-xl font-semibold mb-4">Consultas Puerperais</h3>
            <p>Acompanhamento da puérpera no pós-parto.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="consultas-puericultura">
          <div>
            <h3 className="text-xl font-semibold mb-4">Consultas de Puericultura</h3>
            <p>Acompanhamento do desenvolvimento do bebê.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VigilanciaPerinatal;
