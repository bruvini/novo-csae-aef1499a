
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  XCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle
} from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

// Tipos
interface DiagnosticoItem {
  id: string;
  descricao: string;
  selecionado: boolean;
  subconjunto: string;
  explicacao?: string;
}

interface DiagnosticoEnfermagemProps {
  diagnosticos: DiagnosticoItem[];
  setDiagnosticos: React.Dispatch<React.SetStateAction<DiagnosticoItem[]>>;
  nhbsSelecionadas?: string[];
}

export function DiagnosticoEnfermagem({ 
  diagnosticos, 
  setDiagnosticos,
  nhbsSelecionadas = []
}: DiagnosticoEnfermagemProps) {
  const [busca, setBusca] = useState('');
  const [subconjuntosSelecionados, setSubconjuntosSelecionados] = useState<string[]>([]);
  
  // Dados de exemplo - em produção virão do Firestore
  const protocolos = [
    { id: 'hipertensao', nome: 'Hipertensão Arterial Sistêmica' },
    { id: 'diabetes', nome: 'Diabetes Mellitus' },
    { id: 'pre-natal', nome: 'Pré-natal de Baixo Risco' },
    { id: 'saude-mental', nome: 'Saúde Mental' },
    { id: 'tabagismo', nome: 'Programa de Controle do Tabagismo' },
  ];
  
  const necessidadesHumanas = [
    { id: 'oxigenacao', nome: 'Oxigenação' },
    { id: 'hidratacao', nome: 'Hidratação' },
    { id: 'nutricao', nome: 'Nutrição' },
    { id: 'eliminacao', nome: 'Eliminação' },
    { id: 'sono-repouso', nome: 'Sono e Repouso' },
    { id: 'atividade-fisica', nome: 'Exercício e Atividade Física' },
    { id: 'sexualidade', nome: 'Sexualidade' },
    { id: 'seguranca', nome: 'Segurança Física' },
    { id: 'comunicacao', nome: 'Comunicação' },
    { id: 'gregaria-lazer', nome: 'Gregária e Lazer' },
    { id: 'espiritualidade', nome: 'Espiritualidade' },
    { id: 'espaco', nome: 'Espaço' },
    { id: 'regulacao', nome: 'Regulação' },
  ];
  
  // Diagnósticos de exemplo - em produção virão do Firestore
  const diagnosticosExemplo = [
    // Protocolos
    { id: "1", descricao: "Risco de pressão arterial instável", selecionado: false, subconjunto: "Hipertensão Arterial Sistêmica", explicacao: "Suscetibilidade a forças que fazem com que a pressão arterial média seja inferior ou superior aos limites normais, que pode comprometer a saúde." },
    { id: "2", descricao: "Risco de complicações associadas à hipertensão", selecionado: false, subconjunto: "Hipertensão Arterial Sistêmica", explicacao: "Suscetibilidade a desenvolver problemas como IAM, AVE, insuficiência renal devido à hipertensão não controlada." },
    { id: "3", descricao: "Conhecimento deficiente sobre regime terapêutico", selecionado: false, subconjunto: "Hipertensão Arterial Sistêmica", explicacao: "Ausência ou deficiência de informação cognitiva relacionada ao tratamento medicamentoso e não medicamentoso." },
    
    { id: "4", descricao: "Risco de glicemia instável", selecionado: false, subconjunto: "Diabetes Mellitus", explicacao: "Suscetibilidade a episódios de hiperglicemia ou hipoglicemia que comprometem a saúde." },
    { id: "5", descricao: "Risco de infecção", selecionado: false, subconjunto: "Diabetes Mellitus", explicacao: "Suscetibilidade a invasão e multiplicação de organismos patogênicos devido à resistência diminuída e cicatrização comprometida." },
    
    // NHBs
    { id: "6", descricao: "Padrão respiratório ineficaz", selecionado: false, subconjunto: "Oxigenação", explicacao: "Inspiração e/ou expiração que não proporciona ventilação adequada." },
    { id: "7", descricao: "Troca de gases prejudicada", selecionado: false, subconjunto: "Oxigenação", explicacao: "Excesso ou déficit na oxigenação e/ou na eliminação de dióxido de carbono na membrana alveolocapilar." },
    
    { id: "8", descricao: "Volume de líquidos deficiente", selecionado: false, subconjunto: "Hidratação", explicacao: "Diminuição do líquido intravascular, intersticial e/ou intracelular." },
    { id: "9", descricao: "Risco de desequilíbrio eletrolítico", selecionado: false, subconjunto: "Hidratação", explicacao: "Suscetibilidade a mudanças nos níveis de eletrólitos séricos, que podem comprometer a saúde." },
    
    { id: "10", descricao: "Nutrição desequilibrada: menos do que as necessidades corporais", selecionado: false, subconjunto: "Nutrição", explicacao: "Ingestão de nutrientes insuficiente para satisfazer as necessidades metabólicas." },
    { id: "11", descricao: "Risco de glicemia instável", selecionado: false, subconjunto: "Nutrição", explicacao: "Suscetibilidade a alterações nos níveis sanguíneos de glicose, que podem comprometer a saúde." },
    
    { id: "12", descricao: "Eliminação urinária prejudicada", selecionado: false, subconjunto: "Eliminação", explicacao: "Disfunção na eliminação de urina." },
    { id: "13", descricao: "Constipação", selecionado: false, subconjunto: "Eliminação", explicacao: "Diminuição na frequência normal de evacuação, acompanhada por eliminação difícil ou incompleta de fezes e/ou eliminação de fezes excessivamente duras e secas." },
    
    { id: "14", descricao: "Insônia", selecionado: false, subconjunto: "Sono e Repouso", explicacao: "Distúrbio na quantidade e qualidade do sono que prejudica o funcionamento normal." },
    { id: "15", descricao: "Fadiga", selecionado: false, subconjunto: "Sono e Repouso", explicacao: "Sensação opressiva e sustentada de exaustão e de capacidade diminuída para realizar trabalho físico e mental." },
  ];
  
  // Inicializar os diagnósticos na primeira renderização
  useEffect(() => {
    if (diagnosticos.length === 0) {
      setDiagnosticos(diagnosticosExemplo);
    }
    
    // Selecionar automaticamente os diagnósticos das NHBs selecionadas na etapa anterior
    if (nhbsSelecionadas.length > 0) {
      setDiagnosticos(prev => 
        prev.map(d => {
          const nhbEquivalente = necessidadesHumanas.find(
            nhb => nhb.nome === d.subconjunto && nhbsSelecionadas.includes(nhb.nome)
          );
          
          if (nhbEquivalente) {
            return { ...d, selecionado: true };
          }
          return d;
        })
      );
      
      // Atualizar subconjuntos selecionados para incluir as NHBs
      setSubconjuntosSelecionados(['Protocolos de Enfermagem', 'Necessidades Humanas Básicas']);
    }
  }, [diagnosticos.length, nhbsSelecionadas, setDiagnosticos]);
  
  // Agrupar diagnósticos por subconjunto
  const diagnosticosAgrupados = diagnosticos.reduce<Record<string, DiagnosticoItem[]>>((acc, diagnostico) => {
    if (!acc[diagnostico.subconjunto]) {
      acc[diagnostico.subconjunto] = [];
    }
    acc[diagnostico.subconjunto].push(diagnostico);
    return acc;
  }, {});
  
  // Filtrar diagnósticos com base na busca
  const filtrarDiagnosticos = (diagnosticos: DiagnosticoItem[]) => {
    if (!busca) return diagnosticos;
    return diagnosticos.filter(d => 
      d.descricao.toLowerCase().includes(busca.toLowerCase()) || 
      d.subconjunto.toLowerCase().includes(busca.toLowerCase())
    );
  };
  
  // Selecionar/desselecionar um diagnóstico
  const toggleDiagnostico = (id: string) => {
    setDiagnosticos(prev => 
      prev.map(d => 
        d.id === id ? { ...d, selecionado: !d.selecionado } : d
      )
    );
  };
  
  // Remover diagnóstico da seleção
  const removerDiagnostico = (id: string) => {
    toggleDiagnostico(id);
  };
  
  // Alternar seleção de subconjunto
  const toggleSubconjunto = (nome: string) => {
    setSubconjuntosSelecionados(prev => 
      prev.includes(nome) 
        ? prev.filter(s => s !== nome) 
        : [...prev, nome]
    );
  };
  
  // Verificar se um subconjunto está selecionado
  const isSubconjuntoSelecionado = (nome: string) => {
    return subconjuntosSelecionados.includes(nome);
  };
  
  // Diagnósticos selecionados
  const diagnosticosSelecionados = diagnosticos.filter(d => d.selecionado);
  
  // Determinar quais protocolos e NHBs mostrar com base nos filtros
  const protocolosFiltrados = busca 
    ? protocolos.filter(p => {
        const diagnosticosDoProtocolo = diagnosticos.filter(d => 
          d.subconjunto === p.nome && 
          d.descricao.toLowerCase().includes(busca.toLowerCase())
        );
        return diagnosticosDoProtocolo.length > 0 || p.nome.toLowerCase().includes(busca.toLowerCase());
      })
    : protocolos;
  
  const nhbsFiltradas = busca 
    ? necessidadesHumanas.filter(n => {
        const diagnosticosDaNHB = diagnosticos.filter(d => 
          d.subconjunto === n.nome && 
          d.descricao.toLowerCase().includes(busca.toLowerCase())
        );
        return diagnosticosDaNHB.length > 0 || n.nome.toLowerCase().includes(busca.toLowerCase());
      })
    : necessidadesHumanas;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Diagnósticos de Enfermagem</CardTitle>
          <CardDescription>
            Identifique os diagnósticos de enfermagem relevantes para este paciente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Subconjuntos */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isSubconjuntoSelecionado('Protocolos de Enfermagem') ? "default" : "outline"}
              className={isSubconjuntoSelecionado('Protocolos de Enfermagem') ? "bg-csae-green-600" : ""}
              onClick={() => toggleSubconjunto('Protocolos de Enfermagem')}
            >
              Protocolos de Enfermagem
            </Button>
            <Button
              variant={isSubconjuntoSelecionado('Necessidades Humanas Básicas') ? "default" : "outline"}
              className={isSubconjuntoSelecionado('Necessidades Humanas Básicas') ? "bg-csae-green-600" : ""}
              onClick={() => toggleSubconjunto('Necessidades Humanas Básicas')}
            >
              Necessidades Humanas Básicas
            </Button>
          </div>
          
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar diagnósticos..."
              className="pl-9"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setBusca('')}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Subconjuntos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Protocolos de Enfermagem */}
            {isSubconjuntoSelecionado('Protocolos de Enfermagem') && (
              <Card className="overflow-hidden h-[400px] flex flex-col">
                <CardHeader className="p-4 bg-gray-50">
                  <CardTitle className="text-lg">Protocolos de Enfermagem</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-y-auto flex-grow">
                  <Accordion type="multiple" className="w-full">
                    {protocolosFiltrados.length > 0 ? (
                      protocolosFiltrados.map(protocolo => (
                        <AccordionItem key={protocolo.id} value={protocolo.id} className="border-b">
                          <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-sm font-medium">
                            {protocolo.nome}
                          </AccordionTrigger>
                          <AccordionContent className="p-0">
                            <div className="p-4 space-y-3 bg-gray-50">
                              {filtrarDiagnosticos(
                                diagnosticos.filter(d => d.subconjunto === protocolo.nome)
                              ).length > 0 ? (
                                filtrarDiagnosticos(
                                  diagnosticos.filter(d => d.subconjunto === protocolo.nome)
                                ).map(diagnostico => (
                                  <div
                                    key={diagnostico.id}
                                    className="flex items-start space-x-2 p-2 rounded border border-gray-200 bg-white"
                                  >
                                    <Checkbox
                                      id={`diagnostico-${diagnostico.id}`}
                                      checked={diagnostico.selecionado}
                                      onCheckedChange={() => toggleDiagnostico(diagnostico.id)}
                                      className="mt-1"
                                    />
                                    <div className="flex-grow">
                                      <div className="flex items-center">
                                        <Label
                                          htmlFor={`diagnostico-${diagnostico.id}`}
                                          className="cursor-pointer flex-grow pr-2"
                                        >
                                          {diagnostico.descricao}
                                        </Label>
                                        {diagnostico.explicacao && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                                                  <HelpCircle className="h-4 w-4 text-gray-500" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-sm">
                                                <p>{diagnostico.explicacao}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-2 text-gray-500">
                                  Nenhum diagnóstico encontrado neste protocolo.
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum protocolo encontrado com este termo de busca.
                      </div>
                    )}
                  </Accordion>
                </CardContent>
              </Card>
            )}
            
            {/* Necessidades Humanas Básicas */}
            {isSubconjuntoSelecionado('Necessidades Humanas Básicas') && (
              <Card className="overflow-hidden h-[400px] flex flex-col">
                <CardHeader className="p-4 bg-gray-50">
                  <CardTitle className="text-lg">Necessidades Humanas Básicas</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-y-auto flex-grow">
                  <Accordion type="multiple" className="w-full">
                    {nhbsFiltradas.length > 0 ? (
                      nhbsFiltradas.map(nhb => (
                        <AccordionItem 
                          key={nhb.id} 
                          value={nhb.id} 
                          className={`border-b ${
                            nhbsSelecionadas.includes(nhb.nome) ? 'bg-csae-green-50' : ''
                          }`}
                        >
                          <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 text-sm font-medium">
                            <span className="flex items-center">
                              {nhb.nome}
                              {nhbsSelecionadas.includes(nhb.nome) && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs bg-csae-green-100 text-csae-green-800 rounded-full">
                                  Selecionada
                                </span>
                              )}
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="p-0">
                            <div className="p-4 space-y-3 bg-gray-50">
                              {filtrarDiagnosticos(
                                diagnosticos.filter(d => d.subconjunto === nhb.nome)
                              ).length > 0 ? (
                                filtrarDiagnosticos(
                                  diagnosticos.filter(d => d.subconjunto === nhb.nome)
                                ).map(diagnostico => (
                                  <div
                                    key={diagnostico.id}
                                    className="flex items-start space-x-2 p-2 rounded border border-gray-200 bg-white"
                                  >
                                    <Checkbox
                                      id={`diagnostico-${diagnostico.id}`}
                                      checked={diagnostico.selecionado}
                                      onCheckedChange={() => toggleDiagnostico(diagnostico.id)}
                                      className="mt-1"
                                    />
                                    <div className="flex-grow">
                                      <div className="flex items-center">
                                        <Label
                                          htmlFor={`diagnostico-${diagnostico.id}`}
                                          className="cursor-pointer flex-grow pr-2"
                                        >
                                          {diagnostico.descricao}
                                        </Label>
                                        {diagnostico.explicacao && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                                                  <HelpCircle className="h-4 w-4 text-gray-500" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-sm">
                                                <p>{diagnostico.explicacao}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-2 text-gray-500">
                                  Nenhum diagnóstico encontrado nesta NHB.
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Nenhuma NHB encontrada com este termo de busca.
                      </div>
                    )}
                  </Accordion>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Diagnósticos Selecionados */}
          <Card>
            <CardHeader className="p-4 bg-gray-50">
              <CardTitle className="text-lg">Diagnósticos Selecionados ({diagnosticosSelecionados.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {diagnosticosSelecionados.length > 0 ? (
                <div className="space-y-2">
                  {diagnosticosSelecionados.map(diagnostico => (
                    <div 
                      key={diagnostico.id}
                      className="flex justify-between items-center p-3 rounded-md border border-csae-green-200 bg-csae-green-50"
                    >
                      <span>
                        <span className="font-medium text-csae-green-700">{diagnostico.subconjunto}</span>
                        <span className="mx-2">-</span>
                        <span>{diagnostico.descricao}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removerDiagnostico(diagnostico.id)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border border-dashed rounded-md">
                  Nenhum diagnóstico selecionado. Selecione pelo menos um para continuar.
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-blue-50 rounded-md border border-blue-100 flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-700">Diagnósticos selecionados: {diagnosticosSelecionados.length}</h4>
          {diagnosticosSelecionados.length === 0 ? (
            <p className="mt-1 text-sm text-blue-700">
              Selecione pelo menos um diagnóstico para continuar para a próxima etapa.
            </p>
          ) : (
            <p className="mt-1 text-sm text-blue-700">
              Você selecionou {diagnosticosSelecionados.length} diagnóstico(s). 
              Na próxima etapa, será possível estabelecer resultados esperados e intervenções para cada um deles.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
