import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Info, CheckCircle } from 'lucide-react';
import { ProcessoEnfermagem, EvolucaoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { useToast } from '@/hooks/use-toast';

interface EtapaEvolucaoProps {
  processo: ProcessoEnfermagem;
  paciente: Paciente;
  onUpdateEvolucao: (evolucao: EvolucaoEnfermagem) => void;
}

const EtapaEvolucao: React.FC<EtapaEvolucaoProps> = ({
  processo,
  paciente,
  onUpdateEvolucao
}) => {
  const [textoEvolucao, setTextoEvolucao] = useState('');
  const { toast } = useToast();

  // Verificar se a implementação atende aos critérios
  const verificarCriteriosImplementacao = () => {
    const implementacao = processo.implementacao || {};
    let peloMenosUmaImplementada = false;
    let todasPadroesTemExecutor = true;

    Object.values(implementacao).forEach(diagnostico => {
      diagnostico.intervencoes.forEach(intervencao => {
        if (intervencao.implementadoNestaConsulta) {
          peloMenosUmaImplementada = true;
          
          if (intervencao.tipo === 'padrao' && !intervencao.quemExecuta) {
            todasPadroesTemExecutor = false;
          }
        }
      });
    });

    return peloMenosUmaImplementada && todasPadroesTemExecutor;
  };

  const gerarTextoEvolucao = () => {
    const linhas: string[] = [];
    
    // Cabeçalho
    linhas.push(`EVOLUÇÃO DE ENFERMAGEM`);
    linhas.push(`Paciente: ${paciente.nomeCompleto}`);
    linhas.push(`Gerado no Portal CSAE Floripa`);
    linhas.push(`Data: ${new Date().toLocaleDateString('pt-BR')}`);
    linhas.push('');

    // Avaliação
    if (processo.avaliacao.coletaDeDadosSubjetivos) {
      linhas.push('AVALIAÇÃO DE ENFERMAGEM:');
      linhas.push(processo.avaliacao.coletaDeDadosSubjetivos);
      linhas.push('');
    }

    // Exame Físico
    const exameFisico = processo.avaliacao.exameFisico || {};
    if (Object.keys(exameFisico).length > 0) {
      linhas.push('EXAME FÍSICO:');
      Object.entries(exameFisico).forEach(([parametro, valor]) => {
        if (valor !== null && valor !== undefined && valor !== '') {
          linhas.push(`${parametro}: ${valor}`);
        }
      });
      linhas.push('');
    }

    // Diagnósticos
    if (processo.diagnostico.diagnosticosSelecionados.length > 0) {
      linhas.push('DIAGNÓSTICOS DE ENFERMAGEM:');
      processo.diagnostico.diagnosticosSelecionados.forEach(diag => {
        linhas.push(`• ${diag.tituloDiagnostico}`);
      });
      linhas.push('');
    }

    // Planejamento
    if (processo.planejamento.diagnosticosPlanejados.length > 0) {
      linhas.push('PLANEJAMENTO DE ENFERMAGEM:');
      const diagnosticosOrdenados = [...processo.planejamento.diagnosticosPlanejados]
        .sort((a, b) => a.ordemPrioridade - b.ordemPrioridade);

      diagnosticosOrdenados.forEach((diag, index) => {
        linhas.push(`${index + 1}º) ${diag.tituloDiagnostico}`);
        
        if (diag.resultadoEsperadoSelecionado) {
          linhas.push(`   Resultado Esperado: ${diag.resultadoEsperadoSelecionado}`);
        }
        
        if (diag.intervencoesSelecionadas.length > 0) {
          linhas.push('   Intervenções Planejadas:');
          diag.intervencoesSelecionadas.forEach(int => {
            linhas.push(`   - ${int.acaoPrescrita}`);
          });
        }
        linhas.push('');
      });
    }

    // Implementação
    const implementacao = processo.implementacao || {};
    const intervencoesImplementadas: string[] = [];

    Object.entries(implementacao).forEach(([, diagnostico]) => {
      diagnostico.intervencoes.forEach(intervencao => {
        if (intervencao.implementadoNestaConsulta) {
          let textoIntervencao = intervencao.acaoPrescrita;
          
          // Adicionar informação sobre prazo se existir
          if (intervencao.prazo && intervencao.prazoUnidade) {
            textoIntervencao += ` - Prazo: ${intervencao.prazo} ${intervencao.prazoUnidade}`;
          }
          
          intervencoesImplementadas.push(textoIntervencao);
        }
      });
    });

    if (intervencoesImplementadas.length > 0) {
      linhas.push('IMPLEMENTAÇÃO DE ENFERMAGEM:');
      intervencoesImplementadas.forEach(int => {
        linhas.push(`• ${int}`);
      });
      linhas.push('');
    }

    linhas.push('---');
    linhas.push('Enfermeiro Responsável: [Nome do Enfermeiro]');
    linhas.push('COREN: [Número do COREN]');

    return linhas.join('\n');
  };

  const handleCopiarTexto = async () => {
    const texto = gerarTextoEvolucao();
    setTextoEvolucao(texto);
    
    try {
      await navigator.clipboard.writeText(texto);
      
      // Atualizar o estado da evolução
      onUpdateEvolucao({
        resumoGerado: texto
      });
      
      toast({
        title: "Sucesso",
        description: "Evolução de enfermagem copiada para a área de transferência!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  const obterIntervencoesMateriais = () => {
    // Esta função seria implementada para buscar materiais de apoio
    // Por enquanto, retorna um array vazio pois não temos acesso ao rolEnfermagem
    return [];
  };

  if (!verificarCriteriosImplementacao()) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-yellow-500" />
            Etapa 5: Evolução de Enfermagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Para acessar a etapa de Evolução, é necessário implementar pelo menos uma intervenção na etapa anterior. 
              Todas as intervenções padrão implementadas devem ter um executor definido.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título e Introdução */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Etapa 5: Evolução de Enfermagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta etapa final apresenta um resumo completo do processo de enfermagem realizado, 
            permite a geração de uma evolução padronizada e oferece materiais de apoio para o paciente.
          </p>
        </CardContent>
      </Card>

      {/* Resumo do Processo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Processo de Enfermagem</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {/* Avaliação */}
            <AccordionItem value="avaliacao">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">1</Badge>
                  Avaliação de Enfermagem
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Coleta de Dados Subjetivos:</h4>
                    <p className="text-sm bg-muted p-3 rounded">
                      {processo.avaliacao.coletaDeDadosSubjetivos || 'Não preenchido'}
                    </p>
                  </div>
                  
                  {Object.keys(processo.avaliacao.exameFisico || {}).length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Exame Físico:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(processo.avaliacao.exameFisico).map(([param, valor]) => (
                          valor && (
                            <div key={param} className="bg-muted p-2 rounded">
                              <strong>{param}:</strong> {valor}
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Diagnósticos */}
            <AccordionItem value="diagnosticos">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">2</Badge>
                  Diagnósticos de Enfermagem ({processo.diagnostico.diagnosticosSelecionados.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {processo.diagnostico.diagnosticosSelecionados.map((diag, index) => (
                    <div key={index} className="bg-muted p-3 rounded">
                      <p className="font-medium">{diag.tituloDiagnostico}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Planejamento */}
            <AccordionItem value="planejamento">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">3</Badge>
                  Planejamento de Enfermagem
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {processo.planejamento.diagnosticosPlanejados
                    .sort((a, b) => a.ordemPrioridade - b.ordemPrioridade)
                    .map((diag, index) => (
                      <div key={index} className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{diag.ordemPrioridade}º</Badge>
                          <span className="font-medium">{diag.tituloDiagnostico}</span>
                        </div>
                        
                        {diag.resultadoEsperadoSelecionado && (
                          <p className="text-sm mb-2">
                            <strong>Resultado Esperado:</strong> {diag.resultadoEsperadoSelecionado}
                          </p>
                        )}
                        
                        <div>
                          <strong className="text-sm">Intervenções:</strong>
                          <ul className="text-sm mt-1 space-y-1">
                            {diag.intervencoesSelecionadas.map((int, intIndex) => (
                              <li key={intIndex} className="flex items-center gap-2">
                                <span>•</span>
                                <span>{int.acaoPrescrita}</span>
                                <Badge variant={int.tipo === 'padrao' ? 'secondary' : 'outline'} className="text-xs">
                                  {int.tipo === 'padrao' ? 'Padrão' : 'Autoral'}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Implementação */}
            <AccordionItem value="implementacao">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">4</Badge>
                  Implementação de Enfermagem
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {Object.entries(processo.implementacao || {}).map(([tituloDiag, diagnostico]) => {
                    const intervencoesImplementadas = diagnostico.intervencoes.filter(
                      int => int.implementadoNestaConsulta
                    );
                    
                    if (intervencoesImplementadas.length === 0) return null;
                    
                    return (
                      <div key={tituloDiag} className="border rounded p-3">
                        <h4 className="font-medium mb-2">{tituloDiag}</h4>
                        <div className="space-y-2">
                          {intervencoesImplementadas.map((int, index) => (
                            <div key={index} className="bg-green-50 p-2 rounded flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm">{int.acaoPrescrita}</span>
                              {int.quemExecuta && (
                                <Badge variant="secondary" className="text-xs">
                                  {int.quemExecuta}
                                </Badge>
                              )}
                              {int.prazo && int.prazoUnidade && (
                                <Badge variant="outline" className="text-xs">
                                  {int.prazo} {int.prazoUnidade}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Materiais de Apoio */}
      <Card>
        <CardHeader>
          <CardTitle>Materiais de Apoio Recomendados</CardTitle>
        </CardHeader>
        <CardContent>
          {obterIntervencoesMateriais().length > 0 ? (
            <div className="space-y-3">
              {obterIntervencoesMateriais().map((material: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">{material.titulo}</h4>
                    <p className="text-sm text-muted-foreground">{material.descricao}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(material.url, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Acessar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Nenhum material de apoio específico foi identificado para as intervenções implementadas.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gerador de Evolução */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Enfermagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleCopiarTexto} className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Gerar e Copiar Evolução
            </Button>
          </div>
          
          {textoEvolucao && (
            <Textarea
              value={textoEvolucao}
              readOnly
              className="min-h-[300px] font-mono text-sm"
              placeholder="A evolução de enfermagem aparecerá aqui após clicar em 'Gerar e Copiar Evolução'"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapaEvolucao;
