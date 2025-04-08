
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

// Buscar termos CIPE por eixo
export const buscarTermosCipePorEixo = async (eixo: string) => {
  try {
    const colecao = `eixo${eixo.charAt(0).toUpperCase() + eixo.slice(1)}`;
    const termosCipeRef = collection(db, colecao);
    const snapshot = await getDocs(termosCipeRef);
    
    const termos: TermoCipe[] = [];
    snapshot.forEach((doc) => {
      termos.push({ id: doc.id, ...doc.data() } as TermoCipe);
    });
    
    return termos;
  } catch (error) {
    console.error(`Erro ao buscar termos CIPE do eixo ${eixo}:`, error);
    throw error;
  }
};

// Obter todos os termos CIPE organizados por eixo
export const obterTodosTermosCipe = async () => {
  try {
    const eixos = ['Foco', 'Julgamento', 'Meios', 'Acao', 'Tempo', 'Localizacao', 'Cliente'];
    const resultado: Record<string, TermoCipe[]> = {};
    
    for (const eixo of eixos) {
      const termos = await buscarTermosCipePorEixo(eixo);
      const chaveEixo = `array${eixo}`;
      resultado[chaveEixo] = termos;
    }
    
    return resultado;
  } catch (error) {
    console.error("Erro ao obter todos os termos CIPE:", error);
    throw error;
  }
};

// Adicionar termo CIPE
export const adicionarTermoCipe = async (eixo: string, termo: string, descricao: string) => {
  try {
    const colecao = `eixo${eixo.charAt(0).toUpperCase() + eixo.slice(1)}`;
    
    const docRef = await addDoc(collection(db, colecao), {
      tipo: eixo,
      termo: termo,
      descricao: descricao,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error(`Erro ao adicionar termo ao eixo ${eixo}:`, error);
    throw error;
  }
};

// Atualizar termo CIPE
export const atualizarTermoCipe = async (eixo: string, id: string, termo: string, descricao: string) => {
  try {
    const colecao = `eixo${eixo.charAt(0).toUpperCase() + eixo.slice(1)}`;
    const docRef = doc(db, colecao, id);
    
    await updateDoc(docRef, {
      termo: termo,
      descricao: descricao,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error(`Erro ao atualizar termo no eixo ${eixo}:`, error);
    throw error;
  }
};

// Excluir termo CIPE
export const excluirTermoCipe = async (eixo: string, id: string) => {
  try {
    const colecao = `eixo${eixo.charAt(0).toUpperCase() + eixo.slice(1)}`;
    const docRef = doc(db, colecao, id);
    
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Erro ao excluir termo do eixo ${eixo}:`, error);
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
