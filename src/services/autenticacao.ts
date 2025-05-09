
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from './firebase';
import { buscarUsuarioPorUid } from './bancodados';
import { registrarAcesso } from './bancodados/logAcessosDB';
import { SessaoUsuario } from '@/types/usuario';

// Sessão e gerenciamento de usuário local
const useSessaoLocal = () => {
  const obterSessao = (): SessaoUsuario | null => {
    const sessao = localStorage.getItem('sessaoUsuario');
    const resultado = sessao ? JSON.parse(sessao) : null;
    return resultado;
  };

  const salvarSessao = (dados: SessaoUsuario) => {
    // Definir um valor padrão para dataExpiracao se não for fornecido
    const dadosCompletos = {
      ...dados,
      dataExpiracao: dados.dataExpiracao || Date.now() + 24 * 60 * 60 * 1000 // 24 horas por padrão
    };
    localStorage.setItem('sessaoUsuario', JSON.stringify(dadosCompletos));
  };

  const limparSessao = () => {
    localStorage.removeItem('sessaoUsuario');
    localStorage.removeItem('usuario');
  };

  return {
    obterSessao,
    salvarSessao,
    limparSessao
  };
};

// Firebase Auth
const useFirebaseAuth = (sessaoManager: ReturnType<typeof useSessaoLocal>) => {
  const [usuario, setUsuario] = useState<{ uid: string; email: string | null } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { obterSessao, salvarSessao, limparSessao } = sessaoManager;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase: User | null) => {
      if (usuarioFirebase) {
        setUsuario({
          uid: usuarioFirebase.uid,
          email: usuarioFirebase.email
        });
        
        const sessaoExistente = obterSessao();
        
        if (!sessaoExistente) {
          buscarUsuarioPorUid(usuarioFirebase.uid)
            .then(usuarioFirestore => {
              if (usuarioFirestore && usuarioFirestore.statusAcesso === 'Aprovado') {
                const dadosSessao: SessaoUsuario = {
                  uid: usuarioFirestore.uid,
                  email: usuarioFirestore.email,
                  nomeUsuario: usuarioFirestore.dadosPessoais?.nomeCompleto || '',
                  tipoUsuario: usuarioFirestore.tipoUsuario || 'Comum',
                  statusAcesso: usuarioFirestore.statusAcesso,
                  usuario: {
                    atuaSMS: usuarioFirestore.atuaSMS,
                    contadorAcessos: usuarioFirestore.contadorAcessos
                  }
                };
                
                salvarSessao(dadosSessao);
                localStorage.setItem("usuario", JSON.stringify(usuarioFirestore));
              }
            })
            .catch(erro => {
              console.error("Erro ao buscar dados do usuário:", erro);
            });
        }
      } else {
        setUsuario(null);
        limparSessao();
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const registrar = async (email: string, senha: string) => {
    const resultado = await createUserWithEmailAndPassword(auth, email, senha);
    return resultado.user;
  };

  const entrar = async (email: string, password: string) => {
    try {
      const resultado = await signInWithEmailAndPassword(auth, email, password);
      return resultado.user;
    } catch (error) {
      throw error;
    }
  };

  const sair = async () => {
    await signOut(auth);
    setUsuario(null);
    limparSessao();
  };

  return {
    usuario,
    authLoading,
    registrar,
    entrar,
    sair
  };
};

// Verificações e permissões
const useVerificacoes = (
  sessaoManager: ReturnType<typeof useSessaoLocal>,
  authManager: ReturnType<typeof useFirebaseAuth>
) => {
  const { obterSessao, salvarSessao } = sessaoManager;
  const { usuario, authLoading } = authManager;
  
  const verificarAutenticacao = async () => {
    if (authLoading) {
      return false;
    }
    
    if (!usuario) {
      return false;
    }

    const sessao = obterSessao();
    
    if (!sessao) {
      try {
        const usuarioFirestore = await buscarUsuarioPorUid(usuario.uid);
        
        if (usuarioFirestore && usuarioFirestore.statusAcesso === 'Aprovado') {
          const dadosSessao: SessaoUsuario = {
            uid: usuarioFirestore.uid,
            email: usuarioFirestore.email,
            nomeUsuario: usuarioFirestore.dadosPessoais?.nomeCompleto || '',
            tipoUsuario: usuarioFirestore.tipoUsuario || 'Comum',
            statusAcesso: usuarioFirestore.statusAcesso,
            usuario: {
              atuaSMS: usuarioFirestore.atuaSMS,
              contadorAcessos: usuarioFirestore.contadorAcessos
            }
          };
          
          salvarSessao(dadosSessao);
          localStorage.setItem("usuario", JSON.stringify(usuarioFirestore));
          return true;
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
      return false;
    }

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
    verificarAutenticacao,
    verificarAdmin
  };
};

// Hook principal
export function useAutenticacao() {
  const sessaoManager = useSessaoLocal();
  const authManager = useFirebaseAuth(sessaoManager);
  const verificacoes = useVerificacoes(sessaoManager, authManager);
  
  return {
    ...sessaoManager,
    ...authManager,
    ...verificacoes
  };
}
