import React, { useState, useMemo, useEffect } from 'react';
import { Evolucao, Paciente, SubconjuntoDiagnostico } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Info, AlertCircle } from 'lucide-react';
import SinaisVitaisForm from './etapas/SinaisVitaisForm';
import { useQuery } from '@tanstack/react-query';
import { fetchSubconjuntos } from '@/services/bancodados/sinaisVitaisDB';
import { Checkbox } from '../ui/checkbox';
import { Skeleton } from '../ui/skeleton';


interface EtapasProcessoEnfermagemProps {
  paciente: Paciente;
  evolucaoId: string;
  onSalvarProgresso: () => void;
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

const EtapasProcessoEnfermagem: React.FC<EtapasProcessoEnfermagemProps> = ({ paciente, evolucaoId, onSalvarProgresso, dadosEvolucao, onDadosChange, isSaving }) => {
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

    const handleQueixaPrincipalChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        onDadosChange({
            dadosAvaliacao: {
                ...dadosEvolucao.dadosAvaliacao,
                etapaHistorico: {
                    ...(dadosEvolucao.dadosAvaliacao?.etapaHistorico || {}),
                    coletaDados: event.target.value,
                }
            },
        });
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
                                                                value={dadosEvolucao.dadosAvaliacao?.etapaHistorico?.coletaDados || ''}
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
                                                                    onAlterationsChange={setAlteredParams}
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
                                                        {alteredParams.length > 0 && (
                                                            <Card className="border-yellow-400 bg-yellow-50">
                                                                <CardHeader>
                                                                    <CardTitle className="text-base font-semibold text-yellow-800">Parâmetros Alterados</CardTitle>
                                                                    <CardDescription className="text-yellow-700">Valores que indicam necessidade de atenção.</CardDescription>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    <ul className="list-disc pl-5 space-y-2 text-yellow-900">
                                                                        {alteredParams.map(param => (
                                                                            <li key={param.id}>
                                                                                <button
                                                                                    onClick={() => handleScrollToParam(param.id)}
                                                                                    className="text-left text-blue-600 hover:underline focus:outline-none"
                                                                                >
                                                                                    {param.titulo}
                                                                                </button>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </CardContent>
                                                            </Card>
                                                        )}
                                                    </div>
                                                </TabsContent>
                                                <TabsContent value="necessidades-humanas">
                                                    <div className="space-y-4 pt-4">
                                                        <Card className="border-gray-200">
                                                          <CardHeader>
                                                              <CardTitle className="text-base font-semibold">Necessidades Humanas Básicas Afetadas</CardTitle>
                                                              <CardDescription className="pt-2">
                                                                  Durante a coleta de dados de enfermagem, foram identificadas alterações que afetam Necessidades Humanas Básicas (NHBs). Segundo a teoria de Wanda Horta, essas necessidades representam os fundamentos para uma assistência integral, sendo indispensável sua avaliação no processo de enfermagem.
                                                              </CardDescription>
                                                          </CardHeader>
                                                          <CardContent>
                                                              {isLoadingSubconjuntos ? (
                                                                  <div className="space-y-3">
                                                                      <Skeleton className="h-6 w-3/4" />
                                                                      <Skeleton className="h-6 w-1/2" />
                                                                      <Skeleton className="h-6 w-2/3" />
                                                                  </div>
                                                              ) : affectedNhbs.length > 0 ? (
                                                                  <div className="space-y-3">
                                                                      {affectedNhbs.map(nhb => (
                                                                          <div key={nhb.id} className="flex items-center space-x-3">
                                                                              <Checkbox
                                                                                  id={`nhb-${nhb.id}`}
                                                                                  checked={selectedNhbIds.includes(nhb.id!)}
                                                                                  onCheckedChange={(checked) => handleNhbSelectionChange(nhb.id!, !!checked)}
                                                                              />
                                                                              <Label htmlFor={`nhb-${nhb.id}`} className="font-normal text-sm cursor-pointer">
                                                                                  {nhb.nome}
                                                                              </Label>
                                                                          </div>
                                                                      ))}
                                                                  </div>
                                                              ) : (
                                                                  <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-lg bg-gray-50 border">
                                                                      <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                                                                      <p className="text-gray-700 font-medium text-base">Nenhuma Necessidade Humana Básica foi afetada.</p>
                                                                      <p className="text-sm text-gray-500 mt-2">Preencha os Sinais Vitais na aba "Exame Físico" para identificar automaticamente as necessidades que podem requerer atenção.</p>
                                                                  </div>
                                                              )}
                                                          </CardContent>
                                                        </Card>
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
                                            <Button variant="secondary" onClick={onSalvarProgresso} disabled={isSaving}>
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
