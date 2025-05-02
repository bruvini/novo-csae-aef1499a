
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
  const { entrar, limparSessao, salvarSessao } = useAutenticacao();
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
      limparSessao();
      console.log("Sessões anteriores limpas");

      // 1. Autenticar no Firebase Authentication
      console.log("Tentando autenticar com email:", email);
      const usuarioAuth = await entrar(email, password);
      console.log("Resposta da autenticação:", usuarioAuth);

      if (!usuarioAuth) {
        console.error("Falha na autenticação: usuarioAuth é null ou undefined");
        throw new Error("Credenciais inválidas.");
      }

      console.log("Autenticação bem-sucedida. UID:", usuarioAuth.uid);

      // 2. Buscar o usuário no Firestore
      console.log("Buscando dados do usuário no Firestore. UID:", usuarioAuth.uid);
      const usuarioFirestore = await buscarUsuarioPorUid(usuarioAuth.uid);
      console.log("Dados do Firestore:", usuarioFirestore);

      if (!usuarioFirestore) {
        // Usuário autenticado mas sem cadastro no Firestore
        console.error("Usuário autenticado, mas não encontrado no Firestore");
        setRegistrarAtivo(true);
        toast({
          title: "Cadastro não encontrado",
          description: "Usuário autenticado mas sem cadastro no sistema. Clique em 'Registrar' para se cadastrar.",
          variant: "destructive"
        });
        return;
      }

      // 3. Verificar o status de acesso
      console.log("Status do usuário:", usuarioFirestore.statusAcesso);
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
        const dadosSessao = {
          uid: usuarioFirestore.uid,
          email: usuarioFirestore.email,
          nomeUsuario: usuarioFirestore.dadosPessoais.nomeCompleto,
          tipoUsuario: usuarioFirestore.tipoUsuario || 'Comum',
          statusAcesso: usuarioFirestore.statusAcesso
        };
        
        console.log("Salvando sessão:", dadosSessao);
        salvarSessao(dadosSessao);
        
        // Verificar se a sessão foi realmente salva
        const sessaoAtual = localStorage.getItem('sessaoUsuario');
        console.log("Sessão salva no localStorage:", sessaoAtual);

        // Manter compatibilidade com o código existente
        localStorage.setItem("usuario", JSON.stringify(usuarioFirestore));
        console.log("Dados do usuário salvos no localStorage");

        toast({
          title: "Acesso liberado",
          description: "Bem-vindo de volta!",
        });

        // 5. Redirecionar para o dashboard
        console.log("Redirecionando para o dashboard");
        navigate("/dashboard");
      } else {
        console.error("Status de acesso não reconhecido:", usuarioFirestore.statusAcesso);
        toast({
          title: "Erro de acesso",
          description: "Status de acesso não reconhecido. Entre em contato com o suporte.",
          variant: "destructive"
        });
      }

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
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
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
