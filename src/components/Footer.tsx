import { Instagram, Mail } from 'lucide-react';
import { LegalDocumentLinks } from '@/components/legal/LegalDocumentLinks';

const Footer = () => {
  const ano = new Date().getFullYear();
  const link = 'rounded-sm text-emerald-100/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200';
  return (
    <footer role="contentinfo" className="mt-auto border-t border-white/10 bg-csae-green-900 text-white">
      <div className="mx-auto w-full max-w-[1440px] space-y-4 px-5 py-5 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/logo_csae.png" alt="" className="h-9 w-9 shrink-0 object-contain brightness-0 invert" />
            <div className="min-w-0">
              <p className="font-semibold leading-tight">Portal CSAE Floripa <span className="text-emerald-300">2.0</span></p>
              <p className="mt-1 text-xs text-emerald-100/70">Tecnologia para o Processo de Enfermagem</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <a href="mailto:gerenf.sms.pmf@gmail.com" className={link + ' inline-flex items-center gap-1.5'} aria-label="Contato clínico">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Clínico: gerenf.sms.pmf@gmail.com</span>
            </a>
            <a href="mailto:bruvini.silva12@gmail.com" className={link + ' inline-flex items-center gap-1.5'} aria-label="Contato técnico">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Técnico: bruvini.silva12@gmail.com</span>
            </a>
          </div>
          <nav aria-label="Documentos e redes sociais" className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <LegalDocumentLinks className="contents" linkClassName={link} />
            <a href="https://www.instagram.com/portalcsaefloripa/" target="_blank" rel="noopener noreferrer"
              className={link + ' inline-flex items-center gap-1.5'} aria-label="Instagram do Portal CSAE (abre em nova aba)">
              <Instagram className="h-3.5 w-3.5" aria-hidden="true" /> Instagram
            </a>
          </nav>
        </div>
        <div className="flex flex-col justify-between gap-2 border-t border-white/15 pt-3 text-[11px] text-emerald-100/65 sm:flex-row sm:items-center">
          <span>© 2022–{Math.max(2022, ano)} Portal CSAE Floripa 2.0</span>
          <span>Desenvolvimento: Bruno Vinícius da Silva <span aria-hidden="true">·</span> Idealização: Elizimara Ferreira Siqueira</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
