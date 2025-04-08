
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import { ProtocoloOperacionalPadrao } from '@/types/pop';

// Buscar todos os POPs
export const buscarProtocolosOperacionais = async (): Promise<ProtocoloOperacionalPadrao[]> => {
  try {
    const q = query(collection(db, 'protocolosOperacionaisPadrao'), orderBy('dataImplantacao', 'desc'));
    const querySnapshot = await getDocs(q);
    const pops: ProtocoloOperacionalPadrao[] = [];
    
    querySnapshot.forEach((doc) => {
      pops.push({ id: doc.id, ...doc.data() } as ProtocoloOperacionalPadrao);
    });
    
    return pops;
  } catch (error) {
    console.error("Erro ao buscar protocolos operacionais:", error);
    return [];
  }
};

// Buscar POPs ativos
export const buscarProtocolosOperacionaisAtivos = async (): Promise<ProtocoloOperacionalPadrao[]> => {
  try {
    const q = query(
      collection(db, 'protocolosOperacionaisPadrao'), 
      where('ativo', '==', true),
      orderBy('dataImplantacao', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const pops: ProtocoloOperacionalPadrao[] = [];
    
    querySnapshot.forEach((doc) => {
      pops.push({ id: doc.id, ...doc.data() } as ProtocoloOperacionalPadrao);
    });
    
    return pops;
  } catch (error) {
    console.error("Erro ao buscar protocolos operacionais ativos:", error);
    return [];
  }
};

// Buscar POP por ID
export const buscarProtocoloOperacionalPorId = async (id: string): Promise<ProtocoloOperacionalPadrao | null> => {
  try {
    const docRef = doc(db, 'protocolosOperacionaisPadrao', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as ProtocoloOperacionalPadrao;
    }
    
    return null;
  } catch (error) {
    console.error(`Erro ao buscar protocolo operacional ${id}:`, error);
    return null;
  }
};

// Adicionar novo POP
export const adicionarProtocoloOperacional = async (
  pop: Omit<ProtocoloOperacionalPadrao, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, 'protocolosOperacionaisPadrao'), {
      ...pop,
      ativo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar protocolo operacional:", error);
    return null;
  }
};

// Atualizar POP
export const atualizarProtocoloOperacional = async (
  id: string, 
  dados: Partial<ProtocoloOperacionalPadrao>
): Promise<boolean> => {
  try {
    const docRef = doc(db, 'protocolosOperacionaisPadrao', id);
    
    await updateDoc(docRef, {
      ...dados,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar protocolo operacional:", error);
    return false;
  }
};

// Remover POP
export const removerProtocoloOperacional = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'protocolosOperacionaisPadrao', id));
    return true;
  } catch (error) {
    console.error("Erro ao remover protocolo operacional:", error);
    return false;
  }
};
