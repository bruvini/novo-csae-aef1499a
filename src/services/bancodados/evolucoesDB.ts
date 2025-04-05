
import { 
  doc, 
  updateDoc, 
  arrayUnion,
  getDoc,
  Timestamp,
  arrayRemove,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Evolucao } from './tipos';

/**
 * Inicia uma nova evolução para o paciente
 * @param pacienteId ID do paciente
 * @param evolucaoData Dados opcionais para inicialização da evolução
 * @returns Objeto contendo o ID da evolução e sucesso da operação
 */
export async function iniciarEvolucao(pacienteId: string, evolucaoData: Partial<Evolucao> = {}): Promise<{evolucaoId: string, sucesso: boolean}> {
  try {
    console.log("Iniciando evolução para paciente ID:", pacienteId);
    const pacienteRef = doc(db, 'pacientes', pacienteId);
    
    // Verificar se o paciente existe
    const docSnap = await getDoc(pacienteRef);
    if (!docSnap.exists()) {
      console.error("Paciente não encontrado com ID:", pacienteId);
      return { evolucaoId: "", sucesso: false };
    }
    
    // Gerar ID único para a evolução (timestamp + random)
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    const evolucaoId = `evolucao_${timestamp}_${random}`;
    
    // Criar nova evolução
    const novaEvolucao: Evolucao = {
      id: evolucaoId,
      dataInicio: Timestamp.now(),
      dataAtualizacao: Timestamp.now(),
      statusConclusao: 'Em andamento',
      avaliacao: '',
      diagnosticos: [],
      planejamento: [],
      implementacao: [],
      evolucaoFinal: '',
      ...evolucaoData
    };
    
    // Adicionar evolução ao array de evoluções do paciente
    await updateDoc(pacienteRef, {
      evolucoes: arrayUnion(novaEvolucao)
    });
    
    console.log("Evolução iniciada com sucesso. ID:", evolucaoId);
    return { evolucaoId, sucesso: true };
  } catch (error) {
    console.error("Erro ao iniciar evolução:", error);
    return { evolucaoId: "", sucesso: false };
  }
}

/**
 * Salva o progresso de uma evolução em andamento
 * @param pacienteId ID do paciente
 * @param evolucaoId ID da evolução
 * @param dadosAtualizados Dados parciais da evolução para atualização
 * @returns Sucesso da operação
 */
export async function salvarProgressoEvolucao(
  pacienteId: string, 
  evolucaoId: string, 
  dadosAtualizados: Partial<Evolucao>
): Promise<boolean> {
  try {
    console.log("Salvando progresso da evolução:", { pacienteId, evolucaoId });
    
    if (!evolucaoId) {
      console.error("ID de evolução não informado");
      return false;
    }
    
    const pacienteRef = doc(db, 'pacientes', pacienteId);
    
    // Buscar paciente para encontrar a evolução atual
    const docSnap = await getDoc(pacienteRef);
    if (!docSnap.exists()) {
      console.error("Paciente não encontrado com ID:", pacienteId);
      return false;
    }
    
    const pacienteData = docSnap.data();
    const evolucoes = pacienteData.evolucoes || [];
    
    // Encontrar o índice da evolução que está sendo atualizada
    const evolucaoIndex = evolucoes.findIndex((e: Evolucao) => e.id === evolucaoId);
    
    if (evolucaoIndex === -1) {
      console.error("Evolução não encontrada com ID:", evolucaoId);
      return false;
    }
    
    // Remover a evolução antiga
    const evolucaoAntiga = evolucoes[evolucaoIndex];
    await updateDoc(pacienteRef, {
      evolucoes: arrayRemove(evolucaoAntiga)
    });
    
    // Criar evolução atualizada
    const evolucaoAtualizada = {
      ...evolucaoAntiga,
      ...dadosAtualizados,
      dataAtualizacao: Timestamp.now()
    };
    
    // Adicionar evolução atualizada
    await updateDoc(pacienteRef, {
      evolucoes: arrayUnion(evolucaoAtualizada)
    });
    
    console.log("Progresso da evolução salvo com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao salvar progresso da evolução:", error);
    return false;
  }
}

/**
 * Finaliza uma evolução em andamento
 * @param pacienteId ID do paciente
 * @param evolucaoId ID da evolução
 * @param dadosFinais Dados finais da evolução
 * @param statusFinal Status final da evolução (Concluído ou Interrompido)
 * @returns Sucesso da operação
 */
export async function finalizarEvolucao(
  pacienteId: string, 
  evolucaoId: string, 
  dadosFinais: Partial<Evolucao>,
  statusFinal: 'Concluído' | 'Interrompido' = 'Concluído'
): Promise<boolean> {
  try {
    console.log("Finalizando evolução:", { pacienteId, evolucaoId, statusFinal });
    
    if (!evolucaoId) {
      console.error("ID de evolução não informado");
      return false;
    }
    
    const pacienteRef = doc(db, 'pacientes', pacienteId);
    
    // Buscar paciente para encontrar a evolução atual
    const docSnap = await getDoc(pacienteRef);
    if (!docSnap.exists()) {
      console.error("Paciente não encontrado com ID:", pacienteId);
      return false;
    }
    
    const pacienteData = docSnap.data();
    const evolucoes = pacienteData.evolucoes || [];
    
    // Encontrar o índice da evolução que está sendo finalizada
    const evolucaoIndex = evolucoes.findIndex((e: Evolucao) => e.id === evolucaoId);
    
    if (evolucaoIndex === -1) {
      console.error("Evolução não encontrada com ID:", evolucaoId);
      return false;
    }
    
    // Remover a evolução antiga
    const evolucaoAntiga = evolucoes[evolucaoIndex];
    await updateDoc(pacienteRef, {
      evolucoes: arrayRemove(evolucaoAntiga)
    });
    
    // Criar evolução finalizada
    const evolucaoFinalizada = {
      ...evolucaoAntiga,
      ...dadosFinais,
      statusConclusao: statusFinal,
      dataConclusao: Timestamp.now(),
      dataAtualizacao: Timestamp.now()
    };
    
    // Adicionar evolução finalizada
    await updateDoc(pacienteRef, {
      evolucoes: arrayUnion(evolucaoFinalizada)
    });
    
    console.log("Evolução finalizada com sucesso");
    return true;
  } catch (error) {
    console.error("Erro ao finalizar evolução:", error);
    return false;
  }
}
