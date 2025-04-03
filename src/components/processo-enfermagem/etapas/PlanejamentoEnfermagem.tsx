
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Trash2, AlertCircle } from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface PlanejamentoEnfermagemProps {
  diagnosticos: Array<{
    id: string;
    descricao: string;
    selecionado: boolean;
  }>;
  planejamento: Array<{
    diagnosticoId: string;
    resultadoEsperado: string;
    intervencoes: string[];
  }>;
  setPlanejamento: React.Dispatch<React.SetStateAction<any[]>>;
}

export function PlanejamentoEnfermagem({ diagnosticos, planejamento, setPlanejamento }: PlanejamentoEnfermagemProps) {
  // Inicializar planejamento para cada diagnóstico selecionado que ainda não tenha um plano
  useEffect(() => {
    const diagnosticosComPlanejamento = planejamento.map(p => p.diagnosticoId);
    
    const novosPlanejamentos = diagnosticos
      .filter(d => !diagnosticosComPlanejamento.includes(d.id))
      .map(d => ({
        diagnosticoId: d.id,
        resultadoEsperado: '',
        intervencoes: []
      }));
    
    if (novosPlanejamentos.length > 0) {
      setPlanejamento(prev => [...prev, ...novosPlanejamentos]);
    }
  }, [diagnosticos, planejamento, setPlanejamento]);

  const atualizarResultadoEsperado = (diagnosticoId: string, valor: string) => {
    setPlanejamento(prev => 
      prev.map(p => 
        p.diagnosticoId === diagnosticoId 
          ? { ...p, resultadoEsperado: valor } 
          : p
      )
    );
  };

  const adicionarIntervencao = (diagnosticoId: string) => {
    setPlanejamento(prev => 
      prev.map(p => 
        p.diagnosticoId === diagnosticoId 
          ? { ...p, intervencoes: [...p.intervencoes, ''] } 
          : p
      )
    );
  };

  const atualizarIntervencao = (diagnosticoId: string, index: number, valor: string) => {
    setPlanejamento(prev => 
      prev.map(p => {
        if (p.diagnosticoId === diagnosticoId) {
          const novasIntervencoes = [...p.intervencoes];
          novasIntervencoes[index] = valor;
          return { ...p, intervencoes: novasIntervencoes };
        }
        return p;
      })
    );
  };

  const removerIntervencao = (diagnosticoId: string, index: number) => {
    setPlanejamento(prev => 
      prev.map(p => {
        if (p.diagnosticoId === diagnosticoId) {
          const novasIntervencoes = [...p.intervencoes];
          novasIntervencoes.splice(index, 1);
          return { ...p, intervencoes: novasIntervencoes };
        }
        return p;
      })
    );
  };

  const verificarPlanejamentoCompleto = () => {
    return diagnosticos.every(d => {
      const plano = planejamento.find(p => p.diagnosticoId === d.id);
      return plano && plano.resultadoEsperado && plano.intervencoes.length > 0 && 
             plano.intervencoes.every(i => i.trim());
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planejamento de Enfermagem</CardTitle>
          <CardDescription>
            Defina os resultados esperados e as intervenções para cada diagnóstico identificado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-4">
            {diagnosticos.map((diagnostico) => {
              const plano = planejamento.find(p => p.diagnosticoId === diagnostico.id);
              
              return (
                <AccordionItem 
                  key={diagnostico.id} 
                  value={diagnostico.id}
                  className="border rounded-md overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center text-left">
                      <span className="font-medium">{diagnostico.descricao}</span>
                      {plano && plano.resultadoEsperado && plano.intervencoes.length > 0 && 
                       plano.intervencoes.every(i => i.trim()) ? (
                        <span className="ml-3 text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                          Completo
                        </span>
                      ) : (
                        <span className="ml-3 text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                          Pendente
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-2 pb-4 border-t bg-gray-50">
                    {plano && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Resultado Esperado:
                          </label>
                          <Textarea
                            placeholder="Descreva o resultado esperado para este diagnóstico..."
                            value={plano.resultadoEsperado}
                            onChange={(e) => atualizarResultadoEsperado(diagnostico.id, e.target.value)}
                            className="bg-white"
                          />
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Intervenções:
                            </label>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => adicionarIntervencao(diagnostico.id)}
                            >
                              <PlusCircle className="h-3.5 w-3.5 mr-1" />
                              Adicionar
                            </Button>
                          </div>
                          
                          {plano.intervencoes.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 bg-white rounded-md border border-dashed">
                              Adicione pelo menos uma intervenção.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {plano.intervencoes.map((intervencao, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input
                                    placeholder={`Intervenção ${index + 1}`}
                                    value={intervencao}
                                    onChange={(e) => atualizarIntervencao(diagnostico.id, index, e.target.value)}
                                    className="bg-white"
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => removerIntervencao(diagnostico.id, index)}
                                  >
                                    <Trash2 className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-blue-50 rounded-md border border-blue-100 flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-700">
            Status do Planejamento: {verificarPlanejamentoCompleto() ? 'Completo' : 'Incompleto'}
          </h4>
          <p className="mt-1 text-sm text-blue-700">
            {verificarPlanejamentoCompleto() 
              ? 'Todos os diagnósticos possuem resultados esperados e intervenções definidas.' 
              : 'Para continuar, todos os diagnósticos devem ter um resultado esperado e pelo menos uma intervenção definida.'}
          </p>
          <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
            {diagnosticos.map(d => {
              const plano = planejamento.find(p => p.diagnosticoId === d.id);
              const temResultado = plano && plano.resultadoEsperado.trim();
              const temIntervencoes = plano && plano.intervencoes.length > 0 && plano.intervencoes.every(i => i.trim());
              
              if (!temResultado || !temIntervencoes) {
                return (
                  <li key={d.id}>
                    <span className="font-medium">{d.descricao}:</span>
                    {!temResultado && ' Falta resultado esperado.'}
                    {!temIntervencoes && ' Falta intervenções.'}
                  </li>
                );
              }
              return null;
            }).filter(Boolean)}
          </ul>
        </div>
      </div>
    </div>
  );
}
