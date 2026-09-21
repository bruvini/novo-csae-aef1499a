export const normalizarEmailAutenticacao = (email: string): string =>
  email.trim().toLowerCase();

export interface FeedbackErroAutenticacao {
  titulo: string;
  descricao: string;
}

export const obterFeedbackErroAutenticacao = (
  codigo: string,
): FeedbackErroAutenticacao => {
  if (codigo === "auth/user-disabled") {
    return {
      titulo: "Acesso indisponível",
      descricao:
        "Esta conta está desabilitada. Entre em contato com o suporte do Portal CSAE.",
    };
  }

  if (codigo === "auth/too-many-requests") {
    return {
      titulo: "Muitas tentativas",
      descricao:
        "O acesso foi temporariamente limitado. Aguarde alguns minutos ou redefina sua senha.",
    };
  }

  if (codigo === "auth/network-request-failed") {
    return {
      titulo: "Falha de conexão",
      descricao:
        "Não foi possível conectar ao serviço. Verifique sua internet e tente novamente.",
    };
  }

  if (
    codigo === "auth/invalid-credential" ||
    codigo === "auth/user-not-found" ||
    codigo === "auth/wrong-password" ||
    codigo === "auth/invalid-email"
  ) {
    return {
      titulo: "Não foi possível entrar",
      descricao:
        "E-mail ou senha inválidos. Confira os dados ou use “Esqueceu a senha?”.",
    };
  }

  return {
    titulo: "Erro no login",
    descricao: "Não foi possível entrar agora. Tente novamente mais tarde.",
  };
};
