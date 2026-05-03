import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Activity, FileText, Stethoscope } from 'lucide-react';
import { ProcessoEnfermagem, AvaliacaoEnfermagem } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';
import { getSinaisVitais, SinalVital, ValorReferenciaVital } from '@/services/bancodados/sinaisVitaisDB';
import { getExames, Exame, ComponenteExame, ResultadoExame } from '@/services/bancodados/examesDB';
import { getSistemas, SistemaCorporal, ExamePropedeutico, Achado } from '@/services/bancodados/revisaoSistemasDB';
import { Timestamp } from 'firebase/firestore';
import { Combobox } from '@/components/ui/combobox';

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

  // Função centralizada para recalcular todas as NHBs do processo
  const calculateAllNhbs = (tempExameFisico: Record<string, string | number>) => {
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
          const v = ex.tipoExame === 'Laboratorial' 
            ? getNumericValidation(comp.componenteAnalisado, val, 'exameLab')
            : getImagemValidation(comp.componenteAnalisado, String(val));
          if (v.status === 'alterado' && v.nhb) novaLista.push({ parametro: comp.componenteAnalisado, nhb: v.nhb });
        }
      });
    });

    // Revisão de Sistemas
    sistemas.forEach(sist => {
      sist.exames.forEach(ex => {
        const val = tempExameFisico[ex.nomeExame];
        if (val !== undefined && val !== '') {
          const v = getSistemaValidation(ex.nomeExame, String(val));
          if (v.status === 'alterado' && v.nhb) novaLista.push({ parametro: ex.nomeExame, nhb: v.nhb });
        }
      });
    });

    return novaLista;
  };

  // ATUALIZAÇÃO ATÔMICA: Calcula Exame Físico e NHBs sincronizadamente
  const updateAvaliacaoAtomic = (
    parametro: string,
    value: string | number,
    validation: { status: ValidationStatus['status']; nomeAlteracao?: string; nhb?: string }
  ) => {
    // 1. Monta o novo estado do Exame Físico
    const novoExameFisico = {
      ...(processo.avaliacao?.exameFisico || {}),
      [parametro]: value,
    };

    // 2. Recalcula TODAS as NHBs com base no novo mapa total
    const novaListaNhbs = calculateAllNhbs(novoExameFisico);

    // 3. Atualiza estados locais para feedback visual
    setNhbsAfetadas(novaListaNhbs);
    setParametroValidation(parametro, validation.status, validation.nomeAlteracao, validation.nhb);

    // 4. Envia atualização completa para o pai
    onUpdateAvaliacao({
      ...processo.avaliacao,
      exameFisico: novoExameFisico,
      nhbsAfetadas: novaListaNhbs,
    });
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
    const sexo = paciente.sexo;

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
      const r = ref as Record<string, number | string | undefined>;
      const idadeMinOk = r.idadeMinima == null || idade >= (r.idadeMinima as number);
      const idadeMaxOk = r.idadeMaxima == null || idade <= (r.idadeMaxima as number);
      const sexoOk = !r.criterioSexo || r.criterioSexo === 'Ambos' || r.criterioSexo === sexo;
      return idadeMinOk && idadeMaxOk && sexoOk;
    });

    if (possibleRanges.length === 0) return { status: 'neutro' as const };

    // 2. Encontrar a faixa específica onde o VALOR se encaixa
    const matchingRange = possibleRanges.find((ref: ValorReferenciaVital | ResultadoExame) => {
      const r = ref as Record<string, number | undefined>;
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

    const matchingAny = matchingRange as Record<string, string | undefined>;
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

  // Classes condicionais para feedback visual
  const getInputClassName = (parametro: string) => {
    const status = validationStates[parametro]?.status || 'neutro';
    if (status === 'alterado') return 'border-red-500';
    if (status === 'normal') return 'border-green-500';
    return '';
  };

  const renderValidationMessage = (parametro: string) => {
    const v = validationStates[parametro];
    if (!v || v.status !== 'alterado') return null;
    return <p className="text-xs text-red-600 mt-1">{v.nomeAlteracao}</p>;
  };

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
          <div className="h-full space-y-4">
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

            <Accordion type="multiple" className="w-full">
              {/* Sinais Vitais - Inputs numéricos com validação em tempo real */}
              <AccordionItem value="sinais-vitais">
                <AccordionTrigger className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Sinais Vitais
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sinaisVitais.map((sinal) => (
                      <div key={sinal.id} className="space-y-2">
                        <label className="text-sm font-medium">
                          {sinal.sinalVitalNome} ({sinal.unidadeMedida})
                        </label>
                        <Input
                          type="number"
                          placeholder="Digite o valor"
                          value={processo.avaliacao?.exameFisico?.[sinal.sinalVitalNome] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const validation = getNumericValidation(sinal.sinalVitalNome, val, 'sinal');
                            updateAvaliacaoAtomic(sinal.sinalVitalNome, val, validation);
                          }}
                          className={getInputClassName(sinal.sinalVitalNome)}
                        />
                        {renderValidationMessage(sinal.sinalVitalNome)}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Exames Diagnósticos - Diferenciar Laboratorial (Input) e Imagem (Combobox) */}
              <AccordionItem value="exames-diagnosticos">
                <AccordionTrigger className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Exames Diagnósticos
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {exames.map((exame) => (
                      <div key={exame.id} className="space-y-3">
                        <h4 className="font-medium text-sm">{exame.nomeExame}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
                          {exame.componentes.map((componente, idx) => {
                            const parametro = componente.componenteAnalisado;
                            const valorAtual = processo.avaliacao?.exameFisico?.[parametro] || '';

                            // Exame de Imagem -> Combobox com resultadoClassificatorio
                            if (exame.tipoExame === 'Imagem') {
                              const opcoes = Array.from(
                                new Set(
                                  (componente.resultados || [])
                                    .map((r) => r.resultadoClassificatorio)
                                    .filter((r): r is string => !!r)
                                )
                              ).map((r) => ({ value: r, label: r }));

                              return (
                                <div key={idx} className="space-y-2">
                                  <label className="text-sm font-medium">
                                    {parametro}
                                  </label>
                                  <Combobox
                                    options={opcoes}
                                    value={String(valorAtual)}
                                    onValueChange={(selected) => {
                                      const validation = getImagemValidation(parametro, selected);
                                      updateAvaliacaoAtomic(parametro, selected, validation);
                                    }}
                                    placeholder="Selecione o resultado..."
                                    searchPlaceholder="Buscar resultado..."
                                    className={getInputClassName(parametro)}
                                  />
                                  {renderValidationMessage(parametro)}
                                </div>
                              );
                            }

                            // Exame Laboratorial -> Input numérico
                            return (
                              <div key={idx} className="space-y-2">
                                <label className="text-sm font-medium">
                                  {parametro} ({componente.unidadeMedida})
                                </label>
                                <Input
                                  type="number"
                                  placeholder="Digite o resultado"
                                  value={valorAtual}
                                  onChange={(e) => {
                                    const val = e.target.value;
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

              {/* Revisão de Sistemas - Combobox para achados propedêuticos */}
              <AccordionItem value="revisao-sistemas">
                <AccordionTrigger className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Revisão de Sistemas
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {sistemas.map((sistema) => (
                      <div key={sistema.id} className="space-y-3">
                        <h4 className="font-medium text-sm">{sistema.nomeSistema}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
                          {sistema.exames.map((exame, idx) => {
                            const parametro = exame.nomeExame;
                            const valorAtual = processo.avaliacao?.exameFisico?.[parametro] || '';

                            const opcoesAchados = (exame.achados || []).map((a) => ({
                              value: a.descricaoAchado,
                              label: a.descricaoAchado,
                            }));

                            return (
                              <div key={idx} className="space-y-2">
                                <label className="text-sm font-medium">
                                  {exame.nomeExame} - {exame.propedeutica}
                                </label>
                                <Combobox
                                  options={opcoesAchados}
                                  value={String(valorAtual)}
                                  onValueChange={(selected) => {
                                    const validation = getSistemaValidation(parametro, selected);
                                    updateAvaliacaoAtomic(parametro, selected, validation);
                                  }}
                                  placeholder="Selecione o achado..."
                                  searchPlaceholder="Buscar achado..."
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
            </Accordion>

            {nhbsAfetadas.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Necessidades Humanas Básicas Afetadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {nhbsAfetadas.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="font-medium">{item.parametro}:</span>
                        <span className="text-primary">{item.nhb}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EtapaAvaliacao;
