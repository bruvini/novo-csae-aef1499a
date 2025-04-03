
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAutenticacao } from '@/services/autenticacao';
import { useToast } from '@/hooks/use-toast';

interface RotaProtegidaProps {
  children: React.ReactNode;
  apenasAdmin?: boolean;
}

const RotaProtegida = ({ children, apenasAdmin = false }: RotaProtegidaProps) => {
  const { verificarAutenticacao, verificarAdmin } = useAutenticacao();
  const [autenticado, setAutenticado] = useState<boolean | null>(null);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    const verificarAcesso = async () => {
      const autenticado = await verificarAutenticacao();
      
      if (!autenticado) {
        toast({
          title: "Acesso negado",
          description: "Você precisa estar autenticado para acessar esta página.",
          variant: "destructive",
        });
      } else if (apenasAdmin && !verificarAdmin()) {
        toast({
          title: "Acesso restrito",
          description: "Esta página é exclusiva para administradores.",
          variant: "destructive",
        });
        setAutenticado(false);
        return;
      }
      
      setAutenticado(autenticado);
    };

    verificarAcesso();
  }, [apenasAdmin, verificarAdmin, verificarAutenticacao, toast]);

  if (autenticado === null) {
    // Estado ainda não determinado, mostrar loading
    return <div className="flex items-center justify-center h-screen">Verificando...</div>;
  }

  if (!autenticado) {
    // Não autenticado ou não tem permissão, redirecionar para login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Autenticado e com permissões corretas
  return <>{children}</>;
};

export default RotaProtegida;
