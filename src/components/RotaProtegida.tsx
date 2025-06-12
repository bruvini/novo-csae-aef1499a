
import React, { useEffect, useState, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAutenticacao } from '@/hooks/useAutenticacao';
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
  const { verificarAutenticacao, verificarAdmin, carregando } = useAutenticacao();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [verificando, setVerificando] = useState(true);
  const [moduloAtivo, setModuloAtivo] = useState(true);
  const [moduloVisibilidade, setModuloVisibilidade] = useState<'todos' | 'admin' | 'sms'>('todos');
  
  const autenticado = verificarAutenticacao();
  const admin = verificarAdmin();
  
  // Memoize the SMS check to avoid recalculating on every render
  const atuaSMS = useMemo(() => {
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
  }, []);

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

  useEffect(() => {
    if (verificando || carregando) return;


    if (!autenticado) {
      toast({
        title: "Acesso negado",
        description: "É necessário fazer login para acessar esta página.",
        variant: "destructive",
      });
      navigate("/", { replace: true });
      return;
    }

    if (apenasAdmin && !admin) {
      toast({
        title: "Acesso restrito",
        description: "Esta página é restrita para administradores.",
        variant: "destructive",
      });
      navigate("/dashboard", { replace: true });
      return;
    }

    if (moduloNome && !admin) {
      if (!moduloAtivo) {
        toast({
          title: "Módulo indisponível",
          description:
            "Este recurso está em desenvolvimento e estará disponível em breve.",
          variant: "destructive",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      if (moduloVisibilidade === "admin") {
        toast({
          title: "Acesso restrito",
          description: "Este recurso é restrito para administradores.",
          variant: "destructive",
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      if (moduloVisibilidade === "sms" && !atuaSMS) {
        toast({
          title: "Acesso restrito",
          description: "Este recurso é restrito para usuários que atuam na SMS.",
          variant: "destructive",
        });
        navigate("/dashboard", { replace: true });
        return;
      }
    }
  }, [autenticado, admin, moduloAtivo, moduloVisibilidade, atuaSMS, carregando]);

  // Enquanto verifica o módulo ou a autenticação, não renderiza nada
  if (verificando || carregando) {
    return null;
  }


  return <>{children}</>;
};

export default RotaProtegida;
