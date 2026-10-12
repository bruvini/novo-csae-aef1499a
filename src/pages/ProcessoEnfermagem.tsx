import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Users, FileText, Clock, BarChart as BarChartIcon } from 'lucide-react';
import ProcessoEnfermagemExplicacao from '@/components/ProcessoEnfermagemExplicacao';
import ModalCadastroPaciente from '@/components/processo-enfermagem/ModalCadastroPaciente';
import ListaPacientes from '@/components/processo-enfermagem/ListaPacientes';
import IndicadoresProducaoModal from '@/components/processo-enfermagem/IndicadoresProducaoModal';
import { useIndicadoresTempoReal } from '@/hooks/useIndicadoresTempoReal';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';

const ProcessoEnfermagem = () => {
  const [modalCadastroOpen, setModalCadastroOpen] = useState(false);
  const [modalIndicadoresOpen, setModalIndicadoresOpen] = useState(false);
  const { indicadores, loading } = useIndicadoresTempoReal();

  const handlePacienteCadastrado = () => {
    // Os indicadores serão atualizados automaticamente através dos listeners
  };

  return (
    <AuthenticatedLayout fullWidth>
      {/* Desktop: coluna educativa 40% e área operacional 60%.
          Tablets e celulares empilham as seções, sem largura máxima artificial. */}
      <div className="grid w-full min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] 2xl:gap-8">
        <aside className="min-w-0" aria-label="Sobre o Processo de Enfermagem">
          <ProcessoEnfermagemExplicacao />
        </aside>

        <section className="min-w-0" aria-label="Painel e pacientes">
        {/* Dashboard Expandido */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-csae-green-800 sm:text-2xl">Dashboard</h2>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3 2xl:gap-4">
            <Card className="bg-gradient-to-r from-csae-green-50 to-csae-green-100 border-csae-green-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-csae-green-600">Total de Pacientes</p>
                    <p className="text-2xl font-bold text-csae-green-800">
                      {loading ? '-' : indicadores.totalPacientes}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-csae-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Processos Ativos</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {loading ? '-' : indicadores.processosAtivos}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Processos Concluídos</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {loading ? '-' : indicadores.processosConcluidos}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Média por Paciente</p>
                    <p className="text-2xl font-bold text-orange-800">
                      {loading ? '-' : indicadores.mediaProcessosPorPaciente}
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">Taxa de Conclusão</p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {loading ? '-' : 
                        (indicadores.processosAtivos + indicadores.processosConcluidos) > 0 ? 
                          Math.round(
                            (indicadores.processosConcluidos / 
                            (indicadores.processosConcluidos + indicadores.processosAtivos)) * 100
                          ) + '%' : '0%'
                      }
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-rose-50 to-rose-100 border-rose-200">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-rose-600">Tempo Médio</p>
                    <p className="text-2xl font-bold text-rose-800">
                      {loading ? '-' : indicadores.tempoMedioEvolucao + ' min'}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-rose-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Área Principal - Unificada */}
        <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:items-center">
            <h2 className="text-xl font-bold text-csae-green-800 sm:text-2xl">Meus Pacientes</h2>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
              <Button 
                variant="outline"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50" 
                onClick={() => setModalIndicadoresOpen(true)}
              >
                <BarChartIcon className="w-4 h-4 mr-2" />
                Indicadores de Produção
              </Button>
              <Button 
                className="csae-btn-primary" 
                onClick={() => setModalCadastroOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Paciente
              </Button>
            </div>
          </div>

          {/* Lista de Pacientes */}
          <ListaPacientes />
        </div>
        </section>
      </div>

      {/* Modal de Cadastro */}
      <ModalCadastroPaciente
        open={modalCadastroOpen}
        onOpenChange={setModalCadastroOpen}
        onPacienteCadastrado={handlePacienteCadastrado}
      />

      {/* Modal de Indicadores de Produção */}
      <IndicadoresProducaoModal
        open={modalIndicadoresOpen}
        onOpenChange={setModalIndicadoresOpen}
      />
    </AuthenticatedLayout>
  );
};

export default ProcessoEnfermagem;

