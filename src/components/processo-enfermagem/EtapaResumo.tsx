import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Copy, Search, FileText, Target, Play, TrendingUp, BadgeCheck,
  Stethoscope, Heart, CheckCircle2
} from 'lucide-react';
import {
  IntervencaoImplementada,
  IntervencaoSelecionada,
  ProcessoEnfermagem,
  EvolucaoEnfermagem,
} from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { formatarDataConsulta } from '@/utils/continuidadeCuidado';
import { useToast } from '@/hooks/use-toast';
import { getSinaisVitais, SinalVital } from '@/services/bancodados/sinaisVitaisDB';
import { getExames, Exame } from '@/services/bancodados/examesDB';
import { getDiagnosticos, Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import { isValorAvaliacaoValido, obterRegistrosExameFisico } from '@/utils/processoUtils';
import { formatarLinhaResultadoExame } from '@/utils/resultadoExameUtils';
import { contextoRegistradoParaTexto } from '@/utils/referenciasClinicas';
import { formatarSinaisVitais } from '@/utils/formatarSinaisVitais';
import { linhasMateriaisEntregues, materiaisAgrupados } from '@/utils/materiaisApoioProcesso';
import MateriaisApoioLeitura from './MateriaisApoioLeitura';
import { obterIntervencoesDaConsulta, referenciaResultado } from '@/utils/evolucaoProcesso';

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
  useEffect(() => { setTextoEvolucao(processo.evolucao?.resumoGerado || ''); }, [processo.evolucao?.resumoGerado]);
  const { toast } = useToast();
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [diagnosticosRol, setDiagnosticosRol] = useState<Diagnostico[]>([]);


  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [sv, ex] = await Promise.all([
          new Promise<SinalVital[]>((resolve) => {
            const unsubscribe = getSinaisVitais((data) => { resolve(data); unsubscribe(); });
          }),
          new Promise<Exame[]>((resolve) => {
            const unsubscribe = getExames((data) => { resolve(data); unsubscribe(); });
          })
        ]);
        setSinaisVitais(sv);
        setExames(ex);
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
    const registrosExameFisico = obterRegistrosExameFisico(processo.avaliacao);
    if (registrosExameFisico.length > 0) {
      linhas.push('EXAME FÍSICO:');
      const svAtivos = formatarSinaisVitais(exameFisicoData, sinaisVitais, processo.avaliacao?.contextosParametros);
      const parametrosRenderizados = new Set<string>();
      if (svAtivos.length > 0) {
        linhas.push('  [SINAIS VITAIS]');
        svAtivos.forEach(s => {
          s.origens.forEach(origem => parametrosRenderizados.add(origem));
          linhas.push(`  • ${s.nome}: ${s.valor}${s.contexto ?? ''}`);
        });
      }

      const resultadosExame: string[] = [];
      const camposIMCAux = ['Peso (kg)', 'Altura (cm)'];
      const parametrosVitais = new Set(sinaisVitais.map((sinal) => sinal.sinalVitalNome));
      const registrosParametro = registrosExameFisico.filter((registro) => registro.tipo === 'parametro');
      registrosParametro.forEach((registro) => {
        if (parametrosVitais.has(registro.exame) || camposIMCAux.includes(registro.exame)) return;
        const cadastro = exames.flatMap((exame) => exame.componentes
          .filter((componente) => componente.componenteAnalisado === registro.exame)
          .map((componente) => ({ exame, componente })))[0];
        resultadosExame.push(formatarLinhaResultadoExame({
          tipoExame: cadastro?.exame.tipoExame,
          nomeExame: cadastro?.exame.nomeExame,
          componente: registro.exame,
          valor: registro.valor,
          unidadeMedida: cadastro?.componente.unidadeMedida,
          resultadosConfigurados: cadastro?.componente.resultados,
          valorTexto: processo.avaliacao?.examesValoresTexto?.[registro.exame],
        }) + contextoRegistradoParaTexto(processo.avaliacao?.contextosParametros, registro.exame));
        parametrosRenderizados.add(registro.exame);
      });
      if (resultadosExame.length > 0) {
        linhas.push('  [EXAMES DIAGNÓSTICOS]');
        resultadosExame.forEach((resultado) => linhas.push(`  • ${resultado}`));
      }

      // Peso e Altura (campos auxiliares do cálculo de IMC)
      const temIMCAux = camposIMCAux.some(k => isValorAvaliacaoValido(exameFisicoData[k]));
      if (temIMCAux) {
        if (svAtivos.length === 0) linhas.push('  [SINAIS VITAIS]'); // garante cabeçalho
        camposIMCAux.forEach((chave) => {
          const val = exameFisicoData[chave];
          if (isValorAvaliacaoValido(val)) {
            parametrosRenderizados.add(chave);
            linhas.push(`  • ${chave}: ${val}`);
          }
        });
      }

      const parametrosNaoClassificados = registrosExameFisico.filter(
        (registro) => registro.tipo === 'parametro' && !parametrosRenderizados.has(registro.exame)
      );
      if (parametrosNaoClassificados.length > 0) {
        linhas.push('  [OUTROS PARÂMETROS REGISTRADOS]');
        parametrosNaoClassificados.forEach((registro) => {
          parametrosRenderizados.add(registro.exame);
          linhas.push(`  • ${registro.exame}: ${registro.valor}`);
        });
      }

      const achadosPorExame = new Map<string, string[]>();
      registrosExameFisico
        .filter((registro) => registro.tipo === 'achado')
        .forEach((registro) => {
          if (!achadosPorExame.has(registro.exame)) achadosPorExame.set(registro.exame, []);
          achadosPorExame.get(registro.exame)!.push(
            registro.descricao ? `${registro.valor}: ${registro.descricao}` : String(registro.valor)
          );
        });
      const rsEncontrados = [...achadosPorExame.entries()]
        .map(([exame, valores]) => `${exame}: ${valores.join(', ')}`);
      if (rsEncontrados.length > 0) {
        linhas.push('  [REVISÃO DE SISTEMAS]');
        rsEncontrados.forEach(item => linhas.push(`  • ${item}`));
      }

      linhas.push('');
    }

    const diagnosticosSelecionados = processo.diagnostico?.diagnosticosSelecionados || [];
    if (diagnosticosSelecionados.length > 0) {
      linhas.push('DIAGNÓSTICOS DE ENFERMAGEM SELECIONADOS:');
      diagnosticosSelecionados.forEach((diagnostico) => linhas.push(`• ${diagnostico.tituloDiagnostico}`));
      linhas.push('');
    }

    const cuidadosAbordados = processo.avaliacao?.cuidadosAnterioresAbordados || [];
    const reavaliacoes = (processo.diagnostico?.reavaliacoesAnteriores || []).filter(item => cuidadosAbordados.some(cuidado => cuidado.acompanhamentoId === item.acompanhamentoId));
    if (reavaliacoes.length > 0) {
      linhas.push('REAVALIAÇÃO DE DIAGNÓSTICOS ANTERIORES:');
      reavaliacoes.forEach(item => {
        const cuidado = cuidadosAbordados.find(registro => registro.acompanhamentoId === item.acompanhamentoId);
        const data = formatarDataConsulta(cuidado?.dataOrigem, false);
        const decisao = item.decisao === 'manter' ? 'mantido' : item.decisao === 'substituir' ? 'substituído' : 'encerrado';
        const atual = item.decisao === 'manter' ? cuidado?.tituloDiagnostico : item.decisao === 'substituir' ? item.novoTituloDiagnostico : undefined;
        linhas.push(`• ${data}: ${cuidado?.tituloDiagnostico || 'Diagnóstico anterior'} — ${decisao}${atual && atual !== cuidado?.tituloDiagnostico ? ` por ${atual}` : ''}.`);
      });
      linhas.push('');
    }

    // ── Planejamento ─────────────────────────────────────────────────────────
    // Lista TODAS as intervenções planejadas (não apenas implementadas) por diagnóstico.
    // Não exibe executor — é uma prescrição, não uma execução.
    const diagnosticosPlanejados = processo.planejamento?.diagnosticosPlanejados || [];
    if (diagnosticosPlanejados.length > 0) {
      linhas.push('PLANEJAMENTO DE ENFERMAGEM (Prescrições da Consulta):');
      linhas.push('');
      diagnosticosPlanejados.forEach((diag) => {
        linhas.push(`[${diag.tituloDiagnostico}]`);
        if (diag.resultadoEsperadoSelecionado) {
          linhas.push(`Resultado Esperado: ${diag.resultadoEsperadoSelecionado}`);
        }
        if (diag.intervencoesSelecionadas.length === 0 && diag.justificativaSemIntervencao?.trim()) {
          linhas.push(`Sem intervenção adicional nesta consulta: ${diag.justificativaSemIntervencao.trim()}`);
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
    const implementadas: IntervencaoImplementada[] = Object.values(implementacao)
      .flatMap((dados) => dados.intervencoes.filter((intervencao) => intervencao.implementadoNestaConsulta));

    if (implementadas.length > 0) {
      linhas.push('IMPLEMENTAÇÃO DE ENFERMAGEM (Prescrições da Consulta):');
      linhas.push('');
      implementadas.forEach((int) => {
        const executor = int.quemExecuta ? ` (Executor: ${int.quemExecuta})` : '';
        linhas.push(`• ${int.acaoPrescrita}${executor}`);
      });
      linhas.push('');
    }

    const materiaisEntregues = linhasMateriaisEntregues(processo);
    if (materiaisEntregues.length > 0) {
      linhas.push('MATERIAIS DE APOIO ENTREGUES:');
      materiaisEntregues.forEach(linha => linhas.push(`• ${linha}`));
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
        const intv = dxImpl?.intervencoes.find((i) => i.acaoPrescrita === acaoPresc && i.implementadoNestaConsulta && i.quemExecuta === 'Enfermeiro');
        if (!intv) return;
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

    if (processo.evolucao?.julgamentoClinico?.trim()) {
      linhas.push('JULGAMENTO CLÍNICO E AVALIAÇÃO DOS RESULTADOS:');
      linhas.push(processo.evolucao.julgamentoClinico.trim());
      linhas.push('');
    }

    const rotulosRespostas: Record<string, string> = { favoravel: 'Resposta favorável observada', parcial: 'Resposta parcial', desfavoravel: 'Resposta desfavorável', sem_resposta: 'Sem resposta avaliável nesta consulta', acompanhamento: 'Requer acompanhamento posterior' };
    const rotulosResultados: Record<string, string> = { alcancado: 'Alcançado', parcial: 'Parcialmente alcançado', nao_alcancado: 'Não alcançado', nao_avaliavel: 'Ainda não avaliável' };
    const respostas = processo.evolucao?.respostasIntervencoes || {};
    const avaliacoes = processo.evolucao?.avaliacoesResultados || {};
    if (Object.keys(respostas).length || Object.keys(avaliacoes).length || processo.evolucao?.observacoesCompartilhadas?.length) {
      linhas.push('AVALIAÇÕES REGISTRADAS NA EVOLUÇÃO:');
      Object.entries(respostas).forEach(([id, resposta]) => {
        const intervencao = obterIntervencoesDaConsulta(processo).find((item) => item.id === id && item.executada);
        if (!intervencao) return;
        linhas.push(`• ${intervencao.prescrita.acaoPrescrita} (Executor: ${intervencao.implementada?.quemExecuta || 'não informado'}): ${resposta.classificacao ? rotulosRespostas[resposta.classificacao] : 'Observação registrada'}${resposta.observacao?.trim() ? ` — ${resposta.observacao.trim()}` : ''}`);
      });
      (processo.evolucao?.observacoesCompartilhadas || []).forEach((observacao) => {
        const vinculadas = obterIntervencoesDaConsulta(processo).filter((item) => item.executada && observacao.intervencaoIds.includes(item.id));
        if (vinculadas.length && observacao.texto.trim()) linhas.push(`• Observação compartilhada (${vinculadas.map((item) => item.prescrita.acaoPrescrita).join('; ')}): ${observacao.texto.trim()}`);
      });
      Object.entries(avaliacoes).forEach(([id, avaliacao]) => {
        const resultado = (processo.planejamento?.diagnosticosPlanejados || []).find((diag) => referenciaResultado(diag.diagnosticoId, diag.resultadoPlanejadoId) === id);
        if (!resultado) return;
        linhas.push(`• Resultado esperado ${resultado.resultadoEsperadoSelecionado}: ${avaliacao.classificacao ? rotulosResultados[avaliacao.classificacao] : 'Observação registrada'}${avaliacao.observacao?.trim() ? ` — ${avaliacao.observacao.trim()}` : ''}`);
      });
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
  const gruposMateriais = materiaisAgrupados(processo);
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

  const temExecutada = obterIntervencoesDaConsulta(processo).some((item) => item.executada);

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
                      {formatarSinaisVitais(exameFisico, sinaisVitais, processo.avaliacao?.contextosParametros).map((sinal, index) => (
                        <li key={`sinal-vital-${index}`} className="flex items-baseline gap-1 text-sm"><span className="font-semibold text-gray-700">{sinal.nome}:</span><span className="text-gray-600">{sinal.valor}{sinal.contexto ?? ''}</span></li>
                      ))}
                      {Object.entries(exameFisico).filter(([chave]) => !sinaisVitais.some(s => s.sinalVitalNome === chave)).map(([chave, valor]) => (
                      <li key={chave} className="flex items-baseline gap-1 text-sm">
                        <span className="font-semibold text-gray-700">{chave}:</span>
                        <span className="text-gray-600">{valor}{contextoRegistradoParaTexto(processo.avaliacao?.contextosParametros, chave)}</span>
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
              {(processo.diagnostico?.reavaliacoesAnteriores || []).filter(item => (processo.avaliacao?.cuidadosAnterioresAbordados || []).some(cuidado => cuidado.acompanhamentoId === item.acompanhamentoId)).length > 0 && <InfoCard>
                <SectionHeader label="Reavaliação de Diagnósticos Anteriores" />
                {(processo.diagnostico?.reavaliacoesAnteriores || []).filter(item => (processo.avaliacao?.cuidadosAnterioresAbordados || []).some(cuidado => cuidado.acompanhamentoId === item.acompanhamentoId)).map(item => {
                  const cuidado = (processo.avaliacao?.cuidadosAnterioresAbordados || []).find(registro => registro.acompanhamentoId === item.acompanhamentoId);
                  const rotulo = item.decisao === 'manter' ? 'mantido' : item.decisao === 'substituir' ? `substituído por ${item.novoTituloDiagnostico || 'diagnóstico selecionado'}` : 'acompanhamento encerrado';
                  return <p key={item.acompanhamentoId} className="text-sm py-1">{formatarDataConsulta(cuidado?.dataOrigem, false)} · {cuidado?.tituloDiagnostico} — {rotulo}</p>;
                })}
              </InfoCard>}
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
              {(processo.planejamento?.diagnosticosPlanejados || []).map((diag, index) => (
                <DiagnosticoBlock
                  key={index}
                  titulo={diag.tituloDiagnostico}
                  resultado={diag.resultadoEsperadoSelecionado}
                  intervencoes={diag.intervencoesSelecionadas || []}
                  renderIntervencao={(int, idx) => {
                    return <li key={typeof int === 'string' ? idx : int.intervencaoId || idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-csae-green-500 font-bold mt-0.5">•</span>
                      <span>{typeof int === 'string' ? int : int.acaoPrescrita}</span>
                    </li>;
                  }}
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
              {Object.entries(processo.implementacao || {}).map(([titulo, dados], i) => {
                const planejadoDiag = processo.planejamento?.diagnosticosPlanejados?.find(
                  (p) => p.tituloDiagnostico === titulo
                );
                const implementadas = dados.intervencoes;
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
                        const chave = `${planejadoDiag?.diagnosticoId || ''}|${typeof iv === 'string' ? acao : iv.intervencaoId || acao}`;
                        const materiais = gruposMateriais.find(grupo => grupo.chave === chave)?.materiais || [];
                        return (
                      <li key={idx} className="flex items-start justify-between gap-2">
                        <div className="text-sm text-gray-700 flex-1"><span className="flex items-start gap-2">{typeof iv !== 'string' && 'implementadoNestaConsulta' in iv && iv.implementadoNestaConsulta ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> : <span>○</span>}{acao}{typeof iv !== 'string' && 'implementadoNestaConsulta' in iv && !iv.implementadoNestaConsulta ? ' · Não realizada nesta consulta' : ''}</span>{materiais.length > 0 && <MateriaisApoioLeitura materiais={materiais} />}</div>
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
              {!temExecutada && <p className="text-sm text-muted-foreground">Nenhuma intervenção foi realizada nesta consulta.</p>}
              {obterIntervencoesDaConsulta(processo).filter((item) => item.executada).map((item) => {
                const resposta = processo.evolucao?.respostasIntervencoes?.[item.id];
                return <InfoCard key={item.id}>
                  <p className="font-medium text-sm">{item.tituloDiagnostico}</p>
                  <p className="text-sm">{item.prescrita.acaoPrescrita} · Executor: {item.implementada?.quemExecuta || 'não informado'}</p>
                  {resposta?.classificacao && <p className="text-sm">Resposta: {({ favoravel: 'Favorável', parcial: 'Parcial', desfavoravel: 'Desfavorável', sem_resposta: 'Sem resposta avaliável', acompanhamento: 'Requer acompanhamento' })[resposta.classificacao]}</p>}
                  {resposta?.observacao && <p className="text-sm">{resposta.observacao}</p>}
                </InfoCard>;
              })}
              {(processo.evolucao?.observacoesCompartilhadas || []).filter((observacao) => observacao.texto.trim() && obterIntervencoesDaConsulta(processo).some((item) => item.executada && observacao.intervencaoIds.includes(item.id))).map((observacao) => <InfoCard key={observacao.id}><p className="text-sm">{observacao.texto}</p><p className="text-xs text-muted-foreground">Intervenções vinculadas: {obterIntervencoesDaConsulta(processo).filter((item) => item.executada && observacao.intervencaoIds.includes(item.id)).map((item) => item.prescrita.acaoPrescrita).join('; ')}</p></InfoCard>)}
              {(processo.planejamento?.diagnosticosPlanejados || []).map((diag) => {
                const avaliacao = processo.evolucao?.avaliacoesResultados?.[referenciaResultado(diag.diagnosticoId, diag.resultadoPlanejadoId)];
                if (!avaliacao) return null;
                return <InfoCard key={diag.diagnosticoId}><p className="font-medium text-sm">{diag.tituloDiagnostico} · {diag.resultadoEsperadoSelecionado}</p><p className="text-sm">{avaliacao.classificacao ? ({ alcancado: 'Alcançado', parcial: 'Parcialmente alcançado', nao_alcancado: 'Não alcançado', nao_avaliavel: 'Ainda não avaliável' })[avaliacao.classificacao] : ''} {avaliacao.observacao}</p></InfoCard>;
              })}
              {processo.evolucao?.julgamentoClinico?.trim() && <InfoCard><p className="font-medium text-sm">Julgamento Clínico e Avaliação dos Resultados</p><p className="text-sm whitespace-pre-wrap">{processo.evolucao.julgamentoClinico}</p></InfoCard>}
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
