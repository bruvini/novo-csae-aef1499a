
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import ProcessoEnfermagem from "./pages/ProcessoEnfermagem";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import GestaoConteudos from "./pages/GestaoConteudos";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/registrar" element={<Register />} />
              
              {/* Rotas protegidas */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              
              <Route path="/processo-enfermagem" element={
                <ProtectedRoute>
                  <ProcessoEnfermagem />
                </ProtectedRoute>
              } />
              
              <Route path="/gestao-usuarios" element={
                <ProtectedRoute requireAdmin={true}>
                  <GestaoUsuarios />
                </ProtectedRoute>
              } />
              
              <Route path="/gestao-conteudos" element={
                <ProtectedRoute requireGestorConteudos={true}>
                  <GestaoConteudos />
                </ProtectedRoute>
              } />
              
              {/* Redirecionar rotas não encontradas para login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
