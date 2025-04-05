
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { SinalVital, ExameLaboratorial, RevisaoSistema, NHB, DiagnosticoCompleto } from '@/services/bancodados/tipos';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';

interface AvaliacaoEnfermagemProps {
  valor: string;
  onChange: (valor: string) => void;
  onNhbsAfetadasChange?: (nhbs: string[]) => void;
  onDiagnosticosPreSelecionadosChange?: (diagnosticos: any[]) => void;
}

export function AvaliacaoEnfermagem({ 
  valor, 
  onChange, 
  onNhbsAfetadasChange,
  onDiagnosticosPreSelecionadosChange
}: AvaliacaoEnfermagemProps) {
  const [activeTab, setActiveTab] = useState('entrevista');
  const [entrevista, setEntrevista] = useState('');
  
  // Estado para os dados do Firestore
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [examesLaboratoriais, setExamesLaboratoriais] = useState<ExameLaboratorial[]>([]);
  const [sistemasRevisao, setSistemasRevisao] = useState<RevisaoSistema[]>([]);
  const [nhbs, setNhbs] = useState<NHB[]>([]);
  const [diagnosticosEnfermagem, setDiagnosticosEnfermagem] = useState<DiagnosticoCompleto[]>([]);
  
  // Estado para armazenar valores dos campos
  const [valoresSinaisVitais, setValoresSinaisVitais] = useState<Record<string, string>>({});
  const [valoresExames, setValoresExames] = useState<Record<string, string>>({});
  const [valoresSistemas, setValoresSistemas] = useState<Record<string, string>>({});
  
  // Estado para NHBs afetadas e diagnósticos selecionados
  const [nhbsAfetadas, setNhbsAfetadas] = useState<string[]>([]);
  const [diagnosticosSelecionados, setDiagnosticosSelecionados] = useState<string[]>([]);
  
  // Estado para controle dos collapsibles
  const [openSections, setOpenSections] = useState({
    sinaisVitais: true,
    exames: false,
    sistemas: false
  });
  
  // Estado para loading dos dados
  const [loading, setLoading] = useState({
    sinaisVitais: true,
    exames: true,
    sistemas: true,
    nhbs: true,
    diagnosticos: true
  });
  
  // Função para buscar dados do Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar sinais vitais
        const sinaisVitaisSnapshot = await getDocs(collection(db, 'sinaisVitais'));
        const sinaisVitaisData = sinaisVitaisSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as SinalVital[];
        setSinaisVitais(sinaisVitaisData);
        setLoading(prev => ({ ...prev, sinaisVitais: false }));
        
        // Inicializar objeto de valores para sinais vitais
        const initialSinaisVitais: Record<string, string> = {};
        sinaisVitaisData.forEach(sinal => {
          initialSinaisVitais[sinal.id!] = '';
        });
        setValoresSinaisVitais(initialSinaisVitais);
        
        // Buscar exames laboratoriais
        const examesSnapshot = await getDocs(collection(db, 'examesLaboratoriais'));
        const examesData = examesSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as ExameLaboratorial[];
        setExamesLaboratoriais(examesData);
        setLoading(prev => ({ ...prev, exames: false }));
        
        // Inicializar objeto de valores para exames
        const initialExames: Record<string, string> = {};
        examesData.forEach(exame => {
          initialExames[exame.id!] = '';
        });
        setValoresExames(initialExames);
        
        // Buscar sistemas
        const sistemasSnapshot = await getDocs(collection(db, 'sistemasRevisao'));
        const sistemasData = sistemasSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as RevisaoSistema[];
        setSistemasRevisao(sistemasData);
        setLoading(prev => ({ ...prev, sistemas: false }));
        
        // Inicializar objeto de valores para sistemas
        const initialSistemas: Record<string, string> = {};
        sistemasData.forEach(sistema => {
          initialSistemas[sistema.id!] = '';
        });
        setValoresSistemas(initialSistemas);
        
        // Buscar NHBs
        const nhbsSnapshot = await getDocs(collection(db, 'nhbs'));
        const nhbsData = nhbsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as NHB[];
        setNhbs(nhbsData);
        setLoading(prev => ({ ...prev, nhbs: false }));
        
        // Buscar diagnósticos
        const diagnosticosSnapshot = await getDocs(collection(db, 'diagnosticos'));
        const diagnosticosData = diagnosticosSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as DiagnosticoCompleto[];
        setDiagnosticosEnfermagem(diagnosticosData);
        setLoading(prev => ({ ...prev, diagnosticos: false }));
        
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };
    
    fetchData();
  }, []);
  
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
  
  // Verificar alterações nos sinais vitais
  useEffect(() => {
    const nhbsAfetadasTemp = new Set<string>();
    const diagnosticosAfetados = new Set<string>();
    
    // Verificar sinais vitais alterados
    Object.entries(valoresSinaisVitais).forEach(([id, valor]) => {
      if (!valor) return;
      
      const sinalVital = sinaisVitais.find(s => s.id === id);
      if (!sinalVital) return;
      
      // Verificar se o valor está fora da faixa de referência
      const numericValue = parseFloat(valor);
      if (isNaN(numericValue)) return;
      
      sinalVital.valoresReferencia.forEach(ref => {
        // Verificar se o valor está fora da faixa
        const foraFaixa = (ref.valorMinimo !== undefined && numericValue < ref.valorMinimo) || 
                          (ref.valorMaximo !== undefined && numericValue > ref.valorMaximo);
        
        if (foraFaixa && ref.representaAlteracao && ref.diagnosticoId && ref.nhbId) {
          nhbsAfetadasTemp.add(ref.nhbId);
          diagnosticosAfetados.add(ref.diagnosticoId);
        }
      });
    });
    
    // Similar para exames laboratoriais
    Object.entries(valoresExames).forEach(([id, valor]) => {
      if (!valor) return;
      
      const exame = examesLaboratoriais.find(e => e.id === id);
      if (!exame) return;
      
      const numericValue = parseFloat(valor);
      if (isNaN(numericValue)) return;
      
      exame.valoresReferencia.forEach(ref => {
        const foraFaixa = (ref.valorMinimo !== undefined && numericValue < ref.valorMinimo) || 
                          (ref.valorMaximo !== undefined && numericValue > ref.valorMaximo);
        
        if (foraFaixa && ref.representaAlteracao && ref.diagnosticoId && ref.nhbId) {
          nhbsAfetadasTemp.add(ref.nhbId);
          diagnosticosAfetados.add(ref.diagnosticoId);
        }
      });
    });
    
    // Similar para sistemas
    Object.entries(valoresSistemas).forEach(([id, valor]) => {
      if (!valor) return;
      
      const sistema = sistemasRevisao.find(s => s.id === id);
      if (!sistema) return;
      
      const numericValue = parseFloat(valor);
      if (isNaN(numericValue)) return;
      
      sistema.valoresReferencia.forEach(ref => {
        const foraFaixa = (ref.valorMinimo !== undefined && numericValue < ref.valorMinimo) || 
                          (ref.valorMaximo !== undefined && numericValue > ref.valorMaximo);
        
        if (foraFaixa && ref.representaAlteracao && ref.diagnosticoId && ref.nhbId) {
          nhbsAfetadasTemp.add(ref.nhbId);
          diagnosticosAfetados.add(ref.diagnosticoId);
        }
      });
    });
    
    // Atualizar NHBs afetadas
    const nhbsAfetadasArray = Array.from(nhbsAfetadasTemp);
    setNhbsAfetadas(nhbsAfetadasArray);
    if (onNhbsAfetadasChange) {
      onNhbsAfetadasChange(nhbsAfetadasArray);
    }
    
    // Atualizar diagnósticos pré-selecionados
    const diagnosticosArray = Array.from(diagnosticosAfetados);
    setDiagnosticosSelecionados(diagnosticosArray);
    if (onDiagnosticosPreSelecionadosChange) {
      // Formatar diagnósticos para a próxima etapa
      const diagsFormatados = diagnosticosEnfermagem
        .filter(d => diagnosticosArray.includes(d.id!))
        .map(d => ({
          id: d.id!,
          descricao: d.descricao,
          selecionado: true
        }));
      
      onDiagnosticosPreSelecionadosChange(diagsFormatados);
    }
    
  }, [valoresSinaisVitais, valoresExames, valoresSistemas, sinaisVitais, examesLaboratoriais, sistemasRevisao, diagnosticosEnfermagem]);
  
  // Função para atualizar valores dos campos
  const handleSinalVitalChange = (id: string, valor: string) => {
    setValoresSinaisVitais(prev => ({
      ...prev,
      [id]: valor
    }));
  };
  
  const handleExameChange = (id: string, valor: string) => {
    setValoresExames(prev => ({
      ...prev,
      [id]: valor
    }));
  };
  
  const handleSistemaChange = (id: string, valor: string) => {
    setValoresSistemas(prev => ({
      ...prev,
      [id]: valor
    }));
  };
  
  // Abre o PDF do roteiro de exame físico em uma nova janela
  const abrirRoteiroPDF = () => {
    // URL do PDF será fornecida posteriormente
    window.open("#", "_blank");
  };
  
  // Renderizar cada sinal vital com seus campos adequados
  const renderSinaisVitais = () => {
    if (loading.sinaisVitais) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-csae-green-600" />
          <span className="ml-2">Carregando sinais vitais...</span>
        </div>
      );
    }
    
    if (sinaisVitais.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          Não há sinais vitais cadastrados no sistema.
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sinaisVitais.map(sinal => (
          <div key={sinal.id} className="space-y-2">
            <label className="text-sm font-medium">{sinal.nome}:</label>
            <Input
              value={valoresSinaisVitais[sinal.id!] || ''}
              onChange={(e) => handleSinalVitalChange(sinal.id!, e.target.value)}
              placeholder={`Digite o valor de ${sinal.nome}`}
            />
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizar exames laboratoriais
  const renderExamesLaboratoriais = () => {
    if (loading.exames) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-csae-green-600" />
          <span className="ml-2">Carregando exames laboratoriais...</span>
        </div>
      );
    }
    
    if (examesLaboratoriais.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          Não há exames laboratoriais cadastrados no sistema.
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {examesLaboratoriais.map(exame => (
          <div key={exame.id} className="space-y-2">
            <label className="text-sm font-medium">{exame.nome}:</label>
            <Input
              value={valoresExames[exame.id!] || ''}
              onChange={(e) => handleExameChange(exame.id!, e.target.value)}
              placeholder={`Digite o valor de ${exame.nome}`}
            />
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizar sistemas
  const renderSistemas = () => {
    if (loading.sistemas) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-csae-green-600" />
          <span className="ml-2">Carregando dados dos sistemas...</span>
        </div>
      );
    }
    
    if (sistemasRevisao.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          Não há sistemas cadastrados para revisão.
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sistemasRevisao.map(sistema => (
          <div key={sistema.id} className="space-y-2">
            <label className="text-sm font-medium">{sistema.nome}:</label>
            <Input
              value={valoresSistemas[sistema.id!] || ''}
              onChange={(e) => handleSistemaChange(sistema.id!, e.target.value)}
              placeholder={`Digite o valor para ${sistema.nome}`}
            />
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizar NHBs afetadas e diagnósticos relacionados
  const renderNhbsAfetadas = () => {
    if (loading.nhbs || loading.diagnosticos) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-csae-green-600" />
          <span className="ml-2">Carregando necessidades humanas básicas...</span>
        </div>
      );
    }
    
    if (nhbsAfetadas.length === 0) {
      return (
        <div className="text-center py-6 border border-dashed rounded-md">
          <p className="text-gray-500">Nenhuma NHB afetada identificada.</p>
          <p className="text-gray-500 text-sm mt-2">
            As NHBs serão automaticamente identificadas com base nos valores alterados 
            do exame físico e exames laboratoriais.
          </p>
        </div>
      );
    }
    
    // Filtrar NHBs afetadas
    const nhbsAfetadasData = nhbs.filter(nhb => nhbsAfetadas.includes(nhb.id!));
    
    // Buscar diagnósticos relacionados às NHBs afetadas
    const diagnosticosRelacionados = diagnosticosEnfermagem.filter(d => 
      d.subconjunto === 'Necessidades Humanas Básicas' && 
      nhbsAfetadas.includes(d.subitemId) &&
      diagnosticosSelecionados.includes(d.id!)
    );
    
    return (
      <div className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">NHBs afetadas identificadas:</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {nhbsAfetadasData.map((nhb) => (
              <Badge 
                key={nhb.id} 
                className="bg-csae-green-100 text-csae-green-800 hover:bg-csae-green-200"
              >
                {nhb.nome}
              </Badge>
            ))}
          </div>
        </div>
        
        {diagnosticosRelacionados.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Diagnósticos de enfermagem sugeridos:</h4>
            <div className="space-y-2">
              {diagnosticosRelacionados.map((diagnostico) => (
                <div 
                  key={diagnostico.id} 
                  className="flex items-center p-3 border rounded-md bg-csae-green-50"
                >
                  <div>
                    <p className="font-medium">{diagnostico.descricao}</p>
                    <p className="text-sm text-gray-500">
                      {nhbs.find(n => n.id === diagnostico.subitemId)?.nome}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
                  {renderSinaisVitais()}
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
                  {renderExamesLaboratoriais()}
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
                  {renderSistemas()}
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="nhb">
          <Card>
            <CardHeader>
              <CardTitle>Necessidades Humanas Básicas (NHB) Afetadas</CardTitle>
              <CardDescription>
                Aqui são exibidas as NHBs afetadas com base nos valores alterados do exame físico
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderNhbsAfetadas()}
            </CardContent>
          </Card>
          
          <div className="flex items-start p-4 bg-blue-50 rounded-md border border-blue-100 mt-4">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              <p>As Necessidades Humanas Básicas (NHB) afetadas foram identificadas automaticamente com base nos valores alterados no exame físico.</p>
              <p className="mt-2">Na próxima etapa, os diagnósticos relacionados a estas NHBs já estarão pré-selecionados para facilitar seu planejamento.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
