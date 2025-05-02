// Update the import to use the correct Sessao type
import { useAutenticacao } from "@/services/autenticacao";
import { User } from "firebase/auth";
import { useNavigate } from 'react-router-dom';

// Replace SessaoUsuario with the actual types needed
interface LoginResponse {
  sucesso: boolean;
  mensagem?: string;
}

export const useLoginUtils = () => {
  const navigate = useNavigate();
  const { fazerLogin } = useAutenticacao();

  const handleLoginSuccess = (email: string, nome: string, tipo: string) => {
    console.info('Login bem-sucedido:', { email, nome, tipo });
    // Redirecionar com base no tipo de usuário
    if (tipo === 'Administrador') {
      navigate('/gestao-usuarios');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLoginFailure = (mensagem: string) => {
    console.error('Login falhou:', mensagem);
    // Lógica para exibir mensagem de erro ao usuário
    alert(mensagem);
  };

  const processarLogin = async (email: string, senha: string): Promise<void> => {
    if (!email || !senha) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const resultado = await fazerLogin(email, senha);

      if (resultado?.sucesso) {
        // Recuperar dados do localStorage após o login
        const sessaoJSON = localStorage.getItem('sessao');

        if (sessaoJSON) {
          try {
            const sessao = JSON.parse(sessaoJSON);
            handleLoginSuccess(sessao.email, sessao.nomeUsuario, sessao.tipoUsuario);
          } catch (error) {
            console.error('Erro ao analisar a sessão do localStorage:', error);
            handleLoginFailure('Erro ao processar o login. Tente novamente.');
          }
        } else {
          console.warn('Sessão não encontrada no localStorage após o login.');
          handleLoginFailure('Sessão não encontrada. Tente novamente.');
        }
      } else {
        handleLoginFailure(resultado?.mensagem || 'Erro ao fazer login. Tente novamente.');
      }
    } catch (error: any) {
      console.error('Erro durante o processo de login:', error);
      handleLoginFailure(error.message || 'Erro inesperado. Tente novamente.');
    }
  };

  return { processarLogin };
};
