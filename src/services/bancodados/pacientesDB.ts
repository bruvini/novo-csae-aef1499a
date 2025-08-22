import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Paciente, StatusPaciente, IndicadoresPacientes } from '@/types/paciente';

export async function cadastrarPaciente(
  nomeCompleto: string,
  dataNascimento: Date,
  sexo: 'Feminino' | 'Masculino',
  uidUsuario: string,
  idUsuario?: string
): Promise<void> {
  try {
    // Verificar se já existe paciente com mesmo nome e data de nascimento
    const dataNascimentoTimestamp = Timestamp.fromDate(dataNascimento);
    
    const q = query(
      collection(db, 'pacientesProcessoEnfermagem'),
      where('uidUsuario', '==', uidUsuario),
      where('nomeCompleto', '==', nomeCompleto),
      where('dataNascimento', '==', dataNascimentoTimestamp)
    );
    
    const existingPatients = await getDocs(q);
    
    if (!existingPatients.empty) {
      throw new Error('Já existe um paciente cadastrado com este nome e data de nascimento.');
    }

    const pacienteData: Omit<Paciente, 'id'> = {
      nomeCompleto,
      dataNascimento: dataNascimentoTimestamp,
      sexo,
      dataCadastro: serverTimestamp() as Timestamp,
      uidUsuario,
      idUsuario,
      processosEnfermagem: []
    };

    await addDoc(collection(db, 'pacientesProcessoEnfermagem'), pacienteData);
    console.log('Paciente cadastrado com sucesso');
  } catch (error) {
    console.error('Erro ao cadastrar paciente:', error);
    throw error;
  }
}

