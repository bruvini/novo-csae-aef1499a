import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col w-full bg-gray-50 flex-1">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 mt-4">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default AuthenticatedLayout;
