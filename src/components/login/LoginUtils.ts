
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/services/firebase';

export const useLoginHandler = () => {
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      return { success: true, user };
    } catch (error: any) {
      let errorMessage = "Falha ao fazer login. Tente novamente.";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas de login. Tente novamente mais tarde.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "Esta conta foi desativada.";
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for backwards compatibility
  const realizarLogin = login;

  return {
    login,
    realizarLogin,
    isLoading
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};
