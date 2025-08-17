
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProcessoEnfermagem } from '@/types/processoEnfermagem';

export async function criarProcessoEnfermagem(
  pacienteId: string,
  enfermeiroId: string
): Promise<string> {
  try {
    const novoProcesso = {
      pacienteId,
      enfermeiroId,
      status: 'em_andamento' as const,
      etapaAtual: 1,
      dataInicio: serverTimestamp(),
      avaliacao: {},
      diagnostico: {},
      planejamento: {},
      implementacao: {},
      evolucao: {}
    };

    const docRef = await addDoc(collection(db, 'processosEnfermagem'), novoProcesso);
    console.log('Processo criado com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar processo:', error);
    throw error;
  }
}

export async function buscarProcessoAtivo(
  pacienteId: string,
  enfermeiroId: string
): Promise<ProcessoEnfermagem | null> {
  try {
    const q = query(
      collection(db, 'processosEnfermagem'),
      where('pacienteId', '==', pacienteId),
      where('enfermeiroId', '==', enfermeiroId),
      where('status', '==', 'em_andamento')
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    const docData = querySnapshot.docs[0];
    return {
      id: docData.id,
      ...docData.data()
    } as ProcessoEnfermagem;
  } catch (error) {
    console.error('Erro ao buscar processo ativo:', error);
    return null;
  }
}

export async function buscarProcessoConcluido(
  pacienteId: string,
  enfermeiroId: string
): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'processosEnfermagem'),
      where('pacienteId', '==', pacienteId),
      where('enfermeiroId', '==', enfermeiroId),
      where('status', '==', 'concluido')
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Erro ao buscar processo concluído:', error);
    return false;
  }
}

export async function salvarProgressoProcesso(
  processoId: string,
  etapaAtual: number,
  dadosEtapas: {
    avaliacao: any;
    diagnostico: any;
    planejamento: any;
    implementacao: any;
    evolucao: any;
  }
): Promise<void> {
  try {
    const processoRef = doc(db, 'processosEnfermagem', processoId);
    
    await updateDoc(processoRef, {
      etapaAtual,
      ...dadosEtapas
    });
    
    console.log('Progresso salvo com sucesso');
  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
    throw error;
  }
}

export async function concluirProcesso(
  processoId: string,
  dadosEtapas: {
    avaliacao: any;
    diagnostico: any;
    planejamento: any;
    implementacao: any;
    evolucao: any;
  }
): Promise<void> {
  try {
    const processoRef = doc(db, 'processosEnfermagem', processoId);
    
    await updateDoc(processoRef, {
      status: 'concluido',
      dataConclusao: serverTimestamp(),
      etapaAtual: 5,
      ...dadosEtapas
    });
    
    console.log('Processo concluído com sucesso');
  } catch (error) {
    console.error('Erro ao concluir processo:', error);
    throw error;
  }
}

export async function excluirProcesso(processoId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'processosEnfermagem', processoId));
    console.log('Processo excluído com sucesso');
  } catch (error) {
    console.error('Erro ao excluir processo:', error);
    throw error;
  }
}
