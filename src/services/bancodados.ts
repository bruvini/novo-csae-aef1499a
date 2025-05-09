import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
  doc,
  getDoc,
  DocumentSnapshot,
  Timestamp,
  FieldValue,
  updateDoc, 
  deleteDoc, 
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { SinalVital, ExameLaboratorial, SistemaCorporal, RevisaoSistema } from '../types';

export interface DadosPessoais {
  nomeCompleto: string;
  rg: string;
  cpf: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  lotacao?: string;
  matricula?: string;
  observacoes?: string;
}

export interface DadosProfissionais {
  formacao: 'Enfermeiro' | 'Residente de Enfermagem' | 'Técnico de Enfermagem' | 'Acadêmico de Enfermagem';
  numeroCoren?: string;
  ufCoren?: string;
  dataInicioResidencia?: string;
  iesEnfermagem?: string;
  atuaSMS: boolean;
  lotacao?: string;
  matricula?: string;
  cidadeTrabalho?: string;
  localCargo?: string;
}

export interface Log {
  usuario_afetado: string;
  acao: "aprovado" | "recusado" | "revogado" | "reativado" | "excluído";
  quem_realizou: string;
  data_hora: Timestamp;
  justificativa?: string;
}

export interface Usuario {
  dadosPessoais: DadosPessoais;
  dadosProfissionais: DadosProfissionais;
  email: string;
  uid: string;
  dataCadastro: Timestamp;
  statusAcesso: 'Aguardando' | 'Aprovado' | 'Negado' | 'Revogado' | 'Cancelado';
  tipoUsuario?: 'Administrador' | 'Comum';
  dataAprovacao?: Timestamp;
  dataRevogacao?: Timestamp;
  motivoRevogacao?: string;
  dataUltimoAcesso?: Timestamp;
  historico_logs?: Log[];
  id?: string;
}

export interface Paciente {
  id?: string;
  nomeCompleto: string;
  dataNascimento: Timestamp;
  idade: number;
  sexo: 'Masculino' | 'Feminino' | 'Outro';
  profissionalUid: string;
  profissionalNome: string;
  dataCadastro: Timestamp;
  dataAtualizacao?: Timestamp;
  evolucoes?: Evolucao[];
}

export interface Evolucao {
  id?: string;
  dataInicio: Timestamp;
  dataAtualizacao: Timestamp | FieldValue;
  dataConclusao?: Timestamp | FieldValue;
  statusConclusao: 'Em andamento' | 'Interrompido' | 'Concluído';
  avaliacao?: string;
  diagnosticos?: DiagnosticoEnfermagem[];
  planejamento?: Planejamento[];
  implementacao?: Implementacao[];
  evolucaoFinal?: string;
}

export interface DiagnosticoEnfermagem {
  id: string;
  descricao: string;
  selecionado: boolean;
}

export interface Planejamento {
  diagnosticoId: string;
  resultadoEsperado: string;
  intervencoes: string[];
}

export interface Implementacao {
  intervencaoId: string;
  responsavel: string;
  status: 'Pendente' | 'Em andamento' | 'Concluído';
  observacoes?: string;
}

export async function verificarUsuarioExistente(email: string, numeroCoren?: string, ufCoren?: string, matricula?: string): Promise<boolean> {
  const verificacoes = [];

  // Verificar e-mail
  const emailQuery = query(collection(db, 'usuarios'), where('email', '==', email));
  verificacoes.push(getDocs(emailQuery));
  
  // Verificar COREN se fornecido
  if (numeroCoren && ufCoren) {
    const corenQuery = query(
      collection(db, 'usuarios'),
      where('dadosProfissionais.numeroCoren', '==', numeroCoren),
      where('dadosProfissionais.ufCoren', '==', ufCoren)
    );
    verificacoes.push(getDocs(corenQuery));
  }

  // Verificar matrícula se fornecida
  if (matricula) {
    const matriculaQuery = query(
      collection(db, 'usuarios'),
      where('dadosProfissionais.matricula', '==', matricula)
    );
    verificacoes.push(getDocs(matriculaQuery));
  }

  // Executar todas as verificações
  const resultados = await Promise.all(verificacoes);
  
  // Verificar se alguma consulta retornou resultados
  return resultados.some((querySnapshot: QuerySnapshot<DocumentData>) => !querySnapshot.empty);
}

export async function cadastrarUsuario(usuario: Omit<Usuario, 'dataCadastro' | 'statusAcesso'>): Promise<string> {
  const usuarioCompleto = {
    ...usuario,
    dataCadastro: serverTimestamp(),
    statusAcesso: 'Aguardando' as const
  };

  const docRef = await addDoc(collection(db, 'usuarios'), usuarioCompleto);
  return docRef.id;
}

export async function buscarUsuarioPorUid(uid: string): Promise<Usuario | null> {
  try {
    // Buscar pelo uid nos documentos da coleção usuarios
    const q = query(collection(db, 'usuarios'), where('uid', '==', uid));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Retornar o primeiro documento encontrado (deve ser único)
    const docData = querySnapshot.docs[0].data();
    const userId = querySnapshot.docs[0].id;
    
    // Conversão segura usando o operador spread para garantir que todos os campos estejam presentes
    const usuario: Usuario = {
      ...docData as Omit<Usuario, 'id'>,
      id: userId
    };
    
    return usuario;
  } catch (error) {
    console.error("Erro ao buscar usuário por uid:", error);
    return null;
  }
}

