
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

interface AvaliacaoEnfermagemProps {
  valor: string;
  onChange: (valor: string) => void;
}

export function AvaliacaoEnfermagem({ valor, onChange }: AvaliacaoEnfermagemProps) {
  const [activeTab, setActiveTab] = useState('entrevista');
  const [entrevista, setEntrevista] = useState('');
  
  // Estado para os outros campos
  const [sinaisVitais, setSinaisVitais] = useState<Record<string, string>>({
    'Temperatura': '',
    'Frequência Cardíaca': '', 
    'Pressão Arterial': '',
    'Frequência Respiratória': '',
    'Saturação de O2': '',
    'Glicemia Capilar': '',
  });

  const [exames, setExames] = useState<Record<string, string>>({});
  const [sistemas, setSistemas] = useState<Record<string, string>>({});

  // Estado para controle dos collapsibles
  const [openSections, setOpenSections] = useState({
    sinaisVitais: true,
    exames: false,
    sistemas: false
  });

  // NHBs sugeridas com base nos campos preenchidos
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

  // Preenche o valor do textarea quando o componente monta ou quando o valor é alterado externamente
  React.useEffect(() => {
    if (valor && entrevista === '') {
      setEntrevista(valor);
    }
  }, [valor]);

  // Atualiza o valor externo quando a entrevista é alterada
  React.useEffect(() => {
    onChange(entrevista);
  }, [entrevista, onChange]);

  // Função para atualizar os sinais vitais
  const handleSinalVitalChange = (nome: string, valor: string) => {
    setSinaisVitais(prev => ({
      ...prev,
      [nome]: valor
    }));
  };

  // Função para adicionar/remover NHBs da lista de selecionadas
  const toggleNHB = (nhb: string) => {
    setNhbsSelecionadas(prev => 
      prev.includes(nhb) 
        ? prev.filter(item => item !== nhb)
        : [...prev, nhb]
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.keys(sinaisVitais).map(nome => (
                      <div key={nome} className="space-y-2">
                        <label className="text-sm font-medium">{nome}:</label>
                        <Input
                          value={sinaisVitais[nome]}
                          onChange={(e) => handleSinalVitalChange(nome, e.target.value)}
                          placeholder={`Digite o valor de ${nome}`}
                        />
                      </div>
                    ))}
                  </div>
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
                  <div className="text-center py-4 text-gray-500">
                    Não há campos cadastrados para esta seção. 
                    Os exames serão configurados pelo administrador posteriormente.
                  </div>
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
                  <div className="text-center py-4 text-gray-500">
                    Não há campos cadastrados para esta seção. 
                    Os sistemas serão configurados pelo administrador posteriormente.
                  </div>
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
