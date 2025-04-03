
import React, { useState, useEffect } from "react";
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
  const { entrar, salvarSessao } = useAutenticacao();
  const navigate = useNavigate();
  const registrarBtnRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
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

      // 1. Autenticar no Firebase Authentication
      const usuarioAuth = await entrar(email, password);

      if (!usuarioAuth) {
        throw new Error("Credenciais inválidas.");
      }

      // 2. Buscar o usuário no Firestore
      const usuarioFirestore = await buscarUsuarioPorUid(usuarioAuth.uid);

      if (!usuarioFirestore) {
        // Usuário autenticado mas sem cadastro no Firestore
        setRegistrarAtivo(true);
        toast({
          title: "Cadastro não encontrado",
          description: "Usuário autenticado mas sem cadastro no sistema. Clique em 'Registrar' para se cadastrar.",
          variant: "destructive"
        });
        return;
      }

      // 3. Verificar o status de acesso
      if (usuarioFirestore.statusAcesso === "Aguardando") {
        toast({
          title: "Cadastro em análise",
          description: "Recebemos seu cadastro e ele está em análise pela equipe CSAE. Tente novamente mais tarde.",
          variant: "default"
        });
        return;
      }

      if (usuarioFirestore.statusAcesso === "Negado" || 
          usuarioFirestore.statusAcesso === "Revogado" || 
          usuarioFirestore.statusAcesso === "Cancelado") {
        toast({
          title: "Acesso bloqueado",
          description: "O acesso ao seu perfil está bloqueado. Entre em contato pelo e-mail: gerenf.sms.pmf@gmail.com",
          variant: "destructive"
        });
        return;
      }

      if (usuarioFirestore.statusAcesso === "Aprovado") {
        // 4. Salvar a sessão do usuário
        salvarSessao({
          uid: usuarioFirestore.uid,
          email: usuarioFirestore.email,
          nomeUsuario: usuarioFirestore.dadosPessoais.nomeCompleto,
          tipoUsuario: usuarioFirestore.tipoUsuario || 'Comum',
          statusAcesso: usuarioFirestore.statusAcesso
        });

        // Manter compatibilidade com o código existente
        localStorage.setItem("usuario", JSON.stringify(usuarioFirestore));

        toast({
          title: "Acesso liberado",
          description: "Bem-vindo de volta!",
        });

        // 5. Redirecionar para o dashboard
        navigate("/dashboard");
      }

    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
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
      console.error("Erro inesperado:", error);
      toast({
        title: "Erro ao acessar",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg animate-fade-in h-full flex flex-col">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-csae-green-800">
          Acesse o portal
        </h1>
        <p className="text-sm text-gray-500">
          Insira suas credenciais para acessar nossas ferramentas
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-grow">
        <div className="space-y-2">
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-csae-green-500" />
            <Input
              type="email"
              placeholder="Seu e-mail"
              className="csae-input pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-csae-green-500" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              className="csae-input pl-10 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="absolute right-3 top-2.5 text-csae-green-500"
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

        <div className="flex flex-col gap-3 pt-2 mt-auto">
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
      </form>
    </div>
  );
};

export default LoginForm;
