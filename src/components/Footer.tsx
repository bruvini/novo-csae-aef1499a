import React from 'react';
import { Instagram, Mail } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Footer = () => {
  const { toast } = useToast();

  const handleTransparenciaClick = () => {
    toast({
      title: 'Conteúdo em atualização',
      description:
        'Estamos atualizando estas informações para disponibilizá-las de forma completa e transparente em breve.',
    });
  };

  return (
    <footer className="bg-csae-green-900 text-white py-8 mt-auto" role="contentinfo">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
          {/* Logo e Missão */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <img src="/logo_csae.png" alt="Logo CSAE" className="h-6 w-auto brightness-0 invert" />
              </div>
              <h3 className="text-lg font-black tracking-tighter italic">
                Portal CSAE Floripa <span className="text-csae-green-400">2.0</span>
              </h3>
            </div>
            <p className="text-sm text-csae-green-100/70 leading-relaxed max-w-md">
              Tecnologia a serviço da enfermagem pública de Florianópolis.
              Um ecossistema de dados para a excelência do cuidado técnico-científico.
            </p>
          </div>

          {/* Social & Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-csae-green-400">Conectar</h4>
            <div className="flex flex-col space-y-2">
              <a
                href="https://www.instagram.com/enfermagemfloripa/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-csae-green-100/80 hover:text-white transition-colors"
                aria-label="Instagram @enfermagemfloripa (abre em nova aba)"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
                @enfermagemfloripa
              </a>
              <a
                href="https://www.instagram.com/portalcsaefloripa/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-csae-green-100/80 hover:text-white transition-colors"
                aria-label="Instagram @portalcsaefloripa (abre em nova aba)"
              >
                <Instagram className="w-4 h-4" aria-hidden="true" />
                @portalcsaefloripa
              </a>
              <div className="pt-1 flex flex-col space-y-1.5">
                <a
                  href="mailto:gerenf.sms.pmf@gmail.com"
                  className="flex items-start gap-2 text-sm text-csae-green-100/80 hover:text-white transition-colors"
                  aria-label="E-mail de suporte clínico e acadêmico"
                >
                  <Mail className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-xs font-semibold text-csae-green-300 leading-tight">Suporte Clínico/Acadêmico</span>
                    <span className="text-xs text-csae-green-100/70 break-all">gerenf.sms.pmf@gmail.com</span>
                  </span>
                </a>
                <a
                  href="mailto:bruvini.silva12@gmail.com"
                  className="flex items-start gap-2 text-sm text-csae-green-100/80 hover:text-white transition-colors"
                  aria-label="E-mail de suporte técnico"
                >
                  <Mail className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-xs font-semibold text-csae-green-300 leading-tight">Suporte Técnico</span>
                    <span className="text-xs text-csae-green-100/70 break-all">bruvini.silva12@gmail.com</span>
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-csae-green-400">Transparência</h4>
            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={handleTransparenciaClick}
                className="text-left text-sm text-csae-green-100/80 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csae-green-400 rounded"
              >
                Termos &amp; LGPD
              </button>
              <button
                type="button"
                onClick={handleTransparenciaClick}
                className="text-left text-sm text-csae-green-100/80 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csae-green-400 rounded"
              >
                Política de Privacidade
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <a
            href="https://www.pmf.sc.gov.br/entidades/saude/index.php?cms=csae+++apresentacao&menu=9&submenuid=1478"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-csae-green-100/40 uppercase tracking-[0.2em] font-medium text-center md:text-left hover:text-csae-green-100/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csae-green-400 rounded"
            aria-label="Comissão Permanente de Sistematização da Assistência de Enfermagem — CSAE (abre em nova aba)"
          >
            Comissão Permanente de Sistematização da Assistência de Enfermagem (CSAE)
          </a>

          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-[10px] text-csae-green-100/60 font-medium">
              © 2022 Portal CSAE Floripa 2.0
            </p>
            <p className="text-[10px] text-csae-green-100/40 font-medium text-center md:text-right leading-relaxed">
              Desenvolvido por{' '}
              <a
                href="https://www.linkedin.com/in/enfbrunovinicius/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-csae-green-100/60 hover:text-csae-green-300 transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csae-green-400 rounded"
                aria-label="LinkedIn de Bruno Vinícius da Silva (abre em nova aba)"
              >
                Bruno Vinícius da Silva
              </a>
              {' · '}Idealizado por{' '}
              <a
                href="https://br.linkedin.com/in/elizimara-ferreira-siqueira-92767454"
                target="_blank"
                rel="noopener noreferrer"
                className="text-csae-green-100/60 hover:text-csae-green-300 transition-colors underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csae-green-400 rounded"
                aria-label="LinkedIn de Elizimara Ferreira Siqueira (abre em nova aba)"
              >
                Elizimara Ferreira Siqueira
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
