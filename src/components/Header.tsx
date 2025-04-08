
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAutenticacao } from '@/services/autenticacao';
import { useToast } from '@/hooks/use-toast';

const Header = () => {
  const { usuario, sair, obterSessao } = useAutenticacao();
  const [nomeUsuario, setNomeUsuario] = useState<string>('Usuário');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const sessao = obterSessao();
    if (sessao) {
      setNomeUsuario('Enf. ' + (sessao.nomeUsuario.split(' ')[0] || 'Usuário'));
    }
  }, [obterSessao]);

  const handleSair = async () => {
    try {
      await sair();
      toast({
        title: "Sessão encerrada",
        description: "Você saiu do sistema com sucesso.",
      });
      navigate('/');
    } catch (erro) {
      console.error("Erro ao sair:", erro);
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao tentar encerrar sua sessão.",
        variant: "destructive"
      });
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-csae-green-100 py-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img 
                src="/lovable-uploads/6d9cba4c-ad70-4be0-a8ff-5eb1c6c2bed5.png" 
                alt="Logo CSAE Floripa" 
                className="h-12"
              />
            </Link>
            <h1 className="text-csae-green-700 text-xl font-semibold hidden sm:block">
              Portal CSAE Floripa 2.0
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <p className="text-csae-green-600 font-medium hidden sm:block">
              Bem-vindo(a), <span className="font-semibold">{nomeUsuario}</span>
            </p>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 text-csae-green-600 hover:text-csae-green-800 hover:bg-csae-green-50"
              onClick={handleSair}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
