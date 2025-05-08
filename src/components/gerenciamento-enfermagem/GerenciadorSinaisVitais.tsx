
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import useSinaisVitais from "@/hooks/use-sinais-vitais";
import SinaisVitaisTable from "./sinais-vitais/SinaisVitaisTable";
import SinalVitalForm from "./sinais-vitais/SinalVitalForm";

const GerenciadorSinaisVitais = () => {
  const {
    sinaisVitais,
    subconjuntos,
    modalAberto,
    setModalAberto,
    editandoId,
    carregando,
    diagnosticosFiltrados,
    formSinal,
    setFormSinal,
    abrirModalCriar,
    abrirModalEditar,
    adicionarValorReferencia,
    removerValorReferencia,
    atualizarValorReferencia,
    handleNhbChange,
    handleDiagnosticoChange,
    salvarSinalVital,
    excluirSinalVital,
  } = useSinaisVitais();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gerenciamento de Sinais Vitais</span>
          <Button
            onClick={abrirModalCriar}
            className="bg-csae-green-600 hover:bg-csae-green-700"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Sinal Vital
          </Button>
        </CardTitle>
        <CardDescription>
          Cadastre e gerencie os sinais vitais utilizados no processo de
          enfermagem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {carregando ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
          </div>
        ) : sinaisVitais.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            Nenhum sinal vital cadastrado. Clique em "Novo Sinal Vital" para
            começar.
          </div>
        ) : (
          <SinaisVitaisTable 
            sinaisVitais={sinaisVitais} 
            abrirModalEditar={abrirModalEditar}
            excluirSinalVital={excluirSinalVital}
          />
        )}
      </CardContent>

      {/* Modal para criar/editar sinal vital */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <SinalVitalForm 
          formSinal={formSinal}
          setFormSinal={setFormSinal}
          editandoId={editandoId}
          setModalAberto={setModalAberto}
          salvarSinalVital={salvarSinalVital}
          adicionarValorReferencia={adicionarValorReferencia}
          removerValorReferencia={removerValorReferencia}
          atualizarValorReferencia={atualizarValorReferencia}
          handleNhbChange={handleNhbChange}
          handleDiagnosticoChange={handleDiagnosticoChange}
          subconjuntos={subconjuntos}
          diagnosticosFiltrados={diagnosticosFiltrados}
        />
      </Dialog>
    </Card>
  );
};

export default GerenciadorSinaisVitais;
