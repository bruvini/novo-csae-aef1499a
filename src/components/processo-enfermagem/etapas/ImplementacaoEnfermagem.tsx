
import React, { useEffect } from 'react';
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
  // Listar todas as intervenções de todos os planejamentos
  const todasIntervencoes = planejamento.flatMap(p => 
    p.intervencoes.map((intervencao, index) => ({
      id: `${p.diagnosticoId}-${index}`,
      texto: intervencao,
      diagnosticoId: p.diagnosticoId
    }))
  );
  
  // Inicializar implementação para cada intervenção que ainda não tenha
  useEffect(() => {
    const intervencoesComImplementacao = implementacao.map(i => i.intervencaoId);
    
    const novasImplementacoes = todasIntervencoes
      .filter(i => !intervencoesComImplementacao.includes(i.id))
      .map(i => ({
        intervencaoId: i.id,
        responsavel: '',
        status: 'Pendente' as const,
        observacoes: ''
      }));
    
    if (novasImplementacoes.length > 0) {
      setImplementacao(prev => [...prev, ...novasImplementacoes]);
    }
  }, [todasIntervencoes, implementacao, setImplementacao]);

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

  const verificarPeloMenosUmResponsavel = () => {
    return implementacao.some(i => i.responsavel.trim());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Implementação de Enfermagem</CardTitle>
          <CardDescription>
            Defina os responsáveis e o status de cada intervenção planejada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Intervenção</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todasIntervencoes.map((intervencao) => {
                const impl = implementacao.find(i => i.intervencaoId === intervencao.id);
                
                if (!impl) return null;
                
                return (
                  <TableRow key={intervencao.id}>
                    <TableCell className="align-top py-4">
                      {intervencao.texto}
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <Input
                        placeholder="Nome do responsável"
                        value={impl.responsavel}
                        onChange={(e) => atualizarResponsavel(intervencao.id, e.target.value)}
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <Select
                        value={impl.status}
                        onValueChange={(valor: 'Pendente' | 'Em andamento' | 'Concluído') => 
                          atualizarStatus(intervencao.id, valor)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pendente">Pendente</SelectItem>
                          <SelectItem value="Em andamento">Em andamento</SelectItem>
                          <SelectItem value="Concluído">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <Textarea
                        placeholder="Observações (opcional)"
                        value={impl.observacoes || ''}
                        onChange={(e) => atualizarObservacoes(intervencao.id, e.target.value)}
                        className="w-full h-20 min-h-0"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {todasIntervencoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                    Nenhuma intervenção foi definida na etapa de planejamento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="p-4 bg-blue-50 rounded-md border border-blue-100 flex items-start">
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-blue-700">
            Status da Implementação: {verificarPeloMenosUmResponsavel() ? 'Válido' : 'Incompleto'}
          </h4>
          <p className="mt-1 text-sm text-blue-700">
            {verificarPeloMenosUmResponsavel() 
              ? 'Pelo menos um responsável foi definido para as intervenções.' 
              : 'Para continuar, defina pelo menos um responsável para qualquer uma das intervenções.'}
          </p>
          {!verificarPeloMenosUmResponsavel() && (
            <p className="mt-2 text-sm text-blue-700 font-medium">
              Preencha o campo "Responsável" para pelo menos uma intervenção.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
