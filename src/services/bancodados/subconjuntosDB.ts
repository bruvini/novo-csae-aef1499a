
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot,
  QueryConstraint,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';

export interface SubconjuntoEnfermagem {
  id: string;
  tipoSubconjunto: string;
  tituloSubconjunto: string;
  descricaoSubconjunto?: string;
  volumeProtocolo?: number;
  versaoProtocolo?: number;
  dataPublicacaoProtocolo?: Timestamp;
  dataAtualizacaoProtocolo?: Timestamp;
  urlProtocolo?: string;
  imagemCapaProtocolo?: string;
  dataCadastro: Timestamp;
}

export const buscarSubconjuntos = async (
  filtroTipo?: string,
  termoBusca?: string
): Promise<SubconjuntoEnfermagem[]> => {
  try {
    const constraints: QueryConstraint[] = [
      orderBy('dataCadastro', 'desc')
    ];

    if (filtroTipo && filtroTipo !== 'todos') {
      constraints.unshift(where('tipoSubconjunto', '==', filtroTipo));
    }

    const q = query(collection(db, 'subconjuntosEnfermagem'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    let subconjuntos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SubconjuntoEnfermagem[];

    // Filtro de busca por título (case-insensitive)
    if (termoBusca && termoBusca.trim()) {
      const termo = termoBusca.toLowerCase().trim();
      subconjuntos = subconjuntos.filter(sub => 
        sub.tituloSubconjunto.toLowerCase().includes(termo)
      );
    }

    return subconjuntos;
  } catch (error) {
    console.error('Erro ao buscar subconjuntos:', error);
    throw error;
  }
};

export const buscarTiposSubconjuntos = async (): Promise<string[]> => {
  try {
    const q = query(collection(db, 'subconjuntosEnfermagem'));
    const querySnapshot = await getDocs(q);
    
    const tipos = new Set<string>();
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.tipoSubconjunto) {
        tipos.add(data.tipoSubconjunto);
      }
    });

    return Array.from(tipos).sort();
  } catch (error) {
    console.error('Erro ao buscar tipos de subconjuntos:', error);
    throw error;
  }
};

export const atualizarSubconjunto = async (
  id: string, 
  dados: Partial<SubconjuntoEnfermagem>
): Promise<void> => {
  try {
    const docRef = doc(db, 'subconjuntosEnfermagem', id);
    // Remove dataCadastro dos dados para não sobrescrever
    const { dataCadastro, ...dadosParaAtualizar } = dados;
    await updateDoc(docRef, dadosParaAtualizar);
  } catch (error) {
    console.error('Erro ao atualizar subconjunto:', error);
    throw error;
  }
};

export const excluirSubconjunto = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'subconjuntosEnfermagem', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Erro ao excluir subconjunto:', error);
    throw error;
  }
};

export const escutarSubconjuntos = (
  callback: (subconjuntos: SubconjuntoEnfermagem[]) => void,
  filtroTipo?: string
) => {
  const constraints: QueryConstraint[] = [
    orderBy('dataCadastro', 'desc')
  ];

  if (filtroTipo && filtroTipo !== 'todos') {
    constraints.unshift(where('tipoSubconjunto', '==', filtroTipo));
  }

  const q = query(collection(db, 'subconjuntosEnfermagem'), ...constraints);
  
  return onSnapshot(q, (querySnapshot) => {
    const subconjuntos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SubconjuntoEnfermagem[];
    
    callback(subconjuntos);
  });
};

export const buscarNHBs = async (): Promise<string[]> => {
  try {
    const q = query(
      collection(db, 'subconjuntosEnfermagem'),
      where('tipoSubconjunto', '==', 'nhb'),
      orderBy('tituloSubconjunto')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => doc.data().tituloSubconjunto);
  } catch (error) {
    console.error('Erro ao buscar NHBs:', error);
    throw error;
  }
};

// Nova função para buscar subconjuntos do tipo NHB com id e título
export const getSubconjuntosNhb = async (): Promise<{ id: string; tituloSubconjunto: string }[]> => {
  try {
    const q = query(
      collection(db, 'subconjuntosEnfermagem'),
      where('tipoSubconjunto', '==', 'nhb'),
      orderBy('tituloSubconjunto')
    );
    const querySnapshot = await getDocs(q);
    
    const nhbs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      tituloSubconjunto: doc.data().tituloSubconjunto
    }));
    
    return nhbs;
  } catch (error) {
    console.error('Erro ao buscar subconjuntos NHB:', error);
    throw error;
  }
};
