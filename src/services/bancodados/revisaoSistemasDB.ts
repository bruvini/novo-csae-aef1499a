
import { 
  collection, 
  query, 
  orderBy, 
  getDocs,
  getDoc, 
  doc, 
  addDoc,
  updateDoc, 
  onSnapshot,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { normalizarNomeClinico } from '@/utils/referenciasClinicas';
import { validarAtualizacaoSistema } from '@/utils/protecaoCatalogoHistorico';

export interface OpcaoAchado {
  textoOpcao: string;
  ehAlteracao?: boolean;
  nomeAlteracao?: string;
  subconjuntoNHBVinculado?: string;
  exigeDescricao?: boolean;
}

export interface Achado {
  idadeMinima: number | null;
  idadeMaxima: number | null;
  idadeUnidade: 'dias' | 'meses' | 'anos' | '';
  criterioSexo: 'Masculino' | 'Feminino' | 'Ambos';
  descricaoAchado: string;
  ehAlteracao?: boolean;
  nomeAlteracao: string;
  subconjuntoNHBVinculado: string;
  dicaAchado?: string;
  exigeDescricao?: boolean;
  tipoAchado?: 'simples' | 'opcoes';
  opcoes?: OpcaoAchado[];
}

export interface ExamePropedeutico {
  nomeExame: string;
  propedeutica: string;
  achados: Achado[];
}

export interface SistemaCorporal {
  id: string;
  nomeSistema: string;
  descricaoSistema: string;
  dataCadastro: Timestamp;
  exames: ExamePropedeutico[];
}

export const getSistemas = async (): Promise<SistemaCorporal[]> => {
  try {
    const q = query(collection(db, 'RevisaoSistemas'), orderBy('dataCadastro', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SistemaCorporal[];
  } catch (error) {
    console.error('Erro ao buscar sistemas:', error);
    throw error;
  }
};


async function validarUnicidadeSistema(nome: string, exames: ExamePropedeutico[], editingId?: string) {
  const nomes = exames.map(e => normalizarNomeClinico(e.nomeExame));
  if (nomes.some(n => !n) || new Set(nomes).size !== nomes.length) {
    throw new Error('Há exames físicos sem nome ou duplicados no mesmo sistema.');
  }
  const snap = await getDocs(collection(db, 'RevisaoSistemas'));
  const atual = editingId ? snap.docs.find(d => d.id === editingId)?.data() : undefined;
  const mesmoNome = atual && normalizarNomeClinico(atual.nomeSistema || '') === normalizarNomeClinico(nome);
  if (!mesmoNome && snap.docs.some(d => d.id !== editingId
    && normalizarNomeClinico(d.data().nomeSistema || '') === normalizarNomeClinico(nome))) {
    throw new Error('Sistema já cadastrado. Edite os achados no sistema existente.');
  }
  const existentesNoSistema = new Set((atual?.exames || []).map(
    (e: { nomeExame: string }) => normalizarNomeClinico(e.nomeExame)));
  for (const exame of exames) {
    const nomesAchados = exame.achados.map(a => normalizarNomeClinico(a.descricaoAchado));
    if (nomesAchados.some(n => !n) || new Set(nomesAchados).size !== nomesAchados.length) {
      throw new Error('Achados vazios ou duplicados no exame físico ' + exame.nomeExame);
    }
    if (!existentesNoSistema.has(normalizarNomeClinico(exame.nomeExame)) &&
        snap.docs.some(d => d.id !== editingId
          && (d.data().exames || []).some((e: { nomeExame: string }) =>
            normalizarNomeClinico(e.nomeExame || '') === normalizarNomeClinico(exame.nomeExame)))) {
      throw new Error('Exame físico ' + exame.nomeExame +
        ' já existe em outro sistema. Preserve a chave de prontuários antigos.');
    }
  }
}

export const addSistema = async (sistema: Omit<SistemaCorporal, 'id' | 'dataCadastro'>): Promise<void> => {
  await validarUnicidadeSistema(sistema.nomeSistema, sistema.exames);
  try {
    await addDoc(collection(db, 'RevisaoSistemas'), {
      ...sistema,
      dataCadastro: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao adicionar sistema:', error);
    throw error;
  }
};

export const updateSistema = async (id: string, sistema: Partial<SistemaCorporal>): Promise<void> => {
  const docRef = doc(db, 'RevisaoSistemas', id);
  const anterior = await getDoc(docRef);
  if (!anterior.exists()) throw new Error('Sistema corporal não encontrado.');
  const original = anterior.data() as SistemaCorporal;
  const proximo = { ...original, ...sistema };
  validarAtualizacaoSistema(original, proximo);
  if (proximo.nomeSistema && proximo.exames) await validarUnicidadeSistema(proximo.nomeSistema, proximo.exames, id);
  try {
    const { dataCadastro, ...dadosParaAtualizar } = sistema;
    await updateDoc(docRef, dadosParaAtualizar);
  } catch (error) {
    console.error('Erro ao atualizar sistema:', error);
    throw error;
  }
};

export const deleteSistema = async (_id: string): Promise<void> => {
  throw new Error('Para preservar as revisões de sistemas dos prontuários históricos, a exclusão está indisponível até existir arquivamento versionado.');
};

export const escutarSistemas = (callback: (sistemas: SistemaCorporal[]) => void) => {
  const q = query(collection(db, 'RevisaoSistemas'), orderBy('dataCadastro', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const sistemas = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SistemaCorporal[];
    
    callback(sistemas);
  });
};
