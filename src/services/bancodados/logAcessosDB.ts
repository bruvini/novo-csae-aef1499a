
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

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
