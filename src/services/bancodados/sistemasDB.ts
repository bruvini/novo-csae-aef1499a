
import { collection, getDocs, query, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { SistemaCorporal, RevisaoSistema } from '../../types/sinais-vitais';

/**
 * Busca todos os sistemas corporais
 */
export const fetchSistemasCorporais = async (): Promise<SistemaCorporal[]> => {
  try {
    const q = query(collection(db, 'sistemasCorporais'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const sistemas: SistemaCorporal[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data.nome,
        descricao: data.descricao,
        ativo: data.ativo !== false,
      };
    });
    
    return sistemas;
  } catch (error) {
    console.error("Erro ao buscar sistemas corporais:", error);
    return [];
  }
};

/**
 * Cria um novo sistema corporal
 */
export const createSistemaCorporal = async (sistema: SistemaCorporal): Promise<SistemaCorporal> => {
  try {
    const docRef = await addDoc(collection(db, 'sistemasCorporais'), sistema);
    return {
      ...sistema,
      id: docRef.id
    };
  } catch (error) {
    console.error("Erro ao criar sistema corporal:", error);
    throw error;
  }
};

/**
 * Atualiza um sistema corporal
 */
export const updateSistemaCorporal = async (id: string, sistema: SistemaCorporal): Promise<boolean> => {
  try {
    const docRef = doc(db, 'sistemasCorporais', id);
    await updateDoc(docRef, {
      nome: sistema.nome,
      descricao: sistema.descricao,
      ativo: sistema.ativo
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar sistema corporal:", error);
    throw error;
  }
};

/**
 * Exclui um sistema corporal
 */
export const deleteSistemaCorporal = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'sistemasCorporais', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Erro ao excluir sistema corporal:", error);
    throw error;
  }
};

/**
 * Busca todas as revisões de sistema
 */
export const fetchRevisoesSistema = async (): Promise<RevisaoSistema[]> => {
  try {
    const q = query(collection(db, 'revisoesSistema'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const revisoes: RevisaoSistema[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        sistemaId: data.sistemaId,
        titulo: data.titulo,
        descricao: data.descricao,
        tipoAlteracao: data.tipoAlteracao,
        padrao: data.padrao,
        ativo: data.ativo !== false,
        diferencaSexoIdade: data.diferencaSexoIdade,
        valoresReferencia: data.valoresReferencia || []
      };
    });
    
    return revisoes;
  } catch (error) {
    console.error("Erro ao buscar revisões de sistema:", error);
    return [];
  }
};

/**
 * Cria uma nova revisão de sistema
 */
export const createRevisaoSistema = async (revisao: RevisaoSistema): Promise<RevisaoSistema> => {
  try {
    const docRef = await addDoc(collection(db, 'revisoesSistema'), revisao);
    return {
      ...revisao,
      id: docRef.id
    };
  } catch (error) {
    console.error("Erro ao criar revisão de sistema:", error);
    throw error;
  }
};

/**
 * Atualiza uma revisão de sistema
 */
export const updateRevisaoSistema = async (id: string, revisao: RevisaoSistema): Promise<boolean> => {
  try {
    const docRef = doc(db, 'revisoesSistema', id);
    await updateDoc(docRef, { ...revisao });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar revisão de sistema:", error);
    throw error;
  }
};

/**
 * Exclui uma revisão de sistema
 */
export const deleteRevisaoSistema = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'revisoesSistema', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Erro ao excluir revisão de sistema:", error);
    throw error;
  }
};
