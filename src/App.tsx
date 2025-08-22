
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient } from '@/contexts/QueryContext';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ProcessoEnfermagem from '@/pages/ProcessoEnfermagem';
import GestaoConteudos from '@/pages/GestaoConteudos';
import GestaoUsuarios from '@/pages/GestaoUsuarios';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/ProtectedRoute';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';

function App() {
  return (
    <QueryClient>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes with AuthLayout */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Private Routes with DashboardLayout */}
            <Route 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Index />} />
              <Route path="/processo-enfermagem" element={<ProcessoEnfermagem />} />
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
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClient>
  );
}

export default App;
