
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
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
import Timeline from "./pages/Timeline";
import NotFound from "./pages/NotFound";
import RotaProtegida from "./components/RotaProtegida";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/registro" element={<Register />} />
            
            {/* Rotas protegidas */}
            <Route element={<RotaProtegida />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            
            <Route element={<RotaProtegida />}>
              <Route path="/processo-enfermagem" element={<ProcessoEnfermagem />} />
            </Route>
            
            <Route element={<RotaProtegida />}>
              <Route path="/protocolos" element={<ProtocolosEnfermagem />} />
            </Route>
            
            <Route element={<RotaProtegida />}>
              <Route path="/pops" element={<POPs />} />
            </Route>
            
            <Route element={<RotaProtegida permiteSoAdmin={true} />}>
              <Route path="/gerenciamento" element={<GerenciamentoEnfermagem />} />
            </Route>
            
            <Route element={<RotaProtegida permiteSoAdmin={true} />}>
              <Route path="/gestao-usuarios" element={<GestaoUsuarios />} />
            </Route>
            
            <Route element={<RotaProtegida />}>
              <Route path="/sugestoes" element={<Sugestoes />} />
            </Route>
            
            <Route element={<RotaProtegida />}>
              <Route path="/timeline" element={<Timeline />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
