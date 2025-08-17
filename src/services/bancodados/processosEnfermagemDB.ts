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
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProcessoEnfermagem, SessaoDeTrabalho } from '@/types/processoEnfermagem';

export async function criarProcessoEnfermagem(
  pacienteId: string,
  enfermeiroId: string
): Promise<string> {
  try {
    const agora = serverTimestamp();
    const novoProcesso = {
      pacienteId,
      enfermeiroId,
      status: 'em_andamento' as const,
      etapaAtual: 1,
      dataInicio: agora,
      sessoesDeTrabalho: [{
        inicioSessao: agora
      }], // Primeira sessão inicializada
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

export async function iniciarNovaSessao(processoId: string): Promise<void> {
  try {
    const processoRef = doc(db, 'processosEnfermagem', processoId);
    
    await updateDoc(processoRef, {
      sessoesDeTrabalho: arrayUnion({
        inicioSessao: serverTimestamp()
      })
    });
    
    console.log('Nova sessão iniciada');
  } catch (error) {
    console.error('Erro ao iniciar nova sessão:', error);
    throw error;
  }
}

export async function finalizarSessaoAtual(processoId: string): Promise<void> {
  try {
    const processoRef = doc(db, 'processosEnfermagem', processoId);
    const processoDoc = await getDoc(processoRef);
    
    if (processoDoc.exists()) {
      const dados = processoDoc.data() as ProcessoEnfermagem;
      const sessoes = [...dados.sessoesDeTrabalho];
      
      // Encontrar a última sessão sem fimSessao
      const ultimaSessaoIndex = sessoes.findIndex(sessao => !sessao.fimSessao);
      
      if (ultimaSessaoIndex !== -1) {
        sessoes[ultimaSessaoIndex].fimSessao = serverTimestamp() as Timestamp;
        
        await updateDoc(processoRef, {
          sessoesDeTrabalho: sessoes
        });
        
        console.log('Sessão finalizada');
      }
    }
  } catch (error) {
    console.error('Erro ao finalizar sessão:', error);
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
    // Primeiro finalizar a sessão atual
    await finalizarSessaoAtual(processoId);
    
    // Depois salvar o progresso
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
    // Finalizar a sessão atual antes de concluir
    await finalizarSessaoAtual(processoId);
    
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

export async function contarProcessosConcluidos(): Promise<number> {
  try {
    const q = query(
      collection(db, 'processosEnfermagem'),
      where('status', '==', 'concluido')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Erro ao contar processos concluídos:', error);
    return 0;
  }
}

export async function contarTotalProcessos(): Promise<number> {
  try {
    const querySnapshot = await getDocs(collection(db, 'processosEnfermagem'));
    return querySnapshot.size;
  } catch (error) {
    console.error('Erro ao contar total de processos:', error);
    return 0;
  }
}
