
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ProtocoloOperacionalPadrao } from '@/types/pop';

// Função para converter string de data para Timestamp
const converterDataParaTimestamp = (dataString: string): Timestamp | null => {
  if (!dataString) return null;
  
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dataString)) {
    console.error(`Formato de data inválido: ${dataString}. Use o formato DD/MM/AAAA.`);
    return null;
  }
  
  const [dia, mes, ano] = dataString.split('/').map(Number);
  // Mês no JavaScript é baseado em 0 (janeiro = 0, dezembro = 11)
  const data = new Date(ano, mes - 1, dia);
  
  return Timestamp.fromDate(data);
};

// Processa os dados do POP antes de salvar no Firestore
const processarDadosPOP = (pop: any): any => {
  const dadosProcessados = { ...pop };
  
  // Converter strings de data para Timestamp
  if (typeof dadosProcessados.dataImplantacao === 'string') {
    const timestamp = converterDataParaTimestamp(dadosProcessados.dataImplantacao);
    if (timestamp) {
      dadosProcessados.dataImplantacao = timestamp;
    }
  }
  
  if (typeof dadosProcessados.dataRevisao === 'string' && dadosProcessados.dataRevisao) {
    const timestamp = converterDataParaTimestamp(dadosProcessados.dataRevisao);
    if (timestamp) {
      dadosProcessados.dataRevisao = timestamp;
    } else {
      dadosProcessados.dataRevisao = null;
    }
  }
  
  return dadosProcessados;
};

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
    const dadosProcessados = processarDadosPOP(pop);
    
    const docRef = await addDoc(collection(db, 'protocolosOperacionaisPadrao'), {
      ...dadosProcessados,
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
    const dadosProcessados = processarDadosPOP(dados);
    
    const docRef = doc(db, 'protocolosOperacionaisPadrao', id);
    
    await updateDoc(docRef, {
      ...dadosProcessados,
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
