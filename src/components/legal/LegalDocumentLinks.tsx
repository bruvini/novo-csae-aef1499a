import { useState } from "react";
import { LegalDocumentsDialog } from "./LegalDocumentsDialog";
import type { LegalDocumentKind } from "@/lib/legalDocuments";

interface LegalDocumentLinksProps {
  linkClassName?: string;
  className?: string;
}

export function LegalDocumentLinks({ linkClassName, className = "inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1" }: LegalDocumentLinksProps) {
  const [documentType, setDocumentType] = useState<LegalDocumentKind | null>(null);

  return (
    <>
      <span className={className}>
        <button type="button" className={linkClassName} onClick={() => setDocumentType("terms")}>
          Termos de Uso
        </button>
        <button type="button" className={linkClassName} onClick={() => setDocumentType("privacy")}>
          Política de Privacidade
        </button>
      </span>
      <LegalDocumentsDialog documentType={documentType} onClose={() => setDocumentType(null)} />
    </>
  );
}
