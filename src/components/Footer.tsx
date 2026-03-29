import React from 'react';
import { Instagram, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-csae-green-900 text-white py-8 mt-auto" role="contentinfo">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/10">
          {/* Logo e Missão */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <img src="/logo_csae.png" alt="Logo" className="h-6 w-auto brightness-0 invert" />
              </div>
              <h3 className="text-lg font-black tracking-tighter uppercase italic">Portal CSAE <span className="text-csae-green-400">2.0</span></h3>
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
              <a href="https://instagram.com/enfermagemfloripa" target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-csae-green-100/80 hover:text-white transition-colors">
                <Instagram className="w-4 h-4" /> @enfermagemfloripa
              </a>
              <a href="mailto:contato@portalcsaefloripa.com.br" className="flex items-center gap-2 text-sm text-csae-green-100/80 hover:text-white transition-colors">
                <Mail className="w-4 h-4" /> Suporte Técnico
              </a>
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-csae-green-400">Transparência</h4>
            <div className="flex flex-col space-y-2">
              <a href="#" className="text-sm text-csae-green-100/80 hover:text-white transition-colors">Termos & LGPD</a>
              <a href="#" className="text-sm text-csae-green-100/80 hover:text-white transition-colors">Política de Privacidade</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[10px] text-csae-green-100/40 uppercase tracking-[0.2em] font-medium text-center md:text-left">
            Gerência Técnica de Enfermagem <span className="mx-2">|</span> SMS Florianópolis
          </div>
          <div className="flex items-center gap-6">
            <p className="text-[10px] text-csae-green-100/60 font-medium">© 2025 PORTAL CSAE</p>
            <div className="h-4 w-[1px] bg-white/10 hidden md:block"></div>
            <p className="text-[10px] text-csae-green-100/60 font-medium">DESIGN BY BRUVINI</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
