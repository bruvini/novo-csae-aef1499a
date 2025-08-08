
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
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
      </div>
    </SidebarProvider>
  );
};

export default Index;
