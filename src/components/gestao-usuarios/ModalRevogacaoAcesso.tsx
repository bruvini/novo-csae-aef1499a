import { useEffect, useState } from "react";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Usuario } from "@/types/usuario";

interface ModalRevogacaoAcessoProps {
  aberto: boolean;
  usuario: Usuario | null;
  processando: boolean;
  onClose: () => void;
  onConfirmar: (motivo: string) => void;
}

const ModalRevogacaoAcesso = ({
  aberto,
  usuario,
  processando,
  onClose,
  onConfirmar,
}: ModalRevogacaoAcessoProps) => {
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (aberto) setMotivo("");
  }, [aberto, usuario?.id]);

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <ShieldX className="h-5 w-5" /> Revogar acesso
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            O cadastro de <strong>{usuario?.dadosPessoais.nomeCompleto}</strong>{" "}
            será preservado, mas a pessoa não poderá entrar no portal. O acesso
            poderá ser encaminhado para nova análise posteriormente.
          </p>
          <div className="space-y-2">
            <Label htmlFor="motivo-revogacao">Justificativa obrigatória</Label>
            <Textarea
              id="motivo-revogacao"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Explique por que o acesso está sendo revogado..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={processando}>
            Cancelar
          </Button>
          <Button
            className="bg-amber-600 hover:bg-amber-700"
            onClick={() => onConfirmar(motivo.trim())}
            disabled={processando || !motivo.trim()}
          >
            {processando ? "Revogando..." : "Confirmar revogação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalRevogacaoAcesso;
