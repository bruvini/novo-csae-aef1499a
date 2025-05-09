
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/services/firebase";
import { buscarUsuarioPorUid } from "@/services/bancodados/";
import { useNavigate } from "react-router-dom";

export const useLoginHandler = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { 
        success: true, 
        user: userCredential.user 
      };
    } catch (error: any) {
      console.error("Error during login:", error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  };
  
  // Add the realizarLogin function that wraps login but returns properties expected by LoginForm
  const realizarLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    
    if (result.success && result.user) {
      try {
        const usuarioFirestore = await buscarUsuarioPorUid(result.user.uid);
        if (!usuarioFirestore) {
          return { success: false, registrarAtivo: true, error: "Usuário não encontrado" };
        }
        
        // Check user status
        if (usuarioFirestore.statusAcesso === "Aguardando") {
          toast({
            title: "Cadastro em análise",
            description: "Seu cadastro está em análise pela equipe CSAE. Tente novamente mais tarde.",
          });
          return { success: false, registrarAtivo: false, error: "Cadastro em análise" };
        }
        
        if (["Negado", "Revogado", "Cancelado"].includes(usuarioFirestore.statusAcesso || "")) {
          toast({
            title: "Acesso bloqueado",
            description: "O acesso ao seu perfil está bloqueado. Entre em contato pelo e-mail: gerenf.sms.pmf@gmail.com",
            variant: "destructive"
          });
          return { success: false, registrarAtivo: false, error: "Acesso bloqueado" };
        }
        
        if (usuarioFirestore.statusAcesso === "Aprovado") {
          toast({
            title: "Acesso liberado",
            description: "Bem-vindo de volta!",
          });
          // Redirect to dashboard on successful login
          setTimeout(() => {
            navigate("/dashboard");
          }, 500);
          return { success: true, registrarAtivo: false, error: null };
        }
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        return { ...result, error: error.message };
      }
    }
    
    // Ensure error is always included in result
    return { 
      ...result, 
      error: result.error || "Erro desconhecido" 
    };
  };

  return { login, isLoading: false, realizarLogin };
};
