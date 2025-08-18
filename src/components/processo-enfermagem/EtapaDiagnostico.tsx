
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
  AlertTriangle, 
  BookOpen, 
  Star, 
  X,
  Plus
} from 'lucide-react';
import { ProcessoEnfermagem, DiagnosticoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { getDiagnosticos, Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import { buscarSubconjuntos, SubconjuntoEnfermagem } from '@/services/bancodados/subconjuntosDB';

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
          setDiagnosticos(diagnosticosData);
          processarDiagnosticosPorSubconjunto(diagnosticosData);
        });

        // Carregar subconjuntos
        const subconjuntosData = await buscarSubconjuntos();
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
        } else if (subconjunto.tipoSubconjunto === 'protocolo') {
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

  const handleAddDiagnostico = (diagnostico: Diagnostico) => {
    const selecionadosAtuais = processo.diagnostico?.diagnosticosSelecionados ?? [];
    const jaExiste = selecionadosAtuais.some(
      d => d.id === diagnostico.id
    );

    if (!jaExiste) {
      const novosDiagnosticos = [
        ...selecionadosAtuais,
        {
          id: diagnostico.id,
          tituloDiagnostico: diagnostico.tituloDiagnostico
        }
      ];

      onUpdateDiagnostico({
        diagnosticosSelecionados: novosDiagnosticos
      });
    }
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
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Guia para Diagnóstico de Enfermagem</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4 text-sm">
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
                        {diagnosticosLista.map((diagnostico) => (
                          <div
                            key={diagnostico.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleAddDiagnostico(diagnostico)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{diagnostico.tituloDiagnostico}</h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {diagnostico.descricaoDiagnostico}
                                </p>
                              </div>
                              <Plus className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
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
                        {diagnosticosLista.map((diagnostico) => (
                          <div
                            key={diagnostico.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleAddDiagnostico(diagnostico)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{diagnostico.tituloDiagnostico}</h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {diagnostico.descricaoDiagnostico}
                                </p>
                              </div>
                              <Plus className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diagnósticos Selecionados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Diagnósticos de Enfermagem Selecionados</CardTitle>
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
