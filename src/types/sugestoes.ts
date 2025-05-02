
import { Timestamp } from "firebase/firestore";

// Sugestões e feedback
export interface Sugestao {
  id?: string;
  usuarioUid: string;
  usuarioNome: string;
  usuarioEmail: string;
  tipo: 'Sugestão' | 'Erro' | 'Dúvida';
  titulo: string;
  descricao: string;
  status: 'Nova' | 'Em Análise' | 'Implementada' | 'Rejeitada' | 'Respondida';
  dataEnvio: Timestamp;
  resposta?: string;
  respostaData?: Timestamp;
  respostaUsuarioUid?: string;
}
