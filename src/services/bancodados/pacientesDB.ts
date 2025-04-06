
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc, 
  deleteDoc, 
  arrayUnion,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Evolucao, Paciente } from './tipos';

// Funções para gerenciar pacientes
export async function cadastrarPaciente(paciente: Omit<Paciente, 'dataCadastro'>): Promise<string> {
  const pacienteCompleto = {
    ...paciente,
    dataCadastro: serverTimestamp(),
    dataAtualizacao: serverTimestamp(),
    evolucoes: []
  };

  const docRef = await addDoc(collection(db, 'pacientes'), pacienteCompleto);
  return docRef.id;
}

export async function buscarPacientesPorProfissional(uidProfissional: string): Promise<Paciente[]> {
  try {
    const q = query(collection(db, 'pacientes'), where('profissionalUid', '==', uidProfissional));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const pacientes: Paciente[] = querySnapshot.docs.map(doc => {
      return {
        ...doc.data() as Omit<Paciente, 'id'>,
        id: doc.id
      };
    });
    
    return pacientes;
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return [];
  }
}

export async function atualizarPaciente(id: string, dadosAtualizados: Partial<Paciente>): Promise<boolean> {
  try {
    const pacienteRef = doc(db, 'pacientes', id);
    await updateDoc(pacienteRef, {
      ...dadosAtualizados,
      dataAtualizacao: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return false;
  }
}

export async function excluirPaciente(id: string): Promise<boolean> {
  try {
    const pacienteRef = doc(db, 'pacientes', id);
    await deleteDoc(pacienteRef);
    return true;
  } catch (error) {
    console.error("Erro ao excluir paciente:", error);
    return false;
  }
}
