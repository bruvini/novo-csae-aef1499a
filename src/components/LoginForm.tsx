
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, LogIn, UserPlus } from "lucide-react";

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt with:', { email, password });
    // Aqui você implementaria a lógica de autenticação
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg animate-fade-in">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-csae-green-800">
          Acesse o portal
        </h1>
        <p className="text-sm text-gray-500">
          Insira suas credenciais para acessar nossas ferramentas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            />
          </div>
          <div className="text-right">
            <a href="#" className="text-xs csae-link">
              Esqueceu sua senha?
            </a>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 pt-2">
          <Button 
            type="submit"
            className="csae-btn-primary"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Acessar
          </Button>
          
          <Button 
            type="button"
            className="csae-btn-secondary"
            onClick={() => console.log('Registro')}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Registrar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
