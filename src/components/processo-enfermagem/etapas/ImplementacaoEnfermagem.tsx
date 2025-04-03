
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Planejamento {
  diagnosticoId: string;
  resultadoEsperado: string;
  intervencoes: string[];
}

interface Implementacao {
  intervencaoId: string;
  responsavel: string;
  status: 'Pendente' | 'Em andamento' | 'Concluído';
  observacoes?: string;
  selecionada?: boolean;
  tempoReavaliacao?: string;
  unidadeTempo?: string;
}

interface ImplementacaoEnfermagemProps {
  planejamento: Planejamento[];
  implementacao: Implementacao[];
  setImplementacao: React.Dispatch<React.SetStateAction<any[]>>;
}

export function ImplementacaoEnfermagem({ 
  planejamento, 
  implementacao, 
  setImplementacao 
}: ImplementacaoEnfermagemProps) {
  // Agrupar intervenções por resultado esperado para exibição organizada
  const resultadosEIntervencoesAgrupados: Record<string, {
    resultadoEsperado: string,
    intervencoes: { id: string, texto: string }[]
  }> = {};
  
  planejamento.forEach(p => {
    if (p.resultadoEsperado && p.intervencoes.length > 0) {
      if (!resultadosEIntervencoesAgrupados[p.diagnosticoId]) {
        resultadosEIntervencoesAgrupados[p.diagnosticoId] = {
          resultadoEsperado: p.resultadoEsperado,
          intervencoes: []
        };
      }
      
      p.intervencoes.forEach((intervencao, index) => {
        resultadosEIntervencoesAgrupados[p.diagnosticoId].intervencoes.push({
          id: `${p.diagnosticoId}-${index}`,
          texto: intervencao
        });
      });
    }
  });
  
  // Opções para unidade de tempo
  const unidadesTempo = [
    'segundo(s)',
    'minuto(s)',
    'hora(s)',
    'dia(s)',
    'semana(s)',
    'mes(es)',
    'semestre(s)',
    'ano(s)'
  ];
  
  // Inicializar implementação para cada intervenção que ainda não tenha
  useEffect(() => {
    const novasImplementacoes: Implementacao[] = [];
    
    Object.values(resultadosEIntervencoesAgrupados).forEach(grupo => {
      grupo.intervencoes.forEach(intervencao => {
        const implementacaoExistente = implementacao.find(i => i.intervencaoId === intervencao.id);
        
        if (!implementacaoExistente) {
          novasImplementacoes.push({
            intervencaoId: intervencao.id,
            responsavel: '',
            status: 'Pendente',
            observacoes: '',
            selecionada: false,
            tempoReavaliacao: '',
            unidadeTempo: 'dia(s)'
          });
        }
      });
    });
    
    if (novasImplementacoes.length > 0) {
      setImplementacao(prev => [...prev, ...novasImplementacoes]);
    }
  }, [planejamento, implementacao, setImplementacao, resultadosEIntervencoesAgrupados]);

  // Métodos para atualizar a implementação
  const toggleSelecionada = (intervencaoId: string) => {
    setImplementacao(prev => 
      prev.map(i => 
        i.intervencaoId === intervencaoId 
          ? { ...i, selecionada: !i.selecionada } 
          : i
      )
    );
  };

  const atualizarResponsavel = (intervencaoId: string, valor: string) => {
    setImplementacao(prev => 
      prev.map(i => 
        i.intervencaoId === intervencaoId 
          ? { ...i, responsavel: valor } 
          : i
      )
    );
  };

  const atualizarStatus = (intervencaoId: string, valor: 'Pendente' | 'Em andamento' | 'Concluído') => {
    setImplementacao(prev => 
      prev.map(i => 
        i.intervencaoId === intervencaoId 
          ? { ...i, status: valor } 
          : i
      )
    );
  };

  const atualizarObservacoes = (intervencaoId: string, valor: string) => {
    setImplementacao(prev => 
      prev.map(i => 
        i.intervencaoId === intervencaoId 
          ? { ...i, observacoes: valor } 
          : i
      )
    );
  };
  
  const atualizarTempoReavaliacao = (intervencaoId: string, valor: string) => {
    setImplementacao(prev => 
      prev.map(i => 
        i.intervencaoId === intervencaoId 
          ? { ...i, tempoReavaliacao: valor } 
          : i
      )
    );
  };
  
  const atualizarUnidadeTempo = (intervencaoId: string, valor: string) => {
    setImplementacao(prev => 
      prev.map(i => 
        i.intervencaoId === intervencaoId 
          ? { ...i, unidadeTempo: valor } 
          : i
      )
    );
  };

  // Verificar se pelo menos uma intervenção foi selecionada e tem responsável
  const verificarPeloMenosUmaImplementacao = () => {
    return implementacao.some(i => i.selecionada && i.responsavel.trim());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Implementação de Enfermagem</CardTitle>
          <CardDescription>
            Selecione as intervenções que serão implementadas e defina os responsáveis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(resultadosEIntervencoesAgrupados).length > 0 ? (
            Object.entries(resultadosEIntervencoesAgrupados).map(([diagnosticoId, dados]) => (
              <Card key={diagnosticoId} className="overflow-hidden mb-6">
                <CardHeader className="bg-gray-50 py-3 px-4">
                  <CardTitle className="text-base">Resultado Esperado</CardTitle>
                  <CardDescription className="text-sm mt-1 font-medium text-gray-700">
                    {dados.resultadoEsperado}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">Imp.</TableHead>
                        <TableHead>Intervenção</TableHead>
                        <TableHead className="w-[180px]">Responsável</TableHead>
                        <TableHead className="w-[180px]">Reavaliação</TableHead>
                        <TableHead className="w-[200px]">Observações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dados.intervencoes.map((intervencao) => {
                        const impl = implementacao.find(i => i.intervencaoId === intervencao.id);
                        
                        if (!impl) return null;
                        
                        return (
                          <TableRow key={intervencao.id}>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={impl.selecionada}
                                onCheckedChange={() => toggleSelecionada(intervencao.id)}
                                id={`check-${intervencao.id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Label
                                htmlFor={`check-${intervencao.id}`}
                                className="cursor-pointer"
                              >
                                {intervencao.texto}
                              </Label>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={impl.responsavel}
                                onValueChange={(valor) => atualizarResponsavel(intervencao.id, valor)}
                                disabled={!impl.selecionada}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Enfermeiro">Enfermeiro</SelectItem>
                                  <SelectItem value="Outra Pessoa">Outra Pessoa</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Input
                                  type="number"
                                  placeholder="Tempo"
                                  value={impl.tempoReavaliacao}
                                  onChange={(e) => atualizarTempoReavaliacao(intervencao.id, e.target.value)}
                                  className="w-16"
                                  disabled={!impl.selecionada}
                                  min="0"
                                />
                                <Select
                                  value={impl.unidadeTempo}
                                  onValueChange={(valor) => atualizarUnidadeTempo(intervencao.id, valor)}
                                  disabled={!impl.selecionada}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Unidade" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {unidadesTempo.map(unidade => (
                                      <SelectItem key={unidade} value={unidade}>{unidade}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Textarea
                                placeholder="Observações (opcional)"
                                value={impl.observacoes || ''}
                                onChange={(e) => atualizarObservacoes(intervencao.id, e.target.value)}
                                className="w-full h-16 min-h-0 text-sm"
                                disabled={!impl.selecionada}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 border border-dashed rounded-md">
              <p>Nenhuma intervenção foi definida na etapa de planejamento.</p>
              <p className="mt-2">Volte à etapa anterior e adicione pelo menos um resultado e intervenção.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="p-4 bg-blue-50 rounded-md border border-blue-100 flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-700">
            Status da Implementação: {verificarPeloMenosUmaImplementacao() ? 'Válido' : 'Incompleto'}
          </h4>
          <p className="mt-1 text-sm text-blue-700">
            {verificarPeloMenosUmaImplementacao() 
              ? 'Pelo menos uma intervenção foi selecionada e tem responsável definido.' 
              : 'Para continuar, selecione pelo menos uma intervenção e defina um responsável.'}
          </p>
          {!verificarPeloMenosUmaImplementacao() && (
            <p className="mt-2 text-sm text-blue-700 font-medium">
              Marque a caixa "Imp." para selecionar uma intervenção e escolha um responsável.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
