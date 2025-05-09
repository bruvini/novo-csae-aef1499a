
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';
import { Intervencao } from '@/types/intervencoes';

interface IntervencaoFormProps {
  intervencao: Intervencao;
  intervencaoIndex: number;
  resultadoIndex: number;
  onRemoverIntervencao: (resultadoIndex: number, intervencaoIndex: number) => void;
  onAtualizarIntervencao: (resultadoIndex: number, intervencaoIndex: number, campo: keyof Intervencao, valor: string) => void;
  showRemoveButton: boolean;
}

const IntervencaoForm = ({
  intervencao,
  intervencaoIndex,
  resultadoIndex,
  onRemoverIntervencao,
  onAtualizarIntervencao,
  showRemoveButton
}: IntervencaoFormProps) => {
  return (
    <Card className="p-3 border-dashed">
      <div className="grid gap-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm">Intervenção #{intervencaoIndex + 1}</Label>
          {showRemoveButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoverIntervencao(resultadoIndex, intervencaoIndex)}
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-xs">Verbo em 1ª pessoa (Enfermeiro)</Label>
            <Input
              value={intervencao.verboPrimeiraEnfermeiro || ''}
              onChange={(e) => onAtualizarIntervencao(resultadoIndex, intervencaoIndex, 'verboPrimeiraEnfermeiro', e.target.value)}
              placeholder="Ex: Avalio"
              required
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Verbo infinitivo (3ª pessoa)</Label>
            <Input
              value={intervencao.verboOutraPessoa || ''}
              onChange={(e) => onAtualizarIntervencao(resultadoIndex, intervencaoIndex, 'verboOutraPessoa', e.target.value)}
              placeholder="Ex: Avaliar"
              required
            />
          </div>
        </div>
        
        <div className="grid gap-1">
          <Label className="text-xs">Restante da intervenção</Label>
          <Input
            value={intervencao.descricaoRestante || ''}
            onChange={(e) => onAtualizarIntervencao(resultadoIndex, intervencaoIndex, 'descricaoRestante', e.target.value)}
            placeholder="Ex: a intensidade da dor periodicamente"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed">
          <div className="grid gap-1">
            <Label className="text-xs">Documento de apoio (opcional)</Label>
            <Input
              value={intervencao.nomeDocumento || ''}
              onChange={(e) => onAtualizarIntervencao(resultadoIndex, intervencaoIndex, 'nomeDocumento', e.target.value)}
              placeholder="Ex: Protocolo de avaliação da dor"
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs">Link do documento (opcional)</Label>
            <Input
              value={intervencao.linkDocumento || ''}
              onChange={(e) => onAtualizarIntervencao(resultadoIndex, intervencaoIndex, 'linkDocumento', e.target.value)}
              placeholder="Ex: https://exemplo.com/documento.pdf"
            />
          </div>
        </div>
        
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <span className="font-medium">Prévia:</span><br />
          Enfermeiro: <span className="text-green-700">{intervencao.verboPrimeiraEnfermeiro || ''}</span> {intervencao.descricaoRestante || ''}<br />
          Outra pessoa: <span className="text-blue-700">{intervencao.verboOutraPessoa || ''}</span> {intervencao.descricaoRestante || ''}
        </div>
      </div>
    </Card>
  );
};

export default IntervencaoForm;
