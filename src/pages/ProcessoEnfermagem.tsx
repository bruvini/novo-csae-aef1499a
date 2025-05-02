
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useToast } from "@/hooks/use-toast";
import { useAutenticacao } from "@/services/autenticacao";
import Header from '@/components/Header';
import SimpleFooter from '@/components/SimpleFooter';
import { NavigationMenu } from '@/components/NavigationMenu';
import { ListaPacientes } from '@/components/processo-enfermagem/ListaPacientes';
import EnfermagemWizard from '@/components/processo-enfermagem/EnfermagemWizard';

const ProcessoEnfermagem = () => {
  const [activeView, setActiveView] = useState<'lista' | 'wizard'>('lista');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { toast } = useToast();
  const { verificarAutenticacao } = useAutenticacao();

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveView('wizard');
  };

  const handleReturnToList = () => {
    setSelectedPatientId(null);
    setActiveView('lista');
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Processo de Enfermagem | CSAE</title>
      </Helmet>
      <Header />
      <NavigationMenu activeItem="processo-enfermagem" />

      <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-csae-green-700 mb-6">
          Processo de Enfermagem
        </h1>

        {activeView === 'lista' && (
          <ListaPacientes onSelectPatient={handleSelectPatient} />
        )}

        {activeView === 'wizard' && selectedPatientId && (
          <EnfermagemWizard patientId={selectedPatientId} onReturn={handleReturnToList} />
        )}
      </main>

      <SimpleFooter />
    </div>
  );
};

export default ProcessoEnfermagem;
