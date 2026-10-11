
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  getAggregateFromServer,
  sum,
  count
} from 'firebase/firestore';
import { db } from '../firebase';
import { Usuario } from '@/types/usuario';
import { agruparStatusCadastro, ordenarPerfisPorDataCadastro } from '@/utils/registrationData';

export interface UsuariosGestao {
  aguardando: Usuario[];
  aprovados: Usuario[];
  recusados: Usuario[];
  revogados: Usuario[];
}

export async function buscarUsuariosGestao(): Promise<UsuariosGestao> {
  try {
    const querySnapshot = await getDocs(collection(db, 'usuarios'));
    const usuarios: UsuariosGestao = { aguardando: [], aprovados: [], recusados: [], revogados: [] };

    querySnapshot.forEach((doc) => {
      const data = { ...doc.data(), id: doc.id } as Usuario;
      if ((data.statusAcesso || '').toLowerCase() === 'revogado') {
        usuarios.revogados.push(data);
        return;
      }
      const status = agruparStatusCadastro(data.statusAcesso);
      // Status ausentes/desconhecidos ficam visíveis para revisão manual;
      // isso não altera o status nem libera acesso automaticamente.
      if (status === 'Aguardando' || status === 'Status não identificado') usuarios.aguardando.push(data);
      else if (status === 'Liberado') usuarios.aprovados.push(data);
      else if (status === 'Recusado') usuarios.recusados.push(data);
    });

    return {
      aguardando: ordenarPerfisPorDataCadastro(usuarios.aguardando),
      aprovados: ordenarPerfisPorDataCadastro(usuarios.aprovados),
      recusados: ordenarPerfisPorDataCadastro(usuarios.recusados),
      revogados: ordenarPerfisPorDataCadastro(usuarios.revogados),
    };
  } catch (error) {
    console.error("Falha na leitura dos perfis da Gestão de Usuários.");
    throw error;
  }
}

export async function buscarUsuariosAguardando(): Promise<Usuario[]> {
  return (await buscarUsuariosGestao()).aguardando;
}

export async function buscarUsuariosAprovados(): Promise<Usuario[]> {
  return (await buscarUsuariosGestao()).aprovados;
}

export async function buscarUsuariosRecusados(): Promise<Usuario[]> {
  return (await buscarUsuariosGestao()).recusados;
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

export async function revogarAcessoUsuario(userId: string, revogadoPorUid: string): Promise<void> {
  if (!revogadoPorUid || userId === revogadoPorUid) {
    throw new Error('Não é permitido revogar a própria conta.');
  }

  try {
    const userRef = doc(db, 'usuarios', userId);
    const target = await getDoc(userRef);
    if (!target.exists()) throw new Error('Perfil não encontrado para revogação.');
    if (target.data().ehAdmin === true) {
      throw new Error('A revogação de uma conta administradora exige revisão assistida.');
    }
    await updateDoc(userRef, {
      statusAcesso: 'Revogado',
      dataRevogacao: serverTimestamp(),
      revogadoPorUid,
    });
  } catch (error) {
    console.error("Falha ao revogar acesso do usuário.");
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
        const processos: unknown[] = Array.isArray(data.processosEnfermagem) ? data.processosEnfermagem : [];
        processos.forEach((processo) => {
          if (typeof processo !== 'object' || processo === null || !('status' in processo)) return;
          if (processo.status === 'concluido') {
            concluidos++;
          } else if (processo.status === 'em_andamento') {
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
