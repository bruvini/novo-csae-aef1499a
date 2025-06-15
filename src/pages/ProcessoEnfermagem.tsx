
import React from 'react';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';

const ProcessoEnfermagem = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <NavigationMenu activeItem="processo-enfermagem" />
      
      <main className="flex-1 container mx-auto px-4 py-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-csae-green-700 mb-4">
            Processo de Enfermagem
          </h1>
          <p className="text-lg text-gray-600">
            A ferramenta está em desenvolvimento.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ProcessoEnfermagem;
