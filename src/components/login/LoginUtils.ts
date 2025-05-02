
import { useAutenticacao } from "@/services/autenticacao";
import { useToast } from "@/hooks/use-toast";

export const useLoginUtils = () => {
  const { fazerLogin } = useAutenticacao();
  const { toast } = useToast();

  const realizarLogin = async (email: string, senha: string) => {
    try {
      const resultado = await fazerLogin(email, senha);
      
      if (resultado.sucesso) {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo ao portal!",
        });
        return { sucesso: true };
      } else {
        toast({
          title: "Erro ao fazer login",
          description: resultado.mensagem || "Verifique suas credenciais",
          variant: "destructive",
        });
        return { sucesso: false, registrarAtivo: true };
      }
    } catch (error: any) {
      console.error("Erro ao realizar login:", error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
      return { sucesso: false, registrarAtivo: true };
    }
  };

  return {
    realizarLogin
  };
};
