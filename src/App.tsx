
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

import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
                <ProtectedRoute requireAdmin>
                  <GestaoUsuarios />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/gestao-conteudos" 
              element={
                <ProtectedRoute requireGestor>
                  <GestaoConteudos />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Index />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
