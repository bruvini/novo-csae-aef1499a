const REGISTRATION_IN_PROGRESS_KEY = 'csae_registration_in_progress';
const REGISTRATION_MAX_AGE_MS = 5 * 60 * 1000;

export const iniciarFluxoCadastro = () => {
  sessionStorage.setItem(REGISTRATION_IN_PROGRESS_KEY, String(Date.now()));
};

export const finalizarFluxoCadastro = () => {
  sessionStorage.removeItem(REGISTRATION_IN_PROGRESS_KEY);
};

export const cadastroEmAndamento = () => {
  const inicio = Number(sessionStorage.getItem(REGISTRATION_IN_PROGRESS_KEY));
  if (!Number.isFinite(inicio) || Date.now() - inicio > REGISTRATION_MAX_AGE_MS) {
    finalizarFluxoCadastro();
    return false;
  }

  return true;
};
