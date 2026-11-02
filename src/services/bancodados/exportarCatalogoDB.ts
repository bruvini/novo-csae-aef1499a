import { collection, getCountFromServer, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { COLECOES_CATALOGO, type Catalogo, type ColecaoCatalogo } from '@/utils/catalogoClinicoExport';

export async function lerCatalogoCompleto(): Promise<{ catalogo: Catalogo; inicio: Date; fim: Date }> {
  const inicio = new Date();
  const pares = await Promise.all(COLECOES_CATALOGO.map(async (nome) => {
    const ref = collection(db, nome);
    const quantidade = (await getCountFromServer(ref)).data().count;
    const snapshot = await getDocs(ref);
    if (snapshot.size !== quantidade) throw new Error(`A coleção ${nome} mudou durante a leitura. Tente novamente.`);
    const documentos = snapshot.docs.map(item => ({ id: item.id, dados: item.data() as Record<string, unknown> }));
    if (new Set(documentos.map(item => item.id)).size !== documentos.length) throw new Error(`IDs duplicados em ${nome}.`);
    return [nome, documentos] as const;
  }));
  const catalogo = Object.fromEntries(pares) as Catalogo;
  for (const nome of COLECOES_CATALOGO) {
    if (!Array.isArray(catalogo[nome])) throw new Error(`Leitura incompleta: ${nome}.`);
  }
  return { catalogo, inicio, fim: new Date() };
}

export const nomesColecoesCatalogo: readonly ColecaoCatalogo[] = COLECOES_CATALOGO;
