
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
        
        // Verificar se existe sessão no localStorage quando o usuário já está autenticado
        const sessaoExistente = obterSessao();
        if (!sessaoExistente) {
          // Se não existir sessão mas o usuário está autenticado, buscar dados e criar sessão
          buscarUsuarioPorUid(usuarioFirebase.uid).then(usuarioFirestore => {
            if (usuarioFirestore && usuarioFirestore.statusAcesso === 'Aprovado') {
              // Criar sessão se não existir
              salvarSessao({
                uid: usuarioFirestore.uid,
                email: usuarioFirestore.email,
                nomeUsuario: usuarioFirestore.dadosPessoais.nomeCompleto,
                tipoUsuario: usuarioFirestore.tipoUsuario || 'Comum',
                statusAcesso: usuarioFirestore.statusAcesso
              });
            }
          }).catch(erro => {
            console.error("Erro ao buscar dados do usuário:", erro);
          });
        }
      } else {
        setUsuario(null);
        // Limpar sessão se o usuário não estiver autenticado
        limparSessao();
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
    try {
      const resultado = await signInWithEmailAndPassword(auth, email, password);
      
      // Buscar dados adicionais do usuário no Firestore
      const usuarioFirestore = await buscarUsuarioPorUid(resultado.user.uid);
      
      // Verificar se o usuário existe e está aprovado
      if (usuarioFirestore && usuarioFirestore.statusAcesso === 'Aprovado') {
        // Salvar sessão com os dados do usuário
        salvarSessao({
          uid: usuarioFirestore.uid,
          email: usuarioFirestore.email,
          nomeUsuario: usuarioFirestore.dadosPessoais.nomeCompleto,
          tipoUsuario: usuarioFirestore.tipoUsuario || 'Comum',
          statusAcesso: usuarioFirestore.statusAcesso
        });
        
        console.log("Sessão criada com sucesso:", obterSessao());
        return resultado.user;
      }
      
      // Se o status não for aprovado, fazer logout e retornar erro
      await signOut(auth);
      throw new Error(`Acesso não aprovado: ${usuarioFirestore?.statusAcesso || 'Status desconhecido'}`);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      throw error;
    }
  };

  const sair = async () => {
    await signOut(auth);
    setUsuario(null);
    limparSessao();
  };

  const salvarSessao = (dados: SessaoUsuario) => {
    localStorage.setItem('sessaoUsuario', JSON.stringify(dados));
    console.log("Sessão salva:", dados);
  };

  const obterSessao = (): SessaoUsuario | null => {
    const sessao = localStorage.getItem('sessaoUsuario');
    return sessao ? JSON.parse(sessao) : null;
  };

  const limparSessao = () => {
    localStorage.removeItem('sessaoUsuario');
    localStorage.removeItem('usuario');
    console.log("Sessão removida");
  };

  const verificarAutenticacao = async () => {
    console.log("Verificando autenticação. Usuário:", usuario);
    
    // Verificar se o usuário está autenticado no Firebase
    if (!usuario) {
      console.log("Usuário não autenticado no Firebase");
      return false;
    }

    // Verificar se existe sessão no localStorage
    const sessao = obterSessao();
    console.log("Sessão encontrada:", sessao);
    
    if (!sessao) {
      console.log("Sessão não encontrada no localStorage");
      
      // Tentar buscar dados do usuário e criar sessão
      try {
        const usuarioFirestore = await buscarUsuarioPorUid(usuario.uid);
        if (usuarioFirestore && usuarioFirestore.statusAcesso === 'Aprovado') {
          salvarSessao({
            uid: usuarioFirestore.uid,
            email: usuarioFirestore.email,
            nomeUsuario: usuarioFirestore.dadosPessoais.nomeCompleto,
            tipoUsuario: usuarioFirestore.tipoUsuario || 'Comum',
            statusAcesso: usuarioFirestore.statusAcesso
          });
          console.log("Sessão criada dinamicamente durante verificação");
          return true;
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
      
      return false;
    }

    // Verificar se o status de acesso é válido
    if (sessao.statusAcesso !== 'Aprovado') {
      console.log("Status de acesso inválido:", sessao.statusAcesso);
      return false;
    }

    console.log("Usuário autenticado e com acesso aprovado");
    return true;
  };

  const verificarAdmin = () => {
    const sessao = obterSessao();
    const resultado = sessao?.tipoUsuario === 'Administrador';
    console.log("Verificação de admin:", resultado);
    return resultado;
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
