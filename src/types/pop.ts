
import { Timestamp } from "firebase/firestore";

export interface ProtocoloOperacionalPadrao {
  id?: string;
  titulo: string;
  conceito: string;
  dataImplantacao: Timestamp;
  numeroEdicao: string;
  codificacao: string;
  validade: string;
  dataRevisao: Timestamp | null;
  quantidadePaginas: number;
  elaboradoPor: string;
  corenElaborador: string;
  revisadoPor: string;
  corenRevisor: string;
  aprovadoPor: string;
  corenAprovador: string;
  imagemCapa: string;
  linkPdf: string;
  ativo: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
