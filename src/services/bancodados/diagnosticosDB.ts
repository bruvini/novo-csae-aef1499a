
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { DiagnosticoCompleto, SubconjuntoDiagnostico } from '@/types/diagnosticos';

// Fetch all diagnósticos
export const fetchDiagnosticos = async (): Promise<DiagnosticoCompleto[]> => {
  const querySnapshot = await getDocs(collection(db, 'diagnosticos'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiagnosticoCompleto));
};

// Fetch diagnósticos by subconjunto id
export const fetchDiagnosticosBySubconjunto = async (subconjuntoId: string): Promise<DiagnosticoCompleto[]> => {
  const q = query(
    collection(db, 'diagnosticos'), 
    where('subconjuntoIds', 'array-contains', subconjuntoId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DiagnosticoCompleto));
};

// Fetch all subconjuntos
export const fetchSubconjuntosDiagnostico = async (): Promise<SubconjuntoDiagnostico[]> => {
  const querySnapshot = await getDocs(collection(db, 'subconjuntosDiagnostico'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubconjuntoDiagnostico));
};
