
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
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
