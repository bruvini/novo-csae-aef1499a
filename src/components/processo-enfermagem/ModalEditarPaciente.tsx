
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Paciente } from "@/types/paciente";

interface ModalEditarPacienteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paciente: Paciente;
  onPacienteAtualizado: () => void;
}

const ModalEditarPaciente: React.FC<ModalEditarPacienteProps> = ({
  open,
  onOpenChange,
  paciente,
  onPacienteAtualizado,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Paciente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este modal de edição ainda não foi implementado. Você poderá editar os dados do paciente
            "{paciente?.nomeCompleto}" aqui.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                onPacienteAtualizado();
                onOpenChange(false);
              }}
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalEditarPaciente;
