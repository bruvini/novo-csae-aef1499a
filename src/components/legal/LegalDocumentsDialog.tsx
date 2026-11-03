import { FileText, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { LEGAL_DOCUMENTS, type LegalDocumentKind } from "@/lib/legalDocuments";

interface LegalDocumentsDialogProps {
  documentType: LegalDocumentKind | null;
  onClose: () => void;
}

export function LegalDocumentsDialog({ documentType, onClose }: LegalDocumentsDialogProps) {
  const document = documentType ? LEGAL_DOCUMENTS[documentType] : null;

  return (
    <Dialog open={documentType !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        {document && (
          <>
            <DialogHeader className="shrink-0 bg-csae-green-800 p-5 text-white sm:p-6">
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                {documentType === "privacy" ? <ShieldCheck className="h-5 w-5 shrink-0" /> : <FileText className="h-5 w-5 shrink-0" />}
                {document.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-csae-green-100">
                Versão {document.version} · Atualização: {document.updatedAt}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="min-h-0 flex-1 overflow-auto bg-slate-50">
              <div className="space-y-5 p-5 text-sm leading-relaxed text-slate-700 sm:p-7">
                <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 font-medium text-amber-950">
                  {document.status}
                </p>
                <p>{document.introduction}</p>
                {document.sections.map((section) => (
                  <section key={section.title} className="space-y-2" aria-label={section.title}>
                    <h3 className="font-bold text-csae-green-900">{section.title}</h3>
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </section>
                ))}
              </div>
            </ScrollArea>
            <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-white p-4 sm:px-6">
              <span className="text-xs text-slate-500">Leitura pública · Não constitui aceite</span>
              <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
