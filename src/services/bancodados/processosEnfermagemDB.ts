
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { ProcessoEnfermagem, SessaoDeTrabalho } from '@/types/processoEnfermagem';
import { Paciente } from '@/types/paciente';

/**
 * Remove recursivamente todos os campos com valor `undefined` de um objeto antes
 * de enviá-lo ao Firestore, que rejeita qualquer campo undefined com erro silencioso.
 * Campos ausentes (chave não existe) são diferentes de `undefined` e são tratados corretamente.
 */
function sanitizarParaFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizarParaFirestore) as unknown as T;
  }
  if (obj instanceof Timestamp) return obj;
  if (typeof obj === 'object') {
    const limpo: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(obj as Record<string, unknown>)) {
      if (valor !== undefined) {
        limpo[chave] = sanitizarParaFirestore(valor);
      }
    }
    return limpo as T;
  }
  return obj;
}

export async function criarProcessoEnfermagem(
  pacienteId: string,
  enfermeiroId: string
): Promise<string> {
  try {
    const agora = Timestamp.now();
    const processoId = `processo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const novoProcesso = {
      idProcesso: processoId,
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

    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    await updateDoc(pacienteRef, {
      processosEnfermagem: arrayUnion(novoProcesso)
    });

    console.log('Processo criado com ID:', processoId);
    return processoId;
  } catch (error) {
    console.error('Erro ao criar processo:', error);
    throw error;
  }
}

export async function iniciarNovaSessao(
  pacienteId: string,
  processoId: string
): Promise<void> {
  try {
    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    const pacienteDoc = await getDoc(pacienteRef);

    if (!pacienteDoc.exists()) return;

    const dadosPaciente = pacienteDoc.data() as Paciente;
    const processos = dadosPaciente.processosEnfermagem || [];
    
    const processoIndex = processos.findIndex(p => p.idProcesso === processoId);
    if (processoIndex === -1) return;

    const processo = processos[processoIndex];
    const sessoes: SessaoDeTrabalho[] = Array.isArray(processo.sessoesDeTrabalho) ? [...processo.sessoesDeTrabalho] : [];

    const ultima = sessoes[sessoes.length - 1];
    if (ultima && !ultima.fimSessao) {
      console.log('Sessão já em andamento. Nova sessão não será iniciada.');
      return;
    }

    const novaSessao: SessaoDeTrabalho = { inicioSessao: Timestamp.now() };
    sessoes.push(novaSessao);

    processos[processoIndex] = {
      ...processo,
      sessoesDeTrabalho: sessoes,
    };

    await updateDoc(pacienteRef, {
      processosEnfermagem: processos,
    });

    console.log('Nova sessão iniciada');
  } catch (error) {
    console.error('Erro ao iniciar nova sessão:', error);
    throw error;
  }
}

export async function finalizarSessaoAtual(
  pacienteId: string,
  processoId: string
): Promise<void> {
  try {
    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    const pacienteDoc = await getDoc(pacienteRef);

    if (!pacienteDoc.exists()) return;

    const dadosPaciente = pacienteDoc.data() as Paciente;
    const processos = dadosPaciente.processosEnfermagem || [];
    
    const processoIndex = processos.findIndex(p => p.idProcesso === processoId);
    if (processoIndex === -1) return;

    const processo = processos[processoIndex];
    const sessoes: SessaoDeTrabalho[] = Array.isArray(processo.sessoesDeTrabalho) ? [...processo.sessoesDeTrabalho] : [];

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

      processos[processoIndex] = {
        ...processo,
        sessoesDeTrabalho: sessoes,
      };

      await updateDoc(pacienteRef, {
        processosEnfermagem: processos,
      });

      console.log('Sessão finalizada');
    } else {
      console.log('Nenhuma sessão aberta para finalizar.');
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
    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    const pacienteDoc = await getDoc(pacienteRef);

    if (!pacienteDoc.exists()) return null;

    const dadosPaciente = pacienteDoc.data() as Paciente;
    const processos = dadosPaciente.processosEnfermagem || [];

    const processoAtivo = processos.find(p => 
      p.status === 'em_andamento' && p.enfermeiroId === enfermeiroId
    );

    return processoAtivo ? {
      id: processoAtivo.idProcesso,
      ...processoAtivo
    } as ProcessoEnfermagem : null;
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
    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    const pacienteDoc = await getDoc(pacienteRef);

    if (!pacienteDoc.exists()) return false;

    const dadosPaciente = pacienteDoc.data() as Paciente;
    const processos = dadosPaciente.processosEnfermagem || [];

    return processos.some(p => 
      p.status === 'concluido' && p.enfermeiroId === enfermeiroId
    );
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
    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    const pacienteDoc = await getDoc(pacienteRef);

    if (!pacienteDoc.exists()) return [];

    const dadosPaciente = pacienteDoc.data() as Paciente;
    const processos = dadosPaciente.processosEnfermagem || [];

    const processosConcluidos = processos
      .filter(p => p.status === 'concluido' && p.enfermeiroId === enfermeiroId)
      .sort((a, b) => {
        const dataA = a.dataConclusao?.toDate() || new Date(0);
        const dataB = b.dataConclusao?.toDate() || new Date(0);
        return dataB.getTime() - dataA.getTime();
      })
      .map(p => ({
        id: p.idProcesso,
        ...p
      } as ProcessoEnfermagem));

    return processosConcluidos;
  } catch (error) {
    console.error('Erro ao buscar processos concluídos:', error);
    return [];
  }
}

export async function salvarProgressoProcesso(
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
    await finalizarSessaoAtual(pacienteId, processoId);

    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    const pacienteDoc = await getDoc(pacienteRef);

    if (!pacienteDoc.exists()) return;

    const dadosPaciente = pacienteDoc.data() as Paciente;
    const processos = dadosPaciente.processosEnfermagem || [];
    
    const processoIndex = processos.findIndex(p => p.idProcesso === processoId);
    if (processoIndex === -1) return;

    processos[processoIndex] = sanitizarParaFirestore({
      ...processos[processoIndex],
      etapaAtual,
      ...dadosEtapas,
    });

    await updateDoc(pacienteRef, {
      processosEnfermagem: processos,
    });

    console.log('Progresso salvo com sucesso');
  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
    throw error;
  }
}

export async function concluirProcesso(
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
    await finalizarSessaoAtual(pacienteId, processoId);

    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    const pacienteDoc = await getDoc(pacienteRef);

    if (!pacienteDoc.exists()) return;

    const dadosPaciente = pacienteDoc.data() as Paciente;
    const processos = dadosPaciente.processosEnfermagem || [];
    
    const processoIndex = processos.findIndex(p => p.idProcesso === processoId);
    if (processoIndex === -1) return;

    processos[processoIndex] = sanitizarParaFirestore({
      ...processos[processoIndex],
      status: 'concluido' as const,
      dataConclusao: Timestamp.now(),
      etapaAtual: 5,
      ...dadosEtapas,
    });

    await updateDoc(pacienteRef, {
      processosEnfermagem: processos,
    });

    console.log('Processo concluído com sucesso');
  } catch (error) {
    console.error('Erro ao concluir processo:', error);
    throw error;
  }
}

export async function excluirProcesso(
  pacienteId: string,
  processoId: string
): Promise<void> {
  try {
    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    const pacienteDoc = await getDoc(pacienteRef);

    if (!pacienteDoc.exists()) return;

    const dadosPaciente = pacienteDoc.data() as Paciente;
    const processos = dadosPaciente.processosEnfermagem || [];
    
    const processosAtualizados = processos.filter(p => p.idProcesso !== processoId);

    await updateDoc(pacienteRef, {
      processosEnfermagem: processosAtualizados,
    });

    console.log('Processo excluído com sucesso');
  } catch (error) {
    console.error('Erro ao excluir processo:', error);
    throw error;
  }
}

export async function buscarProcessoPorId(
  pacienteId: string,
  processoId: string
): Promise<ProcessoEnfermagem | null> {
  try {
    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    const pacienteDoc = await getDoc(pacienteRef);

    if (!pacienteDoc.exists()) return null;

    const dadosPaciente = pacienteDoc.data() as Paciente;
    const processos = dadosPaciente.processosEnfermagem || [];
    
    const processo = processos.find(p => p.idProcesso === processoId);

    return processo ? {
      id: processo.idProcesso,
      ...processo
    } as ProcessoEnfermagem : null;
  } catch (error) {
    console.error('Erro ao buscar processo por ID:', error);
    return null;
  }
}

// Funções simplificadas para estatísticas globais
export async function contarProcessosConcluidos(): Promise<number> {
  // Esta função agora seria mais complexa pois precisa iterar por todos os pacientes
  // Por simplicidade, retornamos 0 - pode ser implementada conforme necessário
  console.log('Função contarProcessosConcluidos precisa ser reimplementada para o novo modelo');
  return 0;
}

export async function contarTotalProcessos(): Promise<number> {
  // Esta função agora seria mais complexa pois precisa iterar por todos os pacientes
  // Por simplicidade, retornamos 0 - pode ser implementada conforme necessário
  console.log('Função contarTotalProcessos precisa ser reimplementada para o novo modelo');
  return 0;
}

// Função não necessária no novo modelo
export async function excluirProcessosPorPaciente(pacienteId: string): Promise<void> {
  // No novo modelo, os processos são excluídos automaticamente quando o paciente é excluído
  console.log('Processos serão excluídos automaticamente com o paciente');
}
