
import { 
  collection, 
  getDocs, 
  doc, 
  onSnapshot,
  getDoc,
  runTransaction,
  query,
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { normalizarNomeClinico } from '@/utils/referenciasClinicas';
import { validarAtualizacaoExame } from '@/utils/protecaoCatalogoHistorico';
import { chaveCatalogo, chavesNovas, reservarIdentidades } from './identidadesCatalogoDB';

export interface ResultadoExame {
  // Campos para exames laboratoriais
  idadeMinima?: number | null;
  idadeMaxima?: number | null;
  idadeUnidade?: 'dias' | 'meses' | 'anos' | '';
  criterioSexo?: 'Masculino' | 'Feminino' | 'Ambos';
  criterioCondicao?: string;
  contextoClinico?: string;
  interpretacaoClinica?: 'normal' | 'alterado' | 'indeterminado' | 'informativo';
  valorMinimo?: number | null;
  valorMaximo?: number | null;
  // Campo para exames de imagem
  resultadoClassificatorio?: string;
  permiteValorTexto?: boolean;
  rotuloValorTexto?: string;
  valorTextoObrigatorio?: boolean;
  tipoValorTexto?: 'lista' | 'livre';
  opcoesValorTexto?: string[];
  // Campos comuns
  nomeAlteracao: string;
  subconjuntoNHBVinculado: string;
}

export interface ComponenteExame {
  componenteAnalisado: string;
  unidadeMedida: string;
  resultados: ResultadoExame[];
}

export interface Exame {
  id: string;
  nomeExame: string;
  descricaoExame: string;
  tipoExame: 'Laboratorial' | 'Imagem';
  componentes: ComponenteExame[];
  dataCadastro?: Timestamp;
}

export type ExameInput = Omit<Exame, 'id' | 'dataCadastro'>;

export const componenteEhClassificatorio = (
  tipoExame: Exame['tipoExame'],
  componente: ComponenteExame
): boolean => (
  tipoExame === 'Imagem'
  || componente.unidadeMedida.trim().toLocaleLowerCase('pt-BR').includes('qualitativo')
  || componente.resultados.some((resultado) => Boolean(resultado.resultadoClassificatorio))
);

const COLLECTION_NAME = 'ExamesLabImagem';

const chavesDeExame = (exame: ExameInput) => [
  chaveCatalogo('exame', exame.nomeExame),
  ...exame.componentes.map(componente => chaveCatalogo('parametro', componente.componenteAnalisado)),
];

export const getExames = (callback: (exames: Exame[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('nomeExame'));
  
  return onSnapshot(q, (snapshot) => {
    const exames: Exame[] = [];
    snapshot.forEach((doc) => {
      exames.push({
        id: doc.id,
        ...doc.data()
      } as Exame);
    });
    callback(exames);
  });
};


async function validarUnicidadeExame(exame: ExameInput, editingId?: string) {
  const componentes = exame.componentes.map(c => normalizarNomeClinico(c.componenteAnalisado));
  if (componentes.some(n => !n) || new Set(componentes).size !== componentes.length) {
    throw new Error('Componentes sem nome ou duplicados no mesmo exame.');
  }
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const vigente = editingId ? snapshot.docs.find(d => d.id === editingId)?.data() : undefined;
  const novoNome = normalizarNomeClinico(exame.nomeExame);
  const nomeJaExistia = vigente && normalizarNomeClinico(vigente.nomeExame || '') === novoNome;
  const conflito = snapshot.docs.some(d => {
    if (d.id === editingId) return false;
    const data = d.data();
    if (!nomeJaExistia && normalizarNomeClinico(data.nomeExame || '') === novoNome) return true;
    const outros = Array.isArray(data.componentes) ? data.componentes : [];
    const antigos = new Set((vigente?.componentes || []).map(
      (c: { componenteAnalisado: string }) => normalizarNomeClinico(c.componenteAnalisado)));
    return componentes.some(nome => !antigos.has(nome) &&
      outros.some((c: { componenteAnalisado: string }) =>
        normalizarNomeClinico(c.componenteAnalisado || '') === nome));
  });
  if (conflito) throw new Error(
    'Existe um exame com este nome ou componente já cadastrado. ' +
    'Complemente o exame existente para preservar resultados históricos.');
  const sinais = await getDocs(collection(db, 'SinaisVitais'));
  if (componentes.some(nome => sinais.docs.some(d =>
    normalizarNomeClinico(d.data().sinalVitalNome || '') === nome))) {
    throw new Error('Um dos componentes já existe nos sinais vitais. Use o cadastro atual para evitar sobrescrever o mesmo campo.');
  }
}

export const addExame = async (exame: ExameInput) => {
  await validarUnicidadeExame(exame);
  const docRef = doc(collection(db, COLLECTION_NAME));
  await runTransaction(db, async transaction => {
    await reservarIdentidades(transaction, chavesDeExame(exame), 'ExamesLabImagem', docRef.id);
    transaction.set(docRef, { ...exame, dataCadastro: Timestamp.now() });
  });
  return docRef.id;
};

export const updateExame = async (id: string, exame: ExameInput) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const anterior = await getDoc(docRef);
  if (!anterior.exists()) throw new Error('Exame não encontrado.');
  validarAtualizacaoExame(anterior.data() as Exame, exame);
  await validarUnicidadeExame(exame, id);
  await runTransaction(db, async transaction => {
    const atual = await transaction.get(docRef);
    if (!atual.exists()) throw new Error('Exame excluído durante a edição.');
    const original = atual.data() as Exame;
    validarAtualizacaoExame(original, exame);
    const novas = chavesNovas(chavesDeExame(original), chavesDeExame(exame));
    await reservarIdentidades(transaction, novas, 'ExamesLabImagem', docRef.id);
    transaction.update(docRef, exame);
  });
};

export const deleteExame = async (_id: string): Promise<void> => {
  throw new Error('Para preservar os resultados históricos, a exclusão de exames está indisponível até existir arquivamento versionado.');
};

export const getExamesCount = async (): Promise<number> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.size;
};

export const buscarNomesExamesUnicos = async (): Promise<string[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const nomes = new Set<string>();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.nomeExame) {
        nomes.add(data.nomeExame);
      }
    });

    return Array.from(nomes).sort();
  } catch (error) {
    console.error('Erro ao buscar nomes de exames únicos:', error);
    throw error;
  }
};

export const buscarExamePorNome = async (nomeExame: string): Promise<Exame | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('nomeExame', '==', nomeExame)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Exame;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar exame por nome:', error);
    throw error;
  }
};

// Nova função para buscar nomes únicos de exames
export const getNomesDeExamesUnicos = async (): Promise<string[]> => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const nomes = snapshot.docs.map(doc => doc.data().nomeExame);
    // Usa um Set para garantir que a lista contenha apenas valores únicos
    return [...new Set(nomes)].sort();
  } catch (error) {
    console.error('Erro ao buscar nomes de exames únicos:', error);
    throw error;
  }
};
