
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { familiaPressaoArterial, normalizarNomeClinico } from '@/utils/referenciasClinicas';

export interface ValorReferenciaVital {
  idadeMinima: number | null;
  idadeMaxima: number | null;
  idadeUnidade: 'dias' | 'meses' | 'anos' | '' | 'not-specified';
  criterioSexo: 'Masculino' | 'Feminino' | 'Ambos';
  criterioCondicao: string;
  contextoClinico?: string;
  interpretacaoClinica?: 'normal' | 'alterado' | 'indeterminado';
  valorMinimo: number | null;
  valorMaximo: number | null;
  nomeAlteracao: string;
  subconjuntoNHBVinculado: string;
}

export interface SinalVital {
  id: string;
  sinalVitalNome: string;
  sinalVitalDescricao: string;
  unidadeMedida: string;
  valoresDeReferencia: ValorReferenciaVital[];
  dataCadastro?: Timestamp;
}

export interface SinalVitalInput extends Omit<SinalVital, 'id' | 'dataCadastro'> {}

const COLLECTION_NAME = 'SinaisVitais';

export const getSinaisVitais = (callback: (sinais: SinalVital[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('sinalVitalNome'));
  
  return onSnapshot(q, (snapshot) => {
    const sinais: SinalVital[] = [];
    snapshot.forEach((doc) => {
      sinais.push({
        id: doc.id,
        ...doc.data()
      } as SinalVital);
    });
    callback(sinais);
  });
};


async function validarUnicidadeVital(nome: string, editingId?: string) {
  const alvo = normalizarNomeClinico(nome);
  const familia = familiaPressaoArterial(nome);
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const vigente = editingId ? snapshot.docs.find(d => d.id === editingId)?.data().sinalVitalNome : null;
  // Editar metadados de um registro legado não deve bloquear a sua manutenção.
  if (vigente && normalizarNomeClinico(vigente) === alvo) return;
  const conflito = snapshot.docs.find(d => {
    if (d.id === editingId) return false;
    const existente = d.data().sinalVitalNome;
    return normalizarNomeClinico(existente || '') === alvo
      || (familia !== null && familiaPressaoArterial(existente || '') === familia);
  });
  if (conflito) throw new Error(
    'Já existe este parâmetro, ou um cadastro de PAS/PAD equivalente. ' +
    'Edite suas faixas por idade, sexo e contexto no registro existente.');
}

export const addSinalVital = async (sinal: SinalVitalInput) => {
  await validarUnicidadeVital(sinal.sinalVitalNome);
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...sinal,
    dataCadastro: Timestamp.now()
  });
  return docRef.id;
};

export const updateSinalVital = async (id: string, sinal: SinalVitalInput) => {
  await validarUnicidadeVital(sinal.sinalVitalNome, id);
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, sinal);
};

export const deleteSinalVital = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const getSinaisVitaisCount = async (): Promise<number> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.size;
};
