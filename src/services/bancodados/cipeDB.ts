
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  serverTimestamp, 
  Timestamp, 
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { CasoClinico, TermoCipe } from './tipos';

// Função para buscar todos os termos CIPE
export async function buscarTermosCipe(): Promise<{
  arrayFoco: TermoCipe[],
  arrayJulgamento: TermoCipe[],
  arrayMeios: TermoCipe[],
  arrayAcao: TermoCipe[],
  arrayTempo: TermoCipe[],
  arrayLocalizacao: TermoCipe[],
  arrayCliente: TermoCipe[]
}> {
  try {
    const eixos = [
      { nome: 'eixoFoco', array: 'arrayFoco' },
      { nome: 'eixoJulgamento', array: 'arrayJulgamento' },
      { nome: 'eixoMeios', array: 'arrayMeios' },
      { nome: 'eixoAcao', array: 'arrayAcao' },
      { nome: 'eixoTempo', array: 'arrayTempo' },
      { nome: 'eixoLocalizacao', array: 'arrayLocalizacao' },
      { nome: 'eixoCliente', array: 'arrayCliente' }
    ];

    const resultado = {
      arrayFoco: [] as TermoCipe[],
      arrayJulgamento: [] as TermoCipe[],
      arrayMeios: [] as TermoCipe[],
      arrayAcao: [] as TermoCipe[],
      arrayTempo: [] as TermoCipe[],
      arrayLocalizacao: [] as TermoCipe[],
      arrayCliente: [] as TermoCipe[]
    };

    const promises = eixos.map(async eixo => {
      const eixoRef = collection(db, eixo.nome);
      const eixoSnap = await getDocs(eixoRef);
      const terms: TermoCipe[] = [];
      
      eixoSnap.forEach(doc => {
        terms.push({ id: doc.id, ...doc.data() } as TermoCipe);
      });
      
      resultado[eixo.array as keyof typeof resultado] = terms;
    });

    await Promise.all(promises);
    return resultado;
  } catch (error) {
    console.error("Erro ao buscar termos CIPE:", error);
    throw error;
  }
}

// Função para adicionar um termo CIPE
export async function adicionarTermoCipe(tipo: string, termo: string, descricao: string): Promise<string> {
  try {
    const colecao = `eixo${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    const docRef = await addDoc(collection(db, colecao), {
      tipo,
      termo,
      descricao,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error(`Erro ao adicionar termo CIPE de tipo ${tipo}:`, error);
    throw error;
  }
}

// Função para atualizar um termo CIPE
export async function atualizarTermoCipe(tipo: string, id: string, termo: string, descricao: string): Promise<void> {
  try {
    const colecao = `eixo${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    const docRef = doc(db, colecao, id);
    
    await updateDoc(docRef, {
      termo,
      descricao,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Erro ao atualizar termo CIPE de tipo ${tipo} com id ${id}:`, error);
    throw error;
  }
}

// Função para excluir um termo CIPE
export async function excluirTermoCipe(tipo: string, id: string): Promise<void> {
  try {
    const colecao = `eixo${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
    const docRef = doc(db, colecao, id);
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Erro ao excluir termo CIPE de tipo ${tipo} com id ${id}:`, error);
    throw error;
  }
}

// Funções para gerenciar casos clínicos
export async function buscarCasosClinicos(): Promise<CasoClinico[]> {
  try {
    const casosRef = collection(db, 'casosClinicos');
    const snapshot = await getDocs(casosRef);
    
    const casos: CasoClinico[] = [];
    snapshot.forEach(doc => {
      casos.push({ id: doc.id, ...doc.data() } as CasoClinico);
    });
    
    return casos;
  } catch (error) {
    console.error("Erro ao buscar casos clínicos:", error);
    return [];
  }
}

export async function adicionarCasoClinico(caso: Omit<CasoClinico, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'casosClinicos'), {
      ...caso,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error("Erro ao adicionar caso clínico:", error);
    throw error;
  }
}

export async function atualizarCasoClinico(id: string, caso: Partial<CasoClinico>): Promise<void> {
  try {
    const docRef = doc(db, 'casosClinicos', id);
    
    await updateDoc(docRef, {
      ...caso,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Erro ao atualizar caso clínico com id ${id}:`, error);
    throw error;
  }
}

export async function excluirCasoClinico(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'casosClinicos', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Erro ao excluir caso clínico com id ${id}:`, error);
    throw error;
  }
}
