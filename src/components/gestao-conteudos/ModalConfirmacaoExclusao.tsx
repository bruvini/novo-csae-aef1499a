
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ModalConfirmacaoExclusaoProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  loading?: boolean;
}

const ModalConfirmacaoExclusao = ({ 
  open, 
  onClose, 
  onConfirm, 
  titulo, 
  loading = false 
}: ModalConfirmacaoExclusaoProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              Tem certeza que deseja excluir o subconjunto <strong>"{titulo}"</strong>?
            </p>
            <p className="text-sm text-red-700 mt-2">
              Esta ação não poderá ser desfeita.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalConfirmacaoExclusao;
