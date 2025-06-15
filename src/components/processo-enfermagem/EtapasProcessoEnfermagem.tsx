import React, { useState } from 'react';
import { Evolucao, Paciente } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Info } from 'lucide-react';
import SinaisVitaisForm from './etapas/SinaisVitaisForm';

interface EtapasProcessoEnfermagemProps {
  paciente: Paciente;
  evolucaoId: string;
  onSalvarEFechar: () => void;
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

const EtapasProcessoEnfermagem: React.FC<EtapasProcessoEnfermagemProps> = ({ paciente, evolucaoId, onSalvarEFechar, dadosEvolucao, onDadosChange, isSaving }) => {
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

    const handleQueixaPrincipalChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onDadosChange({
            dadosAvaliacao: {
                queixaPrincipal: event.target.value,
            },
        });
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
                                                    <div className="space-y-6">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="queixa-principal" className="text-base font-semibold">Queixa Principal / História da Doença Atual</Label>
                                                            <Textarea
                                                                id="queixa-principal"
                                                                placeholder="Descreva aqui a queixa principal do paciente, suas palavras, história da doença, etc."
                                                                className="min-h-[150px]"
                                                                value={dadosEvolucao.dadosAvaliacao?.queixaPrincipal || ''}
                                                                onChange={handleQueixaPrincipalChange}
                                                            />
                                                        </div>
                                                        <Card className="bg-blue-50 border-blue-200">
                                                            <CardHeader className="pb-2">
                                                                <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                                                                    <Info className="h-5 w-5" />
                                                                    Dicas para uma Coleta de Dados eficaz
                                                                </CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <ul className="list-disc pl-5 space-y-2 text-sm text-blue-700">
                                                                    <li><strong>Escuta Ativa:</strong> Demonstre interesse genuíno, mantenha contato visual e evite interrupções.</li>
                                                                    <li><strong>Perguntas Abertas:</strong> Use perguntas que incentivem o paciente a contar sua história, como "Fale-me mais sobre isso...".</li>
                                                                    <li><strong>Empatia:</strong> Valide os sentimentos do paciente. Frases como "Imagino que isso seja difícil" podem ajudar.</li>
                                                                    <li><strong>Ambiente Confortável:</strong> Garanta privacidade e um ambiente tranquilo para que o paciente se sinta à vontade para se expressar.</li>
                                                                    <li><strong>Linguagem Clara:</strong> Evite jargões técnicos. Use uma linguagem que o paciente possa entender facilmente.</li>
                                                                </ul>
                                                            </CardContent>
                                                        </Card>
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="exame-fisico">
                                                    <div className="space-y-4">
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle className="text-base font-semibold">Sinais Vitais</CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <SinaisVitaisForm
                                                                    paciente={paciente}
                                                                    dadosEvolucao={dadosEvolucao}
                                                                    onDadosChange={onDadosChange}
                                                                />
                                                            </CardContent>
                                                        </Card>
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle className="text-base font-semibold">Resultado de Exames</CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="flex justify-center items-center text-sm text-gray-500 py-8">
                                                                    Em desenvolvimento
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                        <Card>
                                                            <CardHeader>
                                                                <CardTitle className="text-base font-semibold">Revisão por Sistemas</CardTitle>
                                                            </CardHeader>
                                                            <CardContent>
                                                                <div className="flex justify-center items-center text-sm text-gray-500 py-8">
                                                                    Em desenvolvimento
                                                                </div>
                                                            </CardContent>
                                                        </Card>
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
                                            <Button variant="secondary" onClick={onSalvarEFechar} disabled={isSaving}>
                                                {isSaving ? 'Salvando...' : 'Salvar Progresso'}
                                            </Button>
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
