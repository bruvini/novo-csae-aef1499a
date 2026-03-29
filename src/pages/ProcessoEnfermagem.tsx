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
    <AuthenticatedLayout>
      {/* Seção Explicativa */}
      <ProcessoEnfermagemExplicacao />

      {/* Dashboard e Área Funcional */}
      <section className="py-8">
        {/* Dashboard Expandido */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-csae-green-800 mb-6">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-csae-green-50 to-csae-green-100 border-csae-green-200">
              <CardContent className="p-6">
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
              <CardContent className="p-6">
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
              <CardContent className="p-6">
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
              <CardContent className="p-6">
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
              <CardContent className="p-6">
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
              <CardContent className="p-6">
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-csae-green-800">Meus Pacientes</h2>
            <div className="flex gap-4">
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

