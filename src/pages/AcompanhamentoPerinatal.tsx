
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { PacientePerinatal } from '@/types/perinatal';
import PageHeader from '@/components/PageHeader';
import DashboardPerinatal from '@/components/acompanhamento-perinatal/DashboardPerinatal';
import GerenciarPacientesPerinatal from '@/components/acompanhamento-perinatal/GerenciarPacientesPerinatal';
import VigilanciaPerinatal from '@/components/acompanhamento-perinatal/VigilanciaPerinatal';
import { Button } from '@/components/ui/button';
import { UserRound, Users, Eye, ArrowLeft } from 'lucide-react';

const AcompanhamentoPerinatal = () => {
  const [dialogoGerenciarAberto, setDialogoGerenciarAberto] = useState(false);
  const [pacienteEmVigilancia, setPacienteEmVigilancia] = useState<PacientePerinatal | null>(null);

  const iniciarVigilancia = (paciente: PacientePerinatal) => {
    setPacienteEmVigilancia(paciente);
  };

  const voltarParaDashboard = () => {
    setPacienteEmVigilancia(null);
  };

  return (
    <>
      <Helmet>
        <title>Acompanhamento Perinatal | CSAE</title>
      </Helmet>

      <div className="container mx-auto my-6 space-y-6">
        <PageHeader
          title="Acompanhamento Perinatal"
          description="Gestão e vigilância do cuidado perinatal"
          icon={<UserRound className="h-8 w-8 text-csae-green-600" />}
        >
          <Button
            onClick={() => setDialogoGerenciarAberto(true)}
            className="bg-csae-green-600 hover:bg-csae-green-700"
          >
            <Users className="mr-2 h-4 w-4" />
            Gerenciar Pacientes
          </Button>
        </PageHeader>

        {pacienteEmVigilancia ? (
          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={voltarParaDashboard}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Dashboard
            </Button>
            <VigilanciaPerinatal paciente={pacienteEmVigilancia} />
          </div>
        ) : (
          <DashboardPerinatal onIniciarVigilancia={iniciarVigilancia} />
        )}
      </div>

      <GerenciarPacientesPerinatal
        open={dialogoGerenciarAberto}
        onOpenChange={setDialogoGerenciarAberto}
        onIniciarVigilancia={iniciarVigilancia}
      />
    </>
  );
};

export default AcompanhamentoPerinatal;
