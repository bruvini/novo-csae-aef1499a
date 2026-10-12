
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  getDocs,
  runTransaction,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { normalizarNomeClinico } from '@/utils/referenciasClinicas';
import { protegerVinculosDoRol } from '@/utils/protecaoRolHistorico';
import { chaveCatalogo, reservarIdentidades } from './identidadesCatalogoDB';

export interface MaterialApoio {
  tituloMaterialApoio: string;
  urlMaterialApoio: string;
}

export interface Intervencao {
  acaoEnfermeiro: string;
  acaoPrescrita: string;
  materiaisDeApoio: MaterialApoio[];
}

export interface ResultadoEsperado {
  tituloResultado: string;
  descricaoResultado: string;
  intervencoes: Intervencao[];
}

export interface Subconjunto {
  tipoSubconjunto: string;
  tituloSubconjunto: string;
}

export interface Diagnostico {
  id: string;
  tituloDiagnostico: string;
  descricaoDiagnostico: string;
  subconjuntos: Subconjunto[];
  resultadosEsperados: ResultadoEsperado[];
  dataCadastro: Timestamp;
}

export const getDiagnosticos = (callback: (diagnosticos: Diagnostico[]) => void) => {
  const q = query(
    collection(db, 'rolEnfermagem'),
    orderBy('dataCadastro', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const diagnosticos = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Diagnostico[];
    
    callback(diagnosticos);
  });
};

/** Consulta os IDs legados antes de reservar um novo nome. */
async function garantirDiagnosticoNovo(titulo: string): Promise<void> {
  const nome = normalizarNomeClinico(titulo);
  if (!nome) throw new Error('O título do diagnóstico é obrigatório.');
  const existentes = await getDocs(collection(db, 'rolEnfermagem'));
  if (existentes.docs.some(d => normalizarNomeClinico(d.data().tituloDiagnostico || '') === nome)) {
    throw new Error('Já existe um diagnóstico com este título. Edite os vínculos do cadastro existente.');
  }
}

export const addDiagnostico = async (data: Omit<Diagnostico, 'id' | 'dataCadastro'>): Promise<void> => {
  await garantirDiagnosticoNovo(data.tituloDiagnostico);
  const novoDoc = doc(collection(db, 'rolEnfermagem'));
  await runTransaction(db, async transacao => {
    await reservarIdentidades(transacao,
      [chaveCatalogo('diagnostico', data.tituloDiagnostico)], 'rolEnfermagem', novoDoc.id);
    transacao.set(novoDoc, { ...data, dataCadastro: Timestamp.now() });
  });
};

export const updateDiagnostico = async (id: string, data: Partial<Diagnostico>): Promise<void> => {
  const docRef = doc(db, 'rolEnfermagem', id);
  const { dataCadastro: _dataCadastro, id: _id, ...alteracoes } = data;
  await runTransaction(db, async transacao => {
    const snapshot = await transacao.get(docRef);
    if (!snapshot.exists()) throw new Error('Diagnóstico não localizado para atualização.');
    const anterior = snapshot.data() as Diagnostico;
    const proximo = { ...anterior, ...alteracoes };
    protegerVinculosDoRol(anterior, proximo);
    transacao.update(docRef, alteracoes);
  });
};

export const deleteDiagnostico = async (_id: string): Promise<void> => {
  throw new Error('Exclusão permanente de diagnósticos bloqueada para proteger o planejamento histórico. Use arquivamento versionado quando disponível.');
};
