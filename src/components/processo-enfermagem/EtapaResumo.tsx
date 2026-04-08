import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Copy, Search, FileText, Target, Play, TrendingUp, BadgeCheck,
  Stethoscope, Heart, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { ProcessoEnfermagem, EvolucaoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { useToast } from '@/hooks/use-toast';
import { getSinaisVitais } from '@/services/bancodados/sinaisVitaisDB';
import { getExames } from '@/services/bancodados/examesDB';
import { getSistemas } from '@/services/bancodados/revisaoSistemasDB';
import { getDiagnosticos, Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import { useAuth } from '@/contexts/AuthContext';

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
  const [diagnosticosRol, setDiagnosticosRol] = useState<Diagnostico[]>([]);

  const { sessionData } = useAuth();
  const nomeEnfermeiro = sessionData?.nomeCompleto || 'Nome não identificado';
  const numeroCoren = sessionData?.numeroCoren || 'Número não informado';
  const ufCoren = sessionData?.ufCoren || 'UF';

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [sv, ex, sist] = await Promise.all([
          new Promise<any[]>((resolve) => {
            const unsubscribe = getSinaisVitais((data) => { resolve(data); unsubscribe(); });
          }),
          new Promise<any[]>((resolve) => {
            const unsubscribe = getExames((data) => { resolve(data); unsubscribe(); });
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

    // Carregar o Rol de enfermagem para cruzamento de dados
    const unsubDiag = getDiagnosticos((data) => setDiagnosticosRol(data));
    return () => unsubDiag();
  }, []);

  const gerarTextoEvolucao = () => {
    const linhas: string[] = [];

    linhas.push('EVOLUÇÃO DE ENFERMAGEM');
    linhas.push(`Paciente: ${paciente.nomeCompleto}`);
    linhas.push('Unidade: Unidade de Saúde Floripa');
    linhas.push(`Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
    linhas.push('-'.repeat(50));
    linhas.push('');

    if (processo.avaliacao?.coletaDeDadosSubjetivos) {
      linhas.push('AVALIAÇÃO / COLETA DE DADOS:');
      linhas.push(processo.avaliacao.coletaDeDadosSubjetivos);
      linhas.push('');
    }

    const exameFisico = processo.avaliacao?.exameFisico || {};
    if (Object.keys(exameFisico).length > 0) {
      linhas.push('EXAME FÍSICO:');
      const svAtivos = sinaisVitais.filter(s => exameFisico[s.sinalVitalNome]);
      if (svAtivos.length > 0) {
        linhas.push('  [SINAIS VITAIS]');
        svAtivos.forEach(s => linhas.push(`  • ${s.sinalVitalNome}: ${exameFisico[s.sinalVitalNome]}`));
      }
      const exMap = new Map<string, string[]>();
      exames.forEach(ex => {
        ex.componentes.forEach((c: any) => {
          if (exameFisico[c.componenteAnalisado]) {
            const grp = `${ex.tipoExame} - ${ex.tituloExame}`;
            if (!exMap.has(grp)) exMap.set(grp, []);
            exMap.get(grp)!.push(`${c.componenteAnalisado}: ${exameFisico[c.componenteAnalisado]}`);
          }
        });
      });
      if (exMap.size > 0) {
        linhas.push('  [EXAMES DIAGNÓSTICOS]');
        exMap.forEach((vals, titulo) => linhas.push(`  • ${titulo}: ${vals.join(', ')}`));
      }
      const rsEncontrados: string[] = [];
      sistemas.forEach(s => {
        s.exames.forEach((e: any) => {
          if (exameFisico[e.nomeExame]) rsEncontrados.push(`${e.nomeExame}: ${exameFisico[e.nomeExame]}`);
        });
      });
      if (rsEncontrados.length > 0) {
        linhas.push('  [REVISÃO DE SISTEMAS]');
        rsEncontrados.forEach(item => linhas.push(`  • ${item}`));
      }
      linhas.push('');
    }

    if (processo.diagnostico?.diagnosticosSelecionados?.length > 0) {
      linhas.push('DIAGNÓSTICOS DE ENFERMAGEM:');
      processo.diagnostico.diagnosticosSelecionados.forEach((diag: any) => {
        linhas.push(`• ${diag.tituloDiagnostico}`);
      });
      linhas.push('');
    }

    const implementacao = processo.implementacao || {};
    const possuiImplementacao = Object.values(implementacao).some((d: any) => d.intervencoes?.some((i: any) => i.implementadoNestaConsulta));
    if (possuiImplementacao) {
      linhas.push('IMPLEMENTAÇÃO DE ENFERMAGEM (Prescrições da Consulta):');
      Object.entries(implementacao).forEach(([tituloDiag, dados]: any) => {
        const planejadoDiag = processo.planejamento?.diagnosticosPlanejados?.find((p: any) => p.tituloDiagnostico === tituloDiag);
        const implementadas = dados.intervencoes.filter((i: any) => i.implementadoNestaConsulta);
        if (implementadas.length > 0) {
          linhas.push(`  [${tituloDiag}]`);
          if (planejadoDiag?.resultadoEsperadoSelecionado) {
            linhas.push(`  Resultado Esperado: ${planejadoDiag.resultadoEsperadoSelecionado}`);
          }
          implementadas.forEach((int: any) => {
            linhas.push(`  • ${int.acaoPrescrita}. (Executor: ${int.quemExecuta || '?'})`);
          });
        }
      });
      linhas.push('');
    }

    const intervencoesExecutadas = processo.evolucao?.intervencoesExecutadas || {};
    const temExecutada = Object.values(intervencoesExecutadas).some((lista: any) => lista.length > 0);
    if (temExecutada) {
      linhas.push('EVOLUÇÃO DE ENFERMAGEM (Ações Técnicas Realizadas pelo Enfermeiro):');
      Object.entries(intervencoesExecutadas).forEach(([tituloDiag, acoesMarcadas]: any) => {
        if (acoesMarcadas.length === 0) return;
        linhas.push(`  [${tituloDiag}]`);
        acoesMarcadas.forEach((acaoPresc: string) => {
          const dxImpl = processo.implementacao?.[tituloDiag];
          const intv = dxImpl?.intervencoes.find((i: any) => i.acaoPrescrita === acaoPresc);
          linhas.push(`  • ${intv?.acaoEnfermeiro || acaoPresc}`);
        });
      });
      linhas.push('');
    }

    linhas.push('-'.repeat(50));
    linhas.push(`Enfermeiro Responsável: ${nomeEnfermeiro}`);
    linhas.push(`COREN: ${numeroCoren} / ${ufCoren}`);
    return linhas.join('\n');
  };

  const handleCopiarTexto = async () => {
    const texto = gerarTextoEvolucao();
    setTextoEvolucao(texto);
    try {
      await navigator.clipboard.writeText(texto);
      onUpdateEvolucao({ ...processo.evolucao, resumoGerado: texto });
      toast({ title: 'Sucesso', description: 'Prontuário copiado para a área de transferência!' });
    } catch {
      toast({ title: 'Erro', description: 'Falha ao copiar texto.', variant: 'destructive' });
    }
  };

  // ─── Helpers visuais ─────────────────────────────────────────────────────────

  /** Header interno de seção dentro de um AccordionContent */
  const SectionHeader = ({ label }: { label: string }) => (
    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
  );

  /** Card estilizado reutilizável */
  const InfoCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-lg border bg-slate-50 p-3 ${className}`}>{children}</div>
  );

  /** Diagnóstico → Resultado → Intervenções */
  const DiagnosticoBlock = ({ titulo, resultado, intervencoes, renderIntervencao }: {
    titulo: string;
    resultado?: string;
    intervencoes: any[];
    renderIntervencao: (int: any, idx: number) => React.ReactNode;
  }) => (
    <InfoCard>
      <p className="font-bold text-sm text-gray-900 mb-1">{titulo}</p>
      {resultado && (
        <p className="text-xs text-emerald-700 border-l-2 border-emerald-400 pl-2 mb-2 italic">
          Resultado Esperado: {resultado}
        </p>
      )}
      <ul className="space-y-1.5">
        {intervencoes.map((int, idx) => renderIntervencao(int, idx))}
      </ul>
    </InfoCard>
  );

  // ─── Dados derivados ──────────────────────────────────────────────────────────
  const exameFisico = processo.avaliacao?.exameFisico || {};
  // nhbsAfetadas pode ter objetos { parametro, nhb } ou strings legadas
  const nhbsAfetadas: any[] = Array.isArray(processo.avaliacao?.nhbsAfetadas)
    ? processo.avaliacao.nhbsAfetadas
    : [];

  // Diagnósticos agrupados por subconjunto via cruzamento com o Rol de Enfermagem
  const diagnosticosPorSubconjunto: Record<string, string[]> = {};
  (processo.diagnostico?.diagnosticosSelecionados || []).forEach((d: any) => {
    // Busca o documento completo no Rol para extrair os subconjuntos reais
    const docRol = diagnosticosRol.find((r) => r.id === d.id || r.tituloDiagnostico === d.tituloDiagnostico);
    const subconjuntos = docRol?.subconjuntos;
    const nomeGrupo =
      subconjuntos && subconjuntos.length > 0
        ? subconjuntos[0].tituloSubconjunto || subconjuntos[0].tipoSubconjunto || 'Outros'
        : 'Outros';

    if (!diagnosticosPorSubconjunto[nomeGrupo]) diagnosticosPorSubconjunto[nomeGrupo] = [];
    diagnosticosPorSubconjunto[nomeGrupo].push(d.tituloDiagnostico);
  });

  const intervencoesExecutadas = processo.evolucao?.intervencoesExecutadas || {};
  const temExecutada = Object.values(intervencoesExecutadas).some((l: any) => l.length > 0);

  return (
    <div className="space-y-8">
      {/* ─── Caminho Trilhado ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <BadgeCheck className="w-4 h-4" /> Resumo do Caminho Trilhado
        </h3>

        <Accordion type="single" collapsible className="space-y-2">

          {/* ── Etapa 1: Avaliação ──────────────────────────────────────── */}
          <AccordionItem value="etapa1" className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <AccordionTrigger className="hover:no-underline font-bold text-gray-700 py-3 px-4">
              <span className="flex items-center gap-3">
                <Search className="w-5 h-5 text-csae-green-600" /> 1. Avaliação de Enfermagem
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              {/* Coleta Subjetiva */}
              <InfoCard>
                <SectionHeader label="Coleta Subjetiva" />
                <p className="text-sm text-gray-700 leading-relaxed">
                  {processo.avaliacao?.coletaDeDadosSubjetivos || 'Não informado'}
                </p>
              </InfoCard>

              {/* Exame Físico */}
              {Object.keys(exameFisico).length > 0 && (
                <InfoCard>
                  <SectionHeader label="Exame Físico / Parâmetros Registrados" />
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4">
                    {Object.entries(exameFisico).map(([chave, valor]: any) => (
                      <li key={chave} className="flex items-baseline gap-1 text-sm">
                        <span className="font-semibold text-gray-700">{chave}:</span>
                        <span className="text-gray-600">{valor}</span>
                      </li>
                    ))}
                  </ul>
                </InfoCard>
              )}

              {/* NHBs */}
              {nhbsAfetadas.length > 0 && (
                <InfoCard>
                  <SectionHeader label="Necessidades Humanas Básicas Afetadas" />
                  <ul className="space-y-1">
                    {nhbsAfetadas.map((item: any, i: number) => {
                      // Suporta objetos { parametro, nhb } e strings legadas
                      if (item && typeof item === 'object') {
                        return (
                          <li key={i} className="flex items-baseline gap-1 text-sm">
                            <Heart className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />
                            {item.parametro && (
                              <span className="font-semibold text-gray-700">{item.parametro}:</span>
                            )}
                            <span className="text-gray-600">{item.nhb ?? String(item)}</span>
                          </li>
                        );
                      }
                      // Fallback para string
                      return (
                        <li key={i} className="flex items-center gap-1.5 text-sm">
                          <Heart className="w-3 h-3 text-rose-400 flex-shrink-0" />
                          <span className="text-gray-700">{String(item)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </InfoCard>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* ── Etapa 2: Diagnósticos ───────────────────────────────────── */}
          <AccordionItem value="etapa2" className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <AccordionTrigger className="hover:no-underline font-bold text-gray-700 py-3 px-4">
              <span className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-csae-green-600" /> 2. Diagnósticos de Enfermagem
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              {Object.entries(diagnosticosPorSubconjunto).map(([grupo, titulos]) => (
                <InfoCard key={grupo}>
                  <SectionHeader label={grupo} />
                  <div className="space-y-2">
                    {titulos.map((titulo: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <Stethoscope className="w-4 h-4 text-csae-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-gray-800">{titulo}</p>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* ── Etapa 3: Planejamento ───────────────────────────────────── */}
          <AccordionItem value="etapa3" className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <AccordionTrigger className="hover:no-underline font-bold text-gray-700 py-3 px-4">
              <span className="flex items-center gap-3">
                <Target className="w-5 h-5 text-csae-green-600" /> 3. Planejamento de Enfermagem
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              {(processo.planejamento?.diagnosticosPlanejados || []).map((diag: any, index: number) => (
                <DiagnosticoBlock
                  key={index}
                  titulo={diag.tituloDiagnostico}
                  resultado={diag.resultadoEsperadoSelecionado}
                  intervencoes={diag.intervencoesSelecionadas || []}
                  renderIntervencao={(int, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-csae-green-500 font-bold mt-0.5">•</span>
                      {int.acaoPrescrita}
                    </li>
                  )}
                />
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* ── Etapa 4: Implementação ──────────────────────────────────── */}
          <AccordionItem value="etapa4" className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <AccordionTrigger className="hover:no-underline font-bold text-gray-700 py-3 px-4">
              <span className="flex items-center gap-3">
                <Play className="w-5 h-5 text-csae-green-600" /> 4. Implementação de Enfermagem
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              {Object.entries(processo.implementacao || {}).map(([titulo, dados]: any, i: number) => {
                const planejadoDiag = processo.planejamento?.diagnosticosPlanejados?.find(
                  (p: any) => p.tituloDiagnostico === titulo
                );
                const implementadas = dados.intervencoes.filter((iv: any) => iv.implementadoNestaConsulta);
                if (implementadas.length === 0) return null;
                return (
                  <DiagnosticoBlock
                    key={i}
                    titulo={titulo}
                    resultado={planejadoDiag?.resultadoEsperadoSelecionado}
                    intervencoes={implementadas}
                    renderIntervencao={(iv, idx) => (
                      <li key={idx} className="flex items-start justify-between gap-2">
                        <span className="text-sm text-gray-700 flex-1 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {iv.acaoPrescrita}
                        </span>
                        {iv.quemExecuta && (
                          <Badge variant="outline" className="text-[10px] whitespace-nowrap flex-shrink-0">
                            Executor: {iv.quemExecuta}
                          </Badge>
                        )}
                      </li>
                    )}
                  />
                );
              })}
            </AccordionContent>
          </AccordionItem>

          {/* ── Etapa 5: Evolução ───────────────────────────────────────── */}
          <AccordionItem value="etapa5" className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <AccordionTrigger className="hover:no-underline font-bold text-gray-700 py-3 px-4">
              <span className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-csae-green-600" /> 5. Evolução de Enfermagem
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              {!temExecutada ? (
                <Alert className="border-orange-300 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <AlertDescription className="font-bold text-orange-700">
                    Não executei nenhuma intervenção nesta consulta
                  </AlertDescription>
                </Alert>
              ) : (
                Object.entries(intervencoesExecutadas).map(([titulo, lista]: any, i) => {
                  if (lista.length === 0) return null;
                  const planejadoDiag = processo.planejamento?.diagnosticosPlanejados?.find(
                    (d: any) => d.tituloDiagnostico === titulo
                  );
                  const resultadoExp = planejadoDiag?.resultadoEsperadoSelecionado;
                  return (
                    <DiagnosticoBlock
                      key={i}
                      titulo={titulo}
                      resultado={resultadoExp}
                      intervencoes={lista}
                      renderIntervencao={(acaoPresc: string, idx: number) => {
                        const dxImpl = processo.implementacao?.[titulo];
                        const intv = dxImpl?.intervencoes.find((inv: any) => inv.acaoPrescrita === acaoPresc);
                        const textoPresente = intv?.acaoEnfermeiro || acaoPresc;
                        return (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle2 className="w-4 h-4 text-csae-green-500 mt-0.5 flex-shrink-0" />
                            <span className="italic">{textoPresente}</span>
                          </li>
                        );
                      }}
                    />
                  );
                })
              )}
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </section>

      {/* ─── Gerador de Prontuário ─────────────────────────────────────────── */}
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
