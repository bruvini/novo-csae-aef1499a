
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Info, HelpCircle, GripVertical, Plus } from 'lucide-react';
import { ProcessoEnfermagem, DiagnosticoPlanejado, IntervencaoSelecionada, PlanejamentoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { getDiagnosticos, Diagnostico } from '@/services/bancodados/rolEnfermagemDB';

interface EtapaPlanejamentoProps {
  processo: ProcessoEnfermagem;
  paciente: Paciente;
  onUpdatePlanejamento: (planejamento: PlanejamentoEnfermagem) => void;
}

const EtapaPlanejamento: React.FC<EtapaPlanejamentoProps> = ({
  processo,
  paciente,
  onUpdatePlanejamento
}) => {
  const [diagnosticosPriorizados, setDiagnosticosPrivorizados] = useState<DiagnosticoPlanejado[]>([]);
  const [diagnosticosDetalhados, setDiagnosticosDetalhados] = useState<Diagnostico[]>([]);
  const [novaIntervencao, setNovaIntervencao] = useState<{ [key: string]: string }>({});
  const [faseAtual, setFaseAtual] = useState("item-1");

  useEffect(() => {
    // Carregar diagnósticos detalhados do Firestore
    const unsubscribe = getDiagnosticos((data) => {
      setDiagnosticosDetalhados(data);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    // Inicializar diagnosticosPriorizados com base nos diagnósticos selecionados
    if (processo.diagnostico.diagnosticosSelecionados.length > 0 && diagnosticosPriorizados.length === 0) {
      const diagnosticosIniciais = processo.diagnostico.diagnosticosSelecionados.map((diag, index) => ({
        diagnosticoId: diag.id,
        tituloDiagnostico: diag.tituloDiagnostico,
        ordemPrioridade: index + 1,
        intervencoesSelecionadas: []
      }));

      // Se já existe planejamento salvo, usar esses dados
      if (processo.planejamento?.diagnosticosPlanejados?.length > 0) {
        setDiagnosticosPrivorizados(processo.planejamento.diagnosticosPlanejados);
      } else {
        setDiagnosticosPrivorizados(diagnosticosIniciais);
      }
    }
  }, [processo.diagnostico.diagnosticosSelecionados, processo.planejamento, diagnosticosPriorizados.length]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(diagnosticosPriorizados);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Atualizar ordem de prioridade
    const updatedItems = items.map((item, index) => ({
      ...item,
      ordemPrioridade: index + 1
    }));

    setDiagnosticosPrivorizados(updatedItems);
    salvarPlanejamento(updatedItems);
  };

  const handleResultadoChange = (diagnosticoId: string, resultado: string) => {
    const updated = diagnosticosPriorizados.map(diag => 
      diag.diagnosticoId === diagnosticoId 
        ? { ...diag, resultadoEsperadoSelecionado: resultado }
        : diag
    );
    setDiagnosticosPrivorizados(updated);
    salvarPlanejamento(updated);
  };

  const handleIntervencaoChange = (diagnosticoId: string, acaoPrescrita: string, acaoEnfermeiro: string | undefined, checked: boolean) => {
    const updated = diagnosticosPriorizados.map(diag => {
      if (diag.diagnosticoId === diagnosticoId) {
        const intervencoes = diag.intervencoesSelecionadas || [];
        if (checked) {
          // Adicionar intervenção se não existir
          if (!intervencoes.some(i => i.acaoPrescrita === acaoPrescrita)) {
            intervencoes.push({ acaoPrescrita, acaoEnfermeiro, tipo: 'padrao' });
          }
        } else {
          // Remover intervenção
          const index = intervencoes.findIndex(i => i.acaoPrescrita === acaoPrescrita);
          if (index > -1) {
            intervencoes.splice(index, 1);
          }
        }
        return { ...diag, intervencoesSelecionadas: intervencoes };
      }
      return diag;
    });
    setDiagnosticosPrivorizados(updated);
    salvarPlanejamento(updated);
  };

  const handleAdicionarIntervencaoAutoral = (diagnosticoId: string) => {
    const texto = novaIntervencao[diagnosticoId]?.trim();
    if (!texto) return;

    const updated = diagnosticosPriorizados.map(diag => {
      if (diag.diagnosticoId === diagnosticoId) {
        const intervencoes = diag.intervencoesSelecionadas || [];
        intervencoes.push({ acaoPrescrita: texto, tipo: 'autoral' });
        return { ...diag, intervencoesSelecionadas: intervencoes };
      }
      return diag;
    });

    setDiagnosticosPrivorizados(updated);
    setNovaIntervencao(prev => ({ ...prev, [diagnosticoId]: '' }));
    salvarPlanejamento(updated);
  };

  const salvarPlanejamento = (diagnosticos: DiagnosticoPlanejado[]) => {
    const planejamento: PlanejamentoEnfermagem = {
      diagnosticosPlanejados: diagnosticos
    };
    onUpdatePlanejamento(planejamento);
  };

  const getDiagnosticoDetalhado = (diagnosticoId: string) => {
    return diagnosticosDetalhados.find(d => d.id === diagnosticoId);
  };

  const getIntervencoesDoResultado = (diagnosticoId: string, tituloResultado: string) => {
    const diagnostico = getDiagnosticoDetalhado(diagnosticoId);
    if (!diagnostico) return [];
    
    const resultado = diagnostico.resultadosEsperados.find(r => r.tituloResultado === tituloResultado);
    return resultado?.intervencoes || [];
  };

  if (processo.diagnostico.diagnosticosSelecionados.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-yellow-500" />
            Etapa 3: Planejamento de Enfermagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Para acessar a etapa de Planejamento, é necessário selecionar ao menos um diagnóstico na etapa anterior.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bloco Introdutório */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Etapa 3: Planejamento de Enfermagem
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Guia para o Planejamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Guia para o Planejamento de Enfermagem</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2">Decisão Compartilhada</h3>
                    <p>O planejamento deve ser desenvolvido em colaboração com o paciente, família e equipe multidisciplinar, respeitando as preferências, valores culturais e capacidade de autocuidado.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Negociação</h3>
                    <p>Envolva o paciente na definição de metas realistas e alcançáveis, considerando suas limitações e recursos disponíveis.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Consciência Cultural</h3>
                    <p>Adapte o planejamento às crenças, práticas culturais e contexto socioeconômico do paciente e sua família.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Priorização</h3>
                    <p>Organize os diagnósticos por ordem de prioridade, considerando risco de vida, segurança do paciente e impacto na qualidade de vida.</p>
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-xs">
                      <strong>Referência:</strong> Arma, Juliana Cipriano de. Guia de habilidades de comunicação no cuidado de enfermagem [livro eletrônico] / Juliana Cipriano de Arma, Mirelle Saes, Luiz Augusto Facchini. -- Florianópolis, SC : Ed. dos Autores, 2022. PDF. Link: https://www.pmf.sc.gov.br/arquivos/arquivos/PDF/Guia%20de%20Habilidades%20de%20Comunicação%20no%20Cuidado%20de%20Enfermagem.pdf
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            O Planejamento de Enfermagem compreende o desenvolvimento de um plano assistencial direcionado à pessoa, família, coletividade e grupos especiais, compartilhado com os sujeitos do cuidado e equipe de Enfermagem e saúde.
          </p>
        </CardContent>
      </Card>

      {/* Interface Principal das Fases */}
      <Accordion 
        type="single" 
        collapsible 
        className="w-full" 
        value={faseAtual} 
        onValueChange={setFaseAtual}
      >
        {/* Fase I: Priorização */}
        <AccordionItem value="item-1">
          <AccordionTrigger>Fase I: Priorize os Diagnósticos de Enfermagem</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Arraste e solte os diagnósticos para organizá-los por ordem de prioridade (do mais importante para o menos importante).
              </p>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="diagnosticos">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                      {diagnosticosPriorizados.map((diagnostico, index) => (
                        <Draggable key={diagnostico.diagnosticoId} draggableId={diagnostico.diagnosticoId} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${
                                snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                              }`}
                            >
                              <div {...provided.dragHandleProps}>
                                <GripVertical className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-sm font-medium">
                                    {diagnostico.ordemPrioridade}º
                                  </span>
                                  <span className="font-medium">{diagnostico.tituloDiagnostico}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Fase II: Resultados Esperados */}
        <AccordionItem value="item-2">
          <AccordionTrigger>Fase II: Determine os Resultados Esperados</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione um resultado esperado para cada diagnóstico priorizado.
              </p>

              <Accordion type="multiple" className="w-full">
                {diagnosticosPriorizados.map((diagnostico) => {
                  const diagnosticoDetalhado = getDiagnosticoDetalhado(diagnostico.diagnosticoId);
                  const isIncompleto = !diagnostico.resultadoEsperadoSelecionado;
                  
                  return (
                    <AccordionItem 
                      key={diagnostico.diagnosticoId} 
                      value={diagnostico.diagnosticoId}
                      className={isIncompleto ? "bg-red-50/50 rounded-lg px-2" : ""}
                    >
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                            {diagnostico.ordemPrioridade}º
                          </span>
                          {diagnostico.tituloDiagnostico}
                          {isIncompleto && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] uppercase font-bold rounded-full">
                              Incompleto (Falta Resultado)
                            </span>
                          )}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-1 pb-4">
                        {diagnosticoDetalhado ? (
                          <RadioGroup
                            value={diagnostico.resultadoEsperadoSelecionado || ""}
                            onValueChange={(value) => handleResultadoChange(diagnostico.diagnosticoId, value)}
                          >
                            {diagnosticoDetalhado.resultadosEsperados.map((resultado, index) => (
                              <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg bg-white">
                                <RadioGroupItem value={resultado.tituloResultado} id={`${diagnostico.diagnosticoId}-${index}`} />
                                <div className="flex-1">
                                  <Label htmlFor={`${diagnostico.diagnosticoId}-${index}`} className="font-medium cursor-pointer">
                                    {resultado.tituloResultado}
                                  </Label>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {resultado.descricaoResultado}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : (
                          <p className="text-muted-foreground">Carregando resultados esperados...</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Fase III: Intervenções */}
        <AccordionItem value="item-3">
          <AccordionTrigger>Fase III: Selecione as Intervenções de Enfermagem</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione as intervenções apropriadas para cada diagnóstico com base no resultado esperado escolhido.
              </p>

              <Accordion type="multiple" className="w-full">
                {diagnosticosPriorizados.map((diagnostico) => {
                  const intervencoes = diagnostico.resultadoEsperadoSelecionado 
                    ? getIntervencoesDoResultado(diagnostico.diagnosticoId, diagnostico.resultadoEsperadoSelecionado)
                    : [];
                  
                  const semIntervencoes = !diagnostico.intervencoesSelecionadas || diagnostico.intervencoesSelecionadas.length === 0;
                  const semResultado = !diagnostico.resultadoEsperadoSelecionado;
                  const isIncompleto = semIntervencoes || semResultado;

                  return (
                    <AccordionItem 
                      key={diagnostico.diagnosticoId} 
                      value={diagnostico.diagnosticoId}
                      className={isIncompleto ? "bg-red-50/50 rounded-lg px-2" : ""}
                    >
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                            {diagnostico.ordemPrioridade}º
                          </span>
                          {diagnostico.tituloDiagnostico}
                          {isIncompleto && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] uppercase font-bold rounded-full">
                              Incompleto ({semResultado ? 'Falta Resultado' : 'Falta Intervenção'})
                            </span>
                          )}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-1 pb-4">
                        <div className="space-y-4">
                          {diagnostico.resultadoEsperadoSelecionado ? (
                            <div className="p-3 bg-muted rounded-lg">
                              <p className="font-medium text-sm">Resultado Esperado:</p>
                              <p className="text-sm">{diagnostico.resultadoEsperadoSelecionado}</p>
                            </div>
                          ) : (
                            <Alert variant="destructive" className="bg-red-100 border-red-200 text-red-800">
                              <AlertDescription>
                                Selecione primeiro um resultado esperado na Fase II para visualizar as intervenções disponíveis.
                              </AlertDescription>
                            </Alert>
                          )}

                          {intervencoes.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-medium">Intervenções Padrão:</h4>
                              {intervencoes.map((intervencao, index) => (
                                <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg bg-white">
                                  <Checkbox
                                    id={`${diagnostico.diagnosticoId}-int-${index}`}
                                    checked={diagnostico.intervencoesSelecionadas?.some(i => i.acaoPrescrita === intervencao.acaoPrescrita) || false}
                                    onCheckedChange={(checked) => 
                                      handleIntervencaoChange(diagnostico.diagnosticoId, intervencao.acaoPrescrita, intervencao.acaoEnfermeiro, checked as boolean)
                                    }
                                  />
                                  <Label htmlFor={`${diagnostico.diagnosticoId}-int-${index}`} className="flex-1 cursor-pointer">
                                    {intervencao.acaoPrescrita}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Intervenções Autorais */}
                          <div className="space-y-3 border-t pt-4">
                            <h4 className="font-medium">Adicionar Intervenção Autoral:</h4>
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Digite aqui uma intervenção autoral (inicie com um verbo no infinitivo)..."
                                value={novaIntervencao[diagnostico.diagnosticoId] || ""}
                                onChange={(e) => setNovaIntervencao(prev => ({
                                  ...prev,
                                  [diagnostico.diagnosticoId]: e.target.value
                                }))}
                              />
                              <Button
                                onClick={() => handleAdicionarIntervencaoAutoral(diagnostico.diagnosticoId)}
                                disabled={!novaIntervencao[diagnostico.diagnosticoId]?.trim()}
                                size="sm"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Adicionar Intervenção
                              </Button>
                              <p className="text-xs text-muted-foreground">
                                Verbos no infinitivo são verbos em sua forma original, terminados em -ar, -er, -ir (ex: Orientar, Realizar, Medir). 
                                Suas sugestões serão enviadas à Comissão Permanente de Sistematização da Assistência de Enfermagem (CSAE) 
                                para análise e possível inclusão em futuras versões do sistema. Agradecemos sua colaboração na construção 
                                de um cuidado cada vez melhor!
                              </p>
                            </div>

                            {/* Lista de Intervenções Autorais */}
                            {diagnostico.intervencoesSelecionadas?.filter(i => i.tipo === 'autoral').length > 0 && (
                              <div className="space-y-2">
                                <h5 className="font-medium text-sm">Intervenções Autorais Adicionadas:</h5>
                                {diagnostico.intervencoesSelecionadas
                                  .filter(i => i.tipo === 'autoral')
                                  .map((intervencao, index) => (
                                    <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                      {intervencao.acaoPrescrita}
                                    </div>
                                  ))}
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default EtapaPlanejamento;
