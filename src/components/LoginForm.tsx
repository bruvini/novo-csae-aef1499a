
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserCheck, Heart, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import { buscarUsuarioPorUid } from "@/services/bancodados";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { entrar, limparSessao, salvarSessao } = useAutenticacao();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !senha) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu e-mail e senha.",
        variant: "destructive",
      });
      return;
    }

    setCarregando(true);
    
    try {
      // Primeiro, limpar qualquer sessão anterior
      await limparSessao();
      
      // Tentar fazer login com Firebase Auth
      const usuarioAuth = await entrar(email, senha);
      
      if (!usuarioAuth) {
        toast({
          title: "Erro de autenticação",
          description: "E-mail ou senha incorretos.",
          variant: "destructive",
        });
        return;
      }

      // Buscar dados completos do usuário no Firestore
      const dadosUsuario = await buscarUsuarioPorUid(usuarioAuth.uid);
      
      if (!dadosUsuario) {
        toast({
          title: "Usuário não encontrado",
          description: "Não foi possível encontrar os dados do usuário.",
          variant: "destructive",
        });
        return;
      }

      // Verificar status de acesso
      if (dadosUsuario.statusAcesso !== 'Aprovado') {
        let mensagem = "";
        switch (dadosUsuario.statusAcesso) {
          case 'Aguardando':
            mensagem = "Seu cadastro ainda está aguardando aprovação. Você receberá um e-mail quando for aprovado.";
            break;
          case 'Negado':
            mensagem = "Seu cadastro foi negado. Entre em contato com o suporte para mais informações.";
            break;
          case 'Revogado':
            mensagem = "Seu acesso foi revogado. Entre em contato com o administrador.";
            break;
          case 'Cancelado':
            mensagem = "Seu cadastro foi cancelado.";
            break;
          default:
            mensagem = "Seu acesso não está ativo no momento.";
        }
        
        toast({
          title: "Acesso não autorizado",
          description: mensagem,
          variant: "destructive",
        });
        return;
      }

      // Preparar dados da sessão
      const nomeCompleto = dadosUsuario.dadosPessoais?.nomeCompleto || 
                          `${dadosUsuario.nome || ''} ${dadosUsuario.sobrenome || ''}`.trim() ||
                          'Usuário';
      
      const sessaoUsuario = {
        uid: usuarioAuth.uid,
        email: usuarioAuth.email || email,
        nomeUsuario: nomeCompleto,
        tipoUsuario: (dadosUsuario.tipoUsuario || 
                     (dadosUsuario.ehAdmin ? 'Administrador' : 'Comum')) as 'Administrador' | 'Comum',
        usuario: {
          ...dadosUsuario,
          unidade: dadosUsuario.unidade || dadosUsuario.dadosProfissionais?.lotacao || '',
        }
      };

      // Salvar sessão
      await salvarSessao(sessaoUsuario);

      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo(a), ${nomeCompleto}!`,
      });

      // Redirecionar para o dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Erro durante o login:", error);
      
      // Tratamento de erros específicos do Firebase
      let mensagem = "Ocorreu um erro durante o login. Tente novamente.";
      
      if (error instanceof Error) {
        if (error.message.includes("user-not-found")) {
          mensagem = "Usuário não encontrado. Verifique seu e-mail.";
        } else if (error.message.includes("wrong-password")) {
          mensagem = "Senha incorreta. Tente novamente.";
        } else if (error.message.includes("invalid-email")) {
          mensagem = "E-mail inválido. Verifique o formato.";
        } else if (error.message.includes("too-many-requests")) {
          mensagem = "Muitas tentativas de login. Tente novamente mais tarde.";
        }
      }
      
      toast({
        title: "Erro no login",
        description: mensagem,
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <div className="text-center mb-6">
        <UserCheck className="mx-auto h-12 w-12 text-csae-green-600 mb-3" />
        <h2 className="text-2xl font-bold text-csae-green-800">
          Acesse sua conta
        </h2>
        <p className="text-gray-600 mt-2">
          Entre com suas credenciais para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@exemplo.com"
            className="w-full"
            disabled={carregando}
          />
        </div>

        <div>
          <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <div className="relative">
            <Input
              id="senha"
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              className="w-full pr-10"
              disabled={carregando}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              disabled={carregando}
            >
              {mostrarSenha ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full csae-btn-primary"
          disabled={carregando}
        >
          {carregando ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Não tem uma conta?{" "}
          <button
            onClick={() => navigate("/registrar")}
            className="text-csae-green-600 hover:text-csae-green-800 font-medium"
            disabled={carregando}
          >
            Cadastre-se aqui
          </button>
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
        <Heart className="h-3 w-3 mr-1" />
        <span>Feito com ♥ pela equipe CSAE</span>
      </div>
    </div>
  );
};

export default LoginForm;
