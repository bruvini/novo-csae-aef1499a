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
import { getSinaisVitais } from '@/services/bancodados/sinaisVitaisDB';
import { getExames } from '@/services/bancodados/examesDB';
import { getSistemas } from '@/services/bancodados/revisaoSistemasDB';

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
  const [sinaisVitais, setSinaisVitais] = useState<any[]>([]);
  const [exames, setExames] = useState<any[]>([]);
  const [sistemas, setSistemas] = useState<any[]>([]);

  useEffect(() => {
    // Carregar catálogos para agrupamento na evolução
    const loadCatalogs = async () => {
      try {
        const [sv, ex, sist] = await Promise.all([
          new Promise<any[]>((resolve) => {
             const unsubscribe = getSinaisVitais((data) => {
               resolve(data);
               unsubscribe();
             });
          }),
          new Promise<any[]>((resolve) => {
            const unsubscribe = getExames((data) => {
              resolve(data);
              unsubscribe();
            });
          }),
          getSistemas()
        ]);
        setSinaisVitais(sv);
        setExames(ex);
        setSistemas(sist);
      } catch (err) {
        console.error('Erro ao carregar catálogos para evolução:', err);
      }
    };
    loadCatalogs();
  }, []);

  // Verificar se a implementação atende aos critérios
  const verificarCriteriosImplementacao = () => {
    const implementacao = processo.implementacao || {};
    let peloMenosUmaImplementada = false;

    Object.values(implementacao).forEach(diagnostico => {
      diagnostico.intervencoes.forEach(intervencao => {
        if (intervencao.implementadoNestaConsulta) {
          peloMenosUmaImplementada = true;
        }
      });
    });

    return peloMenosUmaImplementada;
  };

  const gerarTextoEvolucao = () => {
    const linhas: string[] = [];
    
    // Cabeçalho
    linhas.push(`EVOLUÇÃO DE ENFERMAGEM`);
    linhas.push(`Paciente: ${paciente.nomeCompleto}`);
    linhas.push(`Unidade: Unidade de Saúde Floripa`);
    linhas.push(`Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
    linhas.push(`-`.repeat(50));
    linhas.push('');

    // Avaliação Subjetiva
    if (processo.avaliacao.coletaDeDadosSubjetivos) {
      linhas.push('AVALIAÇÃO / COLETA DE DADOS:');
      linhas.push(processo.avaliacao.coletaDeDadosSubjetivos);
      linhas.push('');
    }

    // Exame Físico - AGRUPADO
    const exameFisico = processo.avaliacao.exameFisico || {};
    if (Object.keys(exameFisico).length > 0) {
      linhas.push('EXAME FÍSICO:');
      
      // 1. Sinais Vitais
      const svAtivos = sinaisVitais.filter(s => exameFisico[s.sinalVitalNome]);
      if (svAtivos.length > 0) {
        linhas.push('  [SINAIS VITAIS]');
        svAtivos.forEach(s => {
          linhas.push(`  • ${s.sinalVitalNome}: ${exameFisico[s.sinalVitalNome]}`);
        });
      }

      // 2. Exames
      const exMap = new Map();
      exames.forEach(ex => {
        ex.componentes.forEach((c: any) => {
          if (exameFisico[c.componenteAnalisado]) {
            const grp = `${ex.tipoExame} - ${ex.tituloExame}`;
            if (!exMap.has(grp)) exMap.set(grp, []);
            exMap.get(grp).push(`${c.componenteAnalisado}: ${exameFisico[c.componenteAnalisado]}`);
          }
        });
      });
      if (exMap.size > 0) {
        linhas.push('  [EXAMES DIAGNÓSTICOS]');
        exMap.forEach((vals, titulo) => {
          linhas.push(`  • ${titulo}: ${vals.join(', ')}`);
        });
      }

      // 3. Revisão de Sistemas
      const rsEncontrados: string[] = [];
      sistemas.forEach(s => {
        s.exames.forEach((e: any) => {
          if (exameFisico[e.nomeExame]) {
            rsEncontrados.push(`${e.nomeExame}: ${exameFisico[e.nomeExame]}`);
          }
        });
      });
      if (rsEncontrados.length > 0) {
        linhas.push('  [REVISÃO DE SISTEMAS]');
        rsEncontrados.forEach(item => {
          linhas.push(`  • ${item}`);
        });
      }
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

    // Planejamento (Restaurado)
    if (processo.planejamento?.diagnosticosPlanejados?.length > 0) {
      linhas.push('PLANEJAMENTO DE ENFERMAGEM:');
      const diagnosticosOrdenados = [...processo.planejamento.diagnosticosPlanejados]
        .sort((a, b) => a.ordemPrioridade - b.ordemPrioridade);

      diagnosticosOrdenados.forEach((diag, index) => {
        linhas.push(`${index + 1}º) ${diag.tituloDiagnostico}`);
        
        if (diag.resultadoEsperadoSelecionado) {
          linhas.push(`   Resultado Esperado: ${diag.resultadoEsperadoSelecionado}`);
        }
        
        if (diag.intervencoesSelecionadas?.length > 0) {
          linhas.push('   Intervenções Planejadas:');
          diag.intervencoesSelecionadas.forEach(int => {
            linhas.push(`   - ${int.acaoPrescrita}`);
          });
        }
      });
      linhas.push('');
    }

    // Implementação
    const implementacao = processo.implementacao || {};
    const possuiImplementacao = Object.values(implementacao).some(d => d.intervencoes?.some(i => i.implementadoNestaConsulta));

    if (possuiImplementacao) {
      linhas.push('IMPLEMENTAÇÃO DE ENFERMAGEM:');
      Object.entries(implementacao).forEach(([tituloDiag, dados]) => {
        const implementadas = dados.intervencoes.filter(i => i.implementadoNestaConsulta);
        if (implementadas.length > 0) {
          linhas.push(`  [${tituloDiag}]`);
          implementadas.forEach(int => {
            let itemStr = `  • ${int.acaoPrescrita}`;
            if (int.prazo && int.prazoUnidade) {
               itemStr += ` - Prazo: ${int.prazo} ${int.prazoUnidade}`;
            }
            if (int.quemExecuta) {
               itemStr += ` (Executor: ${int.quemExecuta})`;
            }
            linhas.push(itemStr);
          });
        }
      });
      linhas.push('');
    }

    linhas.push('-'.repeat(50));
    linhas.push('Enfermeiro Responsável: [Nome do Enfermeiro]');
    linhas.push('COREN: [Número / UF]');

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
