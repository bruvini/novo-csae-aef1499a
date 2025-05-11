
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, FileText, ChevronDown, ChevronUp, InfoIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useParametrosAvaliacao } from '@/hooks/use-parametros-avaliacao';
import { Paciente } from '@/types/paciente';

interface AvaliacaoEnfermagemProps {
  valor: string;
  onChange: (valor: string) => void;
  paciente?: Paciente;
  onNhbsAlteradas?: (nhbs: string[]) => void;
  onDiagnosticosAlterados?: (diagnosticos: string[]) => void;
}

export function AvaliacaoEnfermagem({
  valor,
  onChange,
  paciente,
  onNhbsAlteradas,
  onDiagnosticosAlterados
}: AvaliacaoEnfermagemProps) {
  const [activeTab, setActiveTab] = useState('entrevista');
  const [entrevista, setEntrevista] = useState('');
  
  // Estado para controle dos collapsibles
  const [openSections, setOpenSections] = useState({
    sinaisVitais: true,
    exames: false,
    sistemas: false
  });

  // NHBs sugeridas com base nos parâmetros alterados
  const [nhbsSelecionadas, setNhbsSelecionadas] = useState<string[]>([]);

  // Lista de possíveis NHBs
  const nhbs = [
    'Oxigenação',
    'Hidratação',
    'Nutrição',
    'Eliminação',
    'Sono e Repouso',
    'Exercício e Atividade Física',
    'Sexualidade',
    'Segurança Física',
    'Comunicação',
    'Gregária e Lazer',
    'Espiritualidade',
    'Espaço',
    'Regulação'
  ];
  
  // Uso do hook para buscar os parâmetros
  const {
    sinaisVitais,
    examesLaboratoriais,
    sistemasCorporais,
    revisoesSystem,
    loading,
    error,
    atualizarValor,
    valoresPreenchidos,
    getValoresAlterados
  } = useParametrosAvaliacao();

  // Preenche o valor do textarea quando o componente monta ou quando o valor é alterado externamente
  useEffect(() => {
    if (valor && entrevista === '') {
      setEntrevista(valor);
    }
  }, [valor]);

  // Atualiza o valor externo quando a entrevista é alterada
  useEffect(() => {
    onChange(entrevista);
  }, [entrevista, onChange]);
  
  // Atualiza as NHBs sugeridas quando os valores alterados mudam
  useEffect(() => {
    // Obter todos os valores alterados
    const alterados = getValoresAlterados();
    
    // Extrair todas as NHBs relacionadas aos valores alterados
    const todasNhbs = alterados.flatMap(val => val.nhbIds || []);
    
    // Remover duplicatas
    const nhbsUnicas = [...new Set(todasNhbs)];
    
    // Atualizar NHBs selecionadas
    setNhbsSelecionadas(prev => {
      // Manter NHBs que foram selecionadas manualmente e adicionar as novas
      const combinadas = [...prev, ...nhbsUnicas];
      return [...new Set(combinadas)];
    });
    
    // Notificar componente pai (se callback existir)
    if (onNhbsAlteradas) {
      onNhbsAlteradas(nhbsUnicas);
    }
    
    // Extrair todos os diagnósticos relacionados aos valores alterados
    const todosDiagnosticos = alterados.flatMap(val => val.diagnosticoIds || []);
    
    // Remover duplicatas
    const diagnosticosUnicos = [...new Set(todosDiagnosticos)];
    
    // Notificar componente pai (se callback existir)
    if (onDiagnosticosAlterados) {
      onDiagnosticosAlterados(diagnosticosUnicos);
    }
  }, [valoresPreenchidos, getValoresAlterados, onNhbsAlteradas, onDiagnosticosAlterados]);

  // Função para adicionar/remover NHBs da lista de selecionadas
  const toggleNHB = (nhb: string) => {
    setNhbsSelecionadas(prev => 
      prev.includes(nhb) 
        ? prev.filter(item => item !== nhb)
        : [...prev, nhb]
    );
    
    // Notificar componente pai (se callback existir)
    if (onNhbsAlteradas) {
      onNhbsAlteradas(
        nhbsSelecionadas.includes(nhb)
          ? nhbsSelecionadas.filter(item => item !== nhb)
          : [...nhbsSelecionadas, nhb]
      );
    }
  };

  // Função para verificar se um valor está alterado
  const isValorAlterado = (id: string) => {
    return valoresPreenchidos[id]?.alterado || false;
  };

  // Função para renderizar um campo de parâmetro
  const renderParametroInput = (
    parametro: any,
    id: string,
    tipoParametro: 'sinalVital' | 'exame' | 'revisaoSistema'
  ) => {
    const tipoValor = parametro.tipoValor || 'Numérico';
    const unidade = parametro.unidade || '';
    const valorPreenchido = valoresPreenchidos[id]?.valor || '';
    const alterado = isValorAlterado(id);
    
    // Função para atualizar o valor do parâmetro
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const novoValor = e.target.value;
      atualizarValor(
        id,
        parametro.id,
        parametro.nome,
        novoValor,
        tipoValor,
        unidade,
        paciente,
        parametro
      );
    };
    
    return (
      <div key={id} className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">
            {parametro.nome}:
            {alterado && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="ml-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-red-50 border border-red-200 text-red-800">
                    <p>{valoresPreenchidos[id]?.tituloAlteracao || 'Valor alterado'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </label>
        </div>
        <Input
          type={tipoValor === 'Numérico' ? 'number' : 'text'}
          placeholder={unidade ? `Digite o valor (${unidade})` : 'Digite o valor'}
          value={valorPreenchido}
          onChange={handleChange}
          className={alterado ? 'border-red-500 focus:border-red-500' : ''}
        />
      </div>
    );
  };

  // Abre o PDF do roteiro de exame físico em uma nova janela
  const abrirRoteiroPDF = () => {
    // URL do PDF será fornecida posteriormente
    window.open("#", "_blank");
  };

  return (
    <div className="space-y-6">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="entrevista">Entrevista</TabsTrigger>
          <TabsTrigger value="exameFisico">Exame Físico</TabsTrigger>
          <TabsTrigger value="nhb">Necessidades Humanas Básicas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="entrevista">
          <Card>
            <CardHeader>
              <CardTitle>Entrevista</CardTitle>
              <CardDescription>
                Registre os dados subjetivos coletados durante a entrevista com o paciente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Registre aqui as informações relatadas pelo paciente durante a entrevista..."
                className="min-h-[300px]"
                value={entrevista}
                onChange={(e) => setEntrevista(e.target.value)}
              />
            </CardContent>
          </Card>
          
          <div className="flex items-start p-4 bg-blue-50 rounded-md border border-blue-100 mt-4">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-blue-700">Dicas para uma boa entrevista:</h4>
              <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
                <li>Inicie apresentando-se e explicando o propósito da entrevista</li>
                <li>Utilize perguntas abertas para obter mais informações</li>
                <li>Escute atentamente, demonstrando interesse genuíno</li>
                <li>Mantenha uma postura não julgadora</li>
                <li>Confirme sua compreensão resumindo o que ouviu</li>
                <li>Registre detalhes como data de início dos sintomas e fatores de alívio/piora</li>
              </ul>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="exameFisico">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Exame Físico</CardTitle>
                  <CardDescription>
                    Registre os dados objetivos coletados durante o exame físico
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={abrirRoteiroPDF}
                  className="flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Roteiro de Exame Físico
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
                </div>
              ) : (
                <>
                  {/* Sinais Vitais */}
                  <Collapsible
                    open={openSections.sinaisVitais}
                    onOpenChange={() => setOpenSections(prev => ({ ...prev, sinaisVitais: !prev.sinaisVitais }))}
                    className="border rounded-md overflow-hidden"
                  >
                    <CollapsibleTrigger className="flex w-full justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <h3 className="font-medium">Sinais Vitais</h3>
                      {openSections.sinaisVitais ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 border-t">
                      {sinaisVitais.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sinaisVitais.map((sinal) => (
                            renderParametroInput(
                              sinal,
                              `sinal-${sinal.id}`,
                              'sinalVital'
                            )
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          Não há sinais vitais cadastrados no sistema.
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                  
                  {/* Exames Laboratoriais/Imagem */}
                  <Collapsible
                    open={openSections.exames}
                    onOpenChange={() => setOpenSections(prev => ({ ...prev, exames: !prev.exames }))}
                    className="border rounded-md overflow-hidden"
                  >
                    <CollapsibleTrigger className="flex w-full justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <h3 className="font-medium">Exames Laboratoriais/Imagem</h3>
                      {openSections.exames ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 border-t">
                      {examesLaboratoriais.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {examesLaboratoriais.map((exame) => (
                            <div key={exame.id} className="mb-4">
                              <h4 className="font-medium text-sm mb-2">{exame.nome}</h4>
                              <div className="grid grid-cols-1 gap-3">
                                {exame.valoresReferencia?.map((valor, index) => (
                                  renderParametroInput(
                                    valor,
                                    `exame-${exame.id}-${index}`,
                                    'exame'
                                  )
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          Não há exames laboratoriais/imagem cadastrados no sistema.
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                  
                  {/* Revisão por Sistemas */}
                  <Collapsible
                    open={openSections.sistemas}
                    onOpenChange={() => setOpenSections(prev => ({ ...prev, sistemas: !prev.sistemas }))}
                    className="border rounded-md overflow-hidden"
                  >
                    <CollapsibleTrigger className="flex w-full justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <h3 className="font-medium">Revisão por Sistemas</h3>
                      {openSections.sistemas ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 border-t">
                      {sistemasCorporais.length > 0 ? (
                        <div className="space-y-6">
                          {sistemasCorporais.map(sistema => {
                            // Filtrar revisões para este sistema
                            const revisoesSistema = revisoesSystem?.filter(
                              r => r.sistemaId === sistema.id
                            ) || [];
                            
                            if (revisoesSistema.length === 0) return null;
                            
                            return (
                              <div key={sistema.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                                <h3 className="font-medium mb-3">{sistema.nome}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {revisoesSistema.map(revisao => (
                                    <div key={revisao.id}>
                                      <h4 className="text-sm font-medium mb-2">{revisao.titulo || revisao.nome}</h4>
                                      {revisao.valoresReferencia?.map((valor, idx) => (
                                        renderParametroInput(
                                          valor,
                                          `revisao-${revisao.id}-${idx}`,
                                          'revisaoSistema'
                                        )
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          Não há sistemas corporais cadastrados no sistema.
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}
              
              {error && (
                <div className="p-4 border border-red-200 bg-red-50 text-red-800 rounded-md">
                  <p className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" /> 
                    {error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="nhb">
          <Card>
            <CardHeader>
              <CardTitle>Necessidades Humanas Básicas (NHB) Afetadas</CardTitle>
              <CardDescription>
                Selecione as necessidades afetadas que serão abordadas no diagnóstico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                {nhbs.map(nhb => (
                  <Badge
                    key={nhb}
                    variant={nhbsSelecionadas.includes(nhb) ? "default" : "outline"}
                    className={`cursor-pointer px-3 py-1.5 text-sm ${
                      nhbsSelecionadas.includes(nhb) 
                        ? 'bg-csae-green-600 hover:bg-csae-green-700' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => toggleNHB(nhb)}
                  >
                    {nhb}
                  </Badge>
                ))}
              </div>
              
              {getValoresAlterados().length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-md mb-6">
                  <p className="text-sm text-yellow-800 flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 text-yellow-600 flex-shrink-0" />
                    <span>
                      <strong className="font-medium">NHBs sugeridas com base em alterações:</strong> As NHBs destacadas 
                      foram sugeridas automaticamente com base nas alterações identificadas durante a avaliação.
                    </span>
                  </p>
                </div>
              )}
              
              {nhbsSelecionadas.length > 0 ? (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">NHBs selecionadas ({nhbsSelecionadas.length}):</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    {nhbsSelecionadas.map(nhb => (
                      <li key={nhb}>{nhb}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 border border-dashed rounded-md">
                  Nenhuma NHB selecionada. As NHBs selecionadas aqui aparecerão automaticamente 
                  nos diagnósticos de enfermagem da próxima etapa.
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex items-start p-4 bg-blue-50 rounded-md border border-blue-100 mt-4">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p>As Necessidades Humanas Básicas (NHB) constituem a base para o diagnóstico de enfermagem. Ao identificar as NHBs afetadas, você poderá direcionar melhor seu planejamento de cuidados.</p>
              <p className="mt-2">Na próxima etapa, estas NHBs já estarão pré-selecionadas para facilitar a escolha dos diagnósticos relacionados.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
