
import { useToast } from "@/hooks/use-toast";
import { SessaoUsuario, useAutenticacao } from "@/services/autenticacao";
import { buscarUsuarioPorUid, registrarAcesso } from "@/services/bancodados";
import { User } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { isResidenteExpirado } from "./ResidenteUtils";

export interface LoginError {
  code?: string;
  message: string;
}

export const useLoginHandler = () => {
  const { toast } = useToast();
  const { entrar, limparSessao, salvarSessao } = useAutenticacao();
  const navigate = useNavigate();

  const handleAuthError = (error: any) => {
    console.error("Detalhes do erro de autenticação:", error);
    
    if (error.code === "auth/user-not-found") {
      toast({
        title: "Usuário não encontrado",
        description: "Não encontramos uma conta com esse e-mail. Que tal se registrar?",
        variant: "destructive"
      });
      return true; // Indica que deve destacar o botão de registro
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
    return false;
  };

  const processarLoginSucesso = async (usuarioAuth: User) => {
    console.log("Autenticação bem-sucedida. UID:", usuarioAuth.uid);
    
    // Buscar o usuário no Firestore
    console.log("Buscando dados do usuário no Firestore. UID:", usuarioAuth.uid);
    const usuarioFirestore = await buscarUsuarioPorUid(usuarioAuth.uid);
    console.log("Dados do Firestore:", usuarioFirestore);

    if (!usuarioFirestore) {
      console.error("Usuário autenticado, mas não encontrado no Firestore");
      toast({
        title: "Cadastro não encontrado",
        description: "Usuário autenticado mas sem cadastro no sistema. Clique em 'Registrar' para se cadastrar.",
        variant: "destructive"
      });
      return { sucesso: false, registrarAtivo: true };
    }

    // Verificar se é um residente com acesso expirado
    if (usuarioFirestore.dadosProfissionais.formacao === "Residente de Enfermagem") {
      const expirado = isResidenteExpirado(usuarioFirestore.dadosProfissionais.dataInicioResidencia);
      
      if (expirado) {
        toast({
          title: "Acesso suspenso",
          description: "Os acessos para residentes são bloqueados após o término da residência, conforme previsto no Termo de Uso. Caso ainda esteja atuando, solicite liberação para gerenf.sms.pmf@gmail.com.",
          variant: "destructive"
        });
        return { sucesso: false, registrarAtivo: false };
      }
    }

    // Verificar o status de acesso
    console.log("Status do usuário:", usuarioFirestore.statusAcesso);
    if (usuarioFirestore.statusAcesso === "Aguardando") {
      toast({
        title: "Cadastro em análise",
        description: "Recebemos seu cadastro e ele está em análise pela equipe CSAE. Tente novamente mais tarde.",
        variant: "default"
      });
      return { sucesso: false, registrarAtivo: false };
    }

    if (usuarioFirestore.statusAcesso === "Negado" || 
        usuarioFirestore.statusAcesso === "Revogado" || 
        usuarioFirestore.statusAcesso === "Cancelado") {
      toast({
        title: "Acesso bloqueado",
        description: "O acesso ao seu perfil está bloqueado. Entre em contato pelo e-mail: gerenf.sms.pmf@gmail.com",
        variant: "destructive"
      });
      return { sucesso: false, registrarAtivo: false };
    }

    if (usuarioFirestore.statusAcesso === "Aprovado") {
      // Registrar o acesso do usuário
      await registrarAcesso(usuarioFirestore.id);
      
      // Salvar a sessão do usuário
      const dadosSessao: SessaoUsuario = {
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
      
      // Verificar se o tipoUsuario foi salvo corretamente
      const sessaoParsed = sessaoAtual ? JSON.parse(sessaoAtual) : null;
      console.log("Tipo de usuário na sessão:", sessaoParsed?.tipoUsuario);

      // Manter compatibilidade com o código existente
      localStorage.setItem("usuario", JSON.stringify(usuarioFirestore));
      console.log("Dados do usuário salvos no localStorage");

      toast({
        title: "Acesso liberado",
        description: "Bem-vindo de volta!",
      });

      // Redirecionar para o dashboard
      console.log("Redirecionando para o dashboard");
      navigate("/dashboard");
      return { sucesso: true, registrarAtivo: false };
    } 
    
    console.error("Status de acesso não reconhecido:", usuarioFirestore.statusAcesso);
    toast({
      title: "Erro de acesso",
      description: "Status de acesso não reconhecido. Entre em contato com o suporte.",
      variant: "destructive"
    });
    return { sucesso: false, registrarAtivo: false };
  };

  const realizarLogin = async (email: string, password: string) => {
    try {
      // Limpar qualquer sessão existente antes de iniciar o processo
      limparSessao();
      console.log("Sessões anteriores limpas");

      // Autenticar no Firebase Authentication
      console.log("Tentando autenticar com email:", email);
      const usuarioAuth = await entrar(email, password);
      console.log("Resposta da autenticação:", usuarioAuth);

      if (!usuarioAuth) {
        console.error("Falha na autenticação: usuarioAuth é null ou undefined");
        throw new Error("Credenciais inválidas.");
      }

      return await processarLoginSucesso(usuarioAuth);
    } catch (error: any) {
      console.error("Erro durante o login:", error);
      const registrarAtivo = handleAuthError(error);
      return { sucesso: false, registrarAtivo };
    }
  };

  return { realizarLogin };
};
