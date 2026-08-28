import React, { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Usuario } from "@/types/usuario";
import { listarAlteracoesProfissionais } from "@/utils/profileUtils";

interface ModalRevisaoCadastralProps {
  aberto: boolean;
  usuario: Usuario | null;
  processando: boolean;
  onClose: () => void;
  onAprovar: () => void;
  onRecusar: (motivo: string) => void;
}

const ModalRevisaoCadastral: React.FC<ModalRevisaoCadastralProps> = ({
  aberto,
  usuario,
  processando,
  onClose,
  onAprovar,
  onRecusar,
}) => {
  const [motivo, setMotivo] = useState("");
  const solicitacao = usuario?.alteracaoProfissionalPendente;
  const alteracoes = solicitacao
    ? listarAlteracoesProfissionais(
        solicitacao.dadosAnteriores,
        solicitacao.dadosNovos,
      )
    : [];

  return (
    <Dialog
      open={aberto}
      onOpenChange={(open) => {
        if (!open) {
          setMotivo("");
          onClose();
        }
      }}
    >
      <DialogContent className="w-11/12 max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisão de alteração cadastral</DialogTitle>
        </DialogHeader>
        {usuario && (
          <div className="space-y-5">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="font-semibold">
                {usuario.dadosPessoais.nomeCompleto}
              </p>
              <p className="text-sm text-gray-500">{usuario.email}</p>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-3 bg-slate-100 px-4 py-2 text-xs font-bold text-gray-600">
                <span>Campo</span>
                <span>Informação anterior</span>
                <span>Nova informação</span>
              </div>
              {alteracoes.map((alteracao) => (
                <div
                  key={alteracao.campo}
                  className="grid grid-cols-3 gap-3 border-t px-4 py-3 text-sm"
                >
                  <strong>{alteracao.campo}</strong>
                  <span className="text-gray-500">{alteracao.anterior}</span>
                  <span className="font-medium text-csae-green-800">
                    {alteracao.novo}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">
                Justificativa para recusa
              </label>
              <Textarea
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                placeholder="Obrigatória somente se a alteração for recusada..."
              />
              <p className="text-xs text-gray-500">
                A justificativa ficará visível para o usuário em seu perfil.
              </p>
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button
            variant="destructive"
            disabled={processando || !motivo.trim()}
            onClick={() => onRecusar(motivo.trim())}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Recusar alterações
          </Button>
          <Button
            disabled={processando}
            onClick={onAprovar}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4" />
            Aprovar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalRevisaoCadastral;
