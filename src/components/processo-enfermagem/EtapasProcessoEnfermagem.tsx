
import React, { useState } from 'react';
import { Paciente } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EtapasProcessoEnfermagemProps {
  paciente: Paciente;
  evolucaoId: string;
  onSalvarEFechar: () => void;
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

const EtapasProcessoEnfermagem: React.FC<EtapasProcessoEnfermagemProps> = ({ paciente, evolucaoId, onSalvarEFechar }) => {
    const [etapaAtual, setEtapaAtual] = useState<Etapa>('historico');

    const currentIndex = etapas.indexOf(etapaAtual);

    const handleNext = () => {
        if (currentIndex < etapas.length - 1) {
            setEtapaAtual(etapas[currentIndex + 1]);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setEtapaAtual(etapas[currentIndex - 1]);
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
                             <TabsTrigger key={etapa} value={etapa}>{etapaLabels[etapa]}</TabsTrigger>
                        ))}
                    </TabsList>
                    {etapas.map((etapa, index) => (
                        <TabsContent key={etapa} value={etapa}>
                            <Card>
                                <CardContent className="pt-6 min-h-[300px] flex flex-col relative">
                                    <div className="flex-grow">
                                        {etapa === 'historico' ? (
                                            <Tabs defaultValue="coleta-dados" className="w-full">
                                                <TabsList className="grid w-full grid-cols-3">
                                                    <TabsTrigger value="coleta-dados">Coleta de Dados</TabsTrigger>
                                                    <TabsTrigger value="exame-fisico">Exame Físico</TabsTrigger>
                                                    <TabsTrigger value="necessidades-humanas">Necessidades Humanas Básicas</TabsTrigger>
                                                </TabsList>
                                                <TabsContent value="coleta-dados">
                                                    <div className="min-h-[200px] flex justify-center items-center">
                                                        <p className="text-gray-500">Em desenvolvimento</p>
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="exame-fisico">
                                                    <div className="min-h-[200px] flex justify-center items-center">
                                                        <p className="text-gray-500">Em desenvolvimento</p>
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="necessidades-humanas">
                                                    <div className="min-h-[200px] flex justify-center items-center">
                                                        <p className="text-gray-500">Em desenvolvimento</p>
                                                    </div>
                                                </TabsContent>
                                            </Tabs>
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
                                            <Button variant="secondary" onClick={onSalvarEFechar}>Salvar Progresso</Button>
                                            {index < etapas.length - 1 && <Button onClick={handleNext}>Avançar</Button>}
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
