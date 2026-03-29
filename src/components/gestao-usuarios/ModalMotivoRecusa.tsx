import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Usuario } from '@/types/usuario';
import { AlertCircle } from 'lucide-react';

interface ModalMotivoRecusaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  usuario: Usuario | null;
}

const ModalMotivoRecusa: React.FC<ModalMotivoRecusaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  usuario
}) => {
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState(false);

  const handleConfirmar = () => {
    if (!motivo.trim()) {
      setErro(true);
      return;
    }
    onConfirm(motivo);
    setMotivo('');
    setErro(false);
  };

  const handleClose = () => {
    setMotivo('');
    setErro(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Recusar Usuário
          </DialogTitle>
          <DialogDescription>
            Informe o motivo da recusa para <strong>{usuario?.dadosPessoais?.nomeCompleto}</strong>. 
            Este motivo ficará visível na aba de recusados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="motivo" className={erro ? "text-red-500" : ""}>
              Motivo da Recusa *
            </Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Documentação incompleta, matrícula não localizada no sistema da prefeitura..."
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (e.target.value.trim()) setErro(false);
              }}
              className={erro ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {erro && (
              <p className="text-xs text-red-500 font-medium">O motivo é obrigatório para proceder com a recusa.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirmar}
            disabled={!motivo.trim() && erro}
          >
            Confirmar Recusa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalMotivoRecusa;
