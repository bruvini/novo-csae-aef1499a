
import { collection, addDoc, Timestamp, getDocs, query, where, limit, orderBy } from "firebase/firestore";
import { db } from "../firebase";

// Function to register a user access
export const registrarAcesso = async (
  userId: string,
  userName?: string,
  userEmail?: string,
  action?: string,
  details?: string,
  platform?: string
): Promise<void> => {
  try {
    await addDoc(collection(db, "logAcessos"), {
      usuarioId: userId,
      usuarioNome: userName || "",
      usuarioEmail: userEmail || "",
      acao: action || "login",
      detalhes: details || "Login realizado com sucesso",
      plataforma: platform || "web",
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error("Erro ao registrar acesso:", error);
  }
};

// Function to get access history for a user
export const obterHistoricoAcessos = async (userId: string, limit_count = 10) => {
  try {
    const q = query(
      collection(db, "logAcessos"),
      where("usuarioId", "==", userId),
      orderBy("timestamp", "desc"),
      limit(limit_count)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erro ao obter histórico de acessos:", error);
    return [];
  }
};

// Function to get total access count for a user
export const obterTotalAcessos = async (userId: string) => {
  try {
    const q = query(
      collection(db, "logAcessos"),
      where("usuarioId", "==", userId)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Erro ao obter total de acessos:", error);
    return 0;
  }
};

// Function to get recent accesses for all users
export const obterUltimosAcessosTodosUsuarios = async (limit_count = 50) => {
  try {
    const q = query(
      collection(db, "logAcessos"),
      orderBy("timestamp", "desc"),
      limit(limit_count)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erro ao obter últimos acessos:", error);
    return [];
  }
};
