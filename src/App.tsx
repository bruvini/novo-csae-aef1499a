
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import WaitingApproval from "./pages/WaitingApproval";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import GestaoConteudos from "./pages/GestaoConteudos";
import ProcessoEnfermagem from "./pages/ProcessoEnfermagem";
import PainelEstatistico from "./pages/PainelEstatistico";
import DebugUsers from "./pages/DebugUsers";
import CentralAjuda from "./pages/CentralAjuda";
import GestaoSuporte from "./pages/GestaoSuporte";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { SupportNotificationsProvider } from "./contexts/SupportNotificationsContext";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <SupportNotificationsProvider>
              <Toaster />
              <Sonner />
              <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Index />} />
              <Route path="/register" element={<Register />} />
              <Route path="/registrar" element={<Register />} />
              <Route path="/waiting-approval" element={<WaitingApproval />} />
              
              {/* Authenticated Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/gestao-usuarios" 
                element={
                  <ProtectedRoute allowedPageId="GestaoUsuarios">
                    <GestaoUsuarios />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/gestao-conteudos" 
                element={
                  <ProtectedRoute allowedPageId="GestaoConteudos">
                    <GestaoConteudos />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/processo-enfermagem" 
                element={
                  <ProtectedRoute>
                    <ProcessoEnfermagem />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/painel-estatistico" 
                element={
                  <ProtectedRoute allowedPageId="PainelEstatistico">
                    <PainelEstatistico />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/debug-users" 
                element={
                  <ProtectedRoute requireAdmin>
                    <DebugUsers />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/ajuda" 
                element={
                  <ProtectedRoute>
                    <CentralAjuda />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/gestao-suporte" 
                element={
                  <ProtectedRoute allowedPageId="GestaoSuporte">
                    <GestaoSuporte />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Index />} />
              </Routes>
            </SupportNotificationsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
