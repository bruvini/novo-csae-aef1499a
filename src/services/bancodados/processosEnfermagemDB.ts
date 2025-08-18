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
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProcessoEnfermagem, SessaoDeTrabalho } from '@/types/processoEnfermagem';

export async function criarProcessoEnfermagem(
  pacienteId: string,
  enfermeiroId: string
): Promise<string> {
  try {
    const agora = Timestamp.now();
    const novoProcesso = {
      pacienteId,
      enfermeiroId,
      status: 'em_andamento' as const,
      etapaAtual: 1,
      dataInicio: agora,
      sessoesDeTrabalho: [
        {
          inicioSessao: agora
        }
      ], // Primeira sessão inicializada com timestamp do cliente
      avaliacao: {
        coletaDeDadosSubjetivos: '',
        exameFisico: {},
        nhbsAfetadas: []
      },
      diagnostico: { diagnosticosSelecionados: [] },
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
    const processoDoc = await getDoc(processoRef);

    if (!processoDoc.exists()) return;

    const dados = processoDoc.data() as ProcessoEnfermagem;
    const sessoes: SessaoDeTrabalho[] = Array.isArray(dados.sessoesDeTrabalho) ? [...dados.sessoesDeTrabalho] : [];

    // Se a última sessão ainda não foi finalizada, não crie outra
    const ultima = sessoes[sessoes.length - 1];
    if (ultima && !ultima.fimSessao) {
      console.log('Sessão já em andamento. Nova sessão não será iniciada.');
      return;
    }

    const novaSessao: SessaoDeTrabalho = { inicioSessao: Timestamp.now() };
    sessoes.push(novaSessao);

    await updateDoc(processoRef, {
      sessoesDeTrabalho: sessoes
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
      const sessoes: SessaoDeTrabalho[] = Array.isArray(dados.sessoesDeTrabalho) ? [...dados.sessoesDeTrabalho] : [];
      
      // Encontrar a última sessão sem fimSessao (varre de trás para frente)
      let ultimaSessaoIndex = -1;
      for (let i = sessoes.length - 1; i >= 0; i--) {
        if (!sessoes[i].fimSessao) {
          ultimaSessaoIndex = i;
          break;
        }
      }
      
      if (ultimaSessaoIndex !== -1) {
        sessoes[ultimaSessaoIndex].fimSessao = Timestamp.now();
        
        await updateDoc(processoRef, {
          sessoesDeTrabalho: sessoes
        });
        
        console.log('Sessão finalizada');
      } else {
        console.log('Nenhuma sessão aberta para finalizar.');
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
      dataConclusao: Timestamp.now(),
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

export async function excluirProcessosPorPaciente(pacienteId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'processosEnfermagem'),
      where('pacienteId', '==', pacienteId)
    );

    const querySnapshot = await getDocs(q);
    
    // Excluir todos os processos encontrados
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );

    await Promise.all(deletePromises);
    console.log(`${querySnapshot.docs.length} processos excluídos para o paciente ${pacienteId}`);
  } catch (error) {
    console.error('Erro ao excluir processos do paciente:', error);
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
