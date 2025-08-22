
import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProcessoEnfermagem, SessaoDeTrabalho } from '@/types/processoEnfermagem';

// Utilitário local para montar o caminho da subcoleção de processos
const processosPath = (enfermeiroId: string, pacienteId: string) =>
  `usuarios/${enfermeiroId}/pacientes/${pacienteId}/processosEnfermagem`;

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
          inicioSessao: agora,
        },
      ],
      avaliacao: {
        coletaDeDadosSubjetivos: '',
        exameFisico: {},
        nhbsAfetadas: [],
      },
      diagnostico: { diagnosticosSelecionados: [] },
      planejamento: { diagnosticosPlanejados: [] },
      implementacao: {},
      evolucao: { resumoGerado: '' },
    };

    const colecao = collection(db, processosPath(enfermeiroId, pacienteId));
    const docRef = await addDoc(colecao, novoProcesso);
    console.log('Processo criado com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar processo:', error);
    throw error;
  }
}

export async function iniciarNovaSessao(
  enfermeiroId: string,
  pacienteId: string,
  processoId: string
): Promise<void> {
  try {
    const processoRef = doc(db, processosPath(enfermeiroId, pacienteId), processoId);
    const processoDoc = await getDoc(processoRef);

    if (!processoDoc.exists()) return;

    const dados = processoDoc.data() as ProcessoEnfermagem;
    const sessoes: SessaoDeTrabalho[] = Array.isArray(dados.sessoesDeTrabalho) ? [...dados.sessoesDeTrabalho] : [];

    const ultima = sessoes[sessoes.length - 1];
    if (ultima && !ultima.fimSessao) {
      console.log('Sessão já em andamento. Nova sessão não será iniciada.');
      return;
    }

    const novaSessao: SessaoDeTrabalho = { inicioSessao: Timestamp.now() };
    sessoes.push(novaSessao);

    await updateDoc(processoRef, {
      sessoesDeTrabalho: sessoes,
    });

    console.log('Nova sessão iniciada');
  } catch (error) {
    console.error('Erro ao iniciar nova sessão:', error);
    throw error;
  }
}

export async function finalizarSessaoAtual(
  enfermeiroId: string,
  pacienteId: string,
  processoId: string
): Promise<void> {
  try {
    const processoRef = doc(db, processosPath(enfermeiroId, pacienteId), processoId);
    const processoDoc = await getDoc(processoRef);

    if (processoDoc.exists()) {
      const dados = processoDoc.data() as ProcessoEnfermagem;
      const sessoes: SessaoDeTrabalho[] = Array.isArray(dados.sessoesDeTrabalho) ? [...dados.sessoesDeTrabalho] : [];

      // Encontrar a última sessão sem fimSessao
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
          sessoesDeTrabalho: sessoes,
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
    const colecao = collection(db, processosPath(enfermeiroId, pacienteId));
    const q = query(colecao, where('status', '==', 'em_andamento'), orderBy('dataInicio', 'desc'), limit(1));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const docData = querySnapshot.docs[0];
    return {
      id: docData.id,
      ...docData.data(),
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
    const colecao = collection(db, processosPath(enfermeiroId, pacienteId));
    const q = query(colecao, where('status', '==', 'concluido'), limit(1));

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Erro ao buscar processo concluído:', error);
    return false;
  }
}

export async function buscarProcessosConcluidos(
  pacienteId: string,
  enfermeiroId: string
): Promise<ProcessoEnfermagem[]> {
  try {
    const colecao = collection(db, processosPath(enfermeiroId, pacienteId));
    const q = query(
      colecao,
      where('status', '==', 'concluido'),
      orderBy('dataConclusao', 'desc')
    );

    const querySnapshot = await getDocs(q);

    const processos: ProcessoEnfermagem[] = [];
    querySnapshot.forEach((docSnap) => {
      processos.push({
        id: docSnap.id,
        ...docSnap.data(),
      } as ProcessoEnfermagem);
    });

    return processos;
  } catch (error) {
    console.error('Erro ao buscar processos concluídos:', error);
    return [];
  }
}

export async function salvarProgressoProcesso(
  enfermeiroId: string,
  pacienteId: string,
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
    await finalizarSessaoAtual(enfermeiroId, pacienteId, processoId);

    const processoRef = doc(db, processosPath(enfermeiroId, pacienteId), processoId);

    await updateDoc(processoRef, {
      etapaAtual,
      ...dadosEtapas,
    });

    console.log('Progresso salvo com sucesso');
  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
    throw error;
  }
}

export async function concluirProcesso(
  enfermeiroId: string,
  pacienteId: string,
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
    await finalizarSessaoAtual(enfermeiroId, pacienteId, processoId);

    const processoRef = doc(db, processosPath(enfermeiroId, pacienteId), processoId);

    await updateDoc(processoRef, {
      status: 'concluido',
      dataConclusao: Timestamp.now(),
      etapaAtual: 5,
      ...dadosEtapas,
    });

    console.log('Processo concluído com sucesso');
  } catch (error) {
    console.error('Erro ao concluir processo:', error);
    throw error;
  }
}

export async function excluirProcesso(
  enfermeiroId: string,
  pacienteId: string,
  processoId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, processosPath(enfermeiroId, pacienteId), processoId));
    console.log('Processo excluído com sucesso');
  } catch (error) {
    console.error('Erro ao excluir processo:', error);
    throw error;
  }
}

export async function excluirProcessosPorPaciente(pacienteId: string): Promise<void> {
  try {
    // Agora que os processos estão em subcoleções, usamos collectionGroup para localizar todos
    const q = query(
      collectionGroup(db, 'processosEnfermagem'),
      where('pacienteId', '==', pacienteId)
    );

    const querySnapshot = await getDocs(q);

    const deletePromises = querySnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));

    await Promise.all(deletePromises);
    console.log(`${querySnapshot.docs.length} processos excluídos para o paciente ${pacienteId}`);
  } catch (error) {
    console.error('Erro ao excluir processos do paciente:', error);
    throw error;
  }
}

export async function contarProcessosConcluidos(): Promise<number> {
  try {
    const q = query(collectionGroup(db, 'processosEnfermagem'), where('status', '==', 'concluido'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Erro ao contar processos concluídos:', error);
    return 0;
  }
}

export async function contarTotalProcessos(): Promise<number> {
  try {
    const querySnapshot = await getDocs(collectionGroup(db, 'processosEnfermagem'));
    return querySnapshot.size;
  } catch (error) {
    console.error('Erro ao contar total de processos:', error);
    return 0;
  }
}

// Atualizado: buscar processo por ID exigindo o caminho completo
export async function buscarProcessoPorId(
  enfermeiroId: string,
  pacienteId: string,
  processoId: string
): Promise<ProcessoEnfermagem | null> {
  try {
    const processoRef = doc(db, processosPath(enfermeiroId, pacienteId), processoId);
    const processoDoc = await getDoc(processoRef);
    if (!processoDoc.exists()) return null;
    return {
      id: processoDoc.id,
      ...processoDoc.data(),
    } as ProcessoEnfermagem;
  } catch (error) {
    console.error('Erro ao buscar processo por ID:', error);
    return null;
  }
}
