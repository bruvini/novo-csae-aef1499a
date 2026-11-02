
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 

  onSnapshot,
  getDoc,
  runTransaction,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { familiaPressaoArterial, identidadeParametroVital, normalizarNomeClinico } from '@/utils/referenciasClinicas';
import { validarAtualizacaoVital } from '@/utils/protecaoCatalogoHistorico';
import { chaveCatalogo, reservarIdentidades } from './identidadesCatalogoDB';

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
  const identidade = identidadeParametroVital(nome);
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  const vigente = editingId ? snapshot.docs.find(d => d.id === editingId)?.data().sinalVitalNome : null;
  // Editar metadados de um registro legado não deve bloquear a sua manutenção.
  if (vigente && normalizarNomeClinico(vigente) === alvo) return;
  const conflito = snapshot.docs.find(d => {
    if (d.id === editingId) return false;
    const existente = d.data().sinalVitalNome;
    const existenteIdentidade = identidadeParametroVital(existente || '');
    return normalizarNomeClinico(existente || '') === alvo
      || existenteIdentidade === identidade
      || (familia !== null && familiaPressaoArterial(existente || '') === familia)
      || (identidade === 'pressao-arterial-composta' && familiaPressaoArterial(existente || '') !== null);
  });
  if (conflito) throw new Error(
    'Já existe este parâmetro, ou um cadastro de PAS/PAD equivalente. ' +
    'Edite suas faixas por idade, sexo e contexto no registro existente.');
  const laboratorios = await getDocs(collection(db, 'ExamesLabImagem'));
  if (laboratorios.docs.some(d => (d.data().componentes || []).some(
    (c: { componenteAnalisado: string }) => normalizarNomeClinico(c.componenteAnalisado || '') === alvo))) {
    throw new Error('Este nome já identifica um componente laboratorial. Use um identificador distinto para evitar sobrescrever avaliações.');
  }
}

export const addSinalVital = async (sinal: SinalVitalInput) => {
  await validarUnicidadeVital(sinal.sinalVitalNome);
  const docRef = doc(collection(db, COLLECTION_NAME));
  await runTransaction(db, async transaction => {
    await reservarIdentidades(
      transaction, [chaveCatalogo('parametro', sinal.sinalVitalNome)], 'SinaisVitais', docRef.id);
    transaction.set(docRef, { ...sinal, dataCadastro: Timestamp.now() });
  });
  return docRef.id;
};

export const updateSinalVital = async (id: string, sinal: SinalVitalInput) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const anterior = await getDoc(docRef);
  if (!anterior.exists()) throw new Error('Sinal vital não encontrado.');
  validarAtualizacaoVital(anterior.data() as SinalVital, sinal);
  await validarUnicidadeVital(sinal.sinalVitalNome, id);
  await updateDoc(docRef, sinal);
};

export const deleteSinalVital = async (_id: string): Promise<void> => {
  throw new Error('Exclusão permanente de conteúdo clínico bloqueada: este campo pode estar vinculado a processos antigos. Aguarde o recurso de arquivamento versionado.');
};

export const getSinaisVitaisCount = async (): Promise<number> => {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME));
  return snapshot.size;
};
