import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Copy, CheckCircle, Search, FileText, Target, Play, TrendingUp, BadgeCheck } from 'lucide-react';
import { ProcessoEnfermagem, EvolucaoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { useToast } from '@/hooks/use-toast';
import { getSinaisVitais } from '@/services/bancodados/sinaisVitaisDB';
import { getExames } from '@/services/bancodados/examesDB';
import { getSistemas } from '@/services/bancodados/revisaoSistemasDB';

interface EtapaResumoProps {
  processo: ProcessoEnfermagem;
  paciente: Paciente;
  onUpdateEvolucao: (evolucao: EvolucaoEnfermagem) => void;
}

const EtapaResumo: React.FC<EtapaResumoProps> = ({
  processo,
  paciente,
  onUpdateEvolucao
}) => {
  const [textoEvolucao, setTextoEvolucao] = useState(processo.evolucao?.resumoGerado || '');
  const { toast } = useToast();
  const [sinaisVitais, setSinaisVitais] = useState<any[]>([]);
  const [exames, setExames] = useState<any[]>([]);
  const [sistemas, setSistemas] = useState<any[]>([]);

  useEffect(() => {
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
        console.error('Erro ao carregar catálogos:', err);
      }
    };
    loadCatalogs();
  }, []);

  const gerarTextoEvolucao = () => {
    const linhas: string[] = [];
    
    linhas.push(`EVOLUÇÃO DE ENFERMAGEM`);
    linhas.push(`Paciente: ${paciente.nomeCompleto}`);
    linhas.push(`Unidade: Unidade de Saúde Floripa`);
    linhas.push(`Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
    linhas.push(`-`.repeat(50));
    linhas.push('');

    if (processo.avaliacao.coletaDeDadosSubjetivos) {
      linhas.push('AVALIAÇÃO / COLETA DE DADOS:');
      linhas.push(processo.avaliacao.coletaDeDadosSubjetivos);
      linhas.push('');
    }

    const exameFisico = processo.avaliacao.exameFisico || {};
    if (Object.keys(exameFisico).length > 0) {
      linhas.push('EXAME FÍSICO:');
      
      const svAtivos = sinaisVitais.filter(s => exameFisico[s.sinalVitalNome]);
      if (svAtivos.length > 0) {
        linhas.push('  [SINAIS VITAIS]');
        svAtivos.forEach(s => {
          linhas.push(`  • ${s.sinalVitalNome}: ${exameFisico[s.sinalVitalNome]}`);
        });
      }

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

    if (processo.diagnostico.diagnosticosSelecionados.length > 0) {
      linhas.push('DIAGNÓSTICOS DE ENFERMAGEM:');
      processo.diagnostico.diagnosticosSelecionados.forEach(diag => {
        linhas.push(`• ${diag.tituloDiagnostico}`);
      });
      linhas.push('');
    }

    const implementacao = processo.implementacao || {};
    const possuiImplementacao = Object.values(implementacao).some(d => d.intervencoes?.some(i => i.implementadoNestaConsulta));

    if (possuiImplementacao) {
      linhas.push('IMPLEMENTAÇÃO DE ENFERMAGEM (Prescrições da Consulta):');
      Object.entries(implementacao).forEach(([tituloDiag, dados]) => {
        const implementadas = dados.intervencoes.filter(i => i.implementadoNestaConsulta);
        if (implementadas.length > 0) {
          linhas.push(`  [${tituloDiag}]`);
          implementadas.forEach(int => {
            let itemStr = `  • ${int.acaoPrescrita}.`;
            if (int.quemExecuta) {
               itemStr += ` (Executor: ${int.quemExecuta})`;
            }
            linhas.push(itemStr);
          });
        }
      });
      linhas.push('');
    }

    const intervencoesExecutadas = processo.evolucao?.intervencoesExecutadas || {};
    const temExecutada = Object.values(intervencoesExecutadas).some(lista => lista.length > 0);
    
    if (temExecutada) {
      linhas.push('EVOLUÇÃO DE ENFERMAGEM (Ações Técnicas Realizadas pelo Enfermeiro):');
      Object.entries(intervencoesExecutadas).forEach(([tituloDiag, acoesMarcadas]) => {
        if (acoesMarcadas.length === 0) return;
        linhas.push(`  [${tituloDiag}]`);
        
        acoesMarcadas.forEach(acaoPresc => {
          // Buscar texto presente no planejamento ou implementação
          const dxImplementacao = processo.implementacao?.[tituloDiag];
          const intv = dxImplementacao?.intervencoes.find(i => i.acaoPrescrita === acaoPresc);
          
          linhas.push(`  • ${intv?.acaoEnfermeiro || acaoPresc}`);
        });
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
      onUpdateEvolucao({ ...processo.evolucao, resumoGerado: texto });
      toast({ title: "Sucesso", description: "Prontuário copiado para a área de transferência!" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao copiar texto.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Interface Path Traveled / Timeline */}
      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
           <BadgeCheck className="w-4 h-4" /> Resumo do Caminho Trilhado
        </h3>
        
        <Accordion type="single" collapsible className="space-y-2">
           {/* Etapa 1 */}
           <AccordionItem value="etapa1" className="border rounded-xl px-4 bg-white shadow-sm overflow-hidden">
             <AccordionTrigger className="hover:no-underline font-bold text-gray-700 py-3">
               <span className="flex items-center gap-3">
                 <Search className="w-5 h-5 text-csae-green-600" /> 1. Avaliação de Enfermagem
               </span>
             </AccordionTrigger>
             <AccordionContent className="text-sm p-4 bg-muted/20 rounded-lg mb-4 space-y-4">
                <div>
                  <h4 className="font-bold underline mb-1">Coleta Subjetiva:</h4>
                  <p className="text-gray-600">{processo.avaliacao.coletaDeDadosSubjetivos || "Não informado"}</p>
                </div>
                 <div>
                  <h4 className="font-bold underline mb-1">Exame Físico (Parâmetros):</h4>
                  <ul className="text-gray-600 space-y-1 list-disc ml-4">
                    {Object.entries(processo.avaliacao?.exameFisico || {}).map(([chave, valor]: any) => (
                      <li key={chave}>
                        <strong>{chave}</strong>: {valor}
                      </li>
                    ))}
                  </ul>
                </div>
             </AccordionContent>
           </AccordionItem>

           {/* Etapa 2 */}
           <AccordionItem value="etapa2" className="border rounded-xl px-4 bg-white shadow-sm overflow-hidden">
             <AccordionTrigger className="hover:no-underline font-bold text-gray-700 py-3">
               <span className="flex items-center gap-3">
                 <FileText className="w-5 h-5 text-csae-green-600" /> 2. Diagnóstico
               </span>
             </AccordionTrigger>
             <AccordionContent className="text-sm p-4 bg-muted/20 rounded-lg mb-4">
                <ul className="space-y-1">
                  {processo.diagnostico.diagnosticosSelecionados.map((d: any, i: number) => (
                    <li key={i} className="flex gap-2"><span>•</span> <strong>{d.tituloDiagnostico}</strong></li>
                  ))}
                </ul>
             </AccordionContent>
           </AccordionItem>

           {/* Etapa 3 */}
           <AccordionItem value="etapa3" className="border rounded-xl px-4 bg-white shadow-sm overflow-hidden">
             <AccordionTrigger className="hover:no-underline font-bold text-gray-700 py-3">
               <span className="flex items-center gap-3">
                 <Target className="w-5 h-5 text-csae-green-600" /> 3. Planejamento de Enfermagem
               </span>
             </AccordionTrigger>
             <AccordionContent className="text-sm p-4 bg-muted/20 rounded-lg mb-4 space-y-4">
                {processo.planejamento?.diagnosticosPlanejados?.map((diag: any, index: number) => (
                  <div key={index}>
                    <h4 className="font-bold">{diag.tituloDiagnostico}</h4>
                    {diag.resultadoEsperadoSelecionado && (
                      <p className="text-csae-green-700 italic border-l-2 border-csae-green-500 pl-2 mt-1">
                        Resultado Esperado: {diag.resultadoEsperadoSelecionado}
                      </p>
                    )}
                    <div className="mt-2">
                       <span className="text-xs font-bold uppercase text-muted-foreground">Intervenções Planejadas:</span>
                       <ul className="list-disc ml-4 mt-1">
                         {diag.intervencoesSelecionadas?.map((int: any, j: number) => (
                           <li key={j} className="text-gray-700">{int.acaoPrescrita}</li>
                         ))}
                       </ul>
                    </div>
                  </div>
                ))}
             </AccordionContent>
           </AccordionItem>

           {/* Etapa 4 */}
           <AccordionItem value="etapa4" className="border rounded-xl px-4 bg-white shadow-sm overflow-hidden">
             <AccordionTrigger className="hover:no-underline font-bold text-gray-700 py-3">
               <span className="flex items-center gap-3">
                 <Play className="w-5 h-5 text-csae-green-600" /> 4. Implementação de Cuidados
               </span>
             </AccordionTrigger>
             <AccordionContent className="text-sm p-4 bg-muted/20 rounded-lg mb-4 space-y-3">
                {Object.entries(processo.implementacao || {}).map(([titulo, dados]: any, i: number) => {
                  const items = dados.intervencoes.filter((iv: any) => iv.implementadoNestaConsulta);
                  if (items.length === 0) return null;
                  return (
                    <div key={i}>
                      <h4 className="font-bold">{titulo}</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                         {items.map((iv: any, idx: number) => (
                           <span key={idx} className="bg-white border rounded px-2 py-0.5 text-[10px] font-medium">
                             {iv.acaoPrescrita} ({iv.quemExecuta})
                           </span>
                         ))}
                      </div>
                    </div>
                  );
                })}
             </AccordionContent>
           </AccordionItem>

           {/* Etapa 5 */}
           <AccordionItem value="etapa5" className="border rounded-xl px-4 bg-white shadow-sm overflow-hidden">
             <AccordionTrigger className="hover:no-underline font-bold text-gray-700 py-3">
               <span className="flex items-center gap-3">
                 <TrendingUp className="w-5 h-5 text-csae-green-600" /> 5. Evolução (Ações Técnicas)
               </span>
             </AccordionTrigger>
             <AccordionContent className="text-sm p-4 bg-muted/20 rounded-lg mb-4">
                <p className="text-xs text-muted-foreground mb-3">Intervenções marcadas como executadas diretamente pelo enfermeiro nesta consulta.</p>
                {Object.keys(processo.evolucao?.intervencoesExecutadas || {}).length > 0 ? (
                  Object.entries(processo.evolucao?.intervencoesExecutadas || {}).map(([titulo, lista]: any, i) => (
                    lista.length > 0 && (
                      <div key={i} className="mb-2">
                         <h4 className="font-bold text-xs">{titulo}:</h4>
                         <ul className="list-disc ml-4 text-gray-600 italic">
                            {lista.map((acao: string, j: number) => {
                              // Buscar verbo no presente se disponível
                              const diagnosticoOriginal = processo.planejamento?.diagnosticosPlanejados?.find(
                                (d: any) => d.tituloDiagnostico === titulo
                              );
                              const intervencaoOriginal = diagnosticoOriginal?.intervencoesSelecionadas?.find(
                                (inv: any) => inv.acaoPrescrita === acao
                              );
                              return (
                                <li key={j}>{intervencaoOriginal?.acaoEnfermeiro || acao}</li>
                              )
                            })}
                         </ul>
                      </div>
                    )
                  ))
                ) : (
                  <p className="font-bold text-red-600">Não executei nenhuma intervenção nesta consulta</p>
                )}
             </AccordionContent>
           </AccordionItem>
        </Accordion>
      </section>

      {/* Gerador de Prontuário */}
      <Card className="border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="bg-csae-green-900 text-white min-h-[120px] flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black">Prontuário Final</CardTitle>
            <CardDescription className="text-csae-green-100 opacity-90">
              Revise o texto gerado e cole no prontuário eletrônico institucional.
            </CardDescription>
          </div>
          <Button onClick={handleCopiarTexto} variant="secondary" className="font-bold gap-2">
            <Copy className="w-5 h-5" />
            Gerar e Copiar Texto
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Textarea
            value={textoEvolucao}
            placeholder="Clique em 'Gerar e Copiar' para estruturar o relato técnico..."
            readOnly
            className="min-h-[500px] border-none font-mono text-xs leading-relaxed p-8 focus-visible:ring-0 bg-gray-50/30"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapaResumo;
