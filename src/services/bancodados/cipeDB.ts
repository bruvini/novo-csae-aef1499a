
import { collection, doc, getDoc, getDocs, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { TermoCipe, CasoClinico } from '@/types/cipe';

// Implementação para buscar termos CIPE
export const buscarTermosCipe = async (tipo: string): Promise<TermoCipe[]> => {
  try {
    const q = query(
      collection(db, 'terminologiaCipe'),
      where('tipo', '==', tipo)
    );
    
    const querySnapshot = await getDocs(q);
    const termos: TermoCipe[] = [];
    
    querySnapshot.forEach((doc) => {
      termos.push({ id: doc.id, ...doc.data() } as TermoCipe);
    });
    
    return termos;
  } catch (error) {
    console.error(`Erro ao buscar termos CIPE do tipo ${tipo}:`, error);
    return [];
  }
};

// Implementação para registrar vencedor em casos clínicos
export const registrarVencedor = async (casoId: string, userId: string, toastVariant = "success") => {
  try {
    const casoRef = doc(db, 'casosClinicos', casoId);
    
    await updateDoc(casoRef, {
      arrayVencedor: arrayUnion(userId)
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao registrar vencedor:", error);
    return false;
  }
};

// Implementação para buscar casos clínicos
export const buscarCasosClinicos = async (): Promise<CasoClinico[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'casosClinicos'));
    const casos: CasoClinico[] = [];
    
    querySnapshot.forEach((doc) => {
      casos.push({ id: doc.id, ...doc.data() } as CasoClinico);
    });
    
    return casos;
  } catch (error) {
    console.error("Erro ao buscar casos clínicos:", error);
    return [];
  }
};
