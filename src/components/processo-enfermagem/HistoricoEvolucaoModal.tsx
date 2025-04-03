
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { ClipboardCheck, Eye, Copy } from 'lucide-react';
import { Paciente, Evolucao } from '@/services/bancodados';
import { useToast } from '@/hooks/use-toast';
import { Timestamp } from 'firebase/firestore';

interface HistoricoEvolucaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente;
}

export function HistoricoEvolucaoModal({ isOpen, onClose, paciente }: HistoricoEvolucaoModalProps) {
  const { toast } = useToast();
  const [evolucaoSelecionada, setEvolucaoSelecionada] = useState<Evolucao | null>(null);
  
  // Filtrar apenas evoluções concluídas e ordenar por data de conclusão (mais recente primeiro)
  const evolucoesConcluidas = paciente.evolucoes
    ? paciente.evolucoes
        .filter(e => e.statusConclusao === 'Concluído')
        .sort((a, b) => {
          // Corrigido: Verificar se é Timestamp antes de chamar toMillis
          const dataA = a.dataConclusao && 'toMillis' in a.dataConclusao ? a.dataConclusao.toMillis() : 0;
          const dataB = b.dataConclusao && 'toMillis' in b.dataConclusao ? b.dataConclusao.toMillis() : 0;
          return dataB - dataA;
        })
    : [];

  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    try {
      const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(data);
    } catch (e) {
      return 'Data inválida';
    }
  };

  const handleCopiarParaAreaDeTransferencia = () => {
    if (!evolucaoSelecionada) return;
    
    let conteudo = `EVOLUÇÃO DE ENFERMAGEM - ${paciente.nomeCompleto}\n`;
    conteudo += `Data/Hora: ${formatarData(evolucaoSelecionada.dataConclusao)}\n\n`;
    
    if (evolucaoSelecionada.avaliacao) {
      conteudo += `AVALIAÇÃO:\n${evolucaoSelecionada.avaliacao}\n\n`;
    }
    
    if (evolucaoSelecionada.diagnosticos && evolucaoSelecionada.diagnosticos.length > 0) {
      conteudo += `DIAGNÓSTICOS DE ENFERMAGEM:\n`;
      evolucaoSelecionada.diagnosticos
        .filter(d => d.selecionado)
        .forEach(d => {
          conteudo += `- ${d.descricao}\n`;
        });
      conteudo += '\n';
    }
    
    if (evolucaoSelecionada.planejamento && evolucaoSelecionada.planejamento.length > 0) {
      conteudo += `PLANEJAMENTO:\n`;
      evolucaoSelecionada.planejamento.forEach(p => {
        const diagnostico = evolucaoSelecionada.diagnosticos?.find(d => d.id === p.diagnosticoId);
        if (diagnostico) {
          conteudo += `Diagnóstico: ${diagnostico.descricao}\n`;
          conteudo += `Resultado Esperado: ${p.resultadoEsperado}\n`;
          conteudo += `Intervenções:\n`;
          p.intervencoes.forEach(i => conteudo += `- ${i}\n`);
          conteudo += '\n';
        }
      });
    }
    
    if (evolucaoSelecionada.implementacao && evolucaoSelecionada.implementacao.length > 0) {
      conteudo += `IMPLEMENTAÇÃO:\n`;
      evolucaoSelecionada.implementacao.forEach(i => {
        conteudo += `Intervenção: ${i.intervencaoId}\n`;
        conteudo += `Responsável: ${i.responsavel}\n`;
        conteudo += `Status: ${i.status}\n`;
        if (i.observacoes) conteudo += `Observações: ${i.observacoes}\n`;
        conteudo += '\n';
      });
    }
    
    if (evolucaoSelecionada.evolucaoFinal) {
      conteudo += `EVOLUÇÃO FINAL:\n${evolucaoSelecionada.evolucaoFinal}\n`;
    }
    
    navigator.clipboard.writeText(conteudo)
      .then(() => {
        toast({
          title: "Copiado com sucesso",
          description: "A evolução foi copiada para a área de transferência.",
        });
      })
      .catch(err => {
        console.error('Erro ao copiar: ', err);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar a evolução. Tente novamente.",
          variant: "destructive"
        });
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Evoluções</DialogTitle>
          <DialogDescription>
            Histórico completo de evoluções do paciente {paciente.nomeCompleto}.
          </DialogDescription>
        </DialogHeader>
        
        {!evolucaoSelecionada ? (
          <div className="mt-4">
            {evolucoesConcluidas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Não há evoluções concluídas para este paciente.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data de Conclusão</TableHead>
                    <TableHead>Diagnósticos</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evolucoesConcluidas.map((evolucao) => (
                    <TableRow key={evolucao.id}>
                      <TableCell>{formatarData(evolucao.dataConclusao)}</TableCell>
                      <TableCell>
                        {evolucao.diagnosticos
                          ? evolucao.diagnosticos
                              .filter(d => d.selecionado)
                              .length
                          : 0} diagnóstico(s)
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEvolucaoSelecionada(evolucao)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEvolucaoSelecionada(null)}
              >
                Voltar à lista
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopiarParaAreaDeTransferencia}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar para área de transferência
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClipboardCheck className="h-5 w-5 mr-2 text-csae-green-600" />
                  Evolução de Enfermagem
                </CardTitle>
                <CardDescription>
                  Concluída em {formatarData(evolucaoSelecionada.dataConclusao)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {evolucaoSelecionada.avaliacao && (
                  <div>
                    <h3 className="font-semibold text-csae-green-700">Avaliação</h3>
                    <p className="whitespace-pre-line text-gray-700">{evolucaoSelecionada.avaliacao}</p>
                  </div>
                )}
                
                {evolucaoSelecionada.diagnosticos && evolucaoSelecionada.diagnosticos.some(d => d.selecionado) && (
                  <div>
                    <h3 className="font-semibold text-csae-green-700">Diagnósticos de Enfermagem</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {evolucaoSelecionada.diagnosticos
                        .filter(d => d.selecionado)
                        .map(d => (
                          <li key={d.id} className="text-gray-700">{d.descricao}</li>
                        ))}
                    </ul>
                  </div>
                )}
                
                {evolucaoSelecionada.planejamento && evolucaoSelecionada.planejamento.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-csae-green-700">Planejamento</h3>
                    <div className="space-y-3">
                      {evolucaoSelecionada.planejamento.map((p, i) => {
                        const diagnostico = evolucaoSelecionada.diagnosticos?.find(d => d.id === p.diagnosticoId);
                        return (
                          <div key={i} className="border-l-2 border-csae-green-200 pl-3 py-1">
                            {diagnostico && (
                              <p className="font-medium">Diagnóstico: {diagnostico.descricao}</p>
                            )}
                            <p className="text-gray-700">Resultado Esperado: {p.resultadoEsperado}</p>
                            <div>
                              <span className="text-gray-700">Intervenções:</span>
                              <ul className="list-disc pl-5">
                                {p.intervencoes.map((i, idx) => (
                                  <li key={idx} className="text-gray-700">{i}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {evolucaoSelecionada.implementacao && evolucaoSelecionada.implementacao.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-csae-green-700">Implementação</h3>
                    <div className="space-y-2">
                      {evolucaoSelecionada.implementacao.map((i, idx) => (
                        <div key={idx} className="bg-gray-50 p-2 rounded border border-gray-100">
                          <p className="font-medium">Intervenção: {i.intervencaoId}</p>
                          <p className="text-gray-700">Responsável: {i.responsavel}</p>
                          <p className="text-gray-700">
                            Status: 
                            <span className={
                              i.status === 'Concluído' 
                                ? 'text-green-600 font-medium' 
                                : i.status === 'Em andamento' 
                                  ? 'text-amber-600 font-medium' 
                                  : 'text-gray-600 font-medium'
                            }>
                              {' '}{i.status}
                            </span>
                          </p>
                          {i.observacoes && (
                            <p className="text-gray-700">Observações: {i.observacoes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {evolucaoSelecionada.evolucaoFinal && (
                  <div>
                    <h3 className="font-semibold text-csae-green-700">Evolução Final</h3>
                    <p className="whitespace-pre-line text-gray-700">{evolucaoSelecionada.evolucaoFinal}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
