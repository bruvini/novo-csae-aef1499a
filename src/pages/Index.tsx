
import React from 'react';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import NavigationCards from '@/components/NavigationCards';
import Footer from '@/components/Footer';

const Index = () => {
  const handleLogout = () => {
    // Implementação futura do logout
    console.log('Logout functionality to be implemented');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        userName="Enf. Maria Silva" // Placeholder - será integrado futuramente
        onLogout={handleLogout}
      />
      
      <main className="flex-1">
        <HeroBanner />
        <NavigationCards />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
