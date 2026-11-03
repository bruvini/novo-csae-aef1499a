import { useEffect, useState } from "react";
import { FileText, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { LegalDocumentKind } from "@/lib/legalDocuments";
import { observarPublicacao, type RevisaoDocumentoLegal } from "@/services/bancodados/documentosLegaisDB";

interface LegalDocumentsDialogProps {
  documentType: LegalDocumentKind | null;
  onClose: () => void;
}

const TITULOS: Record<LegalDocumentKind, string> = { terms: "Termos de Uso", privacy: "Política de Privacidade" };
const formatarData = (data?: { toDate?: () => Date }) =>
  data?.toDate?.().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) ?? "Data não informada";

export function LegalDocumentsDialog({ documentType, onClose }: LegalDocumentsDialogProps) {
  const [versao, setVersao] = useState<RevisaoDocumentoLegal | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!documentType) return;
    const unsubscribe = observarPublicacao(documentType, (documento, e) => {
      setVersao(documento);
      setErro(e ? "Não foi possível consultar o documento publicado. Tente novamente." : "");
      setCarregando(false);
    });
    return unsubscribe;
  }, [documentType]);

  return (
    <Dialog open={documentType !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        {documentType && (
          <>
            <DialogHeader className="shrink-0 bg-csae-green-800 p-5 text-white sm:p-6">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                {documentType === "privacy" ? <ShieldCheck className="h-5 w-5 shrink-0" /> : <FileText className="h-5 w-5 shrink-0" />}
                {TITULOS[documentType]}
              </DialogTitle>
              <DialogDescription className="text-sm text-csae-green-100">
                {versao ? `Versão ${versao.versao}.0 · Publicada em ${formatarData(versao.publicadoEm ?? versao.criadoEm)}` : "Consulta à versão vigente"}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="min-h-0 flex-1 overflow-auto bg-slate-50">
              <div className="space-y-5 p-5 text-sm leading-relaxed text-slate-700 sm:p-7">
                {carregando ? <p role="status">Carregando documento...</p> : erro ? (
                  <p role="alert" className="text-red-700">{erro}</p>
                ) : !versao ? (
                  <p role="status">Ainda não há versão oficial publicada deste documento. O Termo de Responsabilidade e Sigilo apresentado durante o cadastro permanece independente desta publicação.</p>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{versao.conteudo.introducao}</p>
                    {versao.conteudo.secoes.map((secao, index) => (
                      <section key={index} className="space-y-2" aria-label={secao.titulo}>
                        <h3 className="font-bold text-csae-green-900">{secao.titulo}</h3>
                        <p className="whitespace-pre-wrap">{secao.corpo}</p>
                      </section>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
            <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-white p-4 sm:px-6">
              <span className="text-xs text-slate-500">{versao ? `Versão ${versao.versao}.0 vigente` : "Documento não publicado"} · Somente leitura</span>
              <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
