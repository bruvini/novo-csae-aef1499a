
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  AlertTriangle, 
  BookOpen, 
  Star, 
  X,
  CheckCircle,
  Info,
  Search,
  History,
  Clock3,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { ProcessoEnfermagem, DiagnosticoEnfermagem, PlanejamentoEnfermagem, ImplementacaoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { getDiagnosticos, Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import { buscarSubconjuntos, SubconjuntoEnfermagem } from '@/services/bancodados/subconjuntosDB';
import { cn } from '@/lib/utils';
import { diagnosticosAnterioresDisponiveis, formatarDataConsulta } from '@/utils/continuidadeCuidado';
import { DecisaoReavaliacaoDiagnostico } from '@/types/processoEnfermagem';
import { atualizarBuscaPorAcompanhamento, buscarDiagnosticosSubstitutos, normalizarTermoDiagnostico } from '@/utils/buscaDiagnosticoSubstituto';
import { atualizarSelecaoAposReavaliacao } from '@/utils/reavaliacaoDiagnostica';

interface EtapaDiagnosticoProps {
  processo: ProcessoEnfermagem;
  paciente: Paciente;
  onUpdateDiagnostico: (novoDiagnostico: DiagnosticoEnfermagem) => void;
  onUpdatePlanejamento: (planejamento: PlanejamentoEnfermagem) => void;
  onUpdateImplementacao: (implementacao: ImplementacaoEnfermagem) => void;
}

interface DiagnosticoPorSubconjunto {
  [subconjunto: string]: Diagnostico[];
}

const EtapaDiagnostico: React.FC<EtapaDiagnosticoProps> = ({
  processo,
  paciente,
  onUpdateDiagnostico,
  onUpdatePlanejamento,
  onUpdateImplementacao,
}) => {
  const [showNHBs, setShowNHBs] = useState(true);
  const [showProtocolos, setShowProtocolos] = useState(false);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [subconjuntos, setSubconjuntos] = useState<SubconjuntoEnfermagem[]>([]);
  const [diagnosticosPorNHB, setDiagnosticosPorNHB] = useState<DiagnosticoPorSubconjunto>({});
  const [diagnosticosPorProtocolo, setDiagnosticosPorProtocolo] = useState<DiagnosticoPorSubconjunto>({});
  const [loading, setLoading] = useState(true);
  const [termoBuscaDiagnostico, setTermoBuscaDiagnostico] = useState('');
  const [buscasSubstituto, setBuscasSubstituto] = useState<Record<string, string>>({});
  const [substitutoAberto, setSubstitutoAberto] = useState<string | null>(null);

  // Verificar se há dados da avaliação - uso seguro com fallback
  const hasAvaliacaoData = ((processo.avaliacao?.coletaDeDadosSubjetivos ?? '').trim() !== '');
  const nhbsAfetadas = processo.avaliacao?.nhbsAfetadas ?? [];
  const historicoPaciente = (paciente.processosEnfermagem || []).map(item => ({ ...item, id: item.idProcesso }) as unknown as ProcessoEnfermagem);
  const cuidadosAbordados = diagnosticosAnterioresDisponiveis(historicoPaciente, processo.id).filter(cuidado =>
    (processo.avaliacao?.cuidadosAnterioresAbordados || []).some(item => item.acompanhamentoId === cuidado.acompanhamentoId)
  );

  useEffect(() => {
    setLoading(true);

    // Listener síncrono — o cleanup é retornado diretamente para o React
    const unsubscribeDiagnosticos = getDiagnosticos((diagnosticosData) => {
      setDiagnosticos(diagnosticosData);
      processarDiagnosticosPorSubconjunto(diagnosticosData);
      setLoading(false);
    });

    // Subconjuntos são dados estáticos — busca simples sem listener
    buscarSubconjuntos()
      .then(setSubconjuntos)
      .catch((error) => console.error('Erro ao carregar subconjuntos:', error));

    // React recebe e executa este cleanup ao desmontar o componente
    return () => {
      unsubscribeDiagnosticos();
    };
  }, []); // Sem dependências — executa apenas na montagem

  const processarDiagnosticosPorSubconjunto = (diagnosticosData: Diagnostico[]) => {
    const porNHB: DiagnosticoPorSubconjunto = {};
    const porProtocolo: DiagnosticoPorSubconjunto = {};

    diagnosticosData.forEach(diagnostico => {
      diagnostico.subconjuntos.forEach(subconjunto => {
        if (subconjunto.tipoSubconjunto === 'nhb') {
          if (!porNHB[subconjunto.tituloSubconjunto]) {
            porNHB[subconjunto.tituloSubconjunto] = [];
          }
          porNHB[subconjunto.tituloSubconjunto].push(diagnostico);
        } else if (subconjunto.tipoSubconjunto === 'protocolo' || subconjunto.tipoSubconjunto === 'Protocolo_Enfermagem') {
          if (!porProtocolo[subconjunto.tituloSubconjunto]) {
            porProtocolo[subconjunto.tituloSubconjunto] = [];
          }
          porProtocolo[subconjunto.tituloSubconjunto].push(diagnostico);
        }
      });
    });

    setDiagnosticosPorNHB(porNHB);
    setDiagnosticosPorProtocolo(porProtocolo);
  };

  // Função para filtrar diagnósticos com base no termo de busca
  const filtrarDiagnosticos = (diagnosticosLista: Diagnostico[]): Diagnostico[] => {
    const termo = normalizarTermoDiagnostico(termoBuscaDiagnostico);
    if (!termo) return diagnosticosLista;
    return diagnosticosLista.filter(diagnostico =>
      normalizarTermoDiagnostico(diagnostico.tituloDiagnostico || '').includes(termo)
      || normalizarTermoDiagnostico(diagnostico.descricaoDiagnostico || '').includes(termo)
    );
  };

  // Função para filtrar subconjuntos com base nos diagnósticos filtrados
  const filtrarSubconjuntos = (diagnosticosPorSubconjunto: DiagnosticoPorSubconjunto): DiagnosticoPorSubconjunto => {
    if (!termoBuscaDiagnostico.trim()) return diagnosticosPorSubconjunto;
    
    const subconjuntosFiltrados: DiagnosticoPorSubconjunto = {};
    
    Object.entries(diagnosticosPorSubconjunto).forEach(([subconjunto, diagnosticosLista]) => {
      const diagnosticosFiltrados = filtrarDiagnosticos(diagnosticosLista);
      if (diagnosticosFiltrados.length > 0) {
        subconjuntosFiltrados[subconjunto] = diagnosticosFiltrados;
      }
    });
    
    return subconjuntosFiltrados;
  };

  const handleToggleDiagnostico = (diagnostico: Diagnostico) => {
    const selecionadosAtuais = processo.diagnostico?.diagnosticosSelecionados ?? [];
    const jaExiste = selecionadosAtuais.some(d => d.id === diagnostico.id);

    let novosDiagnosticos;
    if (jaExiste) {
      // Remove o diagnóstico
      novosDiagnosticos = selecionadosAtuais.filter(d => d.id !== diagnostico.id);
    } else {
      const revisaoAssociada = processo.diagnostico?.reavaliacoesAnteriores?.find(item =>
        item.decisao === 'manter' && item.diagnosticoOrigemId === diagnostico.id
        || item.decisao === 'substituir' && item.novoDiagnosticoId === diagnostico.id
      );
      // Adiciona o diagnóstico
      novosDiagnosticos = [
        ...selecionadosAtuais,
        {
          id: diagnostico.id,
            tituloDiagnostico: diagnostico.tituloDiagnostico,
            ...(diagnostico.naturezaDiagnostico ? { naturezaDiagnostico: diagnostico.naturezaDiagnostico } : {}),
            ...(revisaoAssociada ? { acompanhamentoId: revisaoAssociada.acompanhamentoId } : {}),
        }
      ];
    }

    onUpdateDiagnostico({
      ...processo.diagnostico,
      diagnosticosSelecionados: novosDiagnosticos
    });
  };

  const handleRemoveDiagnostico = (diagnosticoId: string) => {
    const selecionadosAtuais = processo.diagnostico?.diagnosticosSelecionados ?? [];
    const novosDiagnosticos = selecionadosAtuais.filter(
      d => d.id !== diagnosticoId
    );

    onUpdateDiagnostico({
      ...processo.diagnostico,
      diagnosticosSelecionados: novosDiagnosticos
    });
  };

  const isNHBAfetada = (tituloSubconjunto: string): boolean => {
    return nhbsAfetadas.some(nhb => nhb.nhb === tituloSubconjunto);
  };

  const isDiagnosticoSelecionado = (diagnostico: Diagnostico): boolean => {
    const selecionadosAtuais = processo.diagnostico?.diagnosticosSelecionados ?? [];
    return selecionadosAtuais.some(d => d.id === diagnostico.id);
  };

  if (!hasAvaliacaoData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p className="font-semibold">Acesso à Etapa de Diagnóstico Requer Dados da Avaliação</p>
            <p className="text-sm">
              Na etapa de Diagnóstico de Enfermagem ocorre a reunião e interpretação dos dados 
              coletados na etapa anterior (histórico), os quais constituem a base para o raciocínio 
              clínico na Enfermagem. É o processo de análise dos dados coletados no histórico, ou seja, 
              a identificação das necessidades básicas afetadas e passíveis de receber cuidados de 
              enfermagem (COFEN, 2009).
            </p>
            <p className="text-sm">
              Sem isso, não é possível construir um raciocínio clínico para elencar diagnósticos. 
              Por favor, retorne à etapa de Avaliação e preencha a entrevista e, preferencialmente, 
              o exame físico.
            </p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando diagnósticos...</p>
      </div>
    );
  }

  // Selecionados com fallback seguro
  const diagnosticosSelecionados = processo.diagnostico?.diagnosticosSelecionados ?? [];
  
  // Aplicar filtros
  const nhbsFiltradas = filtrarSubconjuntos(diagnosticosPorNHB);
  const protocolosFiltrados = filtrarSubconjuntos(diagnosticosPorProtocolo);

  return (
    <div className="space-y-6">
      {cuidadosAbordados.length > 0 && <Card className="border-border/80 shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><History className="h-4 w-4 text-primary" />Reavaliação de Diagnósticos Anteriores</CardTitle><p className="text-sm text-muted-foreground">Revise cada diagnóstico abordado e registre a decisão clínica para este acompanhamento.</p></CardHeader><CardContent className="space-y-4">
        {cuidadosAbordados.map(cuidado => {
          const reavaliacoesRegistradas = processo.diagnostico.reavaliacoesAnteriores || [];
          const atual = reavaliacoesRegistradas.find(item => item.acompanhamentoId === cuidado.acompanhamentoId);
          const decidir = (decisao: DecisaoReavaliacaoDiagnostico['decisao'], novo?: Diagnostico) => {
            const revisao: DecisaoReavaliacaoDiagnostico = {
              acompanhamentoId: cuidado.acompanhamentoId,
              processoOrigemId: cuidado.processoOrigemId,
              diagnosticoOrigemId: cuidado.diagnosticoOrigemId,
              decisao,
              ...(decisao === 'substituir' && novo ? { novoDiagnosticoId: novo.id, novoTituloDiagnostico: novo.tituloDiagnostico } : {}),
            };
            const destinoId = decisao === 'manter' ? cuidado.diagnosticoOrigemId : decisao === 'substituir' ? novo?.id : undefined;
            const destino = decisao === 'manter'
              ? { id: cuidado.diagnosticoOrigemId, tituloDiagnostico: cuidado.tituloDiagnostico, ...(cuidado.naturezaDiagnostico ? { naturezaDiagnostico: cuidado.naturezaDiagnostico } : {}) }
              : decisao === 'substituir' && novo
                ? { id: novo.id, tituloDiagnostico: novo.tituloDiagnostico, ...(novo.naturezaDiagnostico ? { naturezaDiagnostico: novo.naturezaDiagnostico } : {}) }
                : undefined;
            const selecionadosAnteriores = processo.diagnostico.diagnosticosSelecionados || [];
            const diagnosticoVinculadoAnterior = selecionadosAnteriores.find(item => item.acompanhamentoId === cuidado.acompanhamentoId);
            const selecionados = atualizarSelecaoAposReavaliacao(selecionadosAnteriores, cuidado.acompanhamentoId, decisao, destino);
            onUpdateDiagnostico({
              ...processo.diagnostico,
              diagnosticosSelecionados: selecionados,
              reavaliacoesAnteriores: [...reavaliacoesRegistradas.filter(item => item.acompanhamentoId !== cuidado.acompanhamentoId), revisao],
            });
            if (decisao === 'encerrar') {
              const planos = processo.planejamento.diagnosticosPlanejados || [];
              const planosRemovidos = planos.filter(item => item.acompanhamentoId === cuidado.acompanhamentoId);
              const planosRestantes = planos.filter(item => item.acompanhamentoId !== cuidado.acompanhamentoId);
              onUpdatePlanejamento({ diagnosticosPlanejados: planosRestantes });
              const titulosRemovidos = new Set([
                diagnosticoVinculadoAnterior?.tituloDiagnostico,
                ...planosRemovidos.map(item => item.tituloDiagnostico),
              ].filter((titulo): titulo is string => Boolean(titulo)));
              const titulosAindaUtilizados = new Set([
                ...selecionados.map(item => item.tituloDiagnostico),
                ...planosRestantes.map(item => item.tituloDiagnostico),
              ]);
              const implementacaoAtualizada = { ...processo.implementacao };
              titulosRemovidos.forEach(titulo => { if (!titulosAindaUtilizados.has(titulo)) delete implementacaoAtualizada[titulo]; });
              onUpdateImplementacao(implementacaoAtualizada);
            }
          };
          const id = cuidado.acompanhamentoId;
          const buscaSubstituto = buscasSubstituto[id] || '';
          const resultadosSubstituto = buscarDiagnosticosSubstitutos(diagnosticos, buscaSubstituto)
            .filter(item => item.id !== cuidado.diagnosticoOrigemId);
          const diagnosticoEscolhido = atual?.novoDiagnosticoId
            ? diagnosticos.find(item => item.id === atual.novoDiagnosticoId)
            : undefined;
          const resumoDecisao = atual?.decisao === 'manter' ? 'Diagnóstico anterior mantido.'
            : atual?.decisao === 'encerrar' ? 'Acompanhamento encerrado nesta consulta.'
              : atual?.decisao === 'substituir' && atual.novoDiagnosticoId
                ? `Substituído por ${diagnosticoEscolhido?.tituloDiagnostico || atual.novoTituloDiagnostico || 'diagnóstico do Rol'}.`
                : atual?.decisao === 'substituir' ? 'Escolha um diagnóstico do Rol para concluir a substituição.' : '';
          const decisoes = [
            { value: 'manter' as const, label: 'Manter diagnóstico' },
            { value: 'substituir' as const, label: 'Substituir diagnóstico' },
            { value: 'encerrar' as const, label: 'Encerrar acompanhamento' },
          ];
          return <Card key={id} className="border-border/80 shadow-sm">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h3 className="text-base font-semibold leading-snug">{cuidado.tituloDiagnostico}</h3>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Consulta de origem · {formatarDataConsulta(cuidado.dataOrigem)}</p>
                </div>
                {atual && <Badge variant="outline" className="shrink-0 border-primary/30 text-primary">Decisão registrada</Badge>}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-muted/50 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Resultado esperado anterior</p>
                  <p className="mt-1 text-sm">{cuidado.resultadoEsperado || 'Não registrado'}</p>
                </div>
                <details className="rounded-md bg-muted/50 px-3 py-2.5">
                  <summary className="cursor-pointer text-sm font-medium">Intervenções anteriores <span className="text-xs text-muted-foreground">({cuidado.intervencoes?.length || 0})</span></summary>
                  {cuidado.intervencoes?.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{cuidado.intervencoes.map((intervencao, index) => <li key={`${index}-${intervencao}`}>{intervencao}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Não registradas</p>}
                </details>
              </div>
              <section className="space-y-2.5 border-t pt-3" aria-label={`Decisão para ${cuidado.tituloDiagnostico}`}>
                <p className="text-sm font-semibold">Decisão clínica</p>
                <div role="group" aria-label={`Escolha uma decisão para ${cuidado.tituloDiagnostico}`} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {decisoes.map(opcao => <Button
                    key={opcao.value}
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-pressed={atual?.decisao === opcao.value}
                    onClick={() => decidir(opcao.value)}
                    className={cn('h-auto min-h-10 justify-start whitespace-normal px-3 py-2 text-left transition-colors', atual?.decisao === opcao.value && 'border-primary bg-primary/5 text-foreground ring-1 ring-primary/30 hover:bg-primary/10')}
                  >{opcao.label}{atual?.decisao === opcao.value && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}</Button>)}
                </div>
                {resumoDecisao && <p role="status" className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">{resumoDecisao}</p>}
                {atual?.decisao === 'substituir' && <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor={`substituto-${id}`}>Pesquisar diagnóstico substituto</label>
                  <Popover open={substitutoAberto === id} onOpenChange={aberto => {
                    setSubstitutoAberto(aberto ? id : null);
                    if (aberto) setBuscasSubstituto(atuais => atualizarBuscaPorAcompanhamento(atuais, id, ''));
                  }}>
                    <PopoverTrigger asChild>
                      <Button id={`substituto-${id}`} type="button" variant="outline" role="combobox" aria-expanded={substitutoAberto === id} aria-label={diagnosticoEscolhido ? `Diagnóstico substituto: ${diagnosticoEscolhido.tituloDiagnostico}. Pesquisar outro diagnóstico` : 'Pesquisar diagnóstico substituto'} className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal text-left">
                        <span className="flex min-w-0 items-start gap-2"><Search className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><span className="min-w-0">{diagnosticoEscolhido ? <><span className="block font-medium">{diagnosticoEscolhido.tituloDiagnostico}</span>{diagnosticoEscolhido.descricaoDiagnostico && <span className="mt-0.5 line-clamp-2 block text-xs font-normal text-muted-foreground">{diagnosticoEscolhido.descricaoDiagnostico}</span>}</> : <span className="font-normal text-muted-foreground">Pesquisar diagnóstico substituto</span>}</span></span>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="bottom" align="start" sideOffset={4} collisionPadding={12} className="z-[70] w-[min(38rem,calc(100vw-2rem))] p-0">
                      <Command shouldFilter={false} loop>
                        <CommandInput
                          aria-label={`Pesquisar por nome ou descrição para ${cuidado.tituloDiagnostico}`}
                          placeholder="Digite o nome ou a descrição do diagnóstico"
                          value={buscaSubstituto}
                          onValueChange={termo => setBuscasSubstituto(atuais => atualizarBuscaPorAcompanhamento(atuais, id, termo))}
                        />
                        <CommandList className="max-h-[min(55vh,34rem)] overscroll-contain">
                          {!buscaSubstituto.trim() ? <p role="status" className="px-4 py-5 text-center text-sm text-muted-foreground">Digite para pesquisar em todo o Rol de Enfermagem.</p>
                            : resultadosSubstituto.length === 0 ? <CommandEmpty>Nenhum diagnóstico encontrado.</CommandEmpty>
                              : resultadosSubstituto.map(item => <CommandItem
                                key={item.id}
                                value={item.id}
                                onSelect={() => {
                                  decidir('substituir', item);
                                  setSubstitutoAberto(null);
                                  setBuscasSubstituto(atuais => atualizarBuscaPorAcompanhamento(atuais, id, ''));
                                }}
                                className="items-start gap-2 px-3 py-2.5"
                              >
                                <Check className={cn('mt-0.5 h-4 w-4 shrink-0', atual.novoDiagnosticoId === item.id ? 'opacity-100 text-primary' : 'opacity-0')} />
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium leading-snug">{item.tituloDiagnostico}</span>
                                  {item.descricaoDiagnostico && <span className="mt-1 block whitespace-normal text-xs leading-relaxed text-muted-foreground">{item.descricaoDiagnostico}</span>}
                                  <span className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                                    {item.naturezaDiagnostico && <span>Natureza: {item.naturezaDiagnostico === 'promocao_saude' ? 'promoção da saúde' : item.naturezaDiagnostico}</span>}
                                    {(item.subconjuntos || []).slice(0, 2).map(subconjunto => <span key={`${subconjunto.tipoSubconjunto}-${subconjunto.tituloSubconjunto}`}>{subconjunto.tituloSubconjunto}</span>)}
                                  </span>
                                </span>
                              </CommandItem>)}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>}
              </section>
            </CardContent>
          </Card>;
        })}
      </CardContent></Card>}
      {/* Bloco Introdutório */}
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Diagnóstico de Enfermagem</h3>
          <p className="text-sm text-muted-foreground">
            Nesta etapa, você identificará os problemas de saúde reais ou potenciais com base nos 
            dados coletados na avaliação. Use as Necessidades Humanas Básicas afetadas como guia 
            para seu raciocínio clínico.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Guia para Diagnosticar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Guia para Diagnóstico de Enfermagem</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">O que é o Diagnóstico de Enfermagem?</h4>
                  <p>
                    É um julgamento clínico sobre as respostas do indivíduo, família ou comunidade 
                    a problemas de saúde/processos vitais reais ou potenciais que constituem a base 
                    para a seleção das intervenções de enfermagem.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Como Diagnosticar?</h4>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Analise os dados coletados na avaliação</li>
                    <li>Identifique padrões e alterações</li>
                    <li>Use as NHBs afetadas como guia (destacadas com ⭐)</li>
                    <li>Selecione diagnósticos que melhor descrevem a situação</li>
                    <li>Priorize os diagnósticos mais urgentes</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dicas Importantes</h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Foque nos problemas que a enfermagem pode resolver</li>
                    <li>Use diagnósticos específicos e precisos</li>
                    <li>Considere diagnósticos de risco quando apropriado</li>
                    <li>Revise periodicamente conforme novas informações</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Comunicando o Diagnóstico ao Paciente</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium mb-2">1. Evite termos técnicos</h5>
                      <p className="mb-2">Substitua jargões médicos por linguagem acessível:</p>
                      <div className="bg-muted p-3 rounded-md">
                        <p><strong>Em vez de:</strong> "Você tem comprometimento da função renal"</p>
                        <p><strong>Diga:</strong> "Seus rins não estão funcionando como deveriam"</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">2. Técnica "Pergunte-Diga-Pergunte"</h5>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Pergunte:</strong> "O que você entende sobre sua condição atual?"</li>
                        <li><strong>Diga:</strong> Forneça informações claras baseadas no conhecimento demonstrado</li>
                        <li><strong>Pergunte:</strong> "Há algo que não ficou claro ou que você gostaria de saber mais?"</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">3. Considere o conhecimento do usuário</h5>
                      <p>Avalie sempre o nível de escolaridade e experiências prévias do paciente antes de iniciar explicações.</p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">4. Resgate preocupações do usuário</h5>
                      <div className="bg-muted p-3 rounded-md">
                        <p><strong>Exemplo:</strong> "Lembra que você me disse que estava preocupado com a falta de ar? Identificamos que isso está relacionado ao acúmulo de líquido no pulmão..."</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">5. Evite sobrecarga de informações</h5>
                      <p>Fragmente as informações em pequenos blocos e permita tempo para processamento entre eles.</p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">6. Consciência Cultural</h5>
                      <p>Adapte a linguagem considerando aspectos culturais, religiosos e socioeconômicos do paciente.</p>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">7. Técnica "Fragmente e verifique"</h5>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Dê uma informação por vez</li>
                        <li>Verifique a compreensão antes de continuar</li>
                        <li>Use frases como: "Isso faz sentido para você?"</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-medium mb-2">8. Repetição e Clareza</h5>
                      <p>Use repetição estratégica e analogias simples para facilitar a compreensão:</p>
                      <div className="bg-muted p-3 rounded-md">
                        <p><strong>Exemplo:</strong> "O coração funciona como uma bomba que leva sangue para todo o corpo..."</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    <strong>Referência:</strong> SILVA, M. J. P. Guia de habilidades de comunicação no cuidado de enfermagem. 
                    São Paulo: Atheneu, 2019.
                  </p>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Seleção de Subconjuntos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Explorar Diagnósticos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="nhbs"
                checked={showNHBs}
                onCheckedChange={(checked) => setShowNHBs(!!checked)}
              />
              <label htmlFor="nhbs" className="text-sm font-medium">
                Necessidades Humanas Básicas
                {nhbsAfetadas.length > 0 && (
                  <span className="ml-2 text-xs text-yellow-600">
                    ({nhbsAfetadas.length} afetadas)
                  </span>
                )}
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="protocolos"
                checked={showProtocolos}
                onCheckedChange={(checked) => setShowProtocolos(!!checked)}
              />
              <label htmlFor="protocolos" className="text-sm font-medium">
                Protocolos de Enfermagem
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barra de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buscar Diagnósticos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar diagnóstico..."
              value={termoBuscaDiagnostico}
              onChange={(e) => setTermoBuscaDiagnostico(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Colunas de Diagnósticos */}
      <div className="grid gap-6" style={{ 
        gridTemplateColumns: `${showNHBs && showProtocolos ? '1fr 1fr' : '1fr'}` 
      }}>
        {/* Coluna NHBs */}
        {showNHBs && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                Necessidades Humanas Básicas
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">= Afetada na avaliação</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {Object.entries(nhbsFiltradas).map(([subconjunto, diagnosticosLista]) => (
                  <AccordionItem key={subconjunto} value={subconjunto}>
                    <AccordionTrigger className="text-left">
                      <div className="flex items-center gap-2">
                        {isNHBAfetada(subconjunto) && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <span>{subconjunto}</span>
                        <Badge variant="outline" className="ml-auto">
                          {diagnosticosLista.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {diagnosticosLista.map((diagnostico) => {
                          const isSelected = isDiagnosticoSelecionado(diagnostico);
                          return (
                            <div
                              key={diagnostico.id}
                              className={cn(
                                "p-3 border rounded-lg cursor-pointer transition-colors",
                                isSelected 
                                  ? "bg-primary text-primary-foreground border-primary" 
                                  : "hover:bg-muted/50"
                              )}
                              onClick={() => handleToggleDiagnostico(diagnostico)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {isSelected && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                                    <h4 className="font-medium text-sm">{diagnostico.tituloDiagnostico}</h4>
                                  </div>
                                  <p className={cn(
                                    "text-xs mt-1 line-clamp-2",
                                    isSelected ? "text-white/80" : "text-muted-foreground"
                                  )}>
                                    {diagnostico.descricaoDiagnostico}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Coluna Protocolos */}
        {showProtocolos && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Protocolos de Enfermagem</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(protocolosFiltrados).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {termoBuscaDiagnostico.trim()
                    ? "Nenhum protocolo encontrado para o termo buscado."
                    : "Nenhum protocolo de enfermagem encontrado. Verifique se há diagnósticos cadastrados com subconjuntos do tipo 'Protocolo_Enfermagem'."
                  }
                </p>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {Object.entries(protocolosFiltrados).map(([subconjunto, diagnosticosLista]) => (
                    <AccordionItem key={subconjunto} value={subconjunto}>
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center justify-between">
                          <span>{subconjunto}</span>
                          <Badge variant="outline">
                            {diagnosticosLista.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {diagnosticosLista.map((diagnostico) => {
                            const isSelected = isDiagnosticoSelecionado(diagnostico);
                            return (
                              <div
                                key={diagnostico.id}
                                className={cn(
                                  "p-3 border rounded-lg cursor-pointer transition-colors",
                                  isSelected 
                                    ? "bg-primary text-primary-foreground border-primary" 
                                    : "hover:bg-muted/50"
                                )}
                                onClick={() => handleToggleDiagnostico(diagnostico)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      {isSelected && <CheckCircle className="w-4 h-4 flex-shrink-0" />}
                                      <h4 className="font-medium text-sm">{diagnostico.tituloDiagnostico}</h4>
                                    </div>
                                    <p className={cn(
                                      "text-xs mt-1 line-clamp-2",
                                      isSelected ? "text-white/80" : "text-muted-foreground"
                                    )}>
                                      {diagnostico.descricaoDiagnostico}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diagnósticos Selecionados */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Diagnósticos de Enfermagem Selecionados</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>
                    Os diagnósticos selecionados aqui serão a base para a etapa de Planejamento de Enfermagem. 
                    Eles guiarão a definição de resultados e a prescrição de intervenções para esta e futuras consultas. 
                    Selecione todos os diagnósticos adequados para um cuidado integral, mas evite selecionar em excesso 
                    para garantir que o plano de cuidados seja exequível.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          {diagnosticosSelecionados.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum diagnóstico selecionado ainda. Explore as categorias acima para adicionar diagnósticos.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {diagnosticosSelecionados.map((diagnostico) => (
                <Badge
                  key={diagnostico.id}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1"
                >
                  <span className="text-sm">{diagnostico.tituloDiagnostico}</span>
                  <button
                    onClick={() => handleRemoveDiagnostico(diagnostico.id)}
                    className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapaDiagnostico;
