
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
import ProtocolosEnfermagem from "./pages/ProtocolosEnfermagem";
import POPs from "./pages/POPs";
import MinicursoCipe from "./pages/MinicursoCipe";
import Timeline from "./pages/Timeline";
import AcompanhamentoPerinatal from "./pages/AcompanhamentoPerinatal";
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
          <Route path="/minicurso-cipe" element={<MinicursoCipe />} />
          <Route path="/timeline" element={<Timeline />} />
          
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
          <Route path="/protocolos" element={
            <RotaProtegida>
              <ProtocolosEnfermagem />
            </RotaProtegida>
          } />
          <Route path="/pops" element={
            <RotaProtegida moduloNome="pops">
              <POPs />
            </RotaProtegida>
          } />
          <Route path="/acompanhamento-perinatal" element={
            <RotaProtegida moduloNome="acompanhamento-perinatal">
              <AcompanhamentoPerinatal />
            </RotaProtegida>
          } />
          <Route path="/minicurso-cipe" element={
            <RotaProtegida moduloNome="minicurso-cipe">
              <MinicursoCipe />
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
