
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Evolucao, Paciente, SubconjuntoDiagnostico } from '@/types';
import ColetaDadosTab from './historico/ColetaDadosTab';
import ExameFisicoTab from './historico/ExameFisicoTab';
import NecessidadesHumanasTab from './historico/NecessidadesHumanasTab';

interface AlteredParam {
  id: string;
  titulo: string;
  nhbIds?: string[];
}

interface HistoricoEnfermagemProps {
    paciente: Paciente;
    dadosEvolucao: Partial<Evolucao>;
    onDadosChange: (novosDados: Partial<Evolucao>) => void;
    isLoadingSubconjuntos: boolean;
    affectedNhbs: SubconjuntoDiagnostico[];
    selectedNhbIds: string[];
    handleNhbSelectionChange: (nhbId: string, checked: boolean) => void;
    alteredParams: AlteredParam[];
    onAlterationsChange: (alterations: AlteredParam[]) => void;
    handleScrollToParam: (id: string) => void;
}

const HistoricoEnfermagem: React.FC<HistoricoEnfermagemProps> = ({
    paciente,
    dadosEvolucao,
    onDadosChange,
    isLoadingSubconjuntos,
    affectedNhbs,
    selectedNhbIds,
    handleNhbSelectionChange,
    alteredParams,
    onAlterationsChange,
    handleScrollToParam
}) => {
    return (
        <Tabs defaultValue="coleta-dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="coleta-dados">Coleta de Dados</TabsTrigger>
                <TabsTrigger value="exame-fisico">Exame Físico</TabsTrigger>
                <TabsTrigger value="necessidades-humanas">Necessidades Humanas Básicas</TabsTrigger>
            </TabsList>
            <TabsContent value="coleta-dados">
                <ColetaDadosTab dadosEvolucao={dadosEvolucao} onDadosChange={onDadosChange} />
            </TabsContent>
            <TabsContent value="exame-fisico">
                <ExameFisicoTab
                    paciente={paciente}
                    dadosEvolucao={dadosEvolucao}
                    onDadosChange={onDadosChange}
                    alteredParams={alteredParams}
                    onAlterationsChange={onAlterationsChange}
                    handleScrollToParam={handleScrollToParam}
                />
            </TabsContent>
            <TabsContent value="necessidades-humanas">
                <NecessidadesHumanasTab
                    isLoadingSubconjuntos={isLoadingSubconjuntos}
                    affectedNhbs={affectedNhbs}
                    selectedNhbIds={selectedNhbIds}
                    handleNhbSelectionChange={handleNhbSelectionChange}
                />
            </TabsContent>
        </Tabs>
    );
};

export default HistoricoEnfermagem;
