
import { 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc, 
  arrayUnion,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Evolucao } from './tipos';

// Funções para gerenciar evoluções
export async function iniciarEvolucao(pacienteId: string, evolucao: Omit<Evolucao, 'dataInicio' | 'dataAtualizacao' | 'statusConclusao'>): Promise<boolean> {
  try {
    const pacienteRef = doc(db, 'pacientes', pacienteId);
    const pacienteSnap = await getDoc(pacienteRef);
    
    if (!pacienteSnap.exists()) {
      return false;
    }
    
    const pacienteData = pacienteSnap.data();
    const evolucoes = pacienteData.evolucoes || [];
    
    // Verificar se já existe evolução em aberto
    const evolucaoAberta = evolucoes.some((e: Evolucao) => 
      e.statusConclusao === 'Em andamento' || e.statusConclusao === 'Interrompido'
    );
    
    if (evolucaoAberta) {
      return false;
    }
    
    const timestamp = serverTimestamp();
    
    const novaEvolucao: Evolucao = {
      ...evolucao,
      id: crypto.randomUUID(),
      dataInicio: Timestamp.now(), // Usar Timestamp.now() em vez de serverTimestamp()
      dataAtualizacao: timestamp, // serverTimestamp() é aceitável pois Evolucao.dataAtualizacao pode ser Timestamp | FieldValue
      statusConclusao: 'Em andamento'
    };
    
    await updateDoc(pacienteRef, {
      evolucoes: arrayUnion(novaEvolucao)
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao iniciar evolução:", error);
    return false;
  }
}

export async function salvarProgressoEvolucao(pacienteId: string, evolucaoId: string, dadosAtualizados: Partial<Evolucao>): Promise<boolean> {
  try {
    const pacienteRef = doc(db, 'pacientes', pacienteId);
    const pacienteSnap = await getDoc(pacienteRef);
    
    if (!pacienteSnap.exists()) {
      return false;
    }
    
    const pacienteData = pacienteSnap.data();
    const evolucoes = pacienteData.evolucoes || [];
    
    const evolucaoIndex = evolucoes.findIndex((e: Evolucao) => e.id === evolucaoId);
    
    if (evolucaoIndex === -1) {
      return false;
    }
    
    // Atualizar a evolução
    const evolucaoAtualizada = {
      ...evolucoes[evolucaoIndex],
      ...dadosAtualizados,
      dataAtualizacao: serverTimestamp(), // É aceitável pois Evolucao.dataAtualizacao pode ser Timestamp | FieldValue
      statusConclusao: dadosAtualizados.statusConclusao || 'Interrompido' as const
    };
    
    evolucoes[evolucaoIndex] = evolucaoAtualizada as Evolucao; // Cast para garantir que é do tipo Evolucao
    
    await updateDoc(pacienteRef, {
      evolucoes: evolucoes
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao salvar progresso da evolução:", error);
    return false;
  }
}

export async function finalizarEvolucao(pacienteId: string, evolucaoId: string, dadosFinais: Partial<Evolucao>): Promise<boolean> {
  try {
    const pacienteRef = doc(db, 'pacientes', pacienteId);
    const pacienteSnap = await getDoc(pacienteRef);
    
    if (!pacienteSnap.exists()) {
      return false;
    }
    
    const pacienteData = pacienteSnap.data();
    const evolucoes = pacienteData.evolucoes || [];
    
    const evolucaoIndex = evolucoes.findIndex((e: Evolucao) => e.id === evolucaoId);
    
    if (evolucaoIndex === -1) {
      return false;
    }
    
    // Finalizar a evolução
    const evolucaoFinalizada = {
      ...evolucoes[evolucaoIndex],
      ...dadosFinais,
      dataConclusao: serverTimestamp(), // É aceitável pois Evolucao.dataConclusao pode ser Timestamp | FieldValue
      dataAtualizacao: serverTimestamp(), // É aceitável pois Evolucao.dataAtualizacao pode ser Timestamp | FieldValue
      statusConclusao: 'Concluído' as const
    };
    
    evolucoes[evolucaoIndex] = evolucaoFinalizada as Evolucao; // Cast para garantir que é do tipo Evolucao
    
    await updateDoc(pacienteRef, {
      evolucoes: evolucoes
    });
    
    return true;
  } catch (error) {
    console.error("Erro ao finalizar evolução:", error);
    return false;
  }
}
