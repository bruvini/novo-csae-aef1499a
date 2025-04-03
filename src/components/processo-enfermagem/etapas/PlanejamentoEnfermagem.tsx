
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  PlusCircle, 
  Trash2, 
  AlertCircle, 
  MoveVertical,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';

interface DiagnosticoEnfermagem {
  id: string;
  descricao: string;
  selecionado: boolean;
  subconjunto?: string;
}

interface Planejamento {
  diagnosticoId: string;
  resultadoEsperado: string;
  intervencoes: string[];
}

interface PlanejamentoEnfermagemProps {
  diagnosticos: DiagnosticoEnfermagem[];
  planejamento: Planejamento[];
  setPlanejamento: React.Dispatch<React.SetStateAction<Planejamento[]>>;
}

export function PlanejamentoEnfermagem({ 
  diagnosticos, 
  planejamento, 
  setPlanejamento 
}: PlanejamentoEnfermagemProps) {
  const [etapaAtiva, setEtapaAtiva] = useState<'priorizacao' | 'resultados'>('priorizacao');
  const [diagnosticosOrdenados, setDiagnosticosOrdenados] = useState<DiagnosticoEnfermagem[]>([]);
  const [intervencaoManual, setIntervencaoManual] = useState<{[key: string]: string}>({});
  
  // Dados de exemplo para resultados esperados - em produção virão do Firestore
  const resultadosEsperadosExemplo: {[key: string]: string[]} = {
    // Para diagnósticos de hipertensão
    "1": [ // Risco de pressão arterial instável
      "Pressão arterial estabilizada dentro dos parâmetros aceitáveis",
      "Paciente compreenderá fatores de risco e medidas preventivas",
      "Ausência de sinais e sintomas de hipertensão aguda"
    ],
    "2": [ // Risco de complicações associadas à hipertensão
      "Ausência de complicações relacionadas à hipertensão",
      "Sinais vitais mantidos estáveis",
      "Adesão ao plano terapêutico"
    ],
    "3": [ // Conhecimento deficiente sobre regime terapêutico
      "Paciente demonstrará conhecimento sobre sua condição e tratamento",
      "Paciente verbalizará entendimento dos medicamentos e efeitos colaterais",
      "Adesão ao regime terapêutico"
    ],
    
    // Para diagnósticos de diabetes
    "4": [ // Risco de glicemia instável
      "Níveis glicêmicos dentro dos parâmetros normais",
      "Ausência de sinais e sintomas de hipoglicemia ou hiperglicemia",
      "Paciente demonstrará habilidade para monitorar glicemia"
    ],
    "5": [ // Risco de infecção
      "Pele e mucosas íntegras sem sinais de infecção",
      "Ausência de processo infeccioso",
      "Paciente demonstrará habilidade para identificar sinais de infecção"
    ],
    
    // Para outros diagnósticos
    "6": [ // Padrão respiratório ineficaz
      "Padrão respiratório eficaz estabelecido",
      "Frequência respiratória dentro dos parâmetros normais",
      "Ausência de dispneia e fadiga respiratória"
    ],
  };
  
  // Dados de exemplo para intervenções - em produção virão do Firestore
  const intervencoesExemplo: {[key: string]: string[]} = {
    // Para resultados de HAS
    "Pressão arterial estabilizada dentro dos parâmetros aceitáveis": [
      "Monitorar pressão arterial em intervalos regulares",
      "Orientar sobre alimentação com baixo teor de sódio",
      "Instruir sobre a importância da adesão à terapia medicamentosa",
      "Orientar sobre atividade física regular"
    ],
    "Paciente compreenderá fatores de risco e medidas preventivas": [
      "Educar sobre fatores de risco cardiovascular",
      "Fornecer material educativo sobre hipertensão",
      "Discutir modificações no estilo de vida",
      "Estimular redução do estresse"
    ],
    
    // Para resultados de DM
    "Níveis glicêmicos dentro dos parâmetros normais": [
      "Monitorar glicemia capilar conforme prescrição",
      "Orientar sobre sinais de hipoglicemia e hiperglicemia",
      "Instruir sobre técnica correta de aplicação de insulina",
      "Promover alimentação adequada com contagem de carboidratos"
    ],
    
    // Para resultados respiratórios
    "Padrão respiratório eficaz estabelecido": [
      "Posicionar o paciente para maximizar a ventilação",
      "Monitorar padrão respiratório",
      "Auscultar sons respiratórios",
      "Instruir sobre técnicas de respiração profunda"
    ],
  };
  
  // Inicializar diagnosticos ordenados
  useEffect(() => {
    if (diagnosticos.length > 0 && diagnosticosOrdenados.length === 0) {
      setDiagnosticosOrdenados([...diagnosticos]);
    }
  }, [diagnosticos, diagnosticosOrdenados.length]);
  
  // Inicializar planejamento para cada diagnóstico selecionado que ainda não tenha um plano
  useEffect(() => {
    if (diagnosticosOrdenados.length > 0) {
      const diagnosticosComPlanejamento = planejamento.map(p => p.diagnosticoId);
      
      const novosPlanejamentos = diagnosticosOrdenados
        .filter(d => !diagnosticosComPlanejamento.includes(d.id))
        .map(d => ({
          diagnosticoId: d.id,
          resultadoEsperado: '',
          intervencoes: []
        }));
      
      if (novosPlanejamentos.length > 0) {
        setPlanejamento(prev => [...prev, ...novosPlanejamentos]);
      }
    }
  }, [diagnosticosOrdenados, planejamento, setPlanejamento]);
  
  // Mover diagnóstico para cima na lista
  const moverParaCima = (index: number) => {
    if (index === 0) return;
    
    const novosOrdenados = [...diagnosticosOrdenados];
    const item = novosOrdenados[index];
    novosOrdenados[index] = novosOrdenados[index - 1];
    novosOrdenados[index - 1] = item;
    
    setDiagnosticosOrdenados(novosOrdenados);
  };
  
  // Mover diagnóstico para baixo na lista
  const moverParaBaixo = (index: number) => {
    if (index === diagnosticosOrdenados.length - 1) return;
    
    const novosOrdenados = [...diagnosticosOrdenados];
    const item = novosOrdenados[index];
    novosOrdenados[index] = novosOrdenados[index + 1];
    novosOrdenados[index + 1] = item;
    
    setDiagnosticosOrdenados(novosOrdenados);
  };
  
  // Selecionar resultado esperado
  const selecionarResultadoEsperado = (diagnosticoId: string, resultado: string) => {
    setPlanejamento(prev => 
      prev.map(p => 
        p.diagnosticoId === diagnosticoId 
          ? { 
              ...p, 
              resultadoEsperado: resultado,
              // Limpar intervenções anteriores quando o resultado muda
              intervencoes: [] 
            } 
          : p
      )
    );
  };
  
  // Selecionar intervenção
  const selecionarIntervencao = (diagnosticoId: string, intervencao: string) => {
    setPlanejamento(prev => 
      prev.map(p => {
        if (p.diagnosticoId === diagnosticoId) {
          const novasIntervencoes = p.intervencoes.includes(intervencao)
            ? p.intervencoes.filter(i => i !== intervencao)
            : [...p.intervencoes, intervencao];
          
          return { ...p, intervencoes: novasIntervencoes };
        }
        return p;
      })
    );
  };
  
  // Adicionar intervenção manual
  const adicionarIntervencaoManual = (diagnosticoId: string) => {
    const texto = intervencaoManual[diagnosticoId];
    
    if (texto && texto.trim()) {
      setPlanejamento(prev => 
        prev.map(p => {
          if (p.diagnosticoId === diagnosticoId) {
            return { 
              ...p, 
              intervencoes: [...p.intervencoes, texto.trim()] 
            };
          }
          return p;
        })
      );
      
      // Limpar campo após adicionar
      setIntervencaoManual(prev => ({ ...prev, [diagnosticoId]: '' }));
    }
  };
  
  // Remover intervenção
  const removerIntervencao = (diagnosticoId: string, intervencao: string) => {
    setPlanejamento(prev => 
      prev.map(p => {
        if (p.diagnosticoId === diagnosticoId) {
          return { 
            ...p, 
            intervencoes: p.intervencoes.filter(i => i !== intervencao) 
          };
        }
        return p;
      })
    );
  };
  
  // Verificar se todas as diagnósticos têm resultados e intervenções
  const verificarPlanejamentoCompleto = () => {
    return diagnosticosOrdenados.every(d => {
      const plano = planejamento.find(p => p.diagnosticoId === d.id);
      return plano?.resultadoEsperado && plano.intervencoes.length > 0;
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planejamento de Enfermagem</CardTitle>
          <CardDescription>
            {etapaAtiva === 'priorizacao'
              ? 'Priorize os diagnósticos de enfermagem de acordo com a importância'
              : 'Defina os resultados esperados e as intervenções para cada diagnóstico'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Etapa 1: Priorização de Diagnósticos */}
          {etapaAtiva === 'priorizacao' && (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-4">
                Arraste os diagnósticos para alterar a ordem de prioridade. Os diagnósticos mais importantes devem ficar no topo.
              </div>
              
              <div className="space-y-2">
                {diagnosticosOrdenados.map((diagnostico, index) => (
                  <div 
                    key={diagnostico.id}
                    className="flex items-center p-3 rounded-md border bg-white hover:bg-gray-50"
                  >
                    <div className="mr-3 flex-shrink-0 font-semibold text-gray-500">
                      {index + 1}.
                    </div>
                    
                    <div className="flex-grow">
                      {diagnostico.subconjunto && (
                        <span className="text-sm text-csae-green-700 block">{diagnostico.subconjunto}</span>
                      )}
                      <span className="font-medium">{diagnostico.descricao}</span>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moverParaCima(index)}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moverParaBaixo(index)}
                        disabled={index === diagnosticosOrdenados.length - 1}
                        className="h-8 w-8 p-0"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end mt-6">
                <Button 
                  variant="default"
                  className="bg-csae-green-600 hover:bg-csae-green-700"
                  onClick={() => setEtapaAtiva('resultados')}
                >
                  Continuar para Resultados e Intervenções
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Etapa 2: Determinação de Resultados e Intervenções */}
          {etapaAtiva === 'resultados' && (
            <div className="space-y-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEtapaAtiva('priorizacao')}
                className="mb-4"
              >
                Voltar para Priorização
              </Button>
              
              <Accordion type="multiple" className="w-full space-y-4">
                {diagnosticosOrdenados.map((diagnostico, index) => {
                  const plano = planejamento.find(p => p.diagnosticoId === diagnostico.id);
                  const resultadosDisponiveis = resultadosEsperadosExemplo[diagnostico.id] || [];
                  const intervencoesDisponiveisParaResultado = plano?.resultadoEsperado 
                    ? intervencoesExemplo[plano.resultadoEsperado] || []
                    : [];
                  
                  const estaCompleto = plano?.resultadoEsperado && plano.intervencoes.length > 0;
                  
                  return (
                    <AccordionItem 
                      key={diagnostico.id} 
                      value={diagnostico.id}
                      className={`border rounded-md overflow-hidden ${
                        estaCompleto ? 'border-green-200' : 'border-amber-200'
                      }`}
                    >
                      <AccordionTrigger className={`px-4 py-3 hover:bg-gray-50 ${
                        estaCompleto ? 'bg-green-50' : 'bg-amber-50'
                      }`}>
                        <div className="flex items-center text-left">
                          <span className="mr-2 font-semibold text-gray-500">{index + 1}.</span>
                          <div>
                            {diagnostico.subconjunto && (
                              <span className="text-sm text-csae-green-700 block">{diagnostico.subconjunto}</span>
                            )}
                            <span className="font-medium">{diagnostico.descricao}</span>
                          </div>
                          
                          {estaCompleto ? (
                            <span className="ml-3 text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                              Completo
                            </span>
                          ) : (
                            <span className="ml-3 text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                              Pendente
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      
                      <AccordionContent className="px-4 pt-2 pb-4 border-t bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Coluna 1: Resultados Esperados */}
                          <div>
                            <h4 className="font-medium mb-3">Resultado Esperado:</h4>
                            
                            {resultadosDisponiveis.length > 0 ? (
                              <div className="space-y-2">
                                {resultadosDisponiveis.map(resultado => (
                                  <div 
                                    key={resultado}
                                    className={`p-3 rounded border cursor-pointer ${
                                      plano?.resultadoEsperado === resultado
                                        ? 'bg-csae-green-50 border-csae-green-300'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                                    onClick={() => selecionarResultadoEsperado(diagnostico.id, resultado)}
                                  >
                                    {resultado}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
                                <p className="text-sm">
                                  Não há resultados esperados cadastrados para este diagnóstico. 
                                  Por favor, selecione outro diagnóstico ou entre em contato com o administrador.
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {/* Coluna 2: Intervenções */}
                          <div>
                            <h4 className="font-medium mb-3">Intervenções:</h4>
                            
                            {!plano?.resultadoEsperado ? (
                              <div className="p-4 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
                                <p className="text-sm">
                                  Selecione um resultado esperado primeiro para ver as intervenções disponíveis.
                                </p>
                              </div>
                            ) : intervencoesDisponiveisParaResultado.length > 0 ? (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  {intervencoesDisponiveisParaResultado.map(intervencao => (
                                    <div 
                                      key={intervencao}
                                      className={`p-3 rounded border cursor-pointer flex items-start ${
                                        plano.intervencoes.includes(intervencao)
                                          ? 'bg-csae-green-50 border-csae-green-300'
                                          : 'bg-white border-gray-200 hover:bg-gray-50'
                                      }`}
                                      onClick={() => selecionarIntervencao(diagnostico.id, intervencao)}
                                    >
                                      <div className="flex-grow">{intervencao}</div>
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="mt-4">
                                  <Label htmlFor={`intervencao-manual-${diagnostico.id}`} className="text-sm font-medium mb-2 block">
                                    Adicionar intervenção personalizada:
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      id={`intervencao-manual-${diagnostico.id}`}
                                      placeholder="Digite uma nova intervenção..."
                                      value={intervencaoManual[diagnostico.id] || ''}
                                      onChange={(e) => setIntervencaoManual(prev => ({ 
                                        ...prev, 
                                        [diagnostico.id]: e.target.value 
                                      }))}
                                    />
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => adicionarIntervencaoManual(diagnostico.id)}
                                      disabled={!intervencaoManual[diagnostico.id]?.trim()}
                                    >
                                      <PlusCircle className="h-4 w-4 mr-2" />
                                      Adicionar
                                    </Button>
                                  </div>
                                </div>
                                
                                {plano.intervencoes.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="text-sm font-medium mb-2">Intervenções selecionadas:</h5>
                                    <div className="space-y-2">
                                      {plano.intervencoes.map((intervencao, i) => (
                                        <div 
                                          key={i}
                                          className="flex justify-between items-center p-2 bg-csae-green-50 border border-csae-green-200 rounded-md"
                                        >
                                          <span className="text-sm">{intervencao}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removerIntervencao(diagnostico.id, intervencao)}
                                            className="h-7 w-7 p-0 text-gray-500 hover:text-red-500"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-200">
                                <p className="text-sm">
                                  Não há intervenções cadastradas para este resultado esperado. 
                                  Por favor, use o campo abaixo para adicionar intervenções personalizadas.
                                </p>
                                <div className="mt-4">
                                  <Label htmlFor={`intervencao-manual-${diagnostico.id}`} className="text-sm font-medium mb-2 block">
                                    Adicionar intervenção personalizada:
                                  </Label>
                                  <div className="flex gap-2">
                                    <Input
                                      id={`intervencao-manual-${diagnostico.id}`}
                                      placeholder="Digite uma nova intervenção..."
                                      value={intervencaoManual[diagnostico.id] || ''}
                                      onChange={(e) => setIntervencaoManual(prev => ({ 
                                        ...prev, 
                                        [diagnostico.id]: e.target.value 
                                      }))}
                                    />
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => adicionarIntervencaoManual(diagnostico.id)}
                                      disabled={!intervencaoManual[diagnostico.id]?.trim()}
                                    >
                                      <PlusCircle className="h-4 w-4 mr-2" />
                                      Adicionar
                                    </Button>
                                  </div>
                                </div>
                                
                                {plano.intervencoes.length > 0 && (
                                  <div className="mt-4">
                                    <h5 className="text-sm font-medium mb-2">Intervenções adicionadas:</h5>
                                    <div className="space-y-2">
                                      {plano.intervencoes.map((intervencao, i) => (
                                        <div 
                                          key={i}
                                          className="flex justify-between items-center p-2 bg-csae-green-50 border border-csae-green-200 rounded-md"
                                        >
                                          <span className="text-sm">{intervencao}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removerIntervencao(diagnostico.id, intervencao)}
                                            className="h-7 w-7 p-0 text-gray-500 hover:text-red-500"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="p-4 bg-blue-50 rounded-md border border-blue-100 flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-700">
            Status do Planejamento: {verificarPlanejamentoCompleto() ? 'Completo' : 'Incompleto'}
          </h4>
          <p className="mt-1 text-sm text-blue-700">
            {verificarPlanejamentoCompleto() 
              ? 'Todos os diagnósticos possuem resultados esperados e intervenções definidas.' 
              : 'Para continuar, todos os diagnósticos devem ter um resultado esperado e pelo menos uma intervenção definida.'}
          </p>
          {!verificarPlanejamentoCompleto() && (
            <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
              {diagnosticosOrdenados.map(d => {
                const plano = planejamento.find(p => p.diagnosticoId === d.id);
                const temResultado = plano && plano.resultadoEsperado;
                const temIntervencoes = plano && plano.intervencoes.length > 0;
                
                if (!temResultado || !temIntervencoes) {
                  return (
                    <li key={d.id}>
                      <span className="font-medium">{d.descricao}:</span>
                      {!temResultado && ' Falta resultado esperado.'}
                      {!temIntervencoes && ' Falta intervenções.'}
                    </li>
                  );
                }
                return null;
              }).filter(Boolean)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
