
import { Timestamp } from "firebase/firestore";

// Variáveis de configuração
export interface ConfiguracaoSistema {
  id?: string;
  nome: string;
  valor: string | number | boolean | object;
  categoria: string;
  descricao?: string;
  ultimaAtualizacao: Timestamp;
}
