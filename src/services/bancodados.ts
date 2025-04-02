
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  DocumentData,
  QuerySnapshot
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
  statusAcesso: 'Aguardando' | 'Aprovado' | 'Negado';
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
    statusAcesso: 'Aguardando'
  };

  const docRef = await addDoc(collection(db, 'usuarios'), usuarioCompleto);
  return docRef.id;
}
