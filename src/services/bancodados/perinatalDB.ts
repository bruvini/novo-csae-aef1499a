import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc, 
  Timestamp, 
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns'; 
import { 
  PacientePerinatal,
  ConsultaPreNatal, 
  ConsultaPuerperio, 
  ConsultaPuericultura 
} from '../../types/perinatal';
import { castFieldValueToTimestamp } from '../../utils/firebaseHelpers';

// Função para cadastrar novo paciente perinatal
export async function cadastrarPacientePerinatal(paciente: Omit<PacientePerinatal, 'dataCadastro' | 'dataAtualizacao'>): Promise<string> {
  try {
    const pacienteCompleto = {
      ...paciente,
      dataCadastro: serverTimestamp(),
      dataAtualizacao: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'cuidadoPerinatal'), pacienteCompleto);
    return docRef.id;
  } catch (error) {
    console.error("Erro ao cadastrar paciente perinatal:", error);
    throw error;
  }
}

// Função para buscar pacientes perinatais de um profissional
export async function buscarPacientesPerinatalPorProfissional(uidProfissional: string): Promise<PacientePerinatal[]> {
  try {
    const q = query(
      collection(db, 'cuidadoPerinatal'),
      where('profissionalUid', '==', uidProfissional),
      orderBy('dataAtualizacao', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const pacientes: PacientePerinatal[] = [];
    querySnapshot.forEach((doc) => {
      pacientes.push({ id: doc.id, ...doc.data() as Omit<PacientePerinatal, 'id'> });
    });
    
    return pacientes;
  } catch (error) {
    console.error("Erro ao buscar pacientes perinatais:", error);
    return [];
  }
}

// Função para atualizar paciente perinatal
export async function atualizarPacientePerinatal(id: string, dadosAtualizados: Partial<PacientePerinatal>): Promise<boolean> {
  try {
    const pacienteRef = doc(db, 'cuidadoPerinatal', id);
    await updateDoc(pacienteRef, {
      ...dadosAtualizados,
      dataAtualizacao: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar paciente perinatal:", error);
    return false;
  }
}

// Função para excluir paciente perinatal
export async function excluirPacientePerinatal(id: string): Promise<boolean> {
  try {
    const pacienteRef = doc(db, 'cuidadoPerinatal', id);
    await deleteDoc(pacienteRef);
    return true;
  } catch (error) {
    console.error("Erro ao excluir paciente perinatal:", error);
    return false;
  }
}

// Função para buscar um paciente específico
export async function buscarPacientePerinatalPorId(id: string): Promise<PacientePerinatal | null> {
  try {
    const docRef = doc(db, 'cuidadoPerinatal', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const pacienteData = docSnap.data();
    return { id: docSnap.id, ...pacienteData } as PacientePerinatal;
  } catch (error) {
    console.error("Erro ao buscar paciente por ID:", error);
    return null;
  }
}

// Função para registrar consulta de pré-natal
export async function registrarConsultaPreNatal(consulta: Omit<ConsultaPreNatal, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'consultasPreNatal'), {
      ...consulta,
      dataConsulta: consulta.dataConsulta || Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao registrar consulta de pré-natal:", error);
    throw error;
  }
}

// Função para buscar consultas de pré-natal de um paciente
export async function buscarConsultasPreNatalPorPaciente(pacienteId: string): Promise<ConsultaPreNatal[]> {
  try {
    const q = query(
      collection(db, 'consultasPreNatal'),
      where('pacienteId', '==', pacienteId),
      orderBy('dataConsulta', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const consultas: ConsultaPreNatal[] = [];
    querySnapshot.forEach((doc) => {
      consultas.push({ id: doc.id, ...doc.data() as Omit<ConsultaPreNatal, 'id'> });
    });
    
    return consultas;
  } catch (error) {
    console.error("Erro ao buscar consultas de pré-natal:", error);
    return [];
  }
}

// Função para registrar consulta de puerpério
export async function registrarConsultaPuerperio(consulta: Omit<ConsultaPuerperio, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'consultasPuerperio'), {
      ...consulta,
      dataConsulta: consulta.dataConsulta || Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao registrar consulta de puerpério:", error);
    throw error;
  }
}

// Função para buscar consultas de puerpério de um paciente
export async function buscarConsultasPuerperioPorPaciente(pacienteId: string): Promise<ConsultaPuerperio[]> {
  try {
    const q = query(
      collection(db, 'consultasPuerperio'),
      where('pacienteId', '==', pacienteId),
      orderBy('dataConsulta', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const consultas: ConsultaPuerperio[] = [];
    querySnapshot.forEach((doc) => {
      consultas.push({ id: doc.id, ...doc.data() as Omit<ConsultaPuerperio, 'id'> });
    });
    
    return consultas;
  } catch (error) {
    console.error("Erro ao buscar consultas de puerpério:", error);
    return [];
  }
}

// Função para registrar consulta de puericultura
export async function registrarConsultaPuericultura(consulta: Omit<ConsultaPuericultura, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'consultasPuericultura'), {
      ...consulta,
      dataConsulta: consulta.dataConsulta || Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Erro ao registrar consulta de puericultura:", error);
    throw error;
  }
}

// Função para buscar consultas de puericultura de um paciente
export async function buscarConsultasPuericulturaPorPaciente(pacienteId: string): Promise<ConsultaPuericultura[]> {
  try {
    const q = query(
      collection(db, 'consultasPuericultura'),
      where('pacienteId', '==', pacienteId),
      orderBy('dataConsulta', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const consultas: ConsultaPuericultura[] = [];
    querySnapshot.forEach((doc) => {
      consultas.push({ id: doc.id, ...doc.data() as Omit<ConsultaPuericultura, 'id'> });
    });
    
    return consultas;
  } catch (error) {
    console.error("Erro ao buscar consultas de puericultura:", error);
    return [];
  }
}

// Função para registrar nascimento de bebê a partir de um parto
export async function registrarNascimentoBebe(
  nomeBebe: string, 
  dataNascimento: Timestamp, 
  idadeGestacionalNascer: number,
  dadosMae: PacientePerinatal
): Promise<string> {
  try {
    // Criar o bebê
    const bebePaciente: Omit<PacientePerinatal, "dataCadastro" | "dataAtualizacao"> = {
      tipoPaciente: "bebê",
      nome: nomeBebe,
      dataNascimento,
      nomeMae: dadosMae.nome,
      idadeGestacionalNascer,
      prematuro: idadeGestacionalNascer < 37,
      titulo: `Puericultura - ${nomeBebe}`,
      descricao: `Acompanhamento de puericultura iniciado em ${format(new Date(), "dd/MM/yyyy")}`,
      profissionalUid: dadosMae.profissionalUid,
      profissionalNome: dadosMae.profissionalNome,
      // Add required fields
      cpf: '',
      cns: '',
      telefone: '',
      endereco: '',
      unidade: dadosMae.unidade || '',
      municipio: dadosMae.municipio || '',
      microarea: dadosMae.microarea || '',
      agenteSaude: dadosMae.agenteSaude || '',
      dataUltimaMenstruacao: null,
      dataProvavelParto: null,
      idadeGestacional: 0,
      ativo: true,
      situacao: 'puericultura',
    };

    const bebeId = await cadastrarPacientePerinatal(bebePaciente);
    return bebeId;
  } catch (error) {
    console.error("Erro ao registrar nascimento de bebê:", error);
    throw error;
  }
}
