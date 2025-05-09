
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, serverTimestamp, updateDoc, increment, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { buscarUsuarioPorUid } from './usuariosDB';

export interface HistoricoAcesso {
  id?: string;
  usuarioId: string;
  nomeUsuario?: string;
  emailUsuario?: string;
  dataHora: Timestamp;
  tipoAcao: "login" | "logout" | "visualizacao" | "acao";
  descricaoAcao?: string;
  recursoAcessado?: string;
}

export const registrarAcesso = async (
  usuarioId: string, 
  nomeUsuario: string, 
  emailUsuario: string, 
  tipoAcao: "login" | "logout" | "visualizacao" | "acao", 
  descricaoAcao?: string, 
  recursoAcessado?: string
): Promise<string | null> => {
  try {
    // 1. Registrar o log de acesso
    const acesso = {
      usuarioId,
      nomeUsuario,
      emailUsuario,
      dataHora: serverTimestamp(),
      tipoAcao,
      descricaoAcao,
      recursoAcessado
    };

    const docRef = await addDoc(collection(db, "historicoAcessos"), acesso);
    
    // 2. Se for um login, atualizar o contador de acessos do usuário
    if (tipoAcao === "login") {
      // Buscar o usuário no Firestore
      const usuario = await buscarUsuarioPorUid(usuarioId);
      if (usuario && usuario.id) {
        // Atualizar o contador de acessos e a data do último acesso
        const usuarioRef = doc(db, "usuarios", usuario.id);
        await updateDoc(usuarioRef, {
          contadorAcessos: increment(1),
          dataUltimoAcesso: serverTimestamp()
        });
        console.log(`Contador de acessos atualizado para o usuário ${nomeUsuario}`);
      }
    }
    
    return docRef.id;
  } catch (error) {
    console.error("Erro ao registrar acesso:", error);
    return null;
  }
};

export const obterHistoricoAcessos = async (usuarioId: string): Promise<HistoricoAcesso[]> => {
  try {
    const q = query(
      collection(db, "historicoAcessos"),
      where("usuarioId", "==", usuarioId),
      orderBy("dataHora", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const acessos: HistoricoAcesso[] = [];
    
    querySnapshot.forEach((doc) => {
      acessos.push({ id: doc.id, ...doc.data() } as HistoricoAcesso);
    });
    
    return acessos;
  } catch (error) {
    console.error("Erro ao obter histórico de acessos:", error);
    return [];
  }
};

// Função para obter o número total de acessos de um usuário
export const obterTotalAcessos = async (usuarioId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, "historicoAcessos"),
      where("usuarioId", "==", usuarioId),
      where("tipoAcao", "==", "login")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Erro ao obter total de acessos:", error);
    return 0;
  }
};

// Função para obter os últimos acessos de todos os usuários (para página de gestão)
export const obterUltimosAcessosTodosUsuarios = async (limite: number = 100): Promise<HistoricoAcesso[]> => {
  try {
    const q = query(
      collection(db, "historicoAcessos"),
      where("tipoAcao", "==", "login"),
      orderBy("dataHora", "desc"),
      // Use limit para não sobrecarregar
      //limit(limite)
    );
    
    const querySnapshot = await getDocs(q);
    const acessos: HistoricoAcesso[] = [];
    
    querySnapshot.forEach((doc) => {
      acessos.push({ id: doc.id, ...doc.data() } as HistoricoAcesso);
    });
    
    return acessos;
  } catch (error) {
    console.error("Erro ao obter histórico de acessos de todos usuários:", error);
    return [];
  }
};
