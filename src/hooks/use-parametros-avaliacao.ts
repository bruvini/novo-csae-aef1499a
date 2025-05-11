
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { SinalVital } from '@/types/sinais-vitais';
import { ExameLaboratorial } from '@/types/exames';
import { RevisaoSistema, SistemaCorporal } from '@/types/sistemas';

export interface ParametroValor {
  id: string;
  parametroId: string;
  nome: string;
  valor: string;
  unidade?: string;
  tipoValor: 'Numérico' | 'Texto';
  alterado?: boolean;
  tituloAlteracao?: string;
  nhbIds?: string[];
  diagnosticoIds?: string[];
}

export function useParametrosAvaliacao() {
  const [sinaisVitais, setSinaisVitais] = useState<SinalVital[]>([]);
  const [examesLaboratoriais, setExamesLaboratoriais] = useState<ExameLaboratorial[]>([]);
  const [sistemasCorporais, setSistemasCorporais] = useState<SistemaCorporal[]>([]);
  const [revisoesSystem, setRevisoesSystem] = useState<RevisaoSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para armazenar valores preenchidos
  const [valoresPreenchidos, setValoresPreenchidos] = useState<Record<string, ParametroValor>>({});

  useEffect(() => {
    const fetchParametros = async () => {
      setLoading(true);
      try {
        // Buscar sinais vitais
        const sinaisVitaisQuery = query(collection(db, 'sinaisVitais'), where('ativo', '==', true));
        const sinaisVitaisSnapshot = await getDocs(sinaisVitaisQuery);
        const sinaisVitaisList = sinaisVitaisSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as SinalVital));
        setSinaisVitais(sinaisVitaisList);

        // Buscar exames laboratoriais
        const examesQuery = query(collection(db, 'examesLaboratoriais'));
        const examesSnapshot = await getDocs(examesQuery);
        const examesList = examesSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as ExameLaboratorial));
        setExamesLaboratoriais(examesList);

        // Buscar sistemas corporais
        const sistemasQuery = query(collection(db, 'sistemasCorporais'), where('ativo', '==', true));
        const sistemasSnapshot = await getDocs(sistemasQuery);
        const sistemasList = sistemasSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as SistemaCorporal));
        setSistemasCorporais(sistemasList);

        // Buscar revisões de sistemas
        const revisoesQuery = query(collection(db, 'revisoesSistema'), where('ativo', '==', true));
        const revisoesSnapshot = await getDocs(revisoesQuery);
        const revisoesList = revisoesSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as RevisaoSistema));
        setRevisoesSystem(revisoesList);
        
      } catch (err) {
        console.error('Erro ao buscar parâmetros:', err);
        setError('Erro ao carregar parâmetros de avaliação.');
      } finally {
        setLoading(false);
      }
    };

    fetchParametros();
  }, []);

  // Função para verificar valor com base nos critérios do paciente
  const verificarAlteracao = (
    valor: string | number,
    parametro: any,
    idadePaciente: number,
    sexoPaciente: 'Masculino' | 'Feminino'
  ) => {
    // Se não possui valores de referência, retorna sem alteração
    if (!parametro.valoresReferencia || parametro.valoresReferencia.length === 0) {
      return { alterado: false };
    }

    // Encontrar o valor de referência que se aplica ao paciente
    const valorReferencia = parametro.valoresReferencia.find((ref: any) => {
      // Verificar variação por sexo e idade
      if (ref.variacaoPor === 'Nenhum') {
        return true;
      } else if (ref.variacaoPor === 'Sexo') {
        return ref.sexo === 'Todos' || ref.sexo === sexoPaciente;
      } else if (ref.variacaoPor === 'Idade') {
        return (!ref.idadeMinima || idadePaciente >= ref.idadeMinima) &&
               (!ref.idadeMaxima || idadePaciente <= ref.idadeMaxima);
      } else if (ref.variacaoPor === 'Ambos') {
        const sexoMatch = ref.sexo === 'Todos' || ref.sexo === sexoPaciente;
        const idadeMatch = (!ref.idadeMinima || idadePaciente >= ref.idadeMinima) &&
                          (!ref.idadeMaxima || idadePaciente <= ref.idadeMaxima);
        return sexoMatch && idadeMatch;
      }
      return false;
    });

    if (!valorReferencia || !valorReferencia.representaAlteracao) {
      return { alterado: false };
    }

    // Verificar se o valor está alterado
    if (valorReferencia.tipoValor === 'Numérico' && typeof valor === 'number') {
      if (valorReferencia.condicao === 'abaixo') {
        return {
          alterado: valor < (valorReferencia.valorMinimo || 0),
          tituloAlteracao: valorReferencia.tituloAlteracao,
          nhbIds: valorReferencia.nhbIds || [],
          diagnosticoIds: valorReferencia.diagnosticoIds || []
        };
      } else if (valorReferencia.condicao === 'acima') {
        return {
          alterado: valor > (valorReferencia.valorMaximo || 0),
          tituloAlteracao: valorReferencia.tituloAlteracao,
          nhbIds: valorReferencia.nhbIds || [],
          diagnosticoIds: valorReferencia.diagnosticoIds || []
        };
      } else if (valorReferencia.condicao === 'entre') {
        return {
          alterado: valor < (valorReferencia.valorMinimo || 0) || valor > (valorReferencia.valorMaximo || 0),
          tituloAlteracao: valorReferencia.tituloAlteracao,
          nhbIds: valorReferencia.nhbIds || [],
          diagnosticoIds: valorReferencia.diagnosticoIds || []
        };
      } else if (valorReferencia.condicao === 'igual') {
        return {
          alterado: valor === valorReferencia.valorReferencia,
          tituloAlteracao: valorReferencia.tituloAlteracao,
          nhbIds: valorReferencia.nhbIds || [],
          diagnosticoIds: valorReferencia.diagnosticoIds || []
        };
      }
    } else if (valorReferencia.tipoValor === 'Texto' && typeof valor === 'string') {
      return {
        alterado: valor === valorReferencia.valorTexto,
        tituloAlteracao: valorReferencia.tituloAlteracao,
        nhbIds: valorReferencia.nhbIds || [],
        diagnosticoIds: valorReferencia.diagnosticoIds || []
      };
    }

    return { alterado: false };
  };

  // Função para atualizar um valor
  const atualizarValor = (
    id: string,
    parametroId: string, 
    nome: string, 
    valor: string, 
    tipoValor: 'Numérico' | 'Texto',
    unidade?: string,
    paciente?: { dataNascimento: string, sexo: 'Masculino' | 'Feminino' },
    parametro?: any
  ) => {
    // Se temos dados do paciente e o parâmetro, verificamos alteração
    let alteracaoInfo = { alterado: false, tituloAlteracao: '', nhbIds: [] as string[], diagnosticoIds: [] as string[] };
    
    if (paciente && parametro) {
      // Calcular idade do paciente
      const dataNascimento = new Date(paciente.dataNascimento);
      const hoje = new Date();
      let idade = hoje.getFullYear() - dataNascimento.getFullYear();
      const m = hoje.getMonth() - dataNascimento.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < dataNascimento.getDate())) {
        idade--;
      }

      // Verificar alteração
      const valorNumerico = tipoValor === 'Numérico' ? parseFloat(valor) : valor;
      alteracaoInfo = verificarAlteracao(valorNumerico, parametro, idade, paciente.sexo);
    }

    setValoresPreenchidos(prev => ({
      ...prev,
      [id]: {
        id,
        parametroId,
        nome,
        valor,
        unidade,
        tipoValor,
        alterado: alteracaoInfo.alterado,
        tituloAlteracao: alteracaoInfo.tituloAlteracao,
        nhbIds: alteracaoInfo.nhbIds,
        diagnosticoIds: alteracaoInfo.diagnosticoIds
      }
    }));
  };

  // Obter todos os valores alterados (para sugestão de NHBs)
  const getValoresAlterados = () => {
    return Object.values(valoresPreenchidos).filter(val => val.alterado);
  };

  // Obter valor específico
  const getValorParametro = (id: string) => {
    return valoresPreenchidos[id] || null;
  };

  // Obter todos os valores preenchidos (para salvar)
  const getTodosValoresPreenchidos = () => {
    return valoresPreenchidos;
  };

  return {
    sinaisVitais,
    examesLaboratoriais,
    sistemasCorporais,
    revisoesSystem,
    loading,
    error,
    valoresPreenchidos,
    atualizarValor,
    getValoresAlterados,
    getValorParametro,
    getTodosValoresPreenchidos
  };
}
