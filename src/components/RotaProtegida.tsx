
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAutenticacao } from '@/services/autenticacao';
import { useToast } from '@/hooks/use-toast';

interface RotaProtegidaProps {
  children: React.ReactNode;
  apenasAdmin?: boolean;
}

const RotaProtegida = ({ children, apenasAdmin = false }: RotaProtegidaProps) => {
  const { verificarAutenticacao, verificarAdmin, obterSessao } = useAutenticacao();
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const autenticado = await verificarAutenticacao();
        
        if (!autenticado) {
          toast({
            title: "Acesso negado",
            description: "Você precisa estar autenticado para acessar esta página.",
            variant: "destructive"
          });
          setAutorizado(false);
          return;
        }
        
        const sessao = obterSessao();
        
        // Verificar se o status de acesso é "Aprovado"
        if (sessao && sessao.statusAcesso !== "Aprovado") {
          toast({
            title: "Acesso bloqueado",
            description: "Seu acesso ao sistema está indisponível no momento.",
            variant: "destructive"
          });
          setAutorizado(false);
          return;
        }
        
        // Verificar permissão de administrador se necessário
        if (apenasAdmin && !verificarAdmin()) {
          toast({
            title: "Acesso restrito",
            description: "Esta página é restrita a administradores.",
            variant: "destructive"
          });
          setAutorizado(false);
          return;
        }
        
        setAutorizado(true);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setAutorizado(false);
      } finally {
        setCarregando(false);
      }
    };
    
    verificarAcesso();
  }, [verificarAutenticacao, verificarAdmin, toast, apenasAdmin, obterSessao]);

  if (carregando) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-csae-green-600"></div>
      </div>
    );
  }

  return autorizado ? <>{children}</> : <Navigate to="/" replace />;
};

export default RotaProtegida;
