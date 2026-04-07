import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

// ─── Interface ───────────────────────────────────────────────
export interface Changelog {
  id?: string;
  titulo: string;
  descricao: string;
  dataHora: Timestamp;
}

// ─── Buscar changelogs recentes (últimos 10) ─────────────────
export async function buscarChangelogsRecentes(): Promise<Changelog[]> {
  const ref = collection(db, 'changelogs');
  const q = query(ref, orderBy('dataHora', 'desc'), limit(10));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Changelog[];
}

// ─── Seed inicial (executado uma vez se a coleção estiver vazia)
export async function seedChangelogInicial(): Promise<void> {
  const ref = collection(db, 'changelogs');
  const snapshot = await getDocs(query(ref, limit(1)));

  if (snapshot.empty) {
    await addDoc(ref, {
      titulo: 'Nova Interface do Dashboard',
      descricao:
        'Otimizamos a área inicial e adicionamos o mural de atualizações para manter você informado.',
      dataHora: Timestamp.now(),
    });
    console.log('[Changelog] Seed inicial inserido com sucesso.');
  }
}

// ─── Salvar novo changelog ───────────────────────────────────
export async function salvarChangelog(titulo: string, descricao: string): Promise<void> {
  const ref = collection(db, 'changelogs');
  await addDoc(ref, {
    titulo,
    descricao,
    dataHora: serverTimestamp(),
  });
}
