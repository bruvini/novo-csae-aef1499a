
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAutenticacao } from "@/services/autenticacao";

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { entrar } = useAutenticacao();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      await entrar(email, password);
    } catch (error) {
      toast({
        title: "Erro ao acessar",
        description: "Verifique suas credenciais e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg animate-fade-in h-full flex flex-col">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-csae-green-800">
          Acesse o portal
        </h1>
        <p className="text-sm text-gray-500">
          Insira suas credenciais para acessar nossas ferramentas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-grow">
        <div className="space-y-2">
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-csae-green-500" />
            <Input
              type="email"
              placeholder="Seu e-mail"
              className="csae-input pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-csae-green-500" />
            <Input
              type="password"
              placeholder="Sua senha"
              className="csae-input pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="text-right">
            <a href="#" className="text-xs csae-link">
              Esqueceu sua senha?
            </a>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 pt-2 mt-auto">
          <Button 
            type="submit"
            className="csae-btn-primary"
            disabled={loading}
          >
            <LogIn className="mr-2 h-4 w-4" />
            {loading ? "Acessando..." : "Acessar"}
          </Button>
          
          <Button 
            type="button"
            className="csae-btn-secondary"
            onClick={() => window.location.href = '/registrar'}
            disabled={loading}
            asChild
          >
            <Link to="/registrar">
              <UserPlus className="mr-2 h-4 w-4" />
              Registrar
            </Link>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
