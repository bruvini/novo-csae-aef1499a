import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAutenticacao } from "@/services/autenticacao";
import { buscarUsuarioPorUid } from "@/services/bancodados";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrarAtivo, setRegistrarAtivo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { fazerLogin, fazerLogout, verificarAutenticacao, obterSessao } = useAutenticacao();
  const navigate = useNavigate();
  const registrarBtnRef = React.useRef<HTMLButtonElement>(null);

  // Efeito para destacar o botão de registrar quando necessário
  React.useEffect(() => {
    if (registrarAtivo && registrarBtnRef.current) {
      registrarBtnRef.current.focus();
      registrarBtnRef.current.classList.add('animate-pulse');
      
      const timer = setTimeout(() => {
        if (registrarBtnRef.current) {
          registrarBtnRef.current.classList.remove('animate-pulse');
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [registrarAtivo]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando processo de login");

    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      setRegistrarAtivo(false);
      
      // Limpar qualquer sessão existente antes de iniciar o processo
      localStorage.removeItem('sessao');
      console.log("Sessões anteriores limpas");

      // 1. Autenticar no Firebase Authentication
      console.log("Tentando autenticar com email:", email);
      const resultado = await fazerLogin(email, password);

      if (!resultado.sucesso) {
        console.error("Falha na autenticação:", resultado.mensagem);
        throw new Error(resultado.mensagem || "Credenciais inválidas.");
      }

      const sessao = obterSessao();
      if (!sessao) {
        throw new Error("Erro ao obter dados de sessão.");
      }

      toast({
        title: "Acesso liberado",
        description: "Bem-vindo de volta!",
      });

      // 5. Redirecionar para o dashboard
      console.log("Redirecionando para o dashboard");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro durante o login:", error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    console.error("Detalhes do erro de autenticação:", error);
    
    if (error.code === "auth/user-not-found") {
      toast({
        title: "Usuário não encontrado",
        description: "Não encontramos uma conta com esse e-mail. Que tal se registrar?",
        variant: "destructive"
      });
      setRegistrarAtivo(true);
    } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      toast({
        title: "Senha incorreta",
        description: "A senha que você inseriu está errada. Tente novamente.",
        variant: "destructive"
      });
    } else if (error.code === "auth/invalid-email") {
      toast({
        title: "E-mail inválido",
        description: "O e-mail inserido não é válido.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Erro ao acessar",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg animate-fade-in flex flex-col h-full">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-csae-green-800">
          Acesse o portal
        </h1>
        <p className="text-sm text-gray-500">
          Insira suas credenciais para acessar nossas ferramentas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-grow flex flex-col">
        <div className="space-y-2">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-csae-green-500">
              <Mail className="h-5 w-5" />
            </div>
            <Input
              type="email"
              placeholder="Seu e-mail"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-csae-green-500">
              <Lock className="h-5 w-5" />
            </div>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              className="pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-csae-green-500"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="text-right">
            <a href="#" className="text-xs csae-link">
              Esqueceu sua senha?
            </a>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex flex-col gap-3">
            <Button type="submit" className="csae-btn-primary" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Acessando..." : "Acessar"}
            </Button>

            <Button
              ref={registrarBtnRef}
              type="button"
              className={`csae-btn-secondary ${registrarAtivo ? 'ring-2 ring-csae-green-500 ring-offset-2' : ''}`}
              onClick={() => navigate("/registrar")}
              disabled={loading}
              asChild
            >
              <Link to="/registrar">
                <UserPlus className="mr-2 h-4 w-4" />
                Registrar
              </Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
