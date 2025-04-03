
import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { buscarUsuarioPorUid } from './bancodados';

export interface UsuarioAutenticado {
  uid: string;
  email: string | null;
}

export interface SessaoUsuario {
  uid: string;
  email: string;
  nomeUsuario: string;
  tipoUsuario: 'Administrador' | 'Comum';
  statusAcesso: string;
}

export function useAutenticacao() {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase: User | null) => {
      if (usuarioFirebase) {
        setUsuario({
          uid: usuarioFirebase.uid,
          email: usuarioFirebase.email
        });
      } else {
        setUsuario(null);
      }
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  const registrar = async (email: string, senha: string) => {
    const resultado = await createUserWithEmailAndPassword(auth, email, senha);
    return resultado.user;
  };

  const entrar = async (email: string, password: string) => {
    const usuario = await signInWithEmailAndPassword(auth, email, password);
    return usuario;
  };

  const sair = async () => {
    await signOut(auth);
    setUsuario(null);
    limparSessao();
  };

  const salvarSessao = (dados: SessaoUsuario) => {
    localStorage.setItem('sessaoUsuario', JSON.stringify(dados));
  };

  const obterSessao = (): SessaoUsuario | null => {
    const sessao = localStorage.getItem('sessaoUsuario');
    return sessao ? JSON.parse(sessao) : null;
  };

  const limparSessao = () => {
    localStorage.removeItem('sessaoUsuario');
    localStorage.removeItem('usuario');
  };

  const verificarAutenticacao = async () => {
    // Verificar se o usuário está autenticado no Firebase
    if (!usuario) {
      return false;
    }

    // Verificar se existe sessão no localStorage
    const sessao = obterSessao();
    if (!sessao) {
      return false;
    }

    // Verificar se o status de acesso é válido
    if (sessao.statusAcesso !== 'Aprovado') {
      return false;
    }

    return true;
  };

  const verificarAdmin = () => {
    const sessao = obterSessao();
    return sessao?.tipoUsuario === 'Administrador';
  };

  return {
    usuario,
    carregando,
    registrar,
    entrar,
    sair,
    salvarSessao,
    obterSessao,
    limparSessao,
    verificarAutenticacao,
    verificarAdmin
  };
}
