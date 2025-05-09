
import { Timestamp } from "firebase/firestore";

// Protocolos de Enfermagem
export interface ProtocoloEnfermagem {
  id?: string;
  volume: string;
  nome: string;
  dataPublicacao: Timestamp;
  dataAtualizacao?: Timestamp;
  descricao: string;
  linkPdf: string;
  linkImagem?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
