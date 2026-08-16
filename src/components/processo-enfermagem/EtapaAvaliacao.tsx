import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Activity, FileText, Stethoscope, AlertTriangle, Info, PenLine, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProcessoEnfermagem, AvaliacaoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente, getSexoBiologico } from '@/types/paciente';
import { getSinaisVitais, SinalVital, ValorReferenciaVital } from '@/services/bancodados/sinaisVitaisDB';
import { getExames, Exame, ComponenteExame, ResultadoExame } from '@/services/bancodados/examesDB';
import { getSistemas, SistemaCorporal, ExamePropedeutico, Achado, OpcaoAchado } from '@/services/bancodados/revisaoSistemasDB';
import { Timestamp } from 'firebase/firestore';
import ExameResultadoInput from './ExameResultadoInput';

// Bloqueio de valores negativos em inputs numéricos
const blockNegative = {
  min: 0,
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === '-' || e.key === 'e') e.preventDefault();
  },
  onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.includes('-') || Number(pasted) < 0) e.preventDefault();
  },
};

// Tipos auxiliares de validação
interface ValidationStatus {
  status: 'normal' | 'alterado' | 'neutro';
  nomeAlteracao?: string;
  nhb?: string;
}

interface EtapaAvaliacaoProps {
  processo: ProcessoEnfermagem;
  paciente: Paciente;
  onUpdateAvaliacao: (avaliacao: AvaliacaoEnfermagem) => void;
}

