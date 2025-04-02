
import React from 'react';
import LoginForm from '@/components/LoginForm';
import WelcomePanel from '@/components/WelcomePanel';
import { Heart } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex flex-col items-center justify-center flex-1 w-full px-4 py-12">
        <div className="container">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 items-stretch max-w-6xl mx-auto">
            {/* Coluna do formulário de login */}
            <div className="lg:col-span-5">
              <LoginForm />
            </div>
            
            {/* Coluna do painel de boas-vindas */}
            <div className="lg:col-span-7">
              <WelcomePanel />
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-6 text-center text-sm text-gray-500">
        <p className="flex items-center justify-center gap-1.5">
          Desenvolvido com 
          <Heart className="w-4 h-4 fill-csae-green-500 text-csae-green-500" /> 
          por Bruno Vinícius, em colaboração com a Comissão Permanente de Sistematização da Assistência de Enfermagem (CSAE) de Florianópolis
        </p>
      </footer>
    </div>
  );
};

export default Index;
