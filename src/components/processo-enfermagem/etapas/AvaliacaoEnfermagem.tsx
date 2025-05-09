
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  buscarSinaisVitais, 
  buscarExamesLaboratoriais,
  buscarSistemasCorporais,
  buscarRevisoesSistemas
} from '@/services/bancodados/index';
import { 
  SinalVital, 
  ExameLaboratorial, 
  SistemaCorporal, 
  RevisaoSistema 
} from '@/types';
import { Progress } from '@/components/ui/progress';
import LoadingOverlay from '@/components/LoadingOverlay';

interface AvaliacaoEnfermagemProps {
  valor: string;
  onChange: (valor: string) => void;
}

export function AvaliacaoEnfermagem({ valor, onChange }: AvaliacaoEnfermagemProps) {
  const [subjectiveData, setSubjectiveData] = useState('');
  const [objectiveData, setObjectiveData] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Estados para armazenar os dados do gerenciamento de conteúdos
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [examesLaboratoriais, setExamesLaboratoriais] = useState<ExameLaboratorial[]>([]);
  const [sistemasCorporais, setSistemasCorporais] = useState<SistemaCorporal[]>([]);
  const [revisoesSistemas, setRevisoesSistemas] = useState<RevisaoSistema[]>([]);

  // Carregar dados do banco
  useEffect(() => {
    const carregarDadosGerenciamento = async () => {
      setLoading(true);
      try {
        // Carregar sinais vitais
        const sinaisVitaisData = await buscarSinaisVitais();
        setSinaisVitais(sinaisVitaisData || []);
        
        // Carregar exames laboratoriais
        const examesLaboratoriaisData = await buscarExamesLaboratoriais();
        setExamesLaboratoriais(examesLaboratoriaisData || []);
        
        // Carregar sistemas corporais
        const sistemasCorporaisData = await buscarSistemasCorporais();
        setSistemasCorporais(sistemasCorporaisData || []);
        
        // Carregar revisões de sistemas
        const revisoesData = await buscarRevisoesSistemas();
        setRevisoesSistemas(revisoesData || []);
      } catch (error) {
        console.error('Erro ao carregar dados do gerenciamento:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosGerenciamento();
    
    // Se já existir valor, tentar desestruturar
    if (valor) {
      try {
        const dadosAvaliacao = JSON.parse(valor);
        if (dadosAvaliacao.subjetivo) setSubjectiveData(dadosAvaliacao.subjetivo);
        if (dadosAvaliacao.objetivo) setObjectiveData(dadosAvaliacao.objetivo);
      } catch (e) {
        // Se não for um JSON válido, usar como texto subjetivo
        setSubjectiveData(valor);
      }
    }
  }, []);

  // Atualizar o valor combinado quando os dados subjetivos ou objetivos mudarem
  useEffect(() => {
    const dadosCombinados = JSON.stringify({
      subjetivo: subjectiveData,
      objetivo: objectiveData
    });
    onChange(dadosCombinados);
  }, [subjectiveData, objectiveData]);

  const renderSinaisVitais = () => {
    if (sinaisVitais.length === 0) {
      return (
        <div className="text-center text-gray-500 py-4">
          Nenhum sinal vital cadastrado no gerenciamento de conteúdos.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sinaisVitais.map((sinalVital) => (
          <div key={sinalVital.id} className="space-y-2">
            <Label htmlFor={`sv-${sinalVital.id}`}>{sinalVital.nome}</Label>
            <Input 
              id={`sv-${sinalVital.id}`} 
              type={sinalVital.tipo === 'numerico' ? 'number' : 'text'}
              placeholder={`${sinalVital.nome}${sinalVital.unidade ? ` (${sinalVital.unidade})` : ''}`}
            />
            {sinalVital.valorReferencia && (
              <p className="text-xs text-gray-500">
                Ref: {sinalVital.valorReferencia}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderExamesLaboratoriais = () => {
    if (examesLaboratoriais.length === 0) {
      return (
        <div className="text-center text-gray-500 py-4">
          Nenhum exame laboratorial cadastrado no gerenciamento de conteúdos.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {examesLaboratoriais.map((exame) => (
          <div key={exame.id} className="space-y-2">
            <Label htmlFor={`ex-${exame.id}`}>{exame.nome}</Label>
            <Input 
              id={`ex-${exame.id}`} 
              type={exame.tipo === 'numerico' ? 'number' : 'text'}
              placeholder={`${exame.nome}${exame.unidade ? ` (${exame.unidade})` : ''}`}
            />
            {exame.valorReferencia && (
              <p className="text-xs text-gray-500">
                Ref: {exame.valorReferencia}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderRevisaoSistemas = () => {
    if (sistemasCorporais.length === 0) {
      return (
        <div className="text-center text-gray-500 py-4">
          Nenhum sistema corporal cadastrado no gerenciamento de conteúdos.
        </div>
      );
    }

    return sistemasCorporais.map((sistema) => {
      // Filtrar as revisões deste sistema
      const revisoesDoSistema = revisoesSistemas.filter(
        (revisao) => revisao.sistemaCorporalId === sistema.id
      );
      
      if (revisoesDoSistema.length === 0) {
        return null;
      }

      return (
        <Card key={sistema.id} className="mb-4">
          <CardContent className="pt-4">
            <h4 className="font-semibold text-lg mb-2">{sistema.nome}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {revisoesDoSistema.map((revisao) => (
                <div key={revisao.id} className="space-y-2">
                  <Label htmlFor={`rev-${revisao.id}`}>{revisao.nome}</Label>
                  <Input 
                    id={`rev-${revisao.id}`} 
                    type={revisao.tipo === 'numerico' ? 'number' : 'text'}
                    placeholder={revisao.nome}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  if (loading) {
    return <LoadingOverlay message="Carregando componentes do exame físico..." />;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="subjetivo" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="subjetivo" className="flex-1">Dados Subjetivos</TabsTrigger>
          <TabsTrigger value="exame-fisico" className="flex-1">Exame Físico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subjetivo" className="space-y-4 mt-4">
          <div>
            <Label htmlFor="queixa-principal" className="text-base font-semibold">
              Queixa principal e História da doença atual
            </Label>
            <Textarea 
              id="queixa-principal"
              placeholder="Descreva a queixa principal do paciente e a história da doença atual..."
              value={subjectiveData}
              onChange={(e) => setSubjectiveData(e.target.value)}
              className="min-h-[200px] mt-2"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="exame-fisico" className="space-y-6 mt-4">
          <Tabs defaultValue="sinais-vitais">
            <TabsList>
              <TabsTrigger value="sinais-vitais">Sinais Vitais</TabsTrigger>
              <TabsTrigger value="exames-laboratoriais">Exames Laboratoriais/Imagem</TabsTrigger>
              <TabsTrigger value="revisao-sistemas">Revisão por Sistemas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sinais-vitais" className="pt-4">
              {renderSinaisVitais()}
            </TabsContent>
            
            <TabsContent value="exames-laboratoriais" className="pt-4">
              {renderExamesLaboratoriais()}
            </TabsContent>
            
            <TabsContent value="revisao-sistemas" className="pt-4">
              {renderRevisaoSistemas()}
            </TabsContent>
          </Tabs>
          
          <div className="space-y-4 mt-4">
            <Label htmlFor="exame-fisico-texto" className="text-base font-semibold">
              Observações adicionais do exame físico
            </Label>
            <Textarea 
              id="exame-fisico-texto"
              placeholder="Registre aqui observações adicionais do exame físico..."
              value={objectiveData}
              onChange={(e) => setObjectiveData(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
