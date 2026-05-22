
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  getAggregateFromServer,
  sum,
  count
} from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Usuario } from '@/types/usuario';

export async function buscarUsuariosAguardando(): Promise<Usuario[]> {
  try {
    const q = query(collection(db, 'usuarios'), orderBy('dataCadastro', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const usuarios: Usuario[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Usuario;
      const status = (data.statusAcesso || '').toLowerCase();
      // Capturar variantes de 'Aguardando'
      if (status === 'aguardando' || status === 'pendente' || status === '') {
        usuarios.push({ ...data, id: doc.id });
      }
    });
    
    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários aguardando:", error);
    return [];
  }
}

export async function buscarUsuariosAprovados(): Promise<Usuario[]> {
  try {
    const q = query(collection(db, 'usuarios'), orderBy('dataCadastro', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const usuarios: Usuario[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Usuario;
      const status = (data.statusAcesso || '').toLowerCase();
      // Capturar variantes de 'Liberado' ou 'Aprovado'
      if (status === 'liberado' || status === 'aprovado') {
        usuarios.push({ ...data, id: doc.id });
      }
    });
    
    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários aprovados:", error);
    return [];
  }
}

export async function buscarUsuariosRecusados(): Promise<Usuario[]> {
  try {
    const q = query(collection(db, 'usuarios'), orderBy('dataCadastro', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const usuarios: Usuario[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Usuario;
      const status = (data.statusAcesso || '').toLowerCase();
      // Capturar variantes de 'Recusado' ou 'Rejeitado'
      if (status === 'recusado' || status === 'rejeitado') {
        usuarios.push({ ...data, id: doc.id });
      }
    });
    
    return usuarios;
  } catch (error) {
    console.error("Erro ao buscar usuários recusados:", error);
    return [];
  }
}

export async function aprovarUsuario(
  userId: string, 
  isAdmin: boolean, 
  paginasPermitidas: string[] = []
): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    const updateData: Record<string, unknown> = {
      statusAcesso: 'Liberado',
      dataAprovacao: serverTimestamp(),
      ehAdmin: isAdmin,
      tipoUsuario: isAdmin ? 'Administrador' : 'Comum',
      paginasPermitidas: isAdmin ? [] : paginasPermitidas,
      gestorConteudos: !isAdmin && paginasPermitidas.includes('GestaoConteudos')
    };
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error("Erro ao aprovar usuário:", error);
    throw error;
  }
}

export async function editarPrivilegiosUsuario(
  userId: string,
  isAdmin: boolean,
  paginasPermitidas: string[] = []
): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    const updateData: Record<string, unknown> = {
      ehAdmin: isAdmin,
      tipoUsuario: isAdmin ? 'Administrador' : 'Comum',
      paginasPermitidas: isAdmin ? [] : paginasPermitidas,
      gestorConteudos: !isAdmin && paginasPermitidas.includes('GestaoConteudos'),
      dataAtualizacaoPrivilegios: serverTimestamp()
    };
    
    await updateDoc(userRef, updateData);
  } catch (error) {
    console.error("Erro ao editar privilégios do usuário:", error);
    throw error;
  }
}

export async function recusarUsuario(userId: string, motivo: string): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, {
      statusAcesso: 'Recusado',
      motivoRecusa: motivo,
      dataRecusa: serverTimestamp()
    });
  } catch (error) {
    console.error("Erro ao recusar usuário:", error);
    throw error;
  }
}

export async function restaurarUsuarioParaAguardando(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, {
      statusAcesso: 'Aguardando',
      dataRestauracao: serverTimestamp()
      // Mantemos o motivoRecusa anterior para histórico, se necessário consultar depois
    });
  } catch (error) {
    console.error("Erro ao restaurar usuário:", error);
    throw error;
  }
}

export async function excluirUsuario(userId: string, uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'usuarios', userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    throw error;
  }
}

export async function buscarEstatisticasGlobais(): Promise<{
  profissionaisAprovados: number;
  processosAndamento: number;
  processosConcluidos: number;
  totalAcessosPlataforma: number;
}> {
  try {
    let aprovados = 0;
    let totalAcessosPlataforma = 0;
    let andamento = 0;
    let concluidos = 0;

    // 1. Contar profissionais aprovados e somar acessos via Iteração Client-side (visto flutuação na base)
    try {
      const usuariosSnap = await getDocs(collection(db, 'usuarios'));
      
      usuariosSnap.forEach(doc => {
        const data = doc.data();
        const status = (data.statusAcesso || '').toLowerCase().trim();
        
        if (status === 'aprovado' || status === 'liberado') {
          aprovados++;
          totalAcessosPlataforma += (data.totalAcessos || 0);
        }
      });
    } catch (userError) {
      console.error("Erro ao iterar usuários globais:", userError);
    }

    // 2. Contar processos globalmente (estritamente global, sem uid)
    try {
      const processosSnap = await getDocs(collection(db, 'pacientesProcessoEnfermagem'));
      
      processosSnap.forEach(doc => {
        const data = doc.data();
        const processos = data.processosEnfermagem || [];
        processos.forEach((p: any) => {
          if (p.status === 'concluido') {
            concluidos++;
          } else if (p.status === 'em_andamento') {
            andamento++;
          }
        });
      });
    } catch (procError) {
      console.error("Erro na busca global de processos:", procError);
    }

    return {
      profissionaisAprovados: aprovados,
      processosAndamento: andamento,
      processosConcluidos: concluidos,
      totalAcessosPlataforma
    };
  } catch (error) {
    console.error("Erro critico ao buscar estatísticas globais:", error);
    return {
      profissionaisAprovados: 0,
      processosAndamento: 0,
      processosConcluidos: 0,
      totalAcessosPlataforma: 0
    };
  }
}
