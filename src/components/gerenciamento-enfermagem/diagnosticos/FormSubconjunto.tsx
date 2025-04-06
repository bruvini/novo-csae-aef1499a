
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import { Subconjunto } from '@/services/bancodados/tipos';

interface FormSubconjuntoProps {
  formSubconjunto: Subconjunto;
  setFormSubconjunto: React.Dispatch<React.SetStateAction<Subconjunto>>;
  onSalvar: () => Promise<void>;
  onCancel: () => void;
  editando: boolean;
}

const FormSubconjunto = ({ 
  formSubconjunto, 
  setFormSubconjunto, 
  onSalvar, 
  onCancel, 
  editando 
}: FormSubconjuntoProps) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="nome">Nome do Subconjunto</Label>
        <Input
          id="nome"
          value={formSubconjunto.nome}
          onChange={(e) => setFormSubconjunto({...formSubconjunto, nome: e.target.value})}
          placeholder="Ex: Necessidades Psicobiológicas"
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="tipo">Tipo de Subconjunto</Label>
        <Select
          value={formSubconjunto.tipo}
          onValueChange={(v) => setFormSubconjunto({...formSubconjunto, tipo: v as 'Protocolo' | 'NHB'})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Protocolo">Protocolo</SelectItem>
            <SelectItem value="NHB">Necessidade Humana Básica (NHB)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="descricao">Descrição (opcional)</Label>
        <Textarea
          id="descricao"
          value={formSubconjunto.descricao || ''}
          onChange={(e) => setFormSubconjunto({...formSubconjunto, descricao: e.target.value})}
          placeholder="Descreva brevemente este subconjunto"
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={onSalvar} className="bg-csae-green-600 hover:bg-csae-green-700">
          {editando ? 'Atualizar' : 'Cadastrar'} Subconjunto
        </Button>
      </DialogFooter>
    </div>
  );
};

export default FormSubconjunto;