const EtapaAvaliacao: React.FC<EtapaAvaliacaoProps> = ({
  processo,
  paciente,
  onUpdateAvaliacao
}) => {
  const [guiaColetaOpen, setGuiaColetaOpen] = useState(false);
  const [guiaExameOpen, setGuiaExameOpen] = useState(false);
  const [buscaExameFisico, setBuscaExameFisico] = useState('');
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [sistemas, setSistemas] = useState<SistemaCorporal[]>([]);
  const [loading, setLoading] = useState(true);

  // Novo estado padronizado para validação por parâmetro
  const [validationStates, setValidationStates] = useState<{ [parametro: string]: ValidationStatus }>({});

  // Mantemos a lista de NHBs local para exibição imediata
  const [nhbsAfetadas, setNhbsAfetadas] = useState<{ parametro: string; nhb: string }[]>([]);

  // Effect 1: Carrega dados estáticos do Firestore — executa APENAS uma vez (montagem)
  useEffect(() => {
    const loadData = async () => {
      try {
        const [sinaisData, examesData, sistemasData] = await Promise.all([
          new Promise<SinalVital[]>((resolve) => {
            const unsubscribe = getSinaisVitais((data) => {
              resolve(data);
              unsubscribe();
            });
          }),
          new Promise<Exame[]>((resolve) => {
            const unsubscribe = getExames((data) => {
              resolve(data);
              unsubscribe();
            });
          }),
          getSistemas()
        ]);

        setSinaisVitais(sinaisData);
        setExames(examesData);
        setSistemas(sistemasData);
      } catch (error) {
        console.error('Erro ao carregar dados da avaliação:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Array vazio: executa apenas na montagem

  // Effect 2: Sincroniza NHBs locais quando o processo é carregado (montagem)
  useEffect(() => {
    if (processo.avaliacao?.nhbsAfetadas) {
      setNhbsAfetadas(processo.avaliacao.nhbsAfetadas);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Inicialização apenas — atualizações subsequentes são gerenciadas por updateNhbs

  const calculateAge = (dataNascimento: Timestamp): number => {
    const birth = dataNascimento.toDate();
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  // Utilitário: atualiza a lista de NHBs (local + no processo via callback)
  const updateNhbs = (parametro: string, isNormal: boolean, nhb?: string) => {
    const outras = nhbsAfetadas.filter((n) => n.parametro !== parametro);
    const novaLista = isNormal || !nhb ? outras : [...outras, { parametro, nhb }];

    setNhbsAfetadas(novaLista);
    onUpdateAvaliacao({
      ...processo.avaliacao,
      nhbsAfetadas: novaLista,
    });
  };

  // Utilitário: define o status de validação de um parâmetro
  const setParametroValidation = (
    parametro: string,
    status: ValidationStatus['status'],
    nomeAlteracao?: string,
    nhb?: string
  ) => {
    setValidationStates((prev) => ({
      ...prev,
      [parametro]: { status, nomeAlteracao, nhb },
    }));
  };

  // Valida um valor específico dentro de um exame (simples ou opção dentro de opcoes)
  const getSistemaValidationForValue = (
    exame: ExamePropedeutico,
    selectedValue: string
  ): { status: ValidationStatus['status']; nomeAlteracao?: string; nhb?: string } => {
    for (const achado of exame.achados) {
      if ((!achado.tipoAchado || achado.tipoAchado === 'simples') && achado.descricaoAchado === selectedValue) {
        const isAlt = achado.ehAlteracao ?? !!achado.subconjuntoNHBVinculado;
        if (isAlt && !isTextoNormal(achado.nomeAlteracao)) {
          return { status: 'alterado', nomeAlteracao: achado.nomeAlteracao, nhb: achado.subconjuntoNHBVinculado };
        }
        return { status: 'normal' };
      }
      if (achado.tipoAchado === 'opcoes' && achado.opcoes) {
        const opcao = achado.opcoes.find((o) => o.textoOpcao === selectedValue);
        if (opcao) {
          if (opcao.ehAlteracao && opcao.subconjuntoNHBVinculado) {
            return { status: 'alterado', nomeAlteracao: opcao.nomeAlteracao, nhb: opcao.subconjuntoNHBVinculado };
          }
          return { status: 'normal' };
        }
      }
    }
    return { status: 'neutro' };
  };

  // Função centralizada para recalcular todas as NHBs do processo
  const calculateAllNhbs = (
    tempExameFisico: Record<string, string | number>,
    tempExameFisicoMulti: Record<string, string[]> = {}
  ) => {
    const novaLista: { parametro: string; nhb: string }[] = [];

    // Sinais Vitais
    sinaisVitais.forEach(sv => {
      const val = tempExameFisico[sv.sinalVitalNome];
      if (val !== undefined && val !== '') {
        const v = getNumericValidation(sv.sinalVitalNome, val, 'sinal');
        if (v.status === 'alterado' && v.nhb) novaLista.push({ parametro: sv.sinalVitalNome, nhb: v.nhb });
      }
    });

    // Exames
    exames.forEach(ex => {
      ex.componentes.forEach(comp => {
        const val = tempExameFisico[comp.componenteAnalisado];
        if (val !== undefined && val !== '') {
          const v = (ex.tipoExame === 'Laboratorial' && comp.tipoResultado !== 'classificatorio')
            ? getNumericValidation(comp.componenteAnalisado, val, 'exameLab')
            : getImagemValidation(comp.componenteAnalisado, String(val));
          if (v.status === 'alterado' && v.nhb) novaLista.push({ parametro: comp.componenteAnalisado, nhb: v.nhb });
        }
      });
    });

    // Revisão de Sistemas — lê multi-select, com fallback para valor único legado
    sistemas.forEach(sist => {
      sist.exames.forEach(ex => {
        const multiVals = tempExameFisicoMulti[ex.nomeExame] || [];
        const legacyVal = tempExameFisico[ex.nomeExame];
        const values = multiVals.length > 0 ? multiVals : (legacyVal ? [String(legacyVal)] : []);
        values.forEach(val => {
          const v = getSistemaValidationForValue(ex, val);
          if (v.status === 'alterado' && v.nhb) novaLista.push({ parametro: ex.nomeExame, nhb: v.nhb });
        });
      });
    });

    return novaLista;
  };

  // ATUALIZAÇÃO ATÔMICA: Calcula Exame Físico e NHBs sincronizadamente (sinais vitais + exames diag.)
  const updateAvaliacaoAtomic = (
    parametro: string,
    value: string | number,
    validation: { status: ValidationStatus['status']; nomeAlteracao?: string; nhb?: string }
  ) => {
    const novoExameFisico = { ...(processo.avaliacao?.exameFisico || {}), [parametro]: value };
    const multiAtual = processo.avaliacao?.exameFisicoMulti || {};
    const novaListaNhbs = calculateAllNhbs(novoExameFisico, multiAtual);

    setNhbsAfetadas(novaListaNhbs);
    setParametroValidation(parametro, validation.status, validation.nomeAlteracao, validation.nhb);

    onUpdateAvaliacao({
      ...processo.avaliacao,
      exameFisico: novoExameFisico,
      nhbsAfetadas: novaListaNhbs,
    });
  };

  // ATUALIZAÇÃO MULTI-SELECT: Para revisão de sistemas (checkboxes)
  const updateSistemaMulti = (
    nomeExame: string,
    newSelectedValues: string[],
    newDescricoes?: Record<string, string>
  ) => {
    const novoMulti = { ...(processo.avaliacao?.exameFisicoMulti || {}), [nomeExame]: newSelectedValues };
    const exameAtual = processo.avaliacao?.exameFisico || {};
    const novaListaNhbs = calculateAllNhbs(exameAtual, novoMulti);

    setNhbsAfetadas(novaListaNhbs);

    onUpdateAvaliacao({
      ...processo.avaliacao,
      exameFisicoMulti: novoMulti,
      ...(newDescricoes !== undefined ? { exameFisicoDescricoes: newDescricoes } : {}),
      nhbsAfetadas: novaListaNhbs,
    });
  };

  const toggleAchadoRS = (nomeExame: string, valor: string, checked: boolean) => {
    const current = processo.avaliacao?.exameFisicoMulti?.[nomeExame] || [];
    const updated = checked ? [...current, valor] : current.filter((v) => v !== valor);

    const descricoes = { ...(processo.avaliacao?.exameFisicoDescricoes || {}) };
    if (!checked) delete descricoes[`${nomeExame}|||${valor}`];

    updateSistemaMulti(nomeExame, updated, descricoes);
  };

  const updateDescricaoRS = (nomeExame: string, descricaoAchado: string, texto: string) => {
    const key = `${nomeExame}|||${descricaoAchado}`;
    const descricoes = { ...(processo.avaliacao?.exameFisicoDescricoes || {}), [key]: texto };
    const multiAtual = processo.avaliacao?.exameFisicoMulti || {};
    const exameAtual = processo.avaliacao?.exameFisico || {};
    const novaListaNhbs = calculateAllNhbs(exameAtual, multiAtual);

    onUpdateAvaliacao({
      ...processo.avaliacao,
      exameFisicoDescricoes: descricoes,
      nhbsAfetadas: novaListaNhbs,
    });
  };

  const updateDescricaoExame = (parametro: string, resultadoClassificatorio: string, texto: string) => {
    const key = `${parametro}|||${resultadoClassificatorio}`;
    const prev = { ...(processo.avaliacao?.exameFisicoDescricoes || {}) };
    if (texto) {
      prev[key] = texto;
    } else {
      delete prev[key];
    }
    onUpdateAvaliacao({ ...processo.avaliacao, exameFisicoDescricoes: prev });
  };

  // Normalização de normalidade por texto clínico (fallback para quando não há faixa ou o resultado é classificatório)
  const isTextoNormal = (nomeAlt?: string | null) => {
    if (!nomeAlt || nomeAlt.trim() === '') return true;
    const termosNormais = ['Normal', 'Normalidade', 'Ótima', 'Ótimo', 'Bom', 'Boa', 'Bem', 'Adequada', 'Adequado', 'Eupneico', 'Eufônico', 'Preservado', 'Normo', 'Ausente', 'Negat'];
    return termosNormais.some(t => nomeAlt.toLowerCase().includes(t.toLowerCase()));
  };

  // Validação para valores numéricos (sinais vitais e exames laboratoriais)
  const getNumericValidation = (parametro: string, value: string | number, type: 'sinal' | 'exameLab'): { status: ValidationStatus['status']; nomeAlteracao?: string; nhb?: string } => {
    if (value === '' || value === null || typeof value === 'undefined') {
      return { status: 'neutro' };
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { status: 'neutro' };
    }

    const idade = calculateAge(paciente.dataNascimento);
    const sexoBio = getSexoBiologico(paciente.sexo);

    let referenceData: (ValorReferenciaVital | ResultadoExame)[] = [];

    if (type === 'sinal') {
      const sinal = sinaisVitais.find((s) => s.sinalVitalNome === parametro);
      referenceData = (sinal?.valoresDeReferencia || []) as ValorReferenciaVital[];
    } else {
      const exame = exames.find(
        (e) => e.tipoExame === 'Laboratorial' && e.componentes.some((c) => c.componenteAnalisado === parametro)
      );
      const componente = exame?.componentes.find((c) => c.componenteAnalisado === parametro);
      referenceData = (componente?.resultados || []) as ResultadoExame[];
    }

    if (!referenceData.length) {
      return { status: 'neutro' };
    }

    // 1. Filtrar referências compatíveis por idade e sexo
    const possibleRanges = referenceData.filter((ref: ValorReferenciaVital | ResultadoExame) => {
      const r = ref as unknown as Record<string, number | string | undefined>;
      const idadeMinOk = r.idadeMinima == null || idade >= (r.idadeMinima as number);
      const idadeMaxOk = r.idadeMaxima == null || idade <= (r.idadeMaxima as number);
      const sexoOk = !r.criterioSexo || r.criterioSexo === 'Ambos' || sexoBio === 'Ambos' || r.criterioSexo === sexoBio;
      return idadeMinOk && idadeMaxOk && sexoOk;
    });

    if (possibleRanges.length === 0) return { status: 'neutro' as const };

    // 2. Encontrar a faixa específica onde o VALOR se encaixa
    const matchingRange = possibleRanges.find((ref: ValorReferenciaVital | ResultadoExame) => {
      const r = ref as unknown as Record<string, number | undefined>;
      const min = r.valorMinimo;
      const max = r.valorMaximo;
      
      if (min != null && max != null) return numValue >= min && numValue <= max;
      if (min != null) return numValue >= min;
      if (max != null) return numValue <= max;
      return false;
    }) as (ValorReferenciaVital | ResultadoExame) | undefined;

    if (!matchingRange) {
      return { status: 'neutro' as const };
    }

    const matchingAny = matchingRange as unknown as Record<string, string | undefined>;
    const nomeAlt: string | null | undefined = matchingAny.nomeAlteracao;
    const nhb: string | undefined = matchingAny.subconjuntoNHBVinculado;
    const isNormal = isTextoNormal(nomeAlt);

    return isNormal 
      ? { status: 'normal' } 
      : { status: 'alterado', nomeAlteracao: nomeAlt || 'Alteração', nhb };
  };

  // Validação para exames de imagem
  const getImagemValidation = (parametro: string, selected: string): { status: ValidationStatus['status']; nomeAlteracao?: string; nhb?: string } => {
    if (!selected) return { status: 'neutro' };

    const exame = exames.find(
      (e) => e.tipoExame === 'Imagem' && e.componentes.some((c) => c.componenteAnalisado === parametro)
    );
    const componente = exame?.componentes.find((c) => c.componenteAnalisado === parametro);
    const resultado = componente?.resultados.find((r) => r.resultadoClassificatorio === selected);

    if (!resultado) return { status: 'neutro' };

    const nomeAlt = resultado.nomeAlteracao;
    const nhb = resultado.subconjuntoNHBVinculado;
    const isNormal = isTextoNormal(nomeAlt);

    return isNormal 
      ? { status: 'normal' } 
      : { status: 'alterado', nomeAlteracao: nomeAlt || 'Alteração', nhb };
  };

  // Validação para revisão de sistemas
  const getSistemaValidation = (parametro: string, selectedDescricao: string): { status: ValidationStatus['status']; nomeAlteracao?: string; nhb?: string } => {
    if (!selectedDescricao) return { status: 'neutro' };

    let achadoSelecionado: Achado | undefined = undefined;
    sistemas.some((sist) => {
      const exame = sist.exames.find((ex) => ex.nomeExame === parametro);
      if (exame) {
        achadoSelecionado = exame.achados.find((a) => a.descricaoAchado === selectedDescricao);
        return true;
      }
      return false;
    });

    if (!achadoSelecionado) return { status: 'neutro' };

    const nomeAlt = (achadoSelecionado as Achado).nomeAlteracao;
    const nhb = (achadoSelecionado as Achado).subconjuntoNHBVinculado;
    const isNormal = isTextoNormal(nomeAlt);

    return isNormal 
      ? { status: 'normal' } 
      : { status: 'alterado', nomeAlteracao: nomeAlt || 'Alteração', nhb };
  };

  const handleColetaDadosChange = (value: string) => {
    const novaAvaliacao: AvaliacaoEnfermagem = {
      ...processo.avaliacao,
      coletaDeDadosSubjetivos: value,
    };
    onUpdateAvaliacao(novaAvaliacao);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Carregando dados de referência...</p>
      </div>
    );
  }

  // ─── Helpers de identificação e filtro ────────────────────
  const isPAS = (nome: string) => {
    const n = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return n.includes('sistolica') || n.includes(' pas)') || n.includes('(pas)');
  };
  const isPAD = (nome: string) => {
    const n = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return n.includes('diastoilica') || n.includes('diastolica') || n.includes(' pad)') || n.includes('(pad)');
  };
  const isIMC = (nome: string) => {
    const n = nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return n.includes('imc') || n.includes('indice de massa') || n.includes('massa corporal');
  };

  /** Busca sem acento, case-insensitive */
  const matchesBusca = (text: string, busca: string): boolean => {
    if (!busca.trim()) return true;
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return norm(text).includes(norm(busca));
  };

  /** Sinal vital aplicável ao paciente (age/sex filter) */
  const sinalMatchesPaciente = (sinal: SinalVital): boolean => {
    if (!sinal.valoresDeReferencia || sinal.valoresDeReferencia.length === 0) return true;
    const idade = calculateAge(paciente.dataNascimento);
    const sexoBio = getSexoBiologico(paciente.sexo);
    return sinal.valoresDeReferencia.some((ref: ValorReferenciaVital) => {
      const idadeMinOk = ref.idadeMinima == null || idade >= ref.idadeMinima;
      const idadeMaxOk = ref.idadeMaxima == null || idade <= ref.idadeMaxima;
      const sexoOk = !ref.criterioSexo || ref.criterioSexo === 'Ambos' || sexoBio === 'Ambos' || ref.criterioSexo === sexoBio;
      return idadeMinOk && idadeMaxOk && sexoOk;
    });
  };

  /** Atualiza Peso, Altura e IMC calculado em uma única operação */
  const handleIMCChange = (pesoStr: string, alturaStr: string, imcVital: SinalVital) => {
    const pesoNum = parseFloat(pesoStr);
    const alturaNum = parseFloat(alturaStr);
    let imcCalc = '';
    if (!isNaN(pesoNum) && !isNaN(alturaNum) && alturaNum > 0) {
      imcCalc = (pesoNum / Math.pow(alturaNum / 100, 2)).toFixed(2);
    }
    const novoExameFisico = {
      ...(processo.avaliacao?.exameFisico || {}),
      'Peso (kg)': pesoStr,
      'Altura (cm)': alturaStr,
      [imcVital.sinalVitalNome]: imcCalc,
    };
    const validation = getNumericValidation(imcVital.sinalVitalNome, imcCalc, 'sinal');
    setParametroValidation(imcVital.sinalVitalNome, validation.status, validation.nomeAlteracao, validation.nhb);
    const novaListaNhbs = calculateAllNhbs(novoExameFisico, processo.avaliacao?.exameFisicoMulti || {});
    setNhbsAfetadas(novaListaNhbs);
    onUpdateAvaliacao({ ...processo.avaliacao, exameFisico: novoExameFisico, nhbsAfetadas: novaListaNhbs });
  };

  // Classes condicionais para feedback visual aprimorado
  const getInputClassName = (parametro: string) => {
    const status = validationStates[parametro]?.status || 'neutro';
    const base = "transition-all duration-200 ";
    if (status === 'alterado') return base + 'border-red-300 bg-red-50 focus-visible:ring-red-400';
    if (status === 'normal') return base + 'border-emerald-300 bg-emerald-50 focus-visible:ring-emerald-400';
    return base;
  };

  const renderValidationMessage = (parametro: string) => {
    const v = validationStates[parametro];
    if (!v || v.status !== 'alterado') return null;
    return (
      <div className="flex items-center gap-1.5 text-red-600 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <p className="text-[11px] font-bold leading-tight">{v.nomeAlteracao}</p>
      </div>
    );
  };

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <div className="col-span-full border-b pb-1.5 mb-2 mt-4 first:mt-0">
      <h5 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
        {title}
      </h5>
    </div>
  );

  return (
    <div className="h-full">
      <Tabs defaultValue="coleta-dados" className="w-full h-full flex flex-col">
        <TabsList className="grid w-full grid-cols-2 shrink-0">
          <TabsTrigger value="coleta-dados">Coleta de Dados</TabsTrigger>
          <TabsTrigger value="exame-fisico">Exame Físico</TabsTrigger>
        </TabsList>

        <TabsContent value="coleta-dados" className="flex-1 mt-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle>Coleta de Dados Subjetivos</CardTitle>
                <Dialog open={guiaColetaOpen} onOpenChange={setGuiaColetaOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Quero ajuda para fazer uma boa coleta de dados
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Guia de Habilidades de Comunicação para a Coleta de Dados</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="h-full pr-4">
                      <div className="space-y-6 text-sm">
                        <section>
                          <h3 className="text-lg font-semibold text-primary mb-3">O Contato Inicial</h3>
                          <p className="mb-4">
                            O contato inicial com o usuário pode determinar como a relação será estabelecida. 
                            A demonstração de respeito, cordialidade, empatia e assertividade devem fazer parte 
                            da apresentação inicial. Tente causar uma primeira impressão positiva (LEIN; WILLS, 2007; CARRIO, 2012).
                          </p>
                          <ul className="space-y-2 list-disc pl-6">
                            <li><strong>Seja cordial:</strong> Chame a pessoa pelo nome, se apresente, mantenha contato visual, sorria e indique onde ela deve se sentar.</li>
                            <li><strong>Lei do eco emocional:</strong> O profissional recebe do usuário conforme o que oferece a ele.</li>
                            <li><strong>Atenção à linguagem corporal:</strong> Evite demonstrar pressa, desinteresse ou desconforto.</li>
                          </ul>
                        </section>

                        <section>
                          <h3 className="text-lg font-semibold text-primary mb-3">Encorajando a Narrativa do Paciente</h3>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">1. Pergunta aberta:</h4>
                            <p className="mb-2">Utilize frases e perguntas abertas para incentivar a pessoa a falar.</p>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplos:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                <li>"Como posso te ajudar hoje?"</li>
                                <li>"Certo, conte-me mais..."</li>
                                <li>"Então, me conte..."</li>
                              </ul>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">2. Não interromper (O Primeiro Minuto):</h4>
                            <p>
                              Dê ao usuário a oportunidade de expor os pontos que ele considera importantes sem interrupções. 
                              Se precisar usar o computador, avise que continua prestando atenção (EPSTEIN et al, 2008; CARRIO, 2012).
                            </p>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">3. Ecoar:</h4>
                            <p className="mb-2">Repita as últimas palavras ditas pela pessoa para reforçar que você está ouvindo e incentivá-la a continuar.</p>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p><strong>Usuário:</strong> "Enfermeira, minha dor nas costas iniciou quando eu caí da escada.."</p>
                              <p><strong>Enfermeiro(a):</strong> "Humm.. caiu da escada?"</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">4. Parafrasear:</h4>
                            <p className="mb-2">Reproduza a mensagem com suas próprias palavras para verificar o entendimento e dar a chance de correção.</p>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p>"Deixa eu ver se entendi... você está sentindo X por causa de Y. Isso está correto?" (MCCABE; TIMMINS, 2013; SIBIYA, 2018).</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">5. Silêncio:</h4>
                            <p>
                              Ofereça pausas para que o usuário organize os pensamentos. O silêncio permite observar 
                              e responder de forma mais apropriada (SILVA, 2015; SIBIYA, 2018).
                            </p>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">6. Clarificar:</h4>
                            <p className="mb-2">Peça esclarecimentos sobre termos ou eventos para entender o real significado do que foi dito.</p>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplos:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                <li>"O que a senhora quer dizer com..."</li>
                                <li>"O senhor quer dizer que é como se fosse..."</li>
                              </ul>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">7. Resumir:</h4>
                            <p className="mb-2">Ao final de um tópico, organize e confirme o que foi dito para estruturar a consulta e evitar mal-entendidos.</p>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p>"Então, posso confirmar se entendi corretamente? Você disse que..."</p>
                            </div>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-lg font-semibold text-primary mb-3">Explorando os Problemas com Detalhes</h3>
                          
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">1. Atenção à Linguagem Não Verbal:</h4>
                            <p>
                              Preste atenção ao tom de voz, gestos e postura. Verifique disparidades entre o que é dito 
                              e o que você observa (SILVERMAN; KURTZ; DRAPER, 2013).
                            </p>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">2. Perguntas Abertas (Aprofundamento):</h4>
                            <p className="mb-2">Use-as para investigar as implicações do problema na vida da pessoa.</p>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplos:</p>
                              <ul className="list-disc pl-4 space-y-1">
                                <li>"O que mais o preocupa nas dores de cabeça?"</li>
                                <li>"Como isso tem afetado o seu dia a dia?"</li>
                              </ul>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">3. "Conte-me mais":</h4>
                            <p className="mb-2">Um convite direto para que o usuário aprofunde um tópico importante (GUSTIN; STOWERS; VON GUNTEN, 2015).</p>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p>"Conte-me mais sobre como você está se sentindo em relação à diabetes."</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">4. Reforço Positivo:</h4>
                            <p className="mb-2">Elogie comportamentos saudáveis para incentivar sua manutenção (SILVA, 2015).</p>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p>"Parabéns! Que bom que está conseguindo fazer as caminhadas diárias!"</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">5. Evite Falsas Garantias:</h4>
                            <p>
                              Não use expressões como "Isso passa" ou "Logo melhora", pois podem minimizar 
                              o sentimento do usuário (RAPHAEL-GRIMM, 2015).
                            </p>
                          </div>

                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">6. Administre o Constrangimento:</h4>
                            <p className="mb-2">Formule perguntas de forma neutra.</p>
                            <div className="bg-muted p-3 rounded-md">
                              <p className="font-medium mb-1">Exemplo:</p>
                              <p>Em vez de "Você não fuma mais de 20 cigarros, não é?", pergunte "Quantos cigarros você costuma fumar por dia?" (ALI, 2017).</p>
                            </div>
                          </div>
                        </section>

                        <div className="border-t pt-4 mt-6">
                          <p className="text-xs text-muted-foreground">
                            <strong>Referência:</strong> Todo o conteúdo deste guia foi extraído de:<br />
                            Arma, Juliana Cipriano de. Guia de habilidades de comunicação no cuidado de enfermagem [livro eletrônico] / Juliana Cipriano de Arma, Mirelle Saes, Luiz Augusto Facchini. -- Florianópolis, SC : Ed. dos Autores, 2022. PDF.
                          </p>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-sm text-muted-foreground">
                Registre aqui as informações coletadas através da entrevista com o paciente (dados subjetivos).
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Textarea
                value={processo.avaliacao?.coletaDeDadosSubjetivos || ''}
                onChange={(e) => handleColetaDadosChange(e.target.value)}
                placeholder="Descreva aqui os dados subjetivos coletados durante a entrevista com o paciente..."
                className="flex-1 resize-none min-h-[300px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Dica: Use o guia de comunicação para aplicar técnicas eficazes de entrevista clínica.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exame-fisico" className="flex-1 mt-4">
          <div className="flex gap-4 items-start">

            {/* ── Coluna principal ───────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Exame Físico</h2>
              <Dialog open={guiaExameOpen} onOpenChange={setGuiaExameOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Guia do Exame Físico
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Guia para Exame Físico de Enfermagem</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-full pr-4">
                    <section>
                      <h3 className="text-lg font-semibold text-primary mb-3">Privacidade e Respeito</h3>
                      <p className="mb-4">
                        O exame físico deve sempre respeitar a privacidade e dignidade do paciente. 
                        Explique cada procedimento antes de realizá-lo e obtenha consentimento.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold text-primary mb-3">Clareza nas Instruções</h3>
                      <p className="mb-4">
                        Use linguagem simples e clara ao dar instruções. Verifique se o paciente 
                        compreendeu o que será feito e tire suas dúvidas.
                      </p>
                    </section>

                    <section>
                      <h3 className="text-lg font-semibold text-primary mb-3">O Toque Terapêutico</h3>
                      <p className="mb-4">
                        O toque durante o exame físico deve ser firme, mas gentil. Mantenha as mãos 
                        aquecidas e explique a sensação que o paciente pode esperar sentir.
                      </p>
                    </section>

                    <div className="border-t pt-4 mt-6">
                      <p className="text-xs text-muted-foreground">
                        <strong>Referência:</strong> Todo o conteúdo deste guia foi extraído de:<br />
                        Arma, Juliana Cipriano de. Guia de habilidades de comunicação no cuidado de enfermagem [livro eletrônico] / Juliana Cipriano de Arma, Mirelle Saes, Luiz Augusto Facchini. -- Florianópolis, SC : Ed. dos Autores, 2022. PDF.
                      </p>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>

            {/* Barra de busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar sinais vitais, exames ou sistemas de revisão…"
                value={buscaExameFisico}
                onChange={(e) => setBuscaExameFisico(e.target.value)}
                className="pl-9"
              />
            </div>

            <TooltipProvider>
            <Accordion type="multiple" defaultValue={['sinais-vitais']} className="w-full space-y-4">
              {/* Sinais Vitais - Grid de mini-cards */}
              <AccordionItem value="sinais-vitais" className="border rounded-xl shadow-sm overflow-hidden bg-white">
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50/80 transition-colors hover:no-underline group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100 transition-colors">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-800">Sinais Vitais</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/40 p-6 border-t">
                  {(() => {
                    const vitais = [...sinaisVitais]
                      .filter(s => sinalMatchesPaciente(s))
                      .filter(s => matchesBusca(s.sinalVitalNome, buscaExameFisico) || matchesBusca(s.sinalVitalDescricao || '', buscaExameFisico));
                    const pasV = vitais.find(s => isPAS(s.sinalVitalNome));
                    const padV = vitais.find(s => isPAD(s.sinalVitalNome));
                    const imcV = vitais.find(s => isIMC(s.sinalVitalNome));
                    const outros = vitais.filter(s => !isPAS(s.sinalVitalNome) && !isPAD(s.sinalVitalNome) && !isIMC(s.sinalVitalNome));
                    if (!pasV && !padV && !imcV && outros.length === 0) {
                      return <p className="text-sm text-muted-foreground text-center py-4">Nenhum resultado para "{buscaExameFisico}".</p>;
                    }
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* ── Bloco PA ── */}
                        {(pasV || padV) && (
                          <div className="sm:col-span-2 bg-white p-4 rounded-xl border-2 border-rose-100 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-rose-500 mb-3">Pressão Arterial</p>
                            <div className="grid grid-cols-2 gap-3">
                              {pasV && (
                                <div className="space-y-2">
                                  <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                                    PAS <span className="text-[9px] font-normal opacity-60">({pasV.unidadeMedida})</span>
                                    {pasV.sinalVitalDescricao && (
                                      <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-gray-400 cursor-help shrink-0" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">{pasV.sinalVitalDescricao}</TooltipContent></Tooltip>
                                    )}
                                  </label>
                                  <Input type="number" placeholder="00" {...blockNegative} value={processo.avaliacao?.exameFisico?.[pasV.sinalVitalNome] || ''} onChange={(e) => { const v = e.target.value; if (v !== '' && Number(v) < 0) return; updateAvaliacaoAtomic(pasV.sinalVitalNome, v, getNumericValidation(pasV.sinalVitalNome, v, 'sinal')); }} className={getInputClassName(pasV.sinalVitalNome)} />
                                  {renderValidationMessage(pasV.sinalVitalNome)}
                                </div>
                              )}
                              {padV && (
                                <div className="space-y-2">
                                  <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1">
                                    PAD <span className="text-[9px] font-normal opacity-60">({padV.unidadeMedida})</span>
                                    {padV.sinalVitalDescricao && (
                                      <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-gray-400 cursor-help shrink-0" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">{padV.sinalVitalDescricao}</TooltipContent></Tooltip>
                                    )}
                                  </label>
                                  <Input type="number" placeholder="00" {...blockNegative} value={processo.avaliacao?.exameFisico?.[padV.sinalVitalNome] || ''} onChange={(e) => { const v = e.target.value; if (v !== '' && Number(v) < 0) return; updateAvaliacaoAtomic(padV.sinalVitalNome, v, getNumericValidation(padV.sinalVitalNome, v, 'sinal')); }} className={getInputClassName(padV.sinalVitalNome)} />
                                  {renderValidationMessage(padV.sinalVitalNome)}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ── Bloco IMC ── */}
                        {imcV && (
                          <div className="sm:col-span-2 bg-white p-4 rounded-xl border-2 border-csae-green-100 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-wider text-csae-green-600 mb-3 flex items-center gap-1">
                              {imcV.sinalVitalNome}
                              {imcV.sinalVitalDescricao && (
                                <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-gray-400 cursor-help" /></TooltipTrigger><TooltipContent className="max-w-[220px] text-xs">{imcV.sinalVitalDescricao}</TooltipContent></Tooltip>
                              )}
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-500">Peso (kg)</label>
                                <Input type="number" placeholder="Ex: 70" {...blockNegative} value={String(processo.avaliacao?.exameFisico?.['Peso (kg)'] || '')} onChange={(e) => { const v = e.target.value; if (v !== '' && Number(v) < 0) return; handleIMCChange(v, String(processo.avaliacao?.exameFisico?.['Altura (cm)'] || ''), imcV); }} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-500">Altura (cm)</label>
                                <Input type="number" placeholder="Ex: 170" {...blockNegative} value={String(processo.avaliacao?.exameFisico?.['Altura (cm)'] || '')} onChange={(e) => { const v = e.target.value; if (v !== '' && Number(v) < 0) return; handleIMCChange(String(processo.avaliacao?.exameFisico?.['Peso (kg)'] || ''), v, imcV); }} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-500">IMC (kg/m²)</label>
                                <div className={`h-9 rounded-md border flex items-center px-3 text-sm font-bold ${getInputClassName(imcV.sinalVitalNome)}`}>{processo.avaliacao?.exameFisico?.[imcV.sinalVitalNome] || '—'}</div>
                                {renderValidationMessage(imcV.sinalVitalNome)}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ── Demais sinais vitais ── */}
                        {outros.map((sinal) => (
                          <div key={sinal.id} className="bg-white p-4 rounded-xl border shadow-sm space-y-3 flex flex-col justify-between">
                            <label className="text-[11px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1 flex-wrap">
                              {sinal.sinalVitalNome} <span className="text-[9px] lowercase font-medium">({sinal.unidadeMedida})</span>
                              {sinal.sinalVitalDescricao && (
                                <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-gray-400 cursor-help shrink-0" /></TooltipTrigger><TooltipContent side="top" className="max-w-[220px] text-xs">{sinal.sinalVitalDescricao}</TooltipContent></Tooltip>
                              )}
                            </label>
                            <Input type="number" placeholder="00.0" {...blockNegative} value={processo.avaliacao?.exameFisico?.[sinal.sinalVitalNome] || ''} onChange={(e) => { const v = e.target.value; if (v !== '' && Number(v) < 0) return; updateAvaliacaoAtomic(sinal.sinalVitalNome, v, getNumericValidation(sinal.sinalVitalNome, v, 'sinal')); }} className={getInputClassName(sinal.sinalVitalNome)} />
                            {renderValidationMessage(sinal.sinalVitalNome)}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </AccordionContent>
              </AccordionItem>

              {/* Exames Diagnósticos - Organizados por Nome */}
              <AccordionItem value="exames-diagnosticos" className="border rounded-xl shadow-sm overflow-hidden bg-white">
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50/80 transition-colors hover:no-underline group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-800">Exames Diagnósticos</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/40 p-6 border-t">
                  <div className="space-y-8">
                    {exames
                      .filter(ex =>
                        matchesBusca(ex.nomeExame, buscaExameFisico) ||
                        matchesBusca(ex.descricaoExame || '', buscaExameFisico) ||
                        ex.componentes.some(c => matchesBusca(c.componenteAnalisado, buscaExameFisico))
                      )
                      .map((exame) => (
                      <div key={exame.id} className="space-y-4">
                        <div className="col-span-full border-b pb-1.5 mb-2 mt-4 first:mt-0 flex items-center gap-1">
                          <h5 className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">{exame.nomeExame}</h5>
                          {exame.descricaoExame && (
                            <Tooltip><TooltipTrigger asChild><Info className="w-3 h-3 text-gray-400 cursor-help" /></TooltipTrigger><TooltipContent className="max-w-[250px] text-xs">{exame.descricaoExame}</TooltipContent></Tooltip>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ml-2">
                          {exame.componentes.map((componente, idx) => {
                            const parametro = componente.componenteAnalisado;
                            const valorAtual = processo.avaliacao?.exameFisico?.[parametro] || '';

                            if (exame.tipoExame === 'Imagem' || componente.tipoResultado === 'classificatorio') {
                              const valorTextoKey = `${parametro}|||${String(valorAtual)}`;
                              const valorTextoAtual = processo.avaliacao?.exameFisicoDescricoes?.[valorTextoKey] || '';

                              return (
                                <ExameResultadoInput
                                  key={idx}
                                  parametro={parametro}
                                  componente={componente}
                                  valorAtual={String(valorAtual)}
                                  valorTextoAtual={valorTextoAtual}
                                  onValueChange={(selected, validation, prevSelection) => {
                                    const novoExameFisico = { ...(processo.avaliacao?.exameFisico || {}), [parametro]: selected };
                                    const novaListaNhbs = calculateAllNhbs(novoExameFisico, processo.avaliacao?.exameFisicoMulti || {});
                                    setNhbsAfetadas(novaListaNhbs);
                                    setParametroValidation(parametro, validation.status, validation.nomeAlteracao, validation.nhb);
                                    const descricoes = { ...(processo.avaliacao?.exameFisicoDescricoes || {}) };
                                    if (prevSelection && prevSelection !== selected) {
                                      delete descricoes[`${parametro}|||${prevSelection}`];
                                    }
                                    onUpdateAvaliacao({
                                      ...processo.avaliacao,
                                      exameFisico: novoExameFisico,
                                      exameFisicoDescricoes: descricoes,
                                      nhbsAfetadas: novaListaNhbs,
                                    });
                                  }}
                                  onValorTextoChange={(resultadoClassif, texto) =>
                                    updateDescricaoExame(parametro, resultadoClassif, texto)
                                  }
                                  getInputClassName={getInputClassName}
                                  renderValidationMessage={renderValidationMessage}
                                  getImagemValidation={getImagemValidation}
                                />
                              );
                            }

                            return (
                              <div key={idx} className="space-y-2">
                                <label className="text-[11px] font-bold text-gray-600">
                                  {parametro} <span className="text-[9px] font-medium opacity-70">({componente.unidadeMedida})</span>
                                </label>
                                <Input
                                  type="number"
                                  placeholder="Resultado"
                                  {...blockNegative}
                                  value={valorAtual}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val !== '' && Number(val) < 0) return;
                                    const validation = getNumericValidation(parametro, val, 'exameLab');
                                    updateAvaliacaoAtomic(parametro, val, validation);
                                  }}
                                  className={getInputClassName(parametro)}
                                />
                                {renderValidationMessage(parametro)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Revisão de Sistemas - Propedêutica por Sistema */}
              <AccordionItem value="revisao-sistemas" className="border rounded-xl shadow-sm overflow-hidden bg-white">
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50/80 transition-colors hover:no-underline group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-800">Revisão de Sistemas</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="bg-slate-50/40 p-4 border-t">
                  <Accordion type="multiple" className="space-y-2">
                    {(() => {
                      const sexoBio = getSexoBiologico(paciente.sexo);
                      const achadoMatchesSexo = (a: Achado) =>
                        sexoBio === 'Ambos' || !a.criterioSexo || a.criterioSexo === 'Ambos' || a.criterioSexo === sexoBio;

                      return sistemas
                        .filter(s => {
                          const matchSearch =
                            matchesBusca(s.nomeSistema, buscaExameFisico) ||
                            matchesBusca(s.descricaoSistema || '', buscaExameFisico) ||
                            s.exames.some(e =>
                              matchesBusca(e.nomeExame, buscaExameFisico) ||
                              e.achados.some(a => matchesBusca(a.descricaoAchado, buscaExameFisico))
                            );
                          if (!matchSearch) return false;
                          // Ocultar sistema se todos os seus achados forem do sexo oposto
                          return s.exames.some(e => e.achados.some(achadoMatchesSexo));
                        })
                        .map((sistema) => (
                        <AccordionItem key={sistema.id} value={`sistema-${sistema.id}`} className="border rounded-xl overflow-hidden bg-white shadow-sm">
                          <AccordionTrigger className="px-4 py-3 hover:bg-gray-50/80 hover:no-underline">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-800">{sistema.nomeSistema}</span>
                              {sistema.descricaoSistema && (
                                <Tooltip><TooltipTrigger asChild><Info className="w-3.5 h-3.5 text-gray-400 cursor-help shrink-0" /></TooltipTrigger><TooltipContent className="max-w-[260px] text-xs">{sistema.descricaoSistema}</TooltipContent></Tooltip>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4 bg-slate-50/40">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
                          {sistema.exames
                            .filter(exame => exame.achados.some(achadoMatchesSexo))
                            .map((exame, idx) => {
                            const nomeExame = exame.nomeExame;
                            const selectedValues = processo.avaliacao?.exameFisicoMulti?.[nomeExame]
                              || (processo.avaliacao?.exameFisico?.[nomeExame]
                                ? [String(processo.avaliacao.exameFisico[nomeExame])]
                                : []);
                            const descricoes = processo.avaliacao?.exameFisicoDescricoes || {};

                            const simpleAchados = (exame.achados || []).filter(
                              (a) => (!a.tipoAchado || a.tipoAchado === 'simples') && achadoMatchesSexo(a)
                            );
                            const opcoesAchados = (exame.achados || []).filter(
                              (a) => a.tipoAchado === 'opcoes' && achadoMatchesSexo(a)
                            );

                            return (
                              <div key={idx} className="rounded-lg border bg-white p-3 space-y-2 shadow-sm">
                                <p className="text-[11px] font-bold text-gray-600 leading-tight">
                                  {exame.nomeExame}
                                  <span className="font-normal opacity-60 italic ml-1">— {exame.propedeutica}</span>
                                </p>

                                {/* Achados simples como checkboxes */}
                                {simpleAchados.map((achado, ai) => {
                                  const isChecked = selectedValues.includes(achado.descricaoAchado);
                                  const isAlteracao = achado.ehAlteracao ?? !!achado.subconjuntoNHBVinculado;
                                  const descKey = `${nomeExame}|||${achado.descricaoAchado}`;
                                  const descAtual = descricoes[descKey] || '';

                                  return (
                                    <div key={ai}>
                                      <div className="flex items-start gap-2">
                                        <Checkbox
                                          id={`${nomeExame}-${ai}`}
                                          checked={isChecked}
                                          onCheckedChange={(checked) => toggleAchadoRS(nomeExame, achado.descricaoAchado, !!checked)}
                                          className="mt-0.5 shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                          <label
                                            htmlFor={`${nomeExame}-${ai}`}
                                            className={`text-xs leading-snug cursor-pointer ${isAlteracao && isChecked ? 'text-red-700 font-medium' : 'text-gray-700'}`}
                                          >
                                            {achado.descricaoAchado}
                                          </label>
                                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                            {isAlteracao ? (
                                              <Badge className="text-[9px] px-1 py-0 bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
                                                {achado.nomeAlteracao || 'Alterado'}
                                              </Badge>
                                            ) : (
                                              <Badge className="text-[9px] px-1 py-0 bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
                                                {achado.nomeAlteracao || 'Normal'}
                                              </Badge>
                                            )}
                                            {achado.dicaAchado && (
                                              <Popover>
                                                <PopoverTrigger asChild>
                                                  <button className="inline-flex items-center gap-0.5 text-[9px] text-csae-green-600 hover:text-csae-green-800 bg-csae-green-50 hover:bg-csae-green-100 rounded px-1 py-0.5 transition-colors">
                                                    <Info className="w-2.5 h-2.5" />Ver orientação
                                                  </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-72 text-xs text-gray-700 leading-relaxed" side="top">
                                                  <p className="font-semibold text-csae-green-700 mb-1">Orientação Clínica</p>
                                                  {achado.dicaAchado}
                                                </PopoverContent>
                                              </Popover>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Campo de descrição obrigatório quando exigeDescricao */}
                                      {achado.exigeDescricao && isChecked && (
                                        <div className="ml-6 mt-1.5">
                                          <Textarea
                                            value={descAtual}
                                            onChange={(e) => updateDescricaoRS(nomeExame, achado.descricaoAchado, e.target.value)}
                                            placeholder={achado.dicaAchado || 'Descreva o achado encontrado…'}
                                            className="text-xs resize-none min-h-[56px]"
                                            rows={2}
                                          />
                                          {!descAtual.trim() && (
                                            <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                                              <PenLine className="w-3 h-3" />Descrição obrigatória para este achado
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Achados com opções como grupos de checkboxes */}
                                {opcoesAchados.map((achado, ai) => (
                                  <div key={`opc-${ai}`} className="border rounded-md p-2 bg-slate-50/60 space-y-1.5">
                                    <div className="flex items-center gap-1">
                                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                                        {achado.descricaoAchado}
                                      </p>
                                      {achado.dicaAchado && (
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <button className="inline-flex items-center gap-0.5 text-[9px] text-csae-green-600 hover:text-csae-green-800 bg-csae-green-50 rounded px-1 py-0.5">
                                              <Info className="w-2.5 h-2.5" />Orientação
                                            </button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-72 text-xs text-gray-700 leading-relaxed" side="top">
                                            <p className="font-semibold text-csae-green-700 mb-1">Orientação Clínica</p>
                                            {achado.dicaAchado}
                                          </PopoverContent>
                                        </Popover>
                                      )}
                                    </div>
                                    {(achado.opcoes || []).map((opcao, oi) => {
                                      const isChecked = selectedValues.includes(opcao.textoOpcao);
                                      const isAlt = opcao.ehAlteracao;
                                      const descKey = `${nomeExame}|||${opcao.textoOpcao}`;
                                      const descAtual = descricoes[descKey] || '';

                                      return (
                                        <div key={oi}>
                                          <div className="flex items-start gap-2">
                                            <Checkbox
                                              id={`${nomeExame}-opc-${ai}-${oi}`}
                                              checked={isChecked}
                                              onCheckedChange={(checked) => toggleAchadoRS(nomeExame, opcao.textoOpcao, !!checked)}
                                              className="mt-0.5 shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <label
                                                htmlFor={`${nomeExame}-opc-${ai}-${oi}`}
                                                className={`text-xs leading-snug cursor-pointer ${isAlt && isChecked ? 'text-red-700 font-medium' : 'text-gray-700'}`}
                                              >
                                                {opcao.textoOpcao}
                                              </label>
                                              {(isAlt ? (
                                                <Badge className="ml-1 text-[9px] px-1 py-0 bg-red-50 text-red-600 border-red-200 hover:bg-red-50">
                                                  {opcao.nomeAlteracao || 'Alterado'}
                                                </Badge>
                                              ) : opcao.nomeAlteracao ? (
                                                <Badge className="ml-1 text-[9px] px-1 py-0 bg-green-50 text-green-600 border-green-200 hover:bg-green-50">
                                                  {opcao.nomeAlteracao}
                                                </Badge>
                                              ) : null)}
                                            </div>
                                          </div>
                                          {opcao.exigeDescricao && isChecked && (
                                            <div className="ml-6 mt-1">
                                              <Textarea
                                                value={descAtual}
                                                onChange={(e) => updateDescricaoRS(nomeExame, opcao.textoOpcao, e.target.value)}
                                                placeholder="Descreva este achado…"
                                                className="text-xs resize-none min-h-[48px]"
                                                rows={2}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}

                                {exame.achados.length === 0 && (
                                  <p className="text-[10px] text-muted-foreground italic">Nenhum achado cadastrado.</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        </AccordionContent>
                      </AccordionItem>
                    ));
                  })()}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            </TooltipProvider>
            </div>{/* fim coluna principal */}

            {/* ── Sidebar NHBs ───────────────────────────────────── */}
            {nhbsAfetadas.length > 0 && (
              <div className="w-60 shrink-0 sticky top-0 self-start">
                <Card className="border-rose-100 shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      NHBs Afetadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <div className="space-y-1.5">
                      {nhbsAfetadas.map((item, idx) => (
                        <div key={idx} className="rounded-lg bg-rose-50 border border-rose-100 px-2.5 py-2">
                          <p className="text-[11px] font-semibold text-rose-700 leading-tight">{item.nhb}</p>
                          <p className="text-[10px] text-rose-400 mt-0.5 leading-tight truncate" title={item.parametro}>{item.parametro}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

          </div>{/* fim flex gap-4 */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EtapaAvaliacao;
