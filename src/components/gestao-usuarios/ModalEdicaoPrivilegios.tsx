
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { availablePages } from '@/lib/pages';
import { Usuario } from '@/types/usuario';

interface ModalEdicaoPrivilegiosProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isAdmin: boolean, paginasPermitidas: string[]) => void;
  usuario?: Usuario | null;
  isNewApproval?: boolean;
}

const ModalEdicaoPrivilegios: React.FC<ModalEdicaoPrivilegiosProps> = ({
  isOpen,
  onClose,
  onConfirm,
  usuario,
  isNewApproval = false
}) => {
  const [tipoUsuario, setTipoUsuario] = useState<string>('comum');
  const [paginasSelecionadas, setPaginasSelecionadas] = useState<string[]>([]);

  // Inicializar valores quando o modal abrir
  useEffect(() => {
    if (isOpen && usuario && !isNewApproval) {
      // Editando privilégios de usuário existente
      setTipoUsuario(usuario.ehAdmin ? 'admin' : 'comum');
      setPaginasSelecionadas(usuario.paginasPermitidas || []);
    } else if (isOpen && isNewApproval) {
      // Aprovando novo usuário
      setTipoUsuario('comum');
      setPaginasSelecionadas(['ProcessoEnfermagem']); // Página padrão
    }
  }, [isOpen, usuario, isNewApproval]);

  const handleTipoUsuarioChange = (value: string) => {
    setTipoUsuario(value);
    if (value === 'admin') {
      setPaginasSelecionadas([]);
    } else if (paginasSelecionadas.length === 0) {
      setPaginasSelecionadas(['ProcessoEnfermagem']);
    }
  };

  const handlePaginaToggle = (paginaId: string, checked: boolean) => {
    if (checked) {
      setPaginasSelecionadas(prev => [...prev, paginaId]);
    } else {
      setPaginasSelecionadas(prev => prev.filter(id => id !== paginaId));
    }
  };

  const handleConfirm = () => {
    const isAdmin = tipoUsuario === 'admin';
    const paginas = isAdmin ? [] : paginasSelecionadas;
    onConfirm(isAdmin, paginas);
    onClose();
  };

  const nomeUsuario = usuario?.dadosPessoais?.nomeCompleto || '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isNewApproval ? 'Aprovar Usuário' : 'Editar Privilégios'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {nomeUsuario && (
            <p className="text-sm text-gray-600">
              {isNewApproval ? 'Aprovando' : 'Editando privilégios de'}: <strong>{nomeUsuario}</strong>
            </p>
          )}

          <div className="space-y-4">
            <Label className="text-base font-medium">Tipo de usuário</Label>
            <RadioGroup value={tipoUsuario} onValueChange={handleTipoUsuarioChange}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comum" id="comum" />
                <Label htmlFor="comum" className="font-normal">Usuário Comum</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="font-normal">Administrador</Label>
              </div>
            </RadioGroup>
          </div>

          {tipoUsuario === 'comum' && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-medium">Páginas permitidas</Label>
                <div className="space-y-3">
                  {availablePages.map((pagina) => (
                    <div key={pagina.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={pagina.id}
                        checked={paginasSelecionadas.includes(pagina.id)}
                        onCheckedChange={(checked) => 
                          handlePaginaToggle(pagina.id, checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={pagina.id} 
                          className="font-normal cursor-pointer"
                        >
                          {pagina.label}
                        </Label>
                        {pagina.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {pagina.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tipoUsuario === 'admin' && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Administradores</strong> têm acesso completo a todas as funcionalidades do sistema.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={tipoUsuario === 'comum' && paginasSelecionadas.length === 0}
          >
            {isNewApproval ? 'Aprovar' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalEdicaoPrivilegios;
