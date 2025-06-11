
import { collection, getDocs, query, where, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DiagnosticoCompleto, SubconjuntoDiagnostico } from '../../types/diagnosticos';

/**
 * Busca todos os subconjuntos de diagnósticos
 */
export const fetchSubconjuntos = async (): Promise<SubconjuntoDiagnostico[]> => {
  try {
    const q = query(collection(db, 'subconjuntos'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const subconjuntos: SubconjuntoDiagnostico[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data.nome,
        tipo: data.tipo || 'NHB',
        descricao: data.descricao,
        ativo: data.ativo !== false,
        ordem: data.ordem,
      };
    });
    
    return subconjuntos;
  } catch (error) {
    console.error("Erro ao buscar subconjuntos:", error);
    return [];
  }
};

/**
 * Busca todos os diagnósticos
 */
export const fetchDiagnosticos = async (): Promise<DiagnosticoCompleto[]> => {
  try {
    const q = query(collection(db, 'diagnosticos'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const diagnosticos: DiagnosticoCompleto[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data.nome,
        explicacao: data.explicacao,
        titulo: data.titulo,
        definicao: data.definicao,
        codigoCipe: data.codigoCipe,
        subconjuntoIds: data.subconjuntoIds || [],
        subconjuntos: data.subconjuntos,
        subitemId: data.subitemId,
        subitemNome: data.subitemNome,
        caracteristicasDefinidoras: data.caracteristicasDefinidoras || [],
        fatoresRelacionados: data.fatoresRelacionados || [],
        populacaoRisco: data.populacaoRisco || [],
        condicoesAssociadas: data.condicoesAssociadas || [],
        resultadosEsperados: data.resultadosEsperados || [],
        ativo: data.ativo !== false,
      };
    });
    
    return diagnosticos;
  } catch (error) {
    console.error("Erro ao buscar diagnósticos:", error);
    return [];
  }
};

/**
 * Busca um diagnóstico pelo ID
 */
export const fetchDiagnosticoPorId = async (id: string): Promise<DiagnosticoCompleto | null> => {
  try {
    const docRef = doc(db, 'diagnosticos', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      nome: data.nome,
      explicacao: data.explicacao,
      titulo: data.titulo,
      definicao: data.definicao,
      codigoCipe: data.codigoCipe,
      subconjuntoIds: data.subconjuntoIds || [],
      subconjuntos: data.subconjuntos,
      subitemId: data.subitemId,
      subitemNome: data.subitemNome,
      caracteristicasDefinidoras: data.caracteristicasDefinidoras || [],
      fatoresRelacionados: data.fatoresRelacionados || [],
      populacaoRisco: data.populacaoRisco || [],
      condicoesAssociadas: data.condicoesAssociadas || [],
      resultadosEsperados: data.resultadosEsperados || [],
      ativo: data.ativo !== false,
    };
  } catch (error) {
    console.error("Erro ao buscar diagnóstico por ID:", error);
    return null;
  }
};

/**
 * Busca diagnósticos por subconjunto
 */
export const fetchDiagnosticosPorSubconjunto = async (subconjuntoId: string): Promise<DiagnosticoCompleto[]> => {
  try {
    const q = query(
      collection(db, 'diagnosticos'), 
      where('subconjuntoIds', 'array-contains', subconjuntoId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }
    
    const diagnosticos: DiagnosticoCompleto[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nome: data.nome,
        explicacao: data.explicacao,
        titulo: data.titulo,
        definicao: data.definicao,
        codigoCipe: data.codigoCipe,
        subconjuntoIds: data.subconjuntoIds || [],
        subconjuntos: data.subconjuntos,
        subitemId: data.subitemId,
        subitemNome: data.subitemNome,
        caracteristicasDefinidoras: data.caracteristicasDefinidoras || [],
        fatoresRelacionados: data.fatoresRelacionados || [],
        populacaoRisco: data.populacaoRisco || [],
        condicoesAssociadas: data.condicoesAssociadas || [],
        resultadosEsperados: data.resultadosEsperados || [],
        ativo: data.ativo !== false,
      };
    });
    
    return diagnosticos;
  } catch (error) {
    console.error("Erro ao buscar diagnósticos por subconjunto:", error);
    return [];
  }
};
