
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ModalConfirmacaoAprovacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isAdmin: boolean) => void;
  nomeUsuario: string;
}

const ModalConfirmacaoAprovacao: React.FC<ModalConfirmacaoAprovacaoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  nomeUsuario
}) => {
  const [tipoUsuario, setTipoUsuario] = useState<string>('comum');

  const handleConfirm = () => {
    onConfirm(tipoUsuario === 'admin');
    setTipoUsuario('comum');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Aprovar Usuário</AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a aprovar o usuário <strong>{nomeUsuario}</strong>.
            Selecione o tipo de privilégio que ele terá no sistema:
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <RadioGroup value={tipoUsuario} onValueChange={setTipoUsuario}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="comum" id="comum" />
              <Label htmlFor="comum">Usuário Comum</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="admin" id="admin" />
              <Label htmlFor="admin">Administrador</Label>
            </div>
          </RadioGroup>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Aprovar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ModalConfirmacaoAprovacao;
