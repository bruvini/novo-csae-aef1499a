
import React from 'react';
import LoginForm from '@/components/login/LoginForm';
import WelcomePanel from '@/components/WelcomePanel';
import SimpleFooter from '@/components/SimpleFooter';

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
      
      <SimpleFooter />
    </div>
  );
};

export default Index;
