import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { CasoClinico, TermoCipe } from '../bancodados/tipos';

export async function buscarTermosCipe(): Promise<{ [key: string]: TermoCipe[] }> {
  try {
    // Buscar termos de cada eixo
    const eixos = ['eixoFoco', 'eixoJulgamento', 'eixoMeios', 'eixoAcao', 'eixoTempo', 'eixoLocalizacao', 'eixoCliente'];
    const result: { [key: string]: TermoCipe[] } = {};
    
    for (const eixo of eixos) {
      const q = query(collection(db, eixo), orderBy('termo'));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        result[eixo] = [];
        querySnapshot.forEach((doc) => {
          const termoData = doc.data();
          result[eixo].push({ 
            id: doc.id, 
            ...termoData
          } as TermoCipe);
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error("Erro ao buscar termos CIPE:", error);
    return {};
  }
}

export async function registrarVencedor(
  userId: string,
  casoId: string,
  arrayEscolhido: string[]
): Promise<boolean> {
  try {
    const respostaRef = await addDoc(collection(db, 'respostasCasosClinicos'), {
      userId,
      casoId,
      arrayEscolhido,
      dataResposta: serverTimestamp()
    });
    
    return !!respostaRef.id;
  } catch (error) {
    console.error('Erro ao registrar vencedor:', error);
    return false;
  }
}
