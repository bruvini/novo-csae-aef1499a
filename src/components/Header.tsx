
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, Menu } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
}

const Header = ({ userName, onLogout }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { toggleSidebar } = useSidebar();

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 backdrop-blur-md shadow-lg border-csae-green-200/50' 
        : 'bg-white shadow-sm border-csae-green-200'
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo, toggle button e título */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8 hover:bg-csae-green-100"
              aria-label="Abrir/fechar menu lateral"
            >
              <Menu className="h-4 w-4 text-csae-green-700" />
            </Button>
            
            <div className="h-10 w-10 bg-csae-green-100 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-csae-green-600 rounded-sm"></div>
            </div>
            
            <div>
              <h1 className="text-lg font-bold text-csae-green-800 sm:text-xl">
                Portal CSAE Floripa 2.0
              </h1>
              <p className="text-xs text-gray-600 hidden sm:block">
                Tecnologia e Cuidado de Mãos Dadas
              </p>
            </div>
          </div>

          {/* Área do usuário e logout */}
          <div className="flex items-center space-x-3">
            {userName && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-700">
                <User className="w-4 h-4" />
                <span>Bem-vindo(a), {userName}!</span>
              </div>
            )}
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="csae-btn-secondary"
              aria-label="Sair do sistema"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
