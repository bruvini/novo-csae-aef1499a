import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import ModalNPSObrigatorio from '@/components/ModalNPSObrigatorio';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const { npsModalPendente, concluirNPSObrigatorio, sessionData } = useAuth();

  return (
    <div className="min-h-screen flex flex-col w-full bg-gray-50 flex-1">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 mt-4">
        {children}
      </main>
      <Footer />

      {/* Modal NPS obrigatório — não pode ser fechado sem avaliar */}
      {npsModalPendente && sessionData && (
        <ModalNPSObrigatorio
          usuarioId={sessionData.uid}
          nomeUsuario={sessionData.nomeCompleto}
          onConcluido={concluirNPSObrigatorio}
        />
      )}
    </div>
  );
};

export default AuthenticatedLayout;
