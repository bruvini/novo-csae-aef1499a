
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { listarIntervencoesBiblioteca, type IntervencaoBiblioteca } from '@/services/bancodados/intervencoesAutoraisDB';
import { obterDisponibilidadePorResultado } from '@/utils/intervencoesBiblioteca';

interface ModalVisualizarDiagnosticoProps {
  diagnostico: Diagnostico | null;
  open: boolean;
  onClose: () => void;
}

const ModalVisualizarDiagnostico = ({ diagnostico, open, onClose }: ModalVisualizarDiagnosticoProps) => {
  const [intervencoesPublicadas, setIntervencoesPublicadas] = useState<IntervencaoBiblioteca[]>([]);
  const [carregandoPublicadas, setCarregandoPublicadas] = useState(false);
  useEffect(() => {
    if (!open) return;
    let ativo = true;
    setCarregandoPublicadas(true);
    void listarIntervencoesBiblioteca()
      .then(dados => { if (ativo) setIntervencoesPublicadas(dados); })
      .catch(error => console.error('Erro ao carregar intervenções publicadas para visualização:', error))
      .finally(() => { if (ativo) setCarregandoPublicadas(false); });
    return () => { ativo = false; };
  }, [open, diagnostico?.id]);

  if (!diagnostico) return null;

  const formatarData = (timestamp: Diagnostico['dataCadastro']) => {
    if (!timestamp) return 'Não informado';
    try {
      const date = timestamp.toDate();
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-csae-green-700">
            {diagnostico.tituloDiagnostico}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Descrição */}
          {diagnostico.descricaoDiagnostico && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Descrição</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                {diagnostico.descricaoDiagnostico}
              </p>
            </div>
          )}

          {/* Data de Cadastro */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Data de Cadastro</h3>
            <p className="text-gray-700">
              {formatarData(diagnostico.dataCadastro)}
            </p>
          </div>

          {/* Subconjuntos */}
          {diagnostico.subconjuntos && diagnostico.subconjuntos.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Subconjuntos Vinculados</h3>
              <div className="flex flex-wrap gap-2">
                {diagnostico.subconjuntos.map((subconjunto, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    <span className="font-medium">{subconjunto.tituloSubconjunto}</span>
                    <span className="ml-1 text-xs opacity-75">
                      ({subconjunto.tipoSubconjunto})
                    </span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Resultados Esperados */}
          {diagnostico.resultadosEsperados && diagnostico.resultadosEsperados.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Resultados Esperados</h3>
              <Accordion type="multiple" className="w-full">
                {diagnostico.resultadosEsperados.map((resultado, resultadoIndex) => (
                  <AccordionItem key={resultadoIndex} value={`resultado-${resultadoIndex}`}>
                    <AccordionTrigger className="text-left">
                      <span className="font-medium">{resultado.tituloResultado}</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      {(() => {
                        const nativas = resultado.intervencoes || [];
                        const publicadas = obterDisponibilidadePorResultado(intervencoesPublicadas, diagnostico.id, resultadoIndex, resultado.tituloResultado);
                        const identidade = (acao: string, enfermeiro: string) => `${acao.trim().toLocaleLowerCase('pt-BR')}|${enfermeiro.trim().toLocaleLowerCase('pt-BR')}`;
                        const chavesNativas = new Set(nativas.map(item => identidade(item.acaoPrescrita, item.acaoEnfermeiro)));
                        const disponiveis = [
                          ...nativas.map((item, index) => ({ key: `nativa-${index}`, item, origem: 'Catálogo homologado' })),
                          ...publicadas.filter(item => !chavesNativas.has(identidade(item.acaoPrescrita, item.acaoEnfermeiro))).map(item => ({ key: `publicada-${item.id}-v${item.versao}`, item, origem: item.modoDisponibilidade === 'transversal' ? 'Aprovada · transversal' : 'Aprovada para este resultado' })),
                        ];
                        return <div>
                          <h4 className="font-medium text-gray-800 mb-2">Intervenções de Enfermagem ({disponiveis.length})</h4>
                          {carregandoPublicadas && <p role="status" className="mb-2 text-xs text-gray-500">Carregando intervenções aprovadas…</p>}
                          {disponiveis.length > 0 ? <div className="space-y-3">{disponiveis.map(({ key, item, origem }) => <div key={key} className="border border-gray-200 rounded-lg p-3 bg-white">
                            <p className="text-xs font-medium text-gray-500">{origem}</p>
                            {item.acaoEnfermeiro && <div className="mt-2"><span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Ação do Enfermeiro</span><p className="text-sm text-gray-700 mt-1">{item.acaoEnfermeiro}</p></div>}
                            {item.acaoPrescrita && <div className="mt-2"><span className="text-xs font-medium text-green-600 uppercase tracking-wide">Ação Prescrita</span><p className="text-sm text-gray-700 mt-1">{item.acaoPrescrita}</p></div>}
                            {item.materiaisDeApoio?.length > 0 && <div className="mt-2"><span className="text-xs font-medium text-purple-600 uppercase tracking-wide">Materiais de Apoio</span><ul className="mt-1 space-y-1">{item.materiaisDeApoio.map((material, index) => <li key={index} className="text-sm">{material.urlMaterialApoio ? <a href={material.urlMaterialApoio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline">{material.tituloMaterialApoio}</a> : <span>{material.tituloMaterialApoio}</span>}</li>)}</ul></div>}
                          </div>)}</div> : <p className="text-sm text-gray-500">Nenhuma intervenção cadastrada para este resultado.</p>}
                        </div>;
                      })()}
                      {/* Descrição do Resultado */}
                      {resultado.descricaoResultado && (
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">Descrição</h4>
                          <p className="text-gray-600 bg-gray-50 p-2 rounded text-sm">
                            {resultado.descricaoResultado}
                          </p>
                        </div>
                      )}

                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalVisualizarDiagnostico;
