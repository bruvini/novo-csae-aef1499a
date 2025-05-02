
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  Auth
} from 'firebase/auth';
import { auth } from './firebase';
import { buscarUsuarioPorUid } from './bancodados';
import { registrarAcesso } from './bancodados/logAcessosDB';

export interface UsuarioAutenticado {
  uid: string;
  email: string | null;
  nome?: string;
  tipoUsuario?: 'Administrador' | 'Comum';
  lotacao?: string;
  matricula?: string;
  observacoes?: string;
}

export interface SessaoUsuario {
  uid: string;
  nomeUsuario: string;
  email: string;
  tipoUsuario?: 'Administrador' | 'Comum';
  dataExpiracao?: number;
  lotacao?: string;
  matricula?: string;
  observacoes?: string;
  id?: string;
  statusAcesso?: 'Aguardando' | 'Aprovado' | 'Negado' | 'Revogado' | 'Cancelado';
}

export function useAutenticacao() {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const obterSessao = (): SessaoUsuario | null => {
    const sessao = localStorage.getItem('sessaoUsuario');
    const resultado = sessao ? JSON.parse(sessao) : null;
    console.log("Sessão obtida do localStorage:", resultado);
    return resultado;
  };

  const salvarSessao = (dados: SessaoUsuario) => {
    console.log("Salvando sessão do usuário com tipo:", dados.tipoUsuario);
    // Definir um valor padrão para dataExpiracao se não for fornecido
    const dadosCompletos = {
      ...dados,
      dataExpiracao: dados.dataExpiracao || Date.now() + 24 * 60 * 60 * 1000 // 24 horas por padrão
    };
    localStorage.setItem('sessaoUsuario', JSON.stringify(dadosCompletos));
    
    const sessaoSalva = localStorage.getItem('sessaoUsuario');
    console.log("Verificação da sessão salva:", sessaoSalva ? JSON.parse(sessaoSalva) : null);
  };

  const limparSessao = () => {
    console.log("Limpando dados de sessão do localStorage");
    localStorage.removeItem('sessaoUsuario');
    localStorage.removeItem('usuario');
  };

  useEffect(() => {
    console.log("Inicializando listener de autenticação");
    const unsubscribe = onAuthStateChanged(auth, (usuarioFirebase: User | null) => {
      console.log("Estado de autenticação alterado:", usuarioFirebase ? "Autenticado" : "Não autenticado");
      
      if (usuarioFirebase) {
        setUsuario({
          uid: usuarioFirebase.uid,
          email: usuarioFirebase.email
        });
        
        const sessaoExistente = obterSessao();
        console.log("Sessão existente:", sessaoExistente);
        
        if (!sessaoExistente) {
          buscarUsuarioPorUid(usuarioFirebase.uid)
            .then(usuarioFirestore => {
              if (usuarioFirestore && usuarioFirestore.statusAcesso === 'Aprovado') {
                const dadosSessao: SessaoUsuario = {
                  uid: usuarioFirestore.uid,
                  email: usuarioFirestore.email,
                  nomeUsuario: usuarioFirestore.dadosPessoais.nomeCompleto,
                  tipoUsuario: usuarioFirestore.tipoUsuario || 'Comum',
                  statusAcesso: usuarioFirestore.statusAcesso,
                  dataExpiracao: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
                  id: usuarioFirestore.id
                };
                
                if (usuarioFirestore.dadosPessoais.lotacao) {
                  dadosSessao.lotacao = usuarioFirestore.dadosPessoais.lotacao;
                }
                
                if (usuarioFirestore.dadosPessoais.matricula) {
                  dadosSessao.matricula = usuarioFirestore.dadosPessoais.matricula;
                }
                
                if (usuarioFirestore.dadosPessoais.observacoes) {
                  dadosSessao.observacoes = usuarioFirestore.dadosPessoais.observacoes;
                }
                
                salvarSessao(dadosSessao);
                console.log("Sessão criada automaticamente:", dadosSessao);
                
                localStorage.setItem("usuario", JSON.stringify(usuarioFirestore));
              } else {
                console.log("Usuário não aprovado ou não encontrado no Firestore, não criando sessão");
                if (usuarioFirestore) {
                  console.log("Status de acesso:", usuarioFirestore.statusAcesso);
                }
              }
            })
            .catch(erro => {
              console.error("Erro ao buscar dados do usuário:", erro);
            });
        }
      } else {
        console.log("Usuário não autenticado, limpando estado e sessão");
        setUsuario(null);
        limparSessao();
      }
      setAuthLoading(false);
    });

    return () => {
      console.log("Desativando listener de autenticação");
      unsubscribe();
    };
  }, []);

  const registrar = async (email: string, senha: string) => {
    console.log("Iniciando processo de registro para:", email);
    const resultado = await createUserWithEmailAndPassword(auth, email, senha);
    console.log("Registro bem-sucedido:", resultado.user.uid);
    return resultado.user;
  };

  const entrar = async (email: string, password: string) => {
    try {
      console.log("Iniciando processo de login para:", email);
      const resultado = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login bem-sucedido. UID:", resultado.user.uid);
      return resultado.user;
    } catch (error) {
      console.error("Erro no processo de login:", error);
      throw error;
    }
  };

  const sair = async () => {
    console.log("Iniciando processo de logout");
    await signOut(auth);
    setUsuario(null);
    limparSessao();
    console.log("Logout completo, sessão removida");
  };

  const verificarAutenticacao = async () => {
    console.log("Verificando autenticação. Estado atual:", usuario ? "Autenticado" : "Não autenticado");
    
    if (authLoading) {
      console.log("Ainda carregando o estado de autenticação...");
      return false;
    }
    
    if (!usuario) {
      console.log("Usuário não autenticado no Firebase");
      return false;
    }

    const sessao = obterSessao();
    console.log("Sessão encontrada:", sessao);
    
    if (!sessao) {
      console.log("Sessão não encontrada no localStorage, tentando criar");
      try {
        console.log("Buscando usuário no Firestore. UID:", usuario.uid);
        const usuarioFirestore = await buscarUsuarioPorUid(usuario.uid);
        console.log("Resposta do Firestore:", usuarioFirestore);
        
        if (usuarioFirestore && usuarioFirestore.statusAcesso === 'Aprovado') {
          console.log("Usuário aprovado, criando sessão");
          console.log("Tipo de usuário:", usuarioFirestore.tipoUsuario || 'Comum');
          
          const dadosSessao: SessaoUsuario = {
            uid: usuarioFirestore.uid,
            email: usuarioFirestore.email,
            nomeUsuario: usuarioFirestore.dadosPessoais.nomeCompleto,
            tipoUsuario: usuarioFirestore.tipoUsuario || 'Comum',
            statusAcesso: usuarioFirestore.statusAcesso,
            dataExpiracao: Date.now() + 24 * 60 * 60 * 1000, // 24 horas
            id: usuarioFirestore.id
          };
          
          if (usuarioFirestore.dadosPessoais.lotacao) {
            dadosSessao.lotacao = usuarioFirestore.dadosPessoais.lotacao;
          }
          
          if (usuarioFirestore.dadosPessoais.matricula) {
            dadosSessao.matricula = usuarioFirestore.dadosPessoais.matricula;
          }
          
          if (usuarioFirestore.dadosPessoais.observacoes) {
            dadosSessao.observacoes = usuarioFirestore.dadosPessoais.observacoes;
          }
          
          salvarSessao(dadosSessao);
          localStorage.setItem("usuario", JSON.stringify(usuarioFirestore));
          console.log("Sessão criada durante verificação");
          return true;
        } else {
          console.log("Usuário não aprovado ou não encontrado");
          if (usuarioFirestore) {
            console.log("Status:", usuarioFirestore.statusAcesso);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      }
      return false;
    }

    if (sessao.statusAcesso !== 'Aprovado') {
      console.log("Status de acesso inválido:", sessao.statusAcesso);
      return false;
    }

    console.log("Verificação completa: usuário autenticado e com acesso aprovado");
    return true;
  };

  const verificarAdmin = () => {
    const sessao = obterSessao();
    const resultado = sessao?.tipoUsuario === 'Administrador';
    console.log("Verificação de permissão admin:", resultado);
    console.log("Detalhes da sessão para verificação admin:", sessao);
    return resultado;
  };

  return {
    usuario,
    authLoading,
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