// Funções para gerenciar pacientes
export async function cadastrarPaciente(paciente: Omit<Paciente, 'dataCadastro'>): Promise<string> {
  const pacienteCompleto = {
    ...paciente,
    dataCadastro: serverTimestamp(),
    dataAtualizacao: serverTimestamp(),
    evolucoes: []
  };

  const docRef = await addDoc(collection(db, 'pacientes'), pacienteCompleto);
  return docRef.id;
}

export async function buscarPacientesPorProfissional(uidProfissional: string): Promise<Paciente[]> {
  try {
    const q = query(collection(db, 'pacientes'), where('profissionalUid', '==', uidProfissional));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const pacientes: Paciente[] = querySnapshot.docs.map(doc => {
      return {
        ...doc.data() as Omit<Paciente, 'id'>,
        id: doc.id
      };
    });
    
    return pacientes;
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return [];
  }
}

export async function atualizarPaciente(id: string, dadosAtualizados: Partial<Paciente>): Promise<boolean> {
  try {
    const pacienteRef = doc(db, 'pacientes', id);
    await updateDoc(pacienteRef, {
      ...dadosAtualizados,
      dataAtualizacao: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error);
    return false;
  }
}

export async function excluirPaciente(id: string): Promise<boolean> {
  try {
    const pacienteRef = doc(db, 'pacientes', id);
    await deleteDoc(pacienteRef);
    return true;
  } catch (error) {
    console.error("Erro ao excluir paciente:", error);
    return false;
  }
}

// Funções para gerenciar evoluções
export async function iniciarEvolucao(pacienteId: string, evolucao: Omit<Evolucao, 'dataInicio' | 'dataAtualizacao' | 'statusConclusao'>): Promise<boolean> {
  try {
    const pacienteRef = doc(db, 'pacientes', pacienteId);
    const pacienteSnap = await getDoc(pacienteRef);
    
    if (!pacienteSnap.exists()) {
      return false;
    }
    
    const pacienteData = pacienteSnap.data() as Paciente;
    const evolucoes = pacienteData.evolucoes || [];
    
    // Verificar se já existe evolução em aberto
    const evolucaoAberta = evolucoes.some(e => 
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
    
    const pacienteData = pacienteSnap.data() as Paciente;
    const evolucoes = pacienteData.evolucoes || [];
    
    const evolucaoIndex = evolucoes.findIndex(e => e.id === evolucaoId);
    
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
    
    const pacienteData = pacienteSnap.data() as Paciente;
    const evolucoes = pacienteData.evolucoes || [];
    
    const evolucaoIndex = evolucoes.findIndex(e => e.id === evolucaoId);
    
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

// Funções para buscar dados de gerenciamento para o processo de enfermagem
export async function buscarSinaisVitais(): Promise<SinalVital[]> {
  try {
    const sinaisVitaisRef = collection(db, 'sinaisVitais');
    const querySnapshot = await getDocs(sinaisVitaisRef);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const sinaisVitais: SinalVital[] = querySnapshot.docs.map(doc => {
      return {
        ...doc.data() as Omit<SinalVital, 'id'>,
        id: doc.id
      };
    });
    
    return sinaisVitais;
  } catch (error) {
    console.error("Erro ao buscar sinais vitais:", error);
    return [];
  }
}

export async function buscarExamesLaboratoriais(): Promise<ExameLaboratorial[]> {
  try {
    const examesRef = collection(db, 'examesLaboratoriais');
    const querySnapshot = await getDocs(examesRef);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const exames: ExameLaboratorial[] = querySnapshot.docs.map(doc => {
      return {
        ...doc.data() as Omit<ExameLaboratorial, 'id'>,
        id: doc.id
      };
    });
    
    return exames;
  } catch (error) {
    console.error("Erro ao buscar exames laboratoriais:", error);
    return [];
  }
}

export async function buscarSistemasCorporais(): Promise<SistemaCorporal[]> {
  try {
    const sistemasRef = collection(db, 'sistemasCorporais');
    const querySnapshot = await getDocs(sistemasRef);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const sistemas: SistemaCorporal[] = querySnapshot.docs.map(doc => {
      return {
        ...doc.data() as Omit<SistemaCorporal, 'id'>,
        id: doc.id
      };
    });
    
    return sistemas;
  } catch (error) {
    console.error("Erro ao buscar sistemas corporais:", error);
    return [];
  }
}

export async function buscarRevisoesSistemas(): Promise<RevisaoSistema[]> {
  try {
    const revisoesRef = collection(db, 'revisoesSistemas');
    const querySnapshot = await getDocs(revisoesRef);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const revisoes: RevisaoSistema[] = querySnapshot.docs.map(doc => {
      return {
        ...doc.data() as Omit<RevisaoSistema, 'id'>,
        id: doc.id
      };
    });
    
    return revisoes;
  } catch (error) {
    console.error("Erro ao buscar revisões de sistemas:", error);
    return [];
  }
}
