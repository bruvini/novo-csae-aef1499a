
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { Info, HelpCircle, GripVertical, Plus, Trash2, RefreshCw } from 'lucide-react';
import { ProcessoEnfermagem, DiagnosticoPlanejado, IntervencaoSelecionada, PlanejamentoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { getDiagnosticos, Diagnostico, type Intervencao as IntervencaoCatalogo } from '@/services/bancodados/rolEnfermagemDB';
import { alinharDiagnosticosPlanejados, isDiagnosticoPositivo, reordenarDiagnosticosPlanejados } from '@/utils/processoUtils';
import { revisarSeparacao, sinalizarIntervencoesMultiplas } from '@/utils/individualizacaoIntervencoes';
import { criarIntervencaoConsulta } from '@/utils/materiaisApoioProcesso';
import { listarIntervencoesBiblioteca, type IntervencaoBiblioteca } from '@/services/bancodados/intervencoesAutoraisDB';
import { obterDisponibilidadePorResultado } from '@/utils/intervencoesBiblioteca';
import { combinarIntervencoesPlanejamento, resolverDiagnosticoPlanejamento, type EstadoCatalogoPlanejamento } from '@/utils/planejamentoCatalogo';

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
  const [estadoCatalogoDiagnosticos, setEstadoCatalogoDiagnosticos] = useState<EstadoCatalogoPlanejamento>('carregando');
  const [tentativaCatalogo, setTentativaCatalogo] = useState(0);
  const [intervencoesBiblioteca, setIntervencoesBiblioteca] = useState<IntervencaoBiblioteca[]>([]);
  const [buscaIntervencoes, setBuscaIntervencoes] = useState<Record<string, string>>({});
  const [bibliotecaCarregando, setBibliotecaCarregando] = useState(true);
  const [bibliotecaErro, setBibliotecaErro] = useState(false);
  const [novaIntervencao, setNovaIntervencao] = useState<{ [key: string]: string }>({});
  const [revisaoId, setRevisaoId] = useState<string | null>(null);
  const [acoesCandidatas, setAcoesCandidatas] = useState<string[]>([]);
  const [justificativaUnica, setJustificativaUnica] = useState('');
  const [erroRevisao, setErroRevisao] = useState('');
  const [faseAtual, setFaseAtual] = useState("item-1");

  useEffect(() => {
    // Carregar diagnósticos detalhados do Firestore
    setEstadoCatalogoDiagnosticos('carregando');
    const unsubscribe = getDiagnosticos((data) => {
      setDiagnosticosDetalhados(data);
      setEstadoCatalogoDiagnosticos('carregado');
    }, () => setEstadoCatalogoDiagnosticos('erro'));

    return () => unsubscribe && unsubscribe();
  }, [tentativaCatalogo]);

  useEffect(() => {
    let ativo = true;
    setBibliotecaCarregando(true);
    setBibliotecaErro(false);
    void listarIntervencoesBiblioteca().then(dados => { if (ativo) setIntervencoesBiblioteca(dados); })
      .catch(error => { console.error('Erro ao carregar intervenções aprovadas:', error); if (ativo) setBibliotecaErro(true); })
      .finally(() => { if (ativo) setBibliotecaCarregando(false); });
    return () => { ativo = false; };
  }, [tentativaCatalogo]);

  useEffect(() => {
    // Alinhar cada diagnóstico escolhido à sua linha de planejamento.
    // Preserva as seleções antigas, adiciona os novos e ignora diagnósticos
    // removidos, inclusive após reabrir o processo.
    const selecionados = processo.diagnostico?.diagnosticosSelecionados ?? [];
    const salvos = processo.planejamento?.diagnosticosPlanejados ?? [];
    const alinhados = alinharDiagnosticosPlanejados(selecionados, salvos).map(plano => {
      const diagnostico = selecionados.find(item => item.id === plano.diagnosticoId);
      const decisao = processo.diagnostico?.reavaliacoesAnteriores?.find(item => item.acompanhamentoId === diagnostico?.acompanhamentoId);
      if (!diagnostico?.acompanhamentoId || !decisao) return plano;
      return { ...plano, acompanhamentoId: diagnostico.acompanhamentoId, origemReavaliacao: decisao.decisao === 'manter' ? 'mantido' as const : 'substituido' as const };
    });
    setDiagnosticosPrivorizados(alinhados);
    if (
      alinhados.length !== salvos.length
      || alinhados.some((diag, index) => diag.diagnosticoId !== salvos[index]?.diagnosticoId)
      || alinhados.some((diag, index) => diag.acompanhamentoId !== salvos[index]?.acompanhamentoId || diag.origemReavaliacao !== salvos[index]?.origemReavaliacao)
    ) {
      onUpdatePlanejamento({ diagnosticosPlanejados: alinhados });
    }
  }, [processo.diagnostico?.diagnosticosSelecionados, processo.diagnostico?.reavaliacoesAnteriores, processo.planejamento?.diagnosticosPlanejados]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const updatedItems = reordenarDiagnosticosPlanejados(diagnosticosPriorizados, result.source.index, result.destination.index);

    setDiagnosticosPrivorizados(updatedItems);
    salvarPlanejamento(updatedItems);
  };

  const handleResultadoChange = (diagnosticoId: string, resultado: string, resultadoIndice: number) => {
    const updated = diagnosticosPriorizados.map(diag =>
      diag.diagnosticoId === diagnosticoId
        ? {
            ...diag,
            resultadoEsperadoSelecionado: resultado,
            resultadoIndiceSelecionado: resultado ? resultadoIndice : undefined,
            ...(resultado ? { resultadoPlanejadoId: diag.resultadoEsperadoSelecionado === resultado && diag.resultadoIndiceSelecionado === resultadoIndice && diag.resultadoPlanejadoId ? diag.resultadoPlanejadoId : crypto.randomUUID() } : { resultadoPlanejadoId: undefined }),
            // Intervenções do resultado anterior não devem ser mantidas
            // quando o enfermeiro altera o resultado esperado.
            intervencoesSelecionadas: diag.resultadoEsperadoSelecionado === resultado && diag.resultadoIndiceSelecionado === resultadoIndice
              ? diag.intervencoesSelecionadas
              : (diag.intervencoesSelecionadas ?? []).filter((item) => item.tipo === 'autoral'),
          }
        : diag
    );
    setDiagnosticosPrivorizados(updated);
    salvarPlanejamento(updated);
  };

  const handleIntervencaoChange = (diagnosticoId: string, resultado: string, indice: number, intervencao: IntervencaoCatalogo, checked: boolean) => {
    const origemCatalogoChave = `${diagnosticoId}|${resultado}|${indice}`;
    const updated = diagnosticosPriorizados.map(diag => {
      if (diag.diagnosticoId === diagnosticoId) {
        const anteriores = diag.intervencoesSelecionadas ?? [];
        const intervencoes = checked
          ? anteriores.some((item) => item.origemCatalogoChave === origemCatalogoChave || (!item.origemCatalogoChave && item.tipo === 'padrao' && item.acaoPrescrita === intervencao.acaoPrescrita))
            ? anteriores
            : [...anteriores, criarIntervencaoConsulta(intervencao, 'padrao', origemCatalogoChave)]
          : anteriores.filter((item) => item.origemCatalogoChave !== origemCatalogoChave && !(item.tipo === 'padrao' && !item.origemCatalogoChave && item.acaoPrescrita === intervencao.acaoPrescrita));
        return { ...diag, intervencoesSelecionadas: intervencoes };
      }
      return diag;
    });
    setDiagnosticosPrivorizados(updated);
    salvarPlanejamento(updated);
  };

  const handleIntervencaoBiblioteca = (diagnosticoId: string, intervencao: IntervencaoBiblioteca, checked: boolean) => {
    const updated = diagnosticosPriorizados.map(diag => {
      if (diag.diagnosticoId !== diagnosticoId || !diag.resultadoEsperadoSelecionado || diag.resultadoIndiceSelecionado === undefined) return diag;
      const anteriores = diag.intervencoesSelecionadas || [];
      const existe = anteriores.some(item => item.origemBibliotecaId === intervencao.id && item.versaoBiblioteca === intervencao.versao);
      if (checked && existe) return diag;
      if (!checked) return { ...diag, intervencoesSelecionadas: anteriores.filter(item => !(item.origemBibliotecaId === intervencao.id && item.versaoBiblioteca === intervencao.versao)) };
      const tipo = intervencao.modoDisponibilidade === 'transversal' ? 'transversal' : 'biblioteca';
      const instantanea = criarIntervencaoConsulta({ acaoPrescrita: intervencao.acaoPrescrita, acaoEnfermeiro: intervencao.acaoEnfermeiro, materiaisDeApoio: intervencao.materiaisDeApoio }, tipo, 'biblioteca|' + intervencao.id + '|v' + intervencao.versao);
      return { ...diag, intervencoesSelecionadas: [...anteriores, { ...instantanea, origemBibliotecaId: intervencao.id, versaoBiblioteca: intervencao.versao, sugestoesOrigemIds: intervencao.sugestoesOrigemIds, resultadoVinculadoId: diag.resultadoPlanejadoId }] };
    });
    setDiagnosticosPrivorizados(updated);
    salvarPlanejamento(updated);
  };

  const adicionarAcoesAutorais = (diagnosticoId: string, acoes: string[], justificativaIntervencaoUnica?: string) => {
    const updated = diagnosticosPriorizados.map(diag => {
      if (diag.diagnosticoId === diagnosticoId) {
        const intervencoes = diag.intervencoesSelecionadas ?? [];
        return {
          ...diag,
          intervencoesSelecionadas: [...intervencoes, ...acoes.filter(texto => !intervencoes.some(item => item.tipo === 'autoral' && item.acaoPrescrita === texto)).map(texto => ({ ...criarIntervencaoConsulta({ acaoPrescrita: texto, acaoEnfermeiro: '' }, 'autoral'), ...(justificativaIntervencaoUnica ? { justificativaIntervencaoUnica } : {}) }))],
        };
      }
      return diag;
    });

    setDiagnosticosPrivorizados(updated);
    setNovaIntervencao(prev => ({ ...prev, [diagnosticoId]: '' }));
    salvarPlanejamento(updated);
  };

  const handleAdicionarIntervencaoAutoral = (diagnosticoId: string) => {
    const texto = novaIntervencao[diagnosticoId]?.trim();
    if (!texto) return;
    const sinal = sinalizarIntervencoesMultiplas(texto);
    if (sinal.nivel === 'nenhuma') { adicionarAcoesAutorais(diagnosticoId, [texto]); return; }
    setRevisaoId(diagnosticoId); setAcoesCandidatas(sinal.candidatas); setJustificativaUnica(''); setErroRevisao('');
  };

  const confirmarSeparacao = () => {
    if (!revisaoId) return;
    try { adicionarAcoesAutorais(revisaoId, revisarSeparacao(acoesCandidatas)); setRevisaoId(null); }
    catch (erro) { setErroRevisao(erro instanceof Error ? erro.message : 'Revise as intervenções.'); }
  };

  const handleRemoverIntervencaoAutoral = (diagnosticoId: string, intervencao: IntervencaoSelecionada) => {
    const updated = diagnosticosPriorizados.map(diag => {
      if (diag.diagnosticoId === diagnosticoId) {
        const intervencoes = diag.intervencoesSelecionadas || [];
        const filtered = intervencoes.filter(i => !(i.tipo === intervencao.tipo && (intervencao.origemBibliotecaId ? i.origemBibliotecaId === intervencao.origemBibliotecaId && i.versaoBiblioteca === intervencao.versaoBiblioteca : intervencao.intervencaoId ? i.intervencaoId === intervencao.intervencaoId : i.acaoPrescrita === intervencao.acaoPrescrita)));
        return { ...diag, intervencoesSelecionadas: filtered };
      }
      return diag;
    });

    setDiagnosticosPrivorizados(updated);
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

  const getIntervencoesDoResultado = (diagnosticoId: string, tituloResultado: string, resultadoIndice?: number) => {
    const diagnostico = getDiagnosticoDetalhado(diagnosticoId);
    if (!diagnostico) return [];

    const resultado = resultadoIndice === undefined
      ? diagnostico.resultadosEsperados.find(r => r.tituloResultado === tituloResultado)
      : diagnostico.resultadosEsperados[resultadoIndice];
    return resultado?.intervencoes || [];
  };

  const obterIntervencoesDaBiblioteca = (diagnostico: DiagnosticoPlanejado) => {
    if (!diagnostico.resultadoEsperadoSelecionado || diagnostico.resultadoIndiceSelecionado === undefined) return [];
    return obterDisponibilidadePorResultado(intervencoesBiblioteca, diagnostico.diagnosticoId, diagnostico.resultadoIndiceSelecionado, diagnostico.resultadoEsperadoSelecionado)
      .filter(intervencao => (intervencao.acaoPrescrita + ' ' + intervencao.acaoEnfermeiro).toLocaleLowerCase('pt-BR').includes((buscaIntervencoes[diagnostico.diagnosticoId] || '').toLocaleLowerCase('pt-BR')));
  };

  if (processo.diagnostico.diagnosticosSelecionados.length === 0) {
    const somenteEncerramento = (processo.avaliacao?.cuidadosAnterioresAbordados || []).length > 0
      && (processo.avaliacao?.cuidadosAnterioresAbordados || []).every(cuidado => processo.diagnostico.reavaliacoesAnteriores?.find(item => item.acompanhamentoId === cuidado.acompanhamentoId)?.decisao === 'encerrar');
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
              {somenteEncerramento ? 'As reavaliações foram encerradas sem identificar novos diagnósticos. Não há novos resultados esperados ou intervenções a planejar nesta consulta.' : 'Para acessar a etapa de Planejamento, é necessário selecionar ao menos um diagnóstico na etapa anterior.'}
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
                          {(provided, snapshot) => {
                            const item = <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center gap-3 p-3 bg-white border rounded-lg ${
                                snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                              }`}
                            >
                              <div {...provided.dragHandleProps} aria-label={`Reordenar ${diagnostico.tituloDiagnostico}`}>
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
                            </div>;
                            return snapshot.isDragging ? createPortal(item, document.body) : item;
                          }}
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
                  const resolucao = resolverDiagnosticoPlanejamento(diagnostico.diagnosticoId, diagnosticosDetalhados, estadoCatalogoDiagnosticos);
                  const isPositivo = isDiagnosticoPositivo(diagnostico.naturezaDiagnostico, diagnostico.isPositivo);
                  const isIncompleto = isPositivo ? false : !diagnostico.resultadoEsperadoSelecionado;
                  
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
                          {diagnostico.origemReavaliacao && <span className="text-xs text-muted-foreground">{diagnostico.origemReavaliacao === 'mantido' ? 'Diagnóstico mantido após reavaliação.' : 'Diagnóstico atualizado a partir de consulta anterior.'}</span>}
                          {isIncompleto && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] uppercase font-bold rounded-full">
                              Incompleto (Falta Resultado)
                            </span>
                          )}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-1 pb-4">
                        {resolucao.estado === 'com_resultados' ? (
                          <RadioGroup
                            value={diagnostico.resultadoIndiceSelecionado !== undefined ? String(diagnostico.resultadoIndiceSelecionado) : String(resolucao.diagnostico.resultadosEsperados.findIndex(item => item.tituloResultado === diagnostico.resultadoEsperadoSelecionado))}
                            onValueChange={(value) => { const resultadoIndice = Number(value); const resultado = resolucao.diagnostico.resultadosEsperados[resultadoIndice]; if (resultado) handleResultadoChange(diagnostico.diagnosticoId, resultado.tituloResultado, resultadoIndice); }}
                          >
                            {resolucao.diagnostico.resultadosEsperados.map((resultado, index) => (
                              <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg bg-white">
                                <RadioGroupItem value={String(index)} id={`${diagnostico.diagnosticoId}-${index}`} />
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
                        ) : resolucao.estado === 'carregando' ? (
                          <p role="status" className="text-sm text-muted-foreground">Carregando resultados esperados homologados...</p>
                        ) : resolucao.estado === 'erro' ? (
                          <div className="flex flex-wrap items-center gap-2 text-sm text-destructive"><span>Não foi possível carregar o catálogo de diagnósticos.</span><Button type="button" variant="outline" size="sm" onClick={() => setTentativaCatalogo(value => value + 1)}><RefreshCw className="mr-2 h-4 w-4" />Tentar novamente</Button></div>
                        ) : resolucao.estado === 'nao_encontrado' ? (
                          <p role="status" className="text-sm text-muted-foreground">Este diagnóstico não foi encontrado no catálogo. Verifique se a seleção foi atualizada e tente novamente.</p>
                        ) : resolucao.estado === 'sem_resultados' ? (
                          <p role="status" className="text-sm text-muted-foreground">Este diagnóstico não possui resultados esperados cadastrados.</p>
                        ) : isPositivo ? (
                          <p className="text-sm text-muted-foreground">Não há resultados esperados homologados para este diagnóstico. A ausência no catálogo não define sua natureza clínica.</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Resultados esperados indisponíveis para este diagnóstico.</p>
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
                    ? getIntervencoesDoResultado(diagnostico.diagnosticoId, diagnostico.resultadoEsperadoSelecionado, diagnostico.resultadoIndiceSelecionado)
                    : [];
                  const intervencoesAprovadas = obterIntervencoesDaBiblioteca(diagnostico);
                  const termoIntervencao = (buscaIntervencoes[diagnostico.diagnosticoId] || '').trim().toLocaleLowerCase('pt-BR');
                  const opcoesIntervencao = combinarIntervencoesPlanejamento(intervencoes, intervencoesAprovadas).filter(opcao => {
                    const texto = opcao.origem === 'catalogo'
                      ? `${opcao.intervencao.acaoPrescrita} ${opcao.intervencao.acaoEnfermeiro}`
                      : `${opcao.intervencao.acaoPrescrita} ${opcao.intervencao.acaoEnfermeiro}`;
                    return texto.toLocaleLowerCase('pt-BR').includes(termoIntervencao);
                  });
                  
                  const semIntervencoes = !diagnostico.intervencoesSelecionadas || diagnostico.intervencoesSelecionadas.length === 0;
                  const semResultado = !diagnostico.resultadoEsperadoSelecionado;
                  const isPositivo = isDiagnosticoPositivo(diagnostico.naturezaDiagnostico, diagnostico.isPositivo);
                  const isIncompleto = isPositivo
                    ? (semIntervencoes && !diagnostico.justificativaSemIntervencao?.trim())
                    : (semIntervencoes || semResultado);

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
                          {diagnostico.origemReavaliacao && <span className="text-xs text-muted-foreground">{diagnostico.origemReavaliacao === 'mantido' ? 'Diagnóstico mantido após reavaliação.' : 'Diagnóstico atualizado a partir de consulta anterior.'}</span>}
                          {isIncompleto && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] uppercase font-bold rounded-full">
                              Incompleto ({isPositivo ? 'Justifique ausência de intervenção' : semResultado ? 'Falta Resultado' : 'Falta Intervenção'})
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
                            ) : !isPositivo ? (
                              <Alert variant="destructive" className="bg-red-100 border-red-200 text-red-800">
                                <AlertDescription>
                                  Selecione primeiro um resultado esperado na Fase II para visualizar as intervenções disponíveis.
                                </AlertDescription>
                              </Alert>
                            ) : null}

                            <div className="space-y-3">
                              <h4 className="font-medium">Intervenções de Enfermagem</h4>
                              <p className="text-xs text-muted-foreground">Selecione individualmente as ações pertinentes a este resultado e ao contexto clínico. Intervenções transversais não são prescritas automaticamente.</p>
                              <Input aria-label={`Pesquisar intervenções para ${diagnostico.tituloDiagnostico}`} placeholder="Pesquisar intervenções" value={buscaIntervencoes[diagnostico.diagnosticoId] || ''} onChange={event => setBuscaIntervencoes(previous => ({ ...previous, [diagnostico.diagnosticoId]: event.target.value }))} />
                              {bibliotecaCarregando && <p role="status" className="text-sm text-muted-foreground">Carregando intervenções aprovadas…</p>}
                              {bibliotecaErro && <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-destructive"><span>Não foi possível carregar todas as intervenções aprovadas.</span><Button type="button" variant="outline" size="sm" onClick={() => setTentativaCatalogo(value => value + 1)}>Tentar novamente</Button></div>}
                              <div className="space-y-2">
                                {opcoesIntervencao.map(opcao => {
                                  const id = `${diagnostico.diagnosticoId}-${opcao.chave}`;
                                  if (opcao.origem === 'catalogo') {
                                    const intervencao = opcao.intervencao;
                                    const selecionada = diagnostico.intervencoesSelecionadas?.some(item => item.origemCatalogoChave === `${diagnostico.diagnosticoId}|${diagnostico.resultadoEsperadoSelecionado}|${opcao.indiceCatalogo}` || (!item.origemCatalogoChave && item.tipo === 'padrao' && item.acaoPrescrita === intervencao.acaoPrescrita)) || false;
                                    return <div key={id} className="flex items-start gap-2 rounded-lg border bg-white p-3"><Checkbox id={id} checked={selecionada} onCheckedChange={checked => handleIntervencaoChange(diagnostico.diagnosticoId, diagnostico.resultadoEsperadoSelecionado || '', opcao.indiceCatalogo, intervencao, checked === true)} /><Label htmlFor={id} className="flex-1 cursor-pointer"><span className="block font-medium">{intervencao.acaoPrescrita}</span>{intervencao.acaoEnfermeiro && <span className="mt-1 block text-sm text-muted-foreground">{intervencao.acaoEnfermeiro}</span>}</Label></div>;
                                  }
                                  const item = opcao.intervencao;
                                  const selecionada = diagnostico.intervencoesSelecionadas?.some(selecionada => selecionada.origemBibliotecaId === item.id && selecionada.versaoBiblioteca === item.versao) || false;
                                  return <div key={id} className="flex items-start gap-2 rounded-lg border bg-white p-3"><Checkbox id={id} checked={selecionada} onCheckedChange={checked => handleIntervencaoBiblioteca(diagnostico.diagnosticoId, item, checked === true)} /><Label htmlFor={id} className="flex-1 cursor-pointer"><span className="block font-medium">{item.acaoPrescrita}</span>{item.acaoEnfermeiro && <span className="mt-1 block text-sm text-muted-foreground">{item.acaoEnfermeiro}</span>}<span className="mt-1 block text-xs text-muted-foreground">{item.modoDisponibilidade === 'transversal' ? 'Intervenção transversal aprovada' : 'Intervenção aprovada para este resultado'}</span>{item.materiaisDeApoio.length > 0 && <span className="block text-xs text-muted-foreground">{item.materiaisDeApoio.length} material(is) de apoio</span>}</Label></div>;
                                })}
                              </div>
                              {!opcoesIntervencao.length && !bibliotecaCarregando && !bibliotecaErro && <p className="text-sm text-muted-foreground">Nenhuma intervenção disponível para o resultado selecionado.</p>}
                            </div>

                            {/* Intervenções Autorais */}

                            {isPositivo && semIntervencoes && (
                              <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                <Label htmlFor={`justificativa-${diagnostico.diagnosticoId}`}>
                                  Justificativa clínica para não prescrever intervenção nesta consulta
                                </Label>
                                <Textarea
                                  id={`justificativa-${diagnostico.diagnosticoId}`}
                                  value={diagnostico.justificativaSemIntervencao || ''}
                                  onChange={(event) => {
                                    const updated = diagnosticosPriorizados.map((item) => item.diagnosticoId === diagnostico.diagnosticoId
                                      ? { ...item, justificativaSemIntervencao: event.target.value }
                                      : item);
                                    setDiagnosticosPrivorizados(updated);
                                    salvarPlanejamento(updated);
                                  }}
                                  placeholder="Registre o julgamento que sustenta não haver ação adicional nesta consulta."
                                  rows={2}
                                />
                              </div>
                            )}

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
                                      <div key={intervencao.intervencaoId || index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                                        <span>{intervencao.acaoPrescrita}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => handleRemoverIntervencaoAutoral(diagnostico.diagnosticoId, intervencao)}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                              )}
                              {diagnostico.intervencoesSelecionadas?.filter(i => i.tipo === 'transversal' || i.tipo === 'biblioteca').length > 0 && <div className="space-y-2"><h5 className="font-medium text-sm">Intervenções da biblioteca selecionadas para esta consulta:</h5>{diagnostico.intervencoesSelecionadas.filter(item => item.tipo === 'transversal' || item.tipo === 'biblioteca').map(item => <div key={item.intervencaoId} className="flex items-center justify-between rounded border border-sky-200 bg-sky-50 p-2 text-sm"><span>{item.acaoPrescrita} · {item.tipo === 'transversal' ? 'transversal' : 'vinculada a resultado'} · versão {item.versaoBiblioteca}</span><Button variant="ghost" size="sm" aria-label={'Remover ' + item.acaoPrescrita} onClick={() => handleRemoverIntervencaoAutoral(diagnostico.diagnosticoId, item)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>}
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
      <Dialog open={revisaoId !== null} onOpenChange={aberto => { if (!aberto) setRevisaoId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Possíveis intervenções múltiplas</DialogTitle></DialogHeader>
          <p className="text-sm">O texto parece conter mais de uma intervenção. Revise cada ação para facilitar executores, implementação e acompanhamento.</p>
          <p className="rounded bg-muted p-3 text-sm whitespace-pre-wrap">{revisaoId && novaIntervencao[revisaoId]}</p>
          {acoesCandidatas.map((acao, index) => <div key={index} className="flex gap-2"><Textarea aria-label={`Intervenção ${index + 1}`} value={acao} onChange={e => setAcoesCandidatas(atuais => atuais.map((item, i) => i === index ? e.target.value : item))} /><Button variant="outline" aria-label={`Remover intervenção ${index + 1}`} onClick={() => setAcoesCandidatas(atuais => atuais.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div>)}
          <Button variant="outline" onClick={() => setAcoesCandidatas(atuais => [...atuais, ''])}>Acrescentar intervenção</Button>
          {erroRevisao && <p role="alert" className="text-red-700">{erroRevisao}</p>}
          <div className="flex flex-wrap gap-2"><Button onClick={confirmarSeparacao}>Confirmar intervenções</Button>
            {revisaoId && sinalizarIntervencoesMultiplas(novaIntervencao[revisaoId] || '').nivel === 'possivel' && <div className="w-full space-y-2"><Textarea aria-label="Justificativa para intervenção única" placeholder="Justifique brevemente por que a ação deve permanecer integrada" value={justificativaUnica} onChange={e => setJustificativaUnica(e.target.value)} /><Button variant="outline" disabled={justificativaUnica.trim().length < 10} onClick={() => { adicionarAcoesAutorais(revisaoId, [(novaIntervencao[revisaoId] || '').trim()], justificativaUnica.trim()); setRevisaoId(null); }}>Manter como intervenção única</Button></div>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EtapaPlanejamento;
