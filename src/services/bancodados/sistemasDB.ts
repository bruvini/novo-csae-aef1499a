
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { SistemaCorporal, RevisaoSistema } from '@/types/sistemas';

// Sistemas Corporais
export const fetchSistemasCorporais = async (): Promise<SistemaCorporal[]> => {
  const querySnapshot = await getDocs(collection(db, 'sistemasCorporais'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SistemaCorporal));
};

export const createSistemaCorporal = async (sistema: SistemaCorporal): Promise<SistemaCorporal> => {
  const docRef = await addDoc(collection(db, 'sistemasCorporais'), sistema);
  return { ...sistema, id: docRef.id };
};

export const updateSistemaCorporal = async (id: string, sistema: Partial<SistemaCorporal>): Promise<void> => {
  await updateDoc(doc(db, 'sistemasCorporais', id), sistema);
};

export const deleteSistemaCorporal = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'sistemasCorporais', id));
};

// Revisão de Sistemas
export const fetchRevisoesSistema = async (): Promise<RevisaoSistema[]> => {
  const querySnapshot = await getDocs(collection(db, 'revisoesSistema'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RevisaoSistema));
};

export const createRevisaoSistema = async (revisao: RevisaoSistema): Promise<RevisaoSistema> => {
  const docRef = await addDoc(collection(db, 'revisoesSistema'), revisao);
  return { ...revisao, id: docRef.id };
};

export const updateRevisaoSistema = async (id: string, revisao: Partial<RevisaoSistema>): Promise<void> => {
  await updateDoc(doc(db, 'revisoesSistema', id), revisao);
};

export const deleteRevisaoSistema = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'revisoesSistema', id));
};
