
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SistemaCorporal } from "@/types/sistemas";

interface SistemaCorporalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sistema: SistemaCorporal) => void;
  sistema?: SistemaCorporal | null;
}

const SistemaCorporalModal: React.FC<SistemaCorporalModalProps> = ({ isOpen, onClose, onSave, sistema }) => {
  const [nome, setNome] = useState(sistema?.nome || '');
  const [descricao, setDescricao] = useState(sistema?.descricao || '');
  const [ativo, setAtivo] = useState(sistema?.ativo !== false);

  useEffect(() => {
    setNome(sistema?.nome || '');
    setDescricao(sistema?.descricao || '');
    setAtivo(sistema?.ativo !== false);
  }, [sistema]);

  const handleSubmit = () => {
    const sistemaToSave = {
      id: sistema?.id,
      nome,
      descricao,
      ativo,
    };
    onSave(sistemaToSave as SistemaCorporal);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{sistema ? "Editar Sistema Corporal" : "Novo Sistema Corporal"}</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para {sistema ? "editar" : "criar"} um sistema corporal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input type="text" id="name" value={nome} onChange={(e) => setNome(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Textarea id="description" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="active" className="text-right">
              Ativo
            </Label>
            <div className="col-span-3 flex items-center">
              <Switch id="active" checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SistemaCorporalModal;
