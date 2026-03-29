
import React from 'react';
import { Instagram, Facebook, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-csae-green-800 text-white py-8" role="contentinfo">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Informações do Portal */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Portal CSAE Floripa 2.0</h3>
            <p className="text-sm text-green-100 leading-relaxed">
              Plataforma desenvolvida para profissionais de enfermagem da rede pública de saúde de Florianópolis, 
              com foco na excelência do cuidado e inovação tecnológica.
            </p>
            <div className="bg-green-700 p-3 rounded-lg">
              <p className="text-xs font-medium text-green-100">
                <strong>Importante:</strong> Acesso exclusivo para profissionais da rede municipal de saúde de Florianópolis. 
                Dados verificados pela Gerência Técnica de Enfermagem.
              </p>
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Siga-nos</h3>
            <div className="space-y-3">
              <a
                href="https://instagram.com/enfermagemfloripa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-green-100 hover:text-white transition-colors"
                aria-label="Instagram da Enfermagem de Floripa"
              >
                <Instagram className="w-5 h-5" />
                <span className="text-sm">@enfermagemfloripa</span>
              </a>
              <a
                href="https://instagram.com/bruvini"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-green-100 hover:text-white transition-colors"
                aria-label="Instagram do desenvolvedor Bruno"
              >
                <Instagram className="w-5 h-5" />
                <span className="text-sm">@bruvini (Desenvolvedor)</span>
              </a>
              <a
                href="https://instagram.com/portalcsaefloripa"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-green-100 hover:text-white transition-colors"
                aria-label="Instagram oficial do Portal CSAE Floripa"
              >
                <Instagram className="w-5 h-5" />
                <span className="text-sm">@portalcsaefloripa</span>
              </a>
            </div>
          </div>

          {/* Links Legais */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Informações Legais</h3>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-green-100 hover:text-white transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="block text-sm text-green-100 hover:text-white transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="block text-sm text-green-100 hover:text-white transition-colors">
                LGPD - Lei Geral de Proteção de Dados
              </a>
              <a 
                href="mailto:contato@portalcsaefloripa.com.br" 
                className="flex items-center space-x-2 text-sm text-green-100 hover:text-white transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Contato</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-green-700 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-green-100">
              © 2025 Portal CSAE Floripa 2.0 - Todos os direitos reservados
            </p>
            <p className="text-xs text-green-200">
              Versão 2.0 | Desenvolvido com ❤️ para a enfermagem de Floripa
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
