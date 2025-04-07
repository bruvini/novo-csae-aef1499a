
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  arrayUnion,
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { CasoClinico, TermoCipe, ProgressoCursoCipe } from "@/types/cipe";

// Buscar todos os termos CIPE
export const buscarTermosCipe = async () => {
  try {
    const docRef = doc(db, "termosCipe", "termos");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("Nenhum termo CIPE encontrado!");
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar termos CIPE:", error);
    throw error;
  }
};

// Buscar casos clínicos para os exercícios
export const buscarCasosClinicos = async () => {
  try {
    const casosRef = collection(db, "casosClinicos");
    const snapshot = await getDocs(casosRef);
    
    const casos: CasoClinico[] = [];
    snapshot.forEach((doc) => {
      casos.push({ id: doc.id, ...doc.data() } as CasoClinico);
    });
    
    return casos;
  } catch (error) {
    console.error("Erro ao buscar casos clínicos:", error);
    throw error;
  }
};

// Buscar caso clínico por ID
export const buscarCasoClinicoPorId = async (id: string) => {
  try {
    const docRef = doc(db, "casosClinicos", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as CasoClinico;
    } else {
      console.log("Caso clínico não encontrado!");
      return null;
    }
  } catch (error) {
    console.error("Erro ao buscar caso clínico:", error);
    throw error;
  }
};

// Registrar vencedor em um caso clínico
export const registrarVencedor = async (casoId: string, nomeUsuario: string) => {
  try {
    const docRef = doc(db, "casosClinicos", casoId);
    await updateDoc(docRef, {
      arrayVencedor: arrayUnion(nomeUsuario),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Erro ao registrar vencedor:", error);
    throw error;
  }
};

// Buscar progresso do curso CIPE de um usuário
export const buscarProgressoCursoCipe = async (userId: string) => {
  try {
    const docRef = doc(db, "usuarios", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists() && docSnap.data().progressoCursoCipe) {
      return docSnap.data().progressoCursoCipe as ProgressoCursoCipe;
    } else {
      // Retorna um objeto de progresso vazio se não existir
      return {
        moduloIntroducao: false,
        moduloEixos: {
          foco: false,
          julgamento: false,
          meios: false,
          acao: false,
          tempo: false,
          localizacao: false,
          cliente: false,
          concluido: false
        },
        moduloElaboracao: {
          diagnosticos: false,
          acoes: false,
          resultados: false,
          concluido: false
        },
        moduloExercicios: false,
        statusCurso: false
      };
    }
  } catch (error) {
    console.error("Erro ao buscar progresso do curso CIPE:", error);
    throw error;
  }
};

// Atualizar progresso do curso CIPE de um usuário
export const atualizarProgressoCursoCipe = async (userId: string, progresso: Partial<ProgressoCursoCipe>) => {
  try {
    const docRef = doc(db, "usuarios", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Mescla o progresso existente com as atualizações
      const progressoAtual = docSnap.data().progressoCursoCipe || {
        moduloIntroducao: false,
        moduloEixos: {
          foco: false,
          julgamento: false,
          meios: false,
          acao: false,
          tempo: false,
          localizacao: false,
          cliente: false,
          concluido: false
        },
        moduloElaboracao: {
          diagnosticos: false,
          acoes: false,
          resultados: false,
          concluido: false
        },
        moduloExercicios: false,
        statusCurso: false
      };
      
      // Função recursiva para mesclar objetos profundos
      const deepMerge = (target: any, source: any) => {
        Object.keys(source).forEach(key => {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            if (!target[key]) Object.assign(target, { [key]: {} });
            deepMerge(target[key], source[key]);
          } else {
            Object.assign(target, { [key]: source[key] });
          }
        });
        return target;
      };
      
      const novoProgresso = deepMerge(progressoAtual, progresso);
      
      // Verifica se todos os módulos e submódulos foram concluídos
      const todosEixosConcluidos = Object.values(novoProgresso.moduloEixos)
        .filter(value => typeof value === 'boolean')
        .every(Boolean);
      
      const todaElaboracaoConcluida = Object.values(novoProgresso.moduloElaboracao)
        .filter(value => typeof value === 'boolean')
        .every(Boolean);
      
      // Atualiza status dos módulos principais
      if (todosEixosConcluidos) {
        novoProgresso.moduloEixos.concluido = true;
      }
      
      if (todaElaboracaoConcluida) {
        novoProgresso.moduloElaboracao.concluido = true;
      }
      
      // Atualiza o status geral do curso
      novoProgresso.statusCurso = 
        novoProgresso.moduloIntroducao && 
        novoProgresso.moduloEixos.concluido && 
        novoProgresso.moduloElaboracao.concluido && 
        novoProgresso.moduloExercicios;
      
      await updateDoc(docRef, {
        progressoCursoCipe: novoProgresso
      });
      
      return novoProgresso;
    } else {
      throw new Error("Usuário não encontrado");
    }
  } catch (error) {
    console.error("Erro ao atualizar progresso do curso CIPE:", error);
    throw error;
  }
};
