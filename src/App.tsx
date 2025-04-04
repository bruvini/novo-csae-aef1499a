
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Sugestoes from "./pages/Sugestoes";
import GestaoUsuarios from "./pages/GestaoUsuarios";
import ProcessoEnfermagem from "./pages/ProcessoEnfermagem";
import GerenciamentoEnfermagem from "./pages/GerenciamentoEnfermagem";
import NotFound from "./pages/NotFound";
import RotaProtegida from "./components/RotaProtegida";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/registrar" element={<Register />} />
          
          {/* Rotas protegidas - exigem autenticação */}
          <Route path="/dashboard" element={
            <RotaProtegida>
              <Dashboard />
            </RotaProtegida>
          } />
          <Route path="/sugestoes" element={
            <RotaProtegida>
              <Sugestoes />
            </RotaProtegida>
          } />
          <Route path="/processo-enfermagem" element={
            <RotaProtegida>
              <ProcessoEnfermagem />
            </RotaProtegida>
          } />
          
          {/* Rotas protegidas apenas para administradores */}
          <Route path="/gestao-usuarios" element={
            <RotaProtegida apenasAdmin>
              <GestaoUsuarios />
            </RotaProtegida>
          } />
          <Route path="/gerenciamento-enfermagem" element={
            <RotaProtegida apenasAdmin>
              <GerenciamentoEnfermagem />
            </RotaProtegida>
          } />
          
          {/* Rota 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
