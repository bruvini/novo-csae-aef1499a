
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SubconjuntoEnfermagem } from '@/services/bancodados/subconjuntosDB';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ModalDetalhesSubconjuntoProps {
  subconjunto: SubconjuntoEnfermagem | null;
  open: boolean;
  onClose: () => void;
}

const ModalDetalhesSubconjunto = ({ subconjunto, open, onClose }: ModalDetalhesSubconjuntoProps) => {
  if (!subconjunto) return null;

  const formatarData = (timestamp: any) => {
    if (!timestamp) return 'Não informado';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const formatarTipoSubconjunto = (tipo: string) => {
    switch (tipo) {
      case 'nhb':
        return 'Necessidade Humana Básica';
      case 'Protocolo_Enfermagem':
        return 'Protocolo de Enfermagem';
      default:
        return tipo;
    }
  };

  const isProtocolo = subconjunto.tipoSubconjunto === 'Protocolo_Enfermagem';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes do Subconjunto
            <Badge variant="secondary">
              {formatarTipoSubconjunto(subconjunto.tipoSubconjunto)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Título</label>
              <p className="text-sm bg-gray-50 p-2 rounded border">
                {subconjunto.tituloSubconjunto}
              </p>
            </div>

            {subconjunto.descricaoSubconjunto && (
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <p className="text-sm bg-gray-50 p-2 rounded border">
                  {subconjunto.descricaoSubconjunto}
                </p>
              </div>
            )}
          </div>

          {/* Informações específicas do Protocolo */}
          {isProtocolo && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Informações do Protocolo</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Volume</label>
                  <p className="text-sm bg-gray-50 p-2 rounded border">
                    {subconjunto.volumeProtocolo || 'Não informado'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Versão</label>
                  <p className="text-sm bg-gray-50 p-2 rounded border">
                    {subconjunto.versaoProtocolo || 'Não informado'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Data de Publicação</label>
                  <p className="text-sm bg-gray-50 p-2 rounded border">
                    {formatarData(subconjunto.dataPublicacaoProtocolo)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Data de Atualização</label>
                  <p className="text-sm bg-gray-50 p-2 rounded border">
                    {formatarData(subconjunto.dataAtualizacaoProtocolo)}
                  </p>
                </div>
              </div>

              {subconjunto.urlProtocolo && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">URL do Protocolo</label>
                  <p className="text-sm bg-gray-50 p-2 rounded border">
                    <a 
                      href={subconjunto.urlProtocolo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {subconjunto.urlProtocolo}
                    </a>
                  </p>
                </div>
              )}

              {subconjunto.imagemCapaProtocolo && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Imagem da Capa</label>
                  <div className="mt-2">
                    <img 
                      src={subconjunto.imagemCapaProtocolo} 
                      alt="Capa do protocolo"
                      className="max-w-xs h-auto rounded border shadow-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Informações de Cadastro */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Informações de Cadastro</h3>
            <div>
              <label className="text-sm font-medium text-gray-700">Data de Cadastro</label>
              <p className="text-sm bg-gray-50 p-2 rounded border">
                {formatarData(subconjunto.dataCadastro)}
              </p>
            </div>
          </div>

          {/* Botão de Fechar */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalDetalhesSubconjunto;
