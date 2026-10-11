
import React from 'react';
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

interface ModalConfirmacaoExclusaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nomeUsuario: string;
}

const ModalConfirmacaoExclusao: React.FC<ModalConfirmacaoExclusaoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  nomeUsuario
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revogar acesso</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja revogar o acesso de{' '}
            <strong>{nomeUsuario}</strong>?
            <br />
            <br />
            A pessoa não poderá entrar no Portal, mas a conta e o cadastro serão preservados para manter o histórico e permitir revisão administrativa. Esta ação não apaga a conta do Firebase Authentication nem os registros clínicos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-red-600 hover:bg-red-700"
          >
            Revogar acesso
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ModalConfirmacaoExclusao;
