
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Info, HelpCircle } from 'lucide-react';
import { ProcessoEnfermagem, ImplementacaoEnfermagem, IntervencaoImplementada } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import IntervencaoItem from './IntervencaoItem';

interface EtapaImplementacaoProps {
  processo: ProcessoEnfermagem;
  paciente: Paciente;
  onUpdateImplementacao: (implementacao: ImplementacaoEnfermagem) => void;
}

const EtapaImplementacao: React.FC<EtapaImplementacaoProps> = ({
  processo,
  paciente,
  onUpdateImplementacao
}) => {
  const [implementacaoLocal, setImplementacaoLocal] = useState<ImplementacaoEnfermagem>({});

  useEffect(() => {
    if (processo.planejamento?.diagnosticosPlanejados?.length > 0) {
      // Inicializar implementação se não existir
      if (Object.keys(processo.implementacao || {}).length === 0) {
        const novaImplementacao: ImplementacaoEnfermagem = {};
        
        processo.planejamento.diagnosticosPlanejados.forEach(diag => {
          novaImplementacao[diag.tituloDiagnostico] = {
            intervencoes: diag.intervencoesSelecionadas.map(intervencao => ({
              ...intervencao,
              implementadoNestaConsulta: false
            }))
          };
        });
        
        setImplementacaoLocal(novaImplementacao);
        onUpdateImplementacao(novaImplementacao);
      } else {
        setImplementacaoLocal(processo.implementacao);
      }
    }
  }, [processo.planejamento, processo.implementacao, onUpdateImplementacao]);

  const handleIntervencaoUpdate = (tituloDiagnostico: string, index: number, intervencaoAtualizada: IntervencaoImplementada) => {
    const novaImplementacao = { ...implementacaoLocal };
    
    if (!novaImplementacao[tituloDiagnostico]) {
      novaImplementacao[tituloDiagnostico] = { intervencoes: [] };
    }
    
    novaImplementacao[tituloDiagnostico].intervencoes[index] = intervencaoAtualizada;
    
    setImplementacaoLocal(novaImplementacao);
    onUpdateImplementacao(novaImplementacao);
  };

  // Verificar se o planejamento está completo
  const diagnosticosPlanjados = processo.planejamento?.diagnosticosPlanejados || [];
  
  if (diagnosticosPlanjados.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-yellow-500" />
            Etapa 4: Implementação de Enfermagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Para acessar a etapa de Implementação, é necessário completar o planejamento na etapa anterior.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Verificar se todos os requisitos do planejamento foram atendidos
  const planejamentoCompleto = diagnosticosPlanjados.every(diag => {
    const temIntervencoes = diag.intervencoesSelecionadas && diag.intervencoesSelecionadas.length > 0;
    const temResultado = !!(diag.resultadoEsperadoSelecionado && diag.resultadoEsperadoSelecionado.trim() !== '');
    return temIntervencoes && temResultado;
  });

  if (!planejamentoCompleto) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-yellow-500" />
            Etapa 4: Implementação de Enfermagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Para acessar a etapa de Implementação, é necessário completar o planejamento: todos os diagnósticos devem ter resultados esperados selecionados e pelo menos uma intervenção definida.
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
              Etapa 4: Implementação de Enfermagem
            </CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Guia para a Implementação do Cuidado
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Guia para a Implementação do Cuidado de Enfermagem</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-semibold mb-2">Tipos de Intervenções</h3>
                    <ul className="space-y-2 ml-4">
                      <li><strong>Independentes:</strong> Ações que o enfermeiro pode realizar de forma autônoma, baseadas em seu conhecimento e julgamento clínico.</li>
                      <li><strong>Interdependentes:</strong> Ações realizadas em colaboração com outros profissionais de saúde.</li>
                      <li><strong>Dependentes:</strong> Ações que requerem prescrição médica ou de outro profissional autorizado.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Explicando Procedimentos ao Paciente</h3>
                    <p>Sempre explique os procedimentos antes de realizá-los, utilizando linguagem clara e adaptada ao nível de compreensão do paciente.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Técnicas de Comunicação</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">"Conte-me"</h4>
                        <p>Peça ao paciente para explicar o que entendeu sobre o procedimento ou cuidado.</p>
                      </div>
                      <div>
                        <h4 className="font-medium">"Mostre-me"</h4>
                        <p>Solicite que o paciente demonstre como realizará o autocuidado.</p>
                      </div>
                      <div>
                        <h4 className="font-medium">"Rede de Segurança"</h4>
                        <p>Estabeleça um plano de contingência: "Se isso acontecer, faça isso... Se continuar, procure ajuda médica".</p>
                      </div>
                    </div>
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
          <div className="space-y-4">
            <p className="text-muted-foreground">
              A Implementação de Enfermagem compreende a realização das intervenções, ações e atividades previstas no planejamento assistencial, pela equipe de enfermagem.
            </p>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Prescrição de Enfermagem</h4>
              <p className="text-sm text-blue-800">
                A prescrição de enfermagem é a documentação das intervenções/ações que devem ser realizadas pela equipe de enfermagem em resposta às necessidades identificadas nos diagnósticos de enfermagem. 
                Ela deve ser clara, específica, mensurável e incluir: o que fazer, como fazer, quando fazer, quantas vezes fazer e quem deve fazer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plano de Cuidados */}
      <Card>
        <CardHeader>
          <CardTitle>Plano de Cuidados - Prescrição e Implementação</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {diagnosticosPlanjados
              .sort((a, b) => a.ordemPrioridade - b.ordemPrioridade)
              .map((diagnostico, index) => {
                const intervencoes = implementacaoLocal[diagnostico.tituloDiagnostico]?.intervencoes || [];
                
                return (
                  <AccordionItem key={diagnostico.diagnosticoId} value={`diag-${index}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2 text-left">
                        <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                          {diagnostico.ordemPrioridade}º
                        </span>
                        <span className="font-medium">{diagnostico.tituloDiagnostico}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {/* Resultado Esperado */}
                        {diagnostico.resultadoEsperadoSelecionado && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="font-medium text-sm mb-1">Resultado Esperado:</p>
                            <p className="text-sm">{diagnostico.resultadoEsperadoSelecionado}</p>
                          </div>
                        )}

                        {/* Lista de Intervenções */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm flex items-center justify-between">
                            Intervenções Prescritas:
                            {intervencoes.filter(i => i.implementadoNestaConsulta && !i.quemExecuta).length > 0 && (
                              <span className="text-[10px] text-red-500 font-bold animate-pulse">
                                Executores pendentes*
                              </span>
                            )}
                          </h4>
                          {intervencoes.map((intervencao, intervencaoIndex) => (
                            <IntervencaoItem
                              key={intervencaoIndex}
                              intervencao={intervencao}
                              onUpdate={(intervencaoAtualizada) => 
                                handleIntervencaoUpdate(diagnostico.tituloDiagnostico, intervencaoIndex, intervencaoAtualizada)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapaImplementacao;
