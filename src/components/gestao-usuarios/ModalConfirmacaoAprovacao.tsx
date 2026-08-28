import React, { useState } from "react";
import ModalEdicaoPrivilegios from "./ModalEdicaoPrivilegios";
import { Usuario } from "@/types/usuario";

interface ModalConfirmacaoAprovacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isAdmin: boolean, paginasPermitidas: string[]) => void;
  usuario?: Usuario | null;
  nomeUsuario: string;
}

const ModalConfirmacaoAprovacao: React.FC<ModalConfirmacaoAprovacaoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  usuario,
}) => {
  const handleConfirm = (isAdmin: boolean, paginasPermitidas: string[]) => {
    onConfirm(isAdmin, paginasPermitidas);
  };

  return (
    <ModalEdicaoPrivilegios
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      usuario={usuario}
      isNewApproval={true}
    />
  );
};

export default ModalConfirmacaoAprovacao;
