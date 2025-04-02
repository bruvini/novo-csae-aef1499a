
import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';

export interface UsuarioAutenticado {
  uid: string;
  email: string | null;
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

  const entrar = async (email: string, senha: string) => {
    const resultado = await signInWithEmailAndPassword(auth, email, senha);
    return resultado.user;
  };

  const sair = async () => {
    await signOut(auth);
    setUsuario(null);
  };

  return {
    usuario,
    carregando,
    registrar,
    entrar,
    sair
  };
}
