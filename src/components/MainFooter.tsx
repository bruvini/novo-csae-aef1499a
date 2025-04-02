
import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Linkedin } from 'lucide-react';

const MainFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-csae-green-50 border-t border-csae-green-100 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-csae-green-700 font-semibold mb-3">Portal CSAE Floripa</h3>
            <p className="text-sm text-gray-600">
              © {currentYear} Comissão Permanente de Sistematização da Assistência de Enfermagem (CSAE). Todos os direitos reservados.
            </p>
          </div>
          
          <div>
            <h3 className="text-csae-green-700 font-semibold mb-3">Documentos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/documentos/termo-responsabilidade" className="text-sm text-csae-green-600 hover:text-csae-green-800 hover:underline">
                  Termo de Responsabilidade
                </Link>
              </li>
              <li>
                <Link to="/documentos/politicas-uso" className="text-sm text-csae-green-600 hover:text-csae-green-800 hover:underline">
                  Políticas de Uso
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-csae-green-700 font-semibold mb-3">Redes Sociais</h3>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-csae-green-600 hover:text-csae-green-800"
                aria-label="Instagram"
                title="Instagram (em breve)"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-csae-green-600 hover:text-csae-green-800"
                aria-label="LinkedIn"
                title="LinkedIn (em breve)"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
