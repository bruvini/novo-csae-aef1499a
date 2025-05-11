
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

// Function to register a user access
export const registrarAcesso = async (userId: string): Promise<void> => {
  try {
    await addDoc(collection(db, "logAcessos"), {
      usuarioId: userId,
      timestamp: Timestamp.now(),
      plataforma: "web"
    });
  } catch (error) {
    console.error("Erro ao registrar acesso:", error);
  }
};
