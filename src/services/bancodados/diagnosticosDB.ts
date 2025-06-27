
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/services/firebase';

export interface MaterialApoio {
  tituloMaterialApoio: string;
  urlMaterialApoio: string;
}

export interface IntervencaoEnfermagem {
  acaoEnfermeiro: string;
  acaoPrescrita: string;
  materialApoio?: MaterialApoio;
}

export interface ResultadoEsperado {
  tituloResultado: string;
  descricaoResultado?: string;
  intervencoesEnfermagem: IntervencaoEnfermagem[];
}

export interface SubconjuntoVinculado {
  tipoSubconjunto: string;
  tituloSubconjunto: string;
}

export interface DiagnosticoEnfermagem {
  id?: string;
  tituloDiagnostico: string;
  descricaoDiagnostico?: string;
  subconjuntosVinculados: SubconjuntoVinculado[];
  resultadosEsperados: ResultadoEsperado[];
  dataCadastro: Timestamp;
}

export const verificarDiagnosticoDuplicado = async (titulo: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'diagnosticosEnfermagem'),
      where('tituloDiagnostico', '==', titulo)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Erro ao verificar diagnóstico duplicado:', error);
    throw error;
  }
};

export const uploadMaterialApoio = async (file: File, diagnosticoId: string, intervencaoIndex: number): Promise<string> => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `materiais-apoio/${diagnosticoId}/${intervencaoIndex}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Erro ao fazer upload do material de apoio:', error);
    throw error;
  }
};

export const salvarDiagnostico = async (diagnostico: Omit<DiagnosticoEnfermagem, 'id' | 'dataCadastro'>): Promise<void> => {
  try {
    const isDuplicado = await verificarDiagnosticoDuplicado(diagnostico.tituloDiagnostico);
    
    if (isDuplicado) {
      throw new Error('Já existe um diagnóstico com este título');
    }

    const novoDocRef = await addDoc(collection(db, 'diagnosticosEnfermagem'), {
      ...diagnostico,
      dataCadastro: Timestamp.now()
    });

    console.log('Diagnóstico salvo com ID:', novoDocRef.id);
  } catch (error) {
    console.error('Erro ao salvar diagnóstico:', error);
    throw error;
  }
};
