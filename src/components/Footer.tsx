import React from 'react';
import { Instagram, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LegalDocumentLinks } from '@/components/legal/LegalDocumentLinks';

const Footer = () => {

  const linkExterno = 'text-csae-green-100/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csae-green-400 rounded';
  const contato = 'inline-flex min-w-0 items-center gap-1.5 text-xs text-csae-green-100/80 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csae-green-400 rounded';

  return (
    <footer className="mt-auto bg-csae-green-900 py-3 text-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-[minmax(210px,1fr)_minmax(360px,1.7fr)_auto] md:items-center">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src="/logo_csae.png" alt="Logo CSAE" className="h-7 w-auto shrink-0 brightness-0 invert" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold leading-tight tracking-tight">Portal CSAE Floripa <span className="text-csae-green-400">2.0</span></h3>
              <p className="mt-0.5 text-xs leading-snug text-csae-green-100/70">Tecnologia a serviço da enfermagem pública de Florianópolis.</p>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 border-y border-white/10 py-2 md:border-y-0 md:py-0">
            <a href="https://www.instagram.com/enfermagemfloripa/" target="_blank" rel="noopener noreferrer" className={`${contato} whitespace-nowrap`} aria-label="Instagram @enfermagemfloripa (abre em nova aba)">
              <Instagram className="h-4 w-4 shrink-0" aria-hidden="true" />@enfermagemfloripa
            </a>
            <a href="https://www.instagram.com/portalcsaefloripa/" target="_blank" rel="noopener noreferrer" className={`${contato} whitespace-nowrap`} aria-label="Instagram @portalcsaefloripa (abre em nova aba)">
              <Instagram className="h-4 w-4 shrink-0" aria-hidden="true" />@portalcsaefloripa
            </a>
            <a href="mailto:gerenf.sms.pmf@gmail.com" className={contato} aria-label="E-mail de suporte clínico e acadêmico">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /><span><span className="font-semibold">Clínico</span>: gerenf.sms.pmf@gmail.com</span>
            </a>
            <a href="mailto:bruvini.silva12@gmail.com" className={contato} aria-label="E-mail de suporte técnico">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /><span><span className="font-semibold">Técnico</span>: bruvini.silva12@gmail.com</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:justify-end">
            <Link to="/timeline" className={`${linkExterno} font-semibold`}>Nossa História</Link>
            <span className="font-semibold uppercase tracking-wide text-csae-green-400">Transparência</span>
            <LegalDocumentLinks className="contents" linkClassName={`${linkExterno} text-left`} />
          </div>
        </div>

        <div className="mt-2 flex flex-col items-center justify-between gap-x-3 gap-y-1 border-t border-white/10 pt-2 text-center text-[11px] leading-tight text-csae-green-100/60 sm:flex-row sm:text-left">
          <a href="https://www.pmf.sc.gov.br/entidades/saude/index.php?cms=csae+++apresentacao&menu=9&submenuid=1478" target="_blank" rel="noopener noreferrer" className={`${linkExterno} text-[10px] text-csae-green-100/60`} aria-label="Comissão Permanente de Sistematização da Assistência de Enfermagem — CSAE (abre em nova aba)">
            Comissão Permanente de Sistematização da Assistência de Enfermagem (CSAE)
          </a>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-end">
            <span>© 2022 Portal CSAE Floripa 2.0</span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span>Desenvolvido por <a href="https://www.linkedin.com/in/enfbrunovinicius/" target="_blank" rel="noopener noreferrer" className={`${linkExterno} underline-offset-2 hover:underline`} aria-label="LinkedIn de Bruno Vinícius da Silva (abre em nova aba)">Bruno Vinícius da Silva</a></span>
            <span aria-hidden="true">·</span>
            <span>Idealizado por <a href="https://br.linkedin.com/in/elizimara-ferreira-siqueira-92767454" target="_blank" rel="noopener noreferrer" className={`${linkExterno} underline-offset-2 hover:underline`} aria-label="LinkedIn de Elizimara Ferreira Siqueira (abre em nova aba)">Elizimara Ferreira Siqueira</a></span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
