
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface EnfermagemWizardProps {
  patientId: string;
  onReturn: () => void;
}

const EnfermagemWizard = ({ patientId, onReturn }: EnfermagemWizardProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          className="mr-4" 
          onClick={onReturn}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar à lista
        </Button>
        <h2 className="text-xl font-semibold">
          Processo de Enfermagem - Paciente ID: {patientId}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processo de Enfermagem em Desenvolvimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p>O componente de wizard para o processo de enfermagem está sendo desenvolvido.</p>
          <p className="mt-2">Paciente ID: {patientId}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnfermagemWizard;
