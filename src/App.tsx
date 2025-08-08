
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registrar" element={<Register />} />
            <Route path="/processo-enfermagem" element={<ProcessoEnfermagem />} />
            <Route path="/gestao-usuarios" element={<GestaoUsuarios />} />
            <Route path="/gestao-conteudos" element={<GestaoConteudos />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
