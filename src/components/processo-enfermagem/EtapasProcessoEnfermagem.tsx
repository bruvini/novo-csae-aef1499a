
import React, { useState, useMemo } from 'react';
import { Evolucao, Paciente, SubconjuntoDiagnostico } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { fetchSubconjuntos } from '@/services/bancodados/sinaisVitaisDB';
import HistoricoEnfermagem from './etapas/HistoricoEnfermagem';


interface EtapasProcessoEnfermagemProps {
  paciente: Paciente;
  evolucaoId: string;
  onSalvarProgresso: (options?: { fecharAposSalvar?: boolean }) => void;
  dadosEvolucao: Partial<Evolucao>;
  onDadosChange: (novosDados: Partial<Evolucao>) => void;
  isSaving: boolean;
}

type Etapa = 'historico' | 'diagnostico' | 'planejamento' | 'implementacao' | 'evolucao';

const etapas: Etapa[] = ['historico', 'diagnostico', 'planejamento', 'implementacao', 'evolucao'];
const etapaLabels: Record<Etapa, string> = {
    historico: 'Histórico',
    diagnostico: 'Diagnóstico',
    planejamento: 'Planejamento',
    implementacao: 'Implementação',
    evolucao: 'Evolução',
};

interface AlteredParam {
  id: string;
  titulo: string;
  nhbIds?: string[];
}

const EtapasProcessoEnfermagem: React.FC<EtapasProcessoEnfermagemProps> = ({ paciente, onSalvarProgresso, dadosEvolucao, onDadosChange, isSaving }) => {
    const [etapaAtual, setEtapaAtual] = useState<Etapa>('historico');
    const [alteredParams, setAlteredParams] = useState<AlteredParam[]>([]);

    const coletaDadosVazia = !dadosEvolucao.dadosAvaliacao?.etapaHistorico?.coletaDados?.trim();

    const { data: todosSubconjuntos, isLoading: isLoadingSubconjuntos } = useQuery<SubconjuntoDiagnostico[]>({
      queryKey: ['subconjuntosDiagnosticos', 'NHB'],
      queryFn: fetchSubconjuntos
    });

    const affectedNhbIds = useMemo(() => {
        const ids = alteredParams.flatMap(p => p.nhbIds || []);
        return [...new Set(ids)];
    }, [alteredParams]);

    const affectedNhbs = useMemo(() => {
        if (!todosSubconjuntos || affectedNhbIds.length === 0) return [];
        return todosSubconjuntos.filter(sub => affectedNhbIds.includes(sub.id!));
    }, [affectedNhbIds, todosSubconjuntos]);

    const selectedNhbIds = useMemo(() => dadosEvolucao.dadosAvaliacao?.etapaHistorico?.necessidadesHumanasBasicas || [], [dadosEvolucao.dadosAvaliacao?.etapaHistorico?.necessidadesHumanasBasicas]);
    
    const handleNhbSelectionChange = (nhbId: string, checked: boolean) => {
        const newSelectedIds = checked
            ? [...selectedNhbIds, nhbId]
            : selectedNhbIds.filter(id => id !== nhbId);
        
        onDadosChange({
            dadosAvaliacao: {
                ...dadosEvolucao.dadosAvaliacao,
                etapaHistorico: {
                    ...(dadosEvolucao.dadosAvaliacao?.etapaHistorico || {}),
                    necessidadesHumanasBasicas: newSelectedIds,
                }
            },
        });
    };

    const currentIndex = etapas.indexOf(etapaAtual);

    const handleNext = () => {
        if (currentIndex < etapas.length - 1 && !coletaDadosVazia) {
            onSalvarProgresso();
            setEtapaAtual(etapas[currentIndex + 1]);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            onSalvarProgresso();
            setEtapaAtual(etapas[currentIndex - 1]);
        }
    };

    const handleScrollToParam = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2', 'transition-shadow', 'duration-300');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
            }, 2000);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-csae-green-700">
                    Processo de Enfermagem: {paciente.nome}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={etapaAtual} onValueChange={(value) => setEtapaAtual(value as Etapa)} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        {etapas.map(etapa => (
                             <TabsTrigger key={etapa} value={etapa} disabled={etapa !== 'historico' && coletaDadosVazia}>{etapaLabels[etapa]}</TabsTrigger>
                        ))}
                    </TabsList>
                    {etapas.map((etapa, index) => (
                        <TabsContent key={etapa} value={etapa}>
                            <Card>
                                <CardContent className="pt-6 min-h-[300px] flex flex-col relative">
                                    <div className="flex-grow">
                                        {etapa === 'historico' ? (
                                            <HistoricoEnfermagem
                                                paciente={paciente}
                                                dadosEvolucao={dadosEvolucao}
                                                onDadosChange={onDadosChange}
                                                isLoadingSubconjuntos={isLoadingSubconjuntos}
                                                affectedNhbs={affectedNhbs}
                                                selectedNhbIds={selectedNhbIds}
                                                handleNhbSelectionChange={handleNhbSelectionChange}
                                                alteredParams={alteredParams}
                                                onAlterationsChange={setAlteredParams}
                                                handleScrollToParam={handleScrollToParam}
                                            />
                                        ) : (
                                            <div className="flex h-full justify-center items-center">
                                                <p className="text-gray-500">Em desenvolvimento</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-auto pt-4 flex justify-between">
                                        <div>
                                            {index > 0 && <Button variant="outline" onClick={handlePrev}>Voltar</Button>}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="secondary" onClick={() => onSalvarProgresso({ fecharAposSalvar: true })} disabled={isSaving}>
                                                {isSaving ? 'Salvando...' : 'Salvar Progresso'}
                                            </Button>
                                            {index < etapas.length - 1 && <Button onClick={handleNext} disabled={coletaDadosVazia}>Avançar</Button>}
                                            {etapa === 'evolucao' && <Button variant="destructive">Finalizar Consulta</Button>}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}

export default EtapasProcessoEnfermagem;
