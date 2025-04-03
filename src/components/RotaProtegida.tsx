
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
        console.log("RotaProtegida: Iniciando verificação de acesso");
        console.log("RotaProtegida: É rota admin?", apenasAdmin ? "Sim" : "Não");
        
        // Verificar autenticação
        const autenticado = await verificarAutenticacao();
        console.log("RotaProtegida: Resultado da autenticação:", autenticado);
        
        if (!autenticado) {
          console.log("RotaProtegida: Acesso negado - usuário não autenticado");
          toast({
            title: "Acesso negado",
            description: "Você precisa estar autenticado para acessar esta página.",
            variant: "destructive"
          });
          setAutorizado(false);
          setCarregando(false);
          return;
        }
        
        // Verificar sessão
        const sessao = obterSessao();
        console.log("RotaProtegida: Sessão do usuário:", sessao);
        
        if (!sessao) {
          console.log("RotaProtegida: Acesso negado - sessão não encontrada");
          toast({
            title: "Sessão expirada",
            description: "Sua sessão expirou. Por favor, faça login novamente.",
            variant: "destructive"
          });
          setAutorizado(false);
          setCarregando(false);
          return;
        }
        
        // Verificar status de acesso
        if (sessao.statusAcesso !== "Aprovado") {
          console.log("RotaProtegida: Acesso negado - status não aprovado:", sessao.statusAcesso);
          toast({
            title: "Acesso bloqueado",
            description: "Seu acesso ao sistema está indisponível no momento.",
            variant: "destructive"
          });
          setAutorizado(false);
          setCarregando(false);
          return;
        }
        
        // Verificar permissão de administrador se necessário
        if (apenasAdmin) {
          const ehAdmin = verificarAdmin();
          console.log("RotaProtegida: Verificação de admin:", ehAdmin);
          
          if (!ehAdmin) {
            console.log("RotaProtegida: Acesso negado - usuário não é admin");
            toast({
              title: "Acesso restrito",
              description: "Esta página é restrita a administradores.",
              variant: "destructive"
            });
            setAutorizado(false);
            setCarregando(false);
            return;
          }
        }
        
        // Se chegou até aqui, está autorizado
        console.log("RotaProtegida: Acesso autorizado");
        setAutorizado(true);
        setCarregando(false);
      } catch (error) {
        console.error("RotaProtegida: Erro ao verificar autenticação:", error);
        toast({
          title: "Erro de autenticação",
          description: "Ocorreu um erro ao verificar suas credenciais.",
          variant: "destructive"
        });
        setAutorizado(false);
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
