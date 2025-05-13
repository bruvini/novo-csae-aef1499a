
import { collection, addDoc, doc, getDoc, query, where, getDocs, updateDoc, Timestamp, setDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Evolucao } from '@/types/evolucao';

// Buscar evolução por ID
export const buscarEvolucaoPorId = async (evolucaoId: string): Promise<Evolucao | null> => {
  try {
    const evolucaoRef = doc(db, 'evolucoes', evolucaoId);
    const evolucaoDoc = await getDoc(evolucaoRef);
    
    if (evolucaoDoc.exists()) {
      return { id: evolucaoDoc.id, ...evolucaoDoc.data() } as Evolucao;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Erro ao buscar evolução:', error);
    throw error;
  }
};

// Buscar todas as evoluções de um paciente
export const buscarEvolucoesPorPaciente = async (pacienteId: string): Promise<Evolucao[]> => {
  try {
    const evolucaoPorPacienteQuery = query(
      collection(db, 'evolucoes'), 
      where('pacienteId', '==', pacienteId),
      orderBy('dataInicio', 'desc')
    );
    
    const evolucoesDocs = await getDocs(evolucaoPorPacienteQuery);
    return evolucoesDocs.docs.map(doc => ({ id: doc.id, ...doc.data() } as Evolucao));
  } catch (error) {
    console.error('Erro ao buscar evoluções do paciente:', error);
    throw error;
  }
};

// Criar ou atualizar uma evolução
export const salvarEvolucao = async (evolucao: Evolucao): Promise<string> => {
  try {
    const agora = Timestamp.now();
    const evolucaoAtualizada = {
      ...evolucao,
      dataAtualizacao: agora,
      statusConclusao: evolucao.statusConclusao || 'Em andamento'
    };

    let evolucaoId = evolucao.id;
    
    if (evolucaoId) {
      // Atualizar evolução existente
      await updateDoc(doc(db, 'evolucoes', evolucaoId), evolucaoAtualizada);
    } else {
      // Criar nova evolução
      const evolucaoRef = await addDoc(collection(db, 'evolucoes'), evolucaoAtualizada);
      evolucaoId = evolucaoRef.id;
    }
    
    return evolucaoId;
  } catch (error) {
    console.error('Erro ao salvar evolução:', error);
    throw error;
  }
};

// Concluir uma evolução
export const concluirEvolucao = async (evolucaoId: string): Promise<void> => {
  try {
    const evolucaoRef = doc(db, 'evolucoes', evolucaoId);
    await updateDoc(evolucaoRef, {
      dataConclusao: Timestamp.now(),
      statusConclusao: 'Concluído'
    });
  } catch (error) {
    console.error('Erro ao concluir evolução:', error);
    throw error;
  }
};

// Interromper uma evolução
export const interromperEvolucao = async (evolucaoId: string): Promise<void> => {
  try {
    const evolucaoRef = doc(db, 'evolucoes', evolucaoId);
    await updateDoc(evolucaoRef, {
      dataConclusao: Timestamp.now(),
      statusConclusao: 'Interrompido'
    });
  } catch (error) {
    console.error('Erro ao interromper evolução:', error);
    throw error;
  }
};
