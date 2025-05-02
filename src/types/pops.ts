
import { Timestamp } from "firebase/firestore";

// POPs (Procedimentos Operacionais Padrão)
export interface POP {
  id?: string;
  titulo: string;
  codigo: string;
  versao: string;
  dataAtualizacao: Timestamp;
  objetivo: string;
  aplicacao: string;
  responsaveis: string;
  materiaisNecessarios: string[];
  descricaoProcedimento: string[];
  referencias: string[];
  cuidadosEspeciais?: string;
  anexos?: string[];
  ativo: boolean;
  categoria: string;
}
