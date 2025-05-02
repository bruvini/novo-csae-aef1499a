
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAutenticacao } from '@/services/autenticacao';
import { verificarModuloAtivo } from '@/services/bancodados/modulosDB';

interface RotaProtegidaProps {
  children: React.ReactNode;
  apenasAdmin?: boolean;
  moduloNome?: string;
}

const RotaProtegida: React.FC<RotaProtegidaProps> = ({ 
  children, 
  apenasAdmin = false,
  moduloNome
}) => {
  const { verificarAutenticacao, verificarAdmin } = useAutenticacao();
  const { toast } = useToast();
  const [verificando, setVerificando] = useState(true);
  const [moduloAtivo, setModuloAtivo] = useState(true);
  const autenticado = verificarAutenticacao();
  const admin = verificarAdmin();
  
  useEffect(() => {
    const checarModulo = async () => {
      if (!moduloNome) {
        setModuloAtivo(true);
        setVerificando(false);
        return;
      }
      
      try {
        const ativo = await verificarModuloAtivo(moduloNome);
        setModuloAtivo(ativo);
      } catch (error) {
        console.error("Erro ao verificar módulo:", error);
        setModuloAtivo(false);
      } finally {
        setVerificando(false);
      }
    };
    
    checarModulo();
  }, [moduloNome]);

  // Enquanto verifica o módulo, não renderiza nada
  if (verificando) {
    return null;
  }

  if (!autenticado) {
    toast({
      title: "Acesso negado",
      description: "É necessário fazer login para acessar esta página.",
      variant: "destructive",
    });
    return <Navigate to="/" replace />;
  }

  if (apenasAdmin && !admin) {
    toast({
      title: "Acesso restrito",
      description: "Esta página é restrita para administradores.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" replace />;
  }
  
  if (moduloNome && !moduloAtivo && !admin) {
    toast({
      title: "Módulo indisponível",
      description: "Este recurso está em desenvolvimento e estará disponível em breve.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RotaProtegida;
