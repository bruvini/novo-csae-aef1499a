
import { 
  collection, 
  addDoc, 
  writeBatch, 
  doc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface IntervencaoAutoral {
  textoIntervencao: string;
  tituloResultadoVinculado: string;
  autorId: string;
  autorNome: string;
  dataCriacao: Timestamp;
}

export const salvarIntervencoesAutorais = async (intervencoes: IntervencaoAutoral[]): Promise<void> => {
  if (intervencoes.length === 0) return;

  const batch = writeBatch(db);
  const colecaoRef = collection(db, 'intervencoesAutorais');

  intervencoes.forEach((intervencao) => {
    const docRef = doc(colecaoRef);
    batch.set(docRef, intervencao);
  });

  await batch.commit();
  console.log(`${intervencoes.length} intervenções autorais salvas com sucesso`);
};

export const salvarIntervencaoAutoral = async (intervencao: IntervencaoAutoral): Promise<void> => {
  const colecaoRef = collection(db, 'intervencoesAutorais');
  await addDoc(colecaoRef, intervencao);
  console.log('Intervenção autoral salva com sucesso');
};
