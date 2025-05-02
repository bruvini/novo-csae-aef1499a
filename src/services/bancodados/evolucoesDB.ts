
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Evolucao } from './tipos';

// Add your functions here that use the Evolucao type
export const getEvolucao = async (pacienteId: string, evolucaoId: string): Promise<Evolucao | null> => {
  try {
    const pacienteRef = doc(db, 'pacientes', pacienteId);
    const pacienteSnap = await getDoc(pacienteRef);
    
    if (!pacienteSnap.exists()) {
      return null;
    }
    
    const paciente = pacienteSnap.data();
    const evolucoes = paciente.evolucoes || [];
    
    const evolucao = evolucoes.find((e: Evolucao) => e.id === evolucaoId);
    return evolucao || null;
  } catch (error) {
    console.error("Erro ao buscar evolução:", error);
    return null;
  }
};
