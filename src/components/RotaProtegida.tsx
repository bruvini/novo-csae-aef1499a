
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
  const [moduloVisibilidade, setModuloVisibilidade] = useState<'todos' | 'admin' | 'sms'>('todos');
  
  const autenticado = verificarAutenticacao();
  const admin = verificarAdmin();
  
  // Verificar se o usuário atua na SMS
  const verificarAtuaSMS = () => {
    try {
      const dadosUsuario = localStorage.getItem('usuario');
      if (dadosUsuario) {
        const usuario = JSON.parse(dadosUsuario);
        return usuario.atuaSMS === true;
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar atuaSMS:", error);
      return false;
    }
  };
  
  const atuaSMS = verificarAtuaSMS();
  
  useEffect(() => {
    const checarModulo = async () => {
      if (!moduloNome) {
        setModuloAtivo(true);
        setModuloVisibilidade('todos');
        setVerificando(false);
        return;
      }
      
      try {
        const resultado = await verificarModuloAtivo(moduloNome);
        setModuloAtivo(resultado.ativo);
        setModuloVisibilidade(resultado.visibilidade || 'todos');
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

  // Verificar acesso baseado em apenasAdmin (prop de mais alto nível)
  if (apenasAdmin && !admin) {
    toast({
      title: "Acesso restrito",
      description: "Esta página é restrita para administradores.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" replace />;
  }
  
  // Verificar acesso baseado na visibilidade do módulo
  if (moduloNome && !admin) {
    // Verificar se o módulo está ativo
    if (!moduloAtivo) {
      toast({
        title: "Módulo indisponível",
        description: "Este recurso está em desenvolvimento e estará disponível em breve.",
        variant: "destructive",
      });
      return <Navigate to="/dashboard" replace />;
    }
    
    // Verificar visibilidade específica
    if (moduloVisibilidade === 'admin') {
      toast({
        title: "Acesso restrito",
        description: "Este recurso é restrito para administradores.",
        variant: "destructive",
      });
      return <Navigate to="/dashboard" replace />;
    }
    
    if (moduloVisibilidade === 'sms' && !atuaSMS) {
      toast({
        title: "Acesso restrito",
        description: "Este recurso é restrito para usuários que atuam na SMS.",
        variant: "destructive",
      });
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default RotaProtegida;
