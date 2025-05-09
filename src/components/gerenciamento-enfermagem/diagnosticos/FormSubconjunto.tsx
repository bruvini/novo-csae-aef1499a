
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Subconjunto } from '@/types/diagnosticos';

export interface FormSubconjuntoProps {
  formSubconjunto: Subconjunto;
  setFormSubconjunto: React.Dispatch<React.SetStateAction<Subconjunto>>;
  onSalvar: () => Promise<void>;
  onCancel: () => void;
  editando?: boolean;
}

const FormSubconjunto: React.FC<FormSubconjuntoProps> = ({ 
  formSubconjunto, 
  setFormSubconjunto, 
  onSalvar, 
  onCancel,
  editando = false
}) => {
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do Subconjunto</Label>
          <Input 
            id="nome"
            value={formSubconjunto.nome || ''}
            onChange={(e) => setFormSubconjunto(prev => ({...prev, nome: e.target.value}))}
            placeholder="Ex: Dor, Respiração, etc."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de Subconjunto</Label>
          <Select 
            value={formSubconjunto.tipo || 'NHB'} 
            onValueChange={(value) => setFormSubconjunto(prev => ({...prev, tipo: value as 'Protocolo' | 'NHB'}))}
          >
            <SelectTrigger id="tipo">
              <SelectValue placeholder="Selecione um tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Protocolo">Protocolo</SelectItem>
              <SelectItem value="NHB">NHB</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea 
          id="descricao"
          value={formSubconjunto.descricao || ''}
          onChange={(e) => setFormSubconjunto(prev => ({...prev, descricao: e.target.value}))}
          placeholder="Descreva brevemente este subconjunto ou protocolo..."
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSalvar} className="bg-csae-green-600 hover:bg-csae-green-700">
          {editando ? 'Atualizar' : 'Salvar'} Subconjunto
        </Button>
      </div>
    </div>
  );
};

export default FormSubconjunto;
