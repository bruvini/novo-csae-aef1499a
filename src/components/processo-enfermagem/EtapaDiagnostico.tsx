
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  Info
} from 'lucide-react';
import { ProcessoEnfermagem, DiagnosticoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { getDiagnosticos, Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import { buscarSubconjuntos, SubconjuntoEnfermagem } from '@/services/bancodados/subconjuntosDB';
import { cn } from '@/lib/utils';

interface EtapaDiagnosticoProps {
  processo: ProcessoEnfermagem;
  paciente: Paciente;
  onUpdateDiagnostico: (novoDiagnostico: DiagnosticoEnfermagem) => void;
}

interface DiagnosticoPorSubconjunto {
  [subconjunto: string]: Diagnostico[];
}

const EtapaDiagnostico: React.FC<EtapaDiagnosticoProps> = ({
  processo,
  paciente,
  onUpdateDiagnostico
}) => {
  const [showNHBs, setShowNHBs] = useState(true);
  const [showProtocolos, setShowProtocolos] = useState(false);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [subconjuntos, setSubconjuntos] = useState<SubconjuntoEnfermagem[]>([]);
  const [diagnosticosPorNHB, setDiagnosticosPorNHB] = useState<DiagnosticoPorSubconjunto>({});
  const [diagnosticosPorProtocolo, setDiagnosticosPorProtocolo] = useState<DiagnosticoPorSubconjunto>({});
  const [loading, setLoading] = useState(true);

  // Verificar se há dados da avaliação - uso seguro com fallback
  const hasAvaliacaoData = ((processo.avaliacao?.coletaDeDadosSubjetivos ?? '').trim() !== '');
  const nhbsAfetadas = processo.avaliacao?.nhbsAfetadas ?? [];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Carregar diagnósticos
        const unsubscribeDiagnosticos = getDiagnosticos((diagnosticosData) => {
          console.log('Diagnósticos carregados:', diagnosticosData);
          setDiagnosticos(diagnosticosData);
          processarDiagnosticosPorSubconjunto(diagnosticosData);
        });

        // Carregar subconjuntos
        const subconjuntosData = await buscarSubconjuntos();
        console.log('Subconjuntos carregados:', subconjuntosData);
        setSubconjuntos(subconjuntosData);

        return () => {
          unsubscribeDiagnosticos();
        };
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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

    console.log('Diagnósticos por NHB:', porNHB);
    console.log('Diagnósticos por Protocolo:', porProtocolo);
    setDiagnosticosPorNHB(porNHB);
    setDiagnosticosPorProtocolo(porProtocolo);
  };

  const handleToggleDiagnostico = (diagnostico: Diagnostico) => {
    const selecionadosAtuais = processo.diagnostico?.diagnosticosSelecionados ?? [];
    const jaExiste = selecionadosAtuais.some(d => d.id === diagnostico.id);

    let novosDiagnosticos;
    if (jaExiste) {
      // Remove o diagnóstico
      novosDiagnosticos = selecionadosAtuais.filter(d => d.id !== diagnostico.id);
    } else {
      // Adiciona o diagnóstico
      novosDiagnosticos = [
        ...selecionadosAtuais,
        {
          id: diagnostico.id,
          tituloDiagnostico: diagnostico.tituloDiagnostico
        }
      ];
    }

    onUpdateDiagnostico({
      diagnosticosSelecionados: novosDiagnosticos
    });
  };

  const handleRemoveDiagnostico = (diagnosticoId: string) => {
    const selecionadosAtuais = processo.diagnostico?.diagnosticosSelecionados ?? [];
    const novosDiagnosticos = selecionadosAtuais.filter(
      d => d.id !== diagnosticoId
    );

    onUpdateDiagnostico({
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

  return (
    <div className="space-y-6">
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
                {Object.entries(diagnosticosPorNHB).map(([subconjunto, diagnosticosLista]) => (
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
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
              {Object.keys(diagnosticosPorProtocolo).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum protocolo de enfermagem encontrado. Verifique se há diagnósticos 
                  cadastrados com subconjuntos do tipo "Protocolo_Enfermagem".
                </p>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {Object.entries(diagnosticosPorProtocolo).map(([subconjunto, diagnosticosLista]) => (
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
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
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