export async function atualizarPaciente(
  pacienteId: string,
  dadosAtualizados: {
    nomeCompleto: string;
    dataNascimento: Date;
    sexo: 'Feminino' | 'Masculino';
  },
  uidUsuario: string
): Promise<void> {
  try {
    const dataNascimentoTimestamp = Timestamp.fromDate(dadosAtualizados.dataNascimento);
    
    // Verificar se já existe outro paciente com mesmo nome e data de nascimento
    const q = query(
      collection(db, 'pacientesProcessoEnfermagem'),
      where('uidUsuario', '==', uidUsuario),
      where('nomeCompleto', '==', dadosAtualizados.nomeCompleto),
      where('dataNascimento', '==', dataNascimentoTimestamp)
    );
    
    const existingPatients = await getDocs(q);
    
    // Verificar se existe outro paciente com os mesmos dados (excluindo o atual)
    const otherPatient = existingPatients.docs.find(doc => doc.id !== pacienteId);
    if (otherPatient) {
      throw new Error('Já existe outro paciente cadastrado com este nome e data de nascimento.');
    }

    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    await updateDoc(pacienteRef, {
      nomeCompleto: dadosAtualizados.nomeCompleto,
      dataNascimento: dataNascimentoTimestamp,
      sexo: dadosAtualizados.sexo
    });

    console.log('Paciente atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    throw error;
  }
}

export async function excluirPaciente(pacienteId: string): Promise<void> {
  try {
    // Primeiro, excluir todos os processos de enfermagem associados
    const { excluirProcessosPorPaciente } = await import('./processosEnfermagemDB');
    await excluirProcessosPorPaciente(pacienteId);

    // Depois, excluir o paciente
    const pacienteRef = doc(db, 'pacientesProcessoEnfermagem', pacienteId);
    await deleteDoc(pacienteRef);

    console.log('Paciente excluído com sucesso');
  } catch (error) {
    console.error('Erro ao excluir paciente:', error);
    throw error;
  }
}

export async function buscarPacientesUsuario(uidUsuario: string): Promise<Paciente[]> {
  try {
    const q = query(
      collection(db, 'pacientesProcessoEnfermagem'),
      where('uidUsuario', '==', uidUsuario),
      orderBy('dataCadastro', 'desc')
    );

    const querySnapshot = await getDocs(q);
    
    const pacientes: Paciente[] = [];
    querySnapshot.forEach((doc) => {
      pacientes.push({
        id: doc.id,
        ...doc.data() as Omit<Paciente, 'id'>
      });
    });

    return pacientes;
  } catch (error) {
    console.error('Erro ao buscar pacientes:', error);
    return [];
  }
}

export async function buscarPacientesPorEnfermeiro(uidUsuario: string): Promise<Paciente[]> {
  return buscarPacientesUsuario(uidUsuario);
}

export function determinarStatusPaciente(paciente: Paciente): StatusPaciente {
  const { processosEnfermagem } = paciente;

  if (!processosEnfermagem || processosEnfermagem.length === 0) {
    return 'Sem processo iniciado';
  }

  const temProcessoEmAndamento = processosEnfermagem.some(
    processo => processo.statusProcesso === 'Em andamento'
  );

  if (temProcessoEmAndamento) {
    return 'Em andamento';
  }

  // Se não tem processo em andamento mas tem processos, todos devem estar concluídos
  return 'Concluído';
}

export async function calcularIndicadoresComProcessos(pacientes: Paciente[], uidUsuario: string): Promise<IndicadoresPacientes> {
  const totalPacientes = pacientes.length;
  
  let processosAtivos = 0;
  let totalProcessosConcluidos = 0;

  // Importar funções do novo serviço
  const { buscarProcessoAtivo, buscarProcessoConcluido } = await import('./processosEnfermagemDB');

  // Verificar processos reais no Firestore para cada paciente
  for (const paciente of pacientes) {
    if (paciente.id) {
      try {
        // Verificar processo ativo
        const processoAtivo = await buscarProcessoAtivo(paciente.id, uidUsuario);
        if (processoAtivo) {
          processosAtivos++;
        } else {
          // Verificar se tem processo concluído
          const temProcessoConcluido = await buscarProcessoConcluido(paciente.id, uidUsuario);
          if (temProcessoConcluido) {
            totalProcessosConcluidos++;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar processos do paciente:', error);
      }
    }
  }

  return {
    totalPacientes,
    processosAtivos,
    totalProcessosConcluidos
  };
}

export async function calcularIndicadoresExpandidos(pacientes: Paciente[], uidUsuario: string): Promise<IndicadoresPacientes & { processosConcluidos: number; mediaProcessosPorPaciente: number }> {
  const totalPacientes = pacientes.length;
  
  // Importar as novas funções
  const { buscarProcessoAtivo, contarProcessosConcluidos, contarTotalProcessos } = await import('./processosEnfermagemDB');
  
  let processosAtivos = 0;
  
  // Contar processos ativos verificando cada paciente
  for (const paciente of pacientes) {
    if (paciente.id) {
      try {
        const processoAtivo = await buscarProcessoAtivo(paciente.id, uidUsuario);
        if (processoAtivo) {
          processosAtivos++;
        }
      } catch (error) {
        console.error('Erro ao verificar processos do paciente:', error);
      }
    }
  }
  
  // Buscar processos concluídos e total
  const processosConcluidos = await contarProcessosConcluidos();
  const totalProcessos = await contarTotalProcessos();
  
  // Calcular média de processos por paciente
  const mediaProcessosPorPaciente = totalPacientes > 0 ? 
    Math.round((totalProcessos / totalPacientes) * 10) / 10 : 0;

  return {
    totalPacientes,
    processosAtivos,
    totalProcessosConcluidos: processosConcluidos, // Mantém compatibilidade
    processosConcluidos, // Nova métrica específica
    mediaProcessosPorPaciente
  };
}

// Manter função original para compatibilidade
export function calcularIndicadores(pacientes: Paciente[]): IndicadoresPacientes {
  const totalPacientes = pacientes.length;
  
  let processosAtivos = 0;
  let totalProcessosConcluidos = 0;

  pacientes.forEach(paciente => {
    const { processosEnfermagem } = paciente;
    
    if (processosEnfermagem && processosEnfermagem.length > 0) {
      const temProcessoAtivo = processosEnfermagem.some(
        processo => processo.statusProcesso === 'Em andamento'
      );
      
      if (temProcessoAtivo) {
        processosAtivos++;
      }

      const processosConcluidos = processosEnfermagem.filter(
        processo => processo.statusProcesso === 'Concluído'
      );
      
      totalProcessosConcluidos += processosConcluidos.length;
    }
  });

  return {
    totalPacientes,
    processosAtivos,
    totalProcessosConcluidos
  };
}
