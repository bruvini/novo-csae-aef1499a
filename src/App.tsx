
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient } from '@/contexts/QueryContext';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ProcessoEnfermagem from '@/pages/ProcessoEnfermagem';
import GestaoConteudos from '@/pages/GestaoConteudos';
import GestaoUsuarios from '@/pages/GestaoUsuarios';
import NotFound from '@/pages/NotFound';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import Header from '@/components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <QueryClient>
      <Router>
        <AuthProvider>
          <SidebarProvider defaultOpen={false}>
            <div className="min-h-screen flex w-full bg-gray-50">
              <AppSidebar />
              <SidebarInset className="flex-1 flex flex-col">
                <Header />
                <main className="flex-1 p-6">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route 
                      path="/processo-enfermagem" 
                      element={
                        <ProtectedRoute>
                          <ProcessoEnfermagem />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/gestao-conteudos" 
                      element={
                        <ProtectedRoute requireAdmin>
                          <GestaoConteudos />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/gestao-usuarios" 
                      element={
                        <ProtectedRoute requireAdmin>
                          <GestaoUsuarios />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </SidebarInset>
            </div>
            <Toaster />
          </SidebarProvider>
        </AuthProvider>
      </Router>
    </QueryClient>
  );
}

export default App;
