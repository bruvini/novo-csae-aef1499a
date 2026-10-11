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
import {
  DiagnosticoPlanejado,
  IntervencaoImplementada,
  IntervencaoSelecionada,
  ProcessoEnfermagem,
  EvolucaoEnfermagem,
} from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { useToast } from '@/hooks/use-toast';
import { getSinaisVitais, SinalVital } from '@/services/bancodados/sinaisVitaisDB';
import { getExames, Exame, type ComponenteExame } from '@/services/bancodados/examesDB';
import { getSistemas, SistemaCorporal } from '@/services/bancodados/revisaoSistemasDB';
import { getDiagnosticos, Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import { formatarLinhaResultadoExame, obterRegistrosAvaliacaoClinica } from '@/utils/resultadoExameUtils';

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
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [sistemas, setSistemas] = useState<SistemaCorporal[]>([]);
  const [diagnosticosRol, setDiagnosticosRol] = useState<Diagnostico[]>([]);


  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [sv, ex, sist] = await Promise.all([
          new Promise<SinalVital[]>((resolve) => {
            const unsubscribe = getSinaisVitais((data) => { resolve(data); unsubscribe(); });
          }),
          new Promise<Exame[]>((resolve) => {
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

  // ─── Mapa de conjugações de verbos (infinitivo → 1ª pessoa do presente) ─────
  const conjugacoes: Record<string, string> = {
    'Estabelecer': 'Estabeleço',
    'Orientar': 'Oriento',
    'Aconselhar': 'Aconselho',
    'Realizar': 'Realizo',
    'Monitorar': 'Monitoro',
    'Avaliar': 'Avalio',
    'Verificar': 'Verifico',
    'Administrar': 'Administro',
    'Encaminhar': 'Encaminho',
    'Registrar': 'Registro',
    'Aplicar': 'Aplico',
    'Educar': 'Educo',
    'Identificar': 'Identifico',
    'Promover': 'Promovo',
    'Prevenir': 'Previno',
    'Incentivar': 'Incentivo',
    'Comunicar': 'Comunico',
    'Executar': 'Executo',
    'Observar': 'Observo',
    'Controlar': 'Controlo',
    'Aferir': 'Afiro',
    'Mensurar': 'Mensuro',
    'Coletar': 'Coleto',
    'Garantir': 'Garanto',
    'Assegurar': 'Asseguro',
    'Solicitar': 'Solicito',
    'Prescrever': 'Prescrevo',
    'Puncionar': 'Punciono',
    'Instalar': 'Instalo',
    'Retirar': 'Retiro',
    'Trocar': 'Troco',
    'Manter': 'Mantenho',
    'Oferecer': 'Ofereço',
    'Estimular': 'Estimulo',
    'Posicionar': 'Posiciono',
    'Mobilizar': 'Mobilizo',
    'Hidratar': 'Hidrato',
    'Mediar': 'Medeio',
    'Auxiliar': 'Auxilio',
    'Apoiar': 'Apoio',
  };

  const conjugarVerbo = (texto: string): string => {
    // Extrai o primeiro token (verbo no infinitivo) e tenta conjugar
    const primeiraLetraMaiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    for (const [infinitivo, conjugado] of Object.entries(conjugacoes)) {
      const regex = new RegExp(`^${infinitivo}\\b`, 'i');
      if (regex.test(texto)) {
        return primeiraLetraMaiuscula(texto.replace(regex, conjugado));
      }
    }
    return texto;
  };

  const gerarTextoEvolucao = () => {
    const linhas: string[] = [];
    const sep = '-'.repeat(50);

    // ── Cabeçalho ───────────────────────────────────────────────────────────────
    linhas.push('EVOLUÇÃO DE ENFERMAGEM - PORTAL CSAE FLORIPA');
    linhas.push(
      `Data: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    );
    linhas.push(sep);
    linhas.push('');

    // ── Avaliação / Coleta de Dados ──────────────────────────────────────────
    if (processo.avaliacao?.coletaDeDadosSubjetivos) {
      linhas.push('AVALIAÇÃO / COLETA DE DADOS:');
      linhas.push(processo.avaliacao.coletaDeDadosSubjetivos);
      linhas.push('');
    }

    // ── Exame Físico ──────────────────────────────────────────────────────────
    const exameFisicoData = processo.avaliacao?.exameFisico || {};
    if (Object.keys(exameFisicoData).length > 0) {
      linhas.push('EXAME FÍSICO:');

      const svAtivos = sinaisVitais.filter(s => exameFisicoData[s.sinalVitalNome] !== undefined
        && exameFisicoData[s.sinalVitalNome] !== null && exameFisicoData[s.sinalVitalNome] !== '');
      const parametrosJaExibidos = new Set<string>();
      if (svAtivos.length > 0) {
        linhas.push('  [SINAIS VITAIS]');
        svAtivos.forEach(s => {
          parametrosJaExibidos.add(s.sinalVitalNome);
          linhas.push(`  • ${s.sinalVitalNome}: ${exameFisicoData[s.sinalVitalNome]}`);
        });
      }

      const resultadosExame: string[] = [];
      const componentesSalvos = new Set<string>();
      exames.forEach(ex => {
        ex.componentes.forEach((c: ComponenteExame) => {
          const valorSalvo = exameFisicoData[c.componenteAnalisado];
          if (valorSalvo !== undefined && valorSalvo !== null && valorSalvo !== '') {
            const complemento = processo.avaliacao?.examesValoresTexto?.[c.componenteAnalisado];
            resultadosExame.push(formatarLinhaResultadoExame({
              tipoExame: ex.tipoExame,
              nomeExame: ex.nomeExame,
              componente: c.componenteAnalisado,
              valor: valorSalvo,
              resultadosConfigurados: c.resultados,
              valorTexto: complemento,
            }));
            componentesSalvos.add(c.componenteAnalisado);
            parametrosJaExibidos.add(c.componenteAnalisado);
          }
        });
      });
      const camposIMCAux = ['Peso (kg)', 'Altura (cm)'];
      Object.entries(exameFisicoData).forEach(([parametro, valor]) => {
        if (valor === undefined || valor === null || valor === '' || componentesSalvos.has(parametro)
          || parametrosJaExibidos.has(parametro) || camposIMCAux.includes(parametro)) return;
        const complemento = processo.avaliacao?.examesValoresTexto?.[parametro];
        const cadastro = exames.flatMap((exame) => exame.componentes
          .filter((componente) => componente.componenteAnalisado === parametro)
          .map((componente) => ({ exame, componente })))[0];
        resultadosExame.push(formatarLinhaResultadoExame({
          tipoExame: cadastro?.exame.tipoExame,
          nomeExame: cadastro?.exame.nomeExame,
          componente: parametro,
          valor,
          resultadosConfigurados: cadastro?.componente.resultados,
          valorTexto: complemento,
        }));
      });
      if (resultadosExame.length > 0) {
        linhas.push('  [EXAMES DIAGNÓSTICOS]');
        resultadosExame.forEach((resultado) => linhas.push(`  • ${resultado}`));
      }

      // Peso e Altura (campos auxiliares do cálculo de IMC)
      const temIMCAux = camposIMCAux.some(k => exameFisicoData[k] !== undefined && exameFisicoData[k] !== null && exameFisicoData[k] !== '');
      if (temIMCAux) {
        if (svAtivos.length === 0) linhas.push('  [SINAIS VITAIS]'); // garante cabeçalho
        camposIMCAux.forEach((chave) => {
          const val = exameFisicoData[chave];
          if (val !== undefined && val !== null && val !== '') {
            parametrosJaExibidos.add(chave);
            linhas.push(`  • ${chave}: ${val}`);
          }
        });
      }

      const rsEncontrados: string[] = [];
      const exameFisicoMultiData = processo.avaliacao?.exameFisicoMulti || {};
      const exameFisicoDescricoesData = processo.avaliacao?.exameFisicoDescricoes || {};
      sistemas.forEach(s => {
        s.exames.forEach((e) => {
          const multiVals: string[] = exameFisicoMultiData[e.nomeExame] || [];
          const legacyVal = exameFisicoData[e.nomeExame];
          const values = multiVals.length > 0 ? multiVals : (legacyVal ? [String(legacyVal)] : []);
          if (values.length > 0) {
            const withDesc = values.map((v) => {
              const desc = exameFisicoDescricoesData[`${e.nomeExame}|||${v}`];
              return desc ? `${v}: ${desc}` : v;
            });
            rsEncontrados.push(`${e.nomeExame}: ${withDesc.join(', ')}`);
          }
        });
      });
      if (rsEncontrados.length > 0) {
        linhas.push('  [REVISÃO DE SISTEMAS]');
        rsEncontrados.forEach(item => linhas.push(`  • ${item}`));
      }

      linhas.push('');
    }

    // ── Planejamento ─────────────────────────────────────────────────────────
    // Lista TODAS as intervenções planejadas (não apenas implementadas) por diagnóstico.
    // Não exibe executor — é uma prescrição, não uma execução.
    const diagnosticosPlanejados = processo.planejamento?.diagnosticosPlanejados || [];
    if (diagnosticosPlanejados.length > 0) {
      linhas.push('PLANEJAMENTO DE ENFERMAGEM (Prescrições da Consulta):');
      linhas.push('');
      diagnosticosPlanejados.forEach((diag: DiagnosticoPlanejado) => {
        linhas.push(`[${diag.tituloDiagnostico}]`);
        if (diag.resultadoEsperadoSelecionado) {
          linhas.push(`Resultado Esperado: ${diag.resultadoEsperadoSelecionado}`);
        }
        linhas.push('');
        if (diag.intervencoesSelecionadas && diag.intervencoesSelecionadas.length > 0) {
          diag.intervencoesSelecionadas.forEach((int) => {
            linhas.push(`• ${int.acaoPrescrita};`);
          });
        }
        linhas.push('');
      });
    }

    // ── Implementação ────────────────────────────────────────────────────────
    // Lista apenas intervenções marcadas como implementadas, com executor.
    // Sem agrupamento por diagnóstico.
    const implementacao = processo.implementacao || {};
    const implementadas: IntervencaoImplementada[] = [];
    Object.values(implementacao).forEach((dados) => {
      if (dados.intervencoes) {
        dados.intervencoes.forEach((i) => {
          if (i.implementadoNestaConsulta) implementadas.push(i);
        });
      }
    });

    if (implementadas.length > 0) {
      linhas.push('IMPLEMENTAÇÃO DE ENFERMAGEM (Prescrições da Consulta):');
      linhas.push('');
      implementadas.forEach((int) => {
        const executor = int.quemExecuta ? ` (Executor: ${int.quemExecuta})` : '';
        linhas.push(`• ${int.acaoPrescrita}${executor}`);
      });
      linhas.push('');
    }

    // ── Evolução ─────────────────────────────────────────────────────────────
    // Lista ações efetivamente realizadas pelo enfermeiro, com verbos conjugados
    // na 1ª pessoa do presente do indicativo. Sem agrupamento por diagnóstico.
    const intervencoesExecutadas = processo.evolucao?.intervencoesExecutadas || {};
    const acoesEnfermeiro: string[] = [];

    Object.entries(intervencoesExecutadas).forEach(([tituloDiag, acoesMarcadas]) => {
      if (!acoesMarcadas || acoesMarcadas.length === 0) return;
      acoesMarcadas.forEach((acaoPresc: string) => {
        const dxImpl = processo.implementacao?.[tituloDiag];
        const intv = dxImpl?.intervencoes.find((i) => i.acaoPrescrita === acaoPresc);
        const textoBase = intv?.acaoEnfermeiro || acaoPresc;
        acoesEnfermeiro.push(conjugarVerbo(textoBase));
      });
    });

    if (acoesEnfermeiro.length > 0) {
      linhas.push('EVOLUÇÃO DE ENFERMAGEM (Ações Técnicas Realizadas pelo Enfermeiro):');
      linhas.push('');
      acoesEnfermeiro.forEach(acao => linhas.push(`• ${acao}`));
      linhas.push('');
    }

    linhas.push(sep);
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
    intervencoes: Array<IntervencaoSelecionada | IntervencaoImplementada | string>;
    renderIntervencao: (int: IntervencaoSelecionada | IntervencaoImplementada | string, idx: number) => React.ReactNode;
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
  const nhbsAfetadas: unknown[] = Array.isArray(processo.avaliacao?.nhbsAfetadas)
    ? processo.avaliacao.nhbsAfetadas
    : [];

  // Diagnósticos agrupados por subconjunto via cruzamento com o Rol de Enfermagem
  const diagnosticosPorSubconjunto: Record<string, string[]> = {};
  (processo.diagnostico?.diagnosticosSelecionados || []).forEach((d) => {
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
  const temExecutada = Object.values(intervencoesExecutadas).some((lista) => lista.length > 0);

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
                    {Object.entries(exameFisico).map(([chave, valor]) => (
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
                    {nhbsAfetadas.map((item, i) => {
                      // Suporta objetos { parametro, nhb } e strings legadas
                      if (item && typeof item === 'object') {
                        const nhbItem = item as Record<string, unknown>;
                        return (
                          <li key={i} className="flex items-baseline gap-1 text-sm">
                            <Heart className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />
                            {nhbItem.parametro && (
                              <span className="font-semibold text-gray-700">{String(nhbItem.parametro)}:</span>
                            )}
                            <span className="text-gray-600">{String(nhbItem.nhb ?? item)}</span>
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
              {(processo.planejamento?.diagnosticosPlanejados || []).map((diag, index: number) => (
                <DiagnosticoBlock
                  key={index}
                  titulo={diag.tituloDiagnostico}
                  resultado={diag.resultadoEsperadoSelecionado}
                  intervencoes={diag.intervencoesSelecionadas || []}
                  renderIntervencao={(int, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-csae-green-500 font-bold mt-0.5">•</span>
                      {typeof int === 'string' ? int : int.acaoPrescrita}
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
              {Object.entries(processo.implementacao || {}).map(([titulo, dados], i: number) => {
                const planejadoDiag = processo.planejamento?.diagnosticosPlanejados?.find(
                  (p) => p.tituloDiagnostico === titulo
                );
                const implementadas = dados.intervencoes.filter((iv) => iv.implementadoNestaConsulta);
                if (implementadas.length === 0) return null;
                return (
                  <DiagnosticoBlock
                    key={i}
                    titulo={titulo}
                    resultado={planejadoDiag?.resultadoEsperadoSelecionado}
                    intervencoes={implementadas}
                    renderIntervencao={(iv, idx) => (
                      (() => {
                        const acao = typeof iv === 'string' ? iv : iv.acaoPrescrita;
                        const executor = typeof iv !== 'string' && 'quemExecuta' in iv ? iv.quemExecuta : undefined;
                        return (
                      <li key={idx} className="flex items-start justify-between gap-2">
                        <span className="text-sm text-gray-700 flex-1 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {acao}
                        </span>
                        {executor && (
                          <Badge variant="outline" className="text-[10px] whitespace-nowrap flex-shrink-0">
                            Executor: {executor}
                          </Badge>
                        )}
                      </li>
                        );
                      })()
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
                Object.entries(intervencoesExecutadas).map(([titulo, lista], i) => {
                  if (lista.length === 0) return null;
                  const planejadoDiag = processo.planejamento?.diagnosticosPlanejados?.find(
                    (d) => d.tituloDiagnostico === titulo
                  );
                  const resultadoExp = planejadoDiag?.resultadoEsperadoSelecionado;
                  return (
                    <DiagnosticoBlock
                      key={i}
                      titulo={titulo}
                      resultado={resultadoExp}
                      intervencoes={lista}
                      renderIntervencao={(acaoPresc, idx: number) => {
                        const textoAcaoPrescrita = typeof acaoPresc === 'string' ? acaoPresc : acaoPresc.acaoPrescrita;
                        const dxImpl = processo.implementacao?.[titulo];
                        const intv = dxImpl?.intervencoes.find((inv) => inv.acaoPrescrita === textoAcaoPrescrita);
                        const textoPresente = intv?.acaoEnfermeiro || textoAcaoPrescrita;
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
