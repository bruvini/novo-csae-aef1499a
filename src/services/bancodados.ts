
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
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

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

export interface Usuario {
  dadosPessoais: DadosPessoais;
  dadosProfissionais: DadosProfissionais;
  email: string;
  uid: string;
  dataCadastro: any;
  statusAcesso: 'Aguardando' | 'Aprovado' | 'Negado' | 'Revogado' | 'Cancelado';
  tipoUsuario?: 'Administrador' | 'Comum';
  dataAprovacao?: any;
  dataRevogacao?: any;
  motivoRevogacao?: string;
  dataUltimoAcesso?: any;
  historico_logs?: Array<{
    usuario_afetado: string;
    acao: "aprovado" | "recusado" | "revogado" | "reativado" | "excluído";
    quem_realizou: string;
    data_hora: any;
    justificativa?: string;
  }>;
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
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Usuario;
  } catch (error) {
    console.error("Erro ao buscar usuário por uid:", error);
    return null;
  }
}

