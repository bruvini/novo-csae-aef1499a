
import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiagnosticosTab from './diagnosticos/DiagnosticosTab';
import SubconjuntoTab from './diagnosticos/SubconjuntoTab';
import LoadingOverlay from '@/components/LoadingOverlay';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import FormSubconjunto from './diagnosticos/FormSubconjunto';
import FormDiagnostico from './diagnosticos/FormDiagnostico';
import DiagnosticoVisualizer from './diagnosticos/DiagnosticoVisualizer';
import { useDiagnosticos } from '@/hooks/use-diagnosticos';

const GerenciadorDiagnosticos = () => {
  const {
    carregando,
    subconjuntos,
    diagnosticos,
    filtroTipoSubconjunto,
    filtroSubconjunto,
    filtroDiagnostico,
    termoBusca,
    modalSubconjuntoAberto,
    modalDiagnosticoAberto,
    modalVisualizarDiagnosticoAberto,
    editandoSubconjunto,
    editandoDiagnostico,
    formSubconjunto,
    formDiagnostico,
    diagnosticoVisualizar,
    
    setFiltroTipoSubconjunto,
    setFiltroSubconjunto,
    setFiltroDiagnostico,
    setTermoBusca,
    setModalSubconjuntoAberto,
    setModalDiagnosticoAberto,
    setModalVisualizarDiagnosticoAberto,
    setFormSubconjunto,
    setFormDiagnostico,
    
    carregarDados,
    getNomeSubconjunto,
    getTipoSubconjunto,
    getSubconjuntosNomes,
    abrirModalCriarSubconjunto,
    abrirModalEditarSubconjunto,
    salvarSubconjunto,
    excluirSubconjunto,
    abrirModalCriarDiagnostico,
    abrirModalEditarDiagnostico,
    abrirModalVisualizarDiagnostico,
    salvarDiagnostico,
    excluirDiagnostico,
    adicionarResultadoEsperado,
    removerResultadoEsperado,
    atualizarResultadoEsperado,
    adicionarIntervencao,
    removerIntervencao,
    atualizarIntervencao
  } = useDiagnosticos();

  // Fetch data on load
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return (
    <div>
      {carregando && <LoadingOverlay />}
      
      <h2 className="text-2xl font-bold text-csae-green-700 mb-6">Gerenciador de Diagnósticos</h2>
      
      <Tabs defaultValue="subconjuntos" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="subconjuntos">Subconjuntos</TabsTrigger>
          <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subconjuntos">
          <SubconjuntoTab 
            filtroTipoSubconjunto={filtroTipoSubconjunto}
            setFiltroTipoSubconjunto={setFiltroTipoSubconjunto}
            carregando={false}
            subconjuntos={subconjuntos}
            diagnosticos={diagnosticos}
            abrirModalCriarSubconjunto={abrirModalCriarSubconjunto}
            abrirModalEditarSubconjunto={abrirModalEditarSubconjunto}
            excluirSubconjunto={excluirSubconjunto}
          />
        </TabsContent>
        
        <TabsContent value="diagnosticos">
          <DiagnosticosTab 
            subconjuntos={subconjuntos}
            diagnosticos={diagnosticos}
            filtroSubconjunto={filtroSubconjunto}
            filtroDiagnostico={filtroDiagnostico}
            termoBusca={termoBusca}
            setFiltroSubconjunto={setFiltroSubconjunto}
            setFiltroDiagnostico={setFiltroDiagnostico}
            setTermoBusca={setTermoBusca}
            carregando={false}
            abrirModalCriarDiagnostico={abrirModalCriarDiagnostico}
            abrirModalEditarDiagnostico={abrirModalEditarDiagnostico}
            abrirModalVisualizarDiagnostico={abrirModalVisualizarDiagnostico}
            excluirDiagnostico={excluirDiagnostico}
            getNomeSubconjunto={getNomeSubconjunto}
            getTipoSubconjunto={getTipoSubconjunto}
            getSubconjuntosNomes={getSubconjuntosNomes}
          />
        </TabsContent>
      </Tabs>

      {/* Modal para criar/editar Subconjunto */}
      <Dialog open={modalSubconjuntoAberto} onOpenChange={setModalSubconjuntoAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{editandoSubconjunto ? "Editar" : "Novo"} Subconjunto</DialogTitle>
          <FormSubconjunto
            formSubconjunto={formSubconjunto}
            setFormSubconjunto={setFormSubconjunto}
            onSalvar={salvarSubconjunto}
            onCancel={() => setModalSubconjuntoAberto(false)}
            editando={editandoSubconjunto}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para criar/editar Diagnóstico */}
      <Dialog open={modalDiagnosticoAberto} onOpenChange={setModalDiagnosticoAberto}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>{editandoDiagnostico ? "Editar" : "Novo"} Diagnóstico de Enfermagem</DialogTitle>
          <FormDiagnostico
            formDiagnostico={formDiagnostico}
            setFormDiagnostico={setFormDiagnostico}
            subconjuntos={subconjuntos}
            onSalvar={salvarDiagnostico}
            onCancel={() => setModalDiagnosticoAberto(false)}
            editando={editandoDiagnostico}
            onAdicionarResultadoEsperado={adicionarResultadoEsperado}
            onRemoverResultadoEsperado={removerResultadoEsperado}
            onAtualizarResultadoEsperado={atualizarResultadoEsperado}
            onAdicionarIntervencao={adicionarIntervencao}
            onRemoverIntervencao={removerIntervencao}
            onAtualizarIntervencao={atualizarIntervencao}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para visualizar Diagnóstico */}
      <Dialog open={modalVisualizarDiagnosticoAberto} onOpenChange={setModalVisualizarDiagnosticoAberto}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Visualizar Diagnóstico de Enfermagem</DialogTitle>
          {diagnosticoVisualizar && (
            <DiagnosticoVisualizer 
              diagnostico={diagnosticoVisualizar}
              subconjuntos={subconjuntos}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciadorDiagnosticos;
