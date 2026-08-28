import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  availablePages,
  paginasPadraoPorTipo,
  PERMISSION_SCHEMA_VERSION,
} from "@/lib/pages";
import { Usuario } from "@/types/usuario";

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
  isNewApproval = false,
}) => {
  const [tipoUsuario, setTipoUsuario] = useState<string>("comum");
  const [paginasSelecionadas, setPaginasSelecionadas] = useState<string[]>([]);

  // Inicializar valores quando o modal abrir
  useEffect(() => {
    if (isOpen && usuario && !isNewApproval) {
      // Editando privilégios de usuário existente
      setTipoUsuario(usuario.ehAdmin ? "admin" : "comum");
      setPaginasSelecionadas(
        (usuario.versaoPermissoes || 0) < PERMISSION_SCHEMA_VERSION
          ? paginasPadraoPorTipo(usuario.ehAdmin)
          : usuario.paginasPermitidas || paginasPadraoPorTipo(usuario.ehAdmin),
      );
    } else if (isOpen && isNewApproval) {
      // Aprovando novo usuário
      setTipoUsuario("comum");
      setPaginasSelecionadas(paginasPadraoPorTipo(false));
    }
  }, [isOpen, usuario, isNewApproval]);

  const handleTipoUsuarioChange = (value: string) => {
    setTipoUsuario(value);
    setPaginasSelecionadas(paginasPadraoPorTipo(value === "admin"));
  };

  const handlePaginaToggle = (paginaId: string, checked: boolean) => {
    if (checked) {
      setPaginasSelecionadas((prev) => [...prev, paginaId]);
    } else {
      setPaginasSelecionadas((prev) => prev.filter((id) => id !== paginaId));
    }
  };

  const handleConfirm = () => {
    const isAdmin = tipoUsuario === "admin";
    onConfirm(isAdmin, paginasSelecionadas);
    onClose();
  };

  const nomeUsuario = usuario?.dadosPessoais?.nomeCompleto || "";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewApproval ? "Aprovar Usuário" : "Editar Privilégios"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {nomeUsuario && (
            <p className="text-sm text-gray-600">
              {isNewApproval ? "Aprovando" : "Editando privilégios de"}:{" "}
              <strong>{nomeUsuario}</strong>
            </p>
          )}

          <div className="space-y-4">
            <Label className="text-base font-medium">Tipo de usuário</Label>
            <RadioGroup
              value={tipoUsuario}
              onValueChange={handleTipoUsuarioChange}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comum" id="comum" />
                <Label htmlFor="comum" className="font-normal">
                  Usuário Comum
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="admin" id="admin" />
                <Label htmlFor="admin" className="font-normal">
                  Administrador
                </Label>
              </div>
            </RadioGroup>
          </div>

          <>
            <Separator />
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  Páginas permitidas
                </Label>
                <p className="mt-1 text-xs text-gray-500">
                  {tipoUsuario === "admin"
                    ? "Administradores recebem todas as páginas por padrão, mas a seleção pode ser personalizada."
                    : "Dashboard, Processo de Enfermagem e Central de Ajuda vêm selecionados por padrão."}
                </p>
              </div>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={paginasSelecionadas.length === 0}
          >
            {isNewApproval ? "Aprovar" : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalEdicaoPrivilegios;
