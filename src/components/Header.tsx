
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  userName?: string;
  onLogout?: () => void;
}

const Header = ({ userName, onLogout }: HeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo e título */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-csae-green-100 rounded-lg flex items-center justify-center">
              {/* Placeholder para logo */}
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
