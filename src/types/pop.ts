
import { Timestamp } from "firebase/firestore";

export interface ProfissionalSaude {
  nome: string;
  conselho: string;
  numeroRegistro: string;
}

export interface ProtocoloOperacionalPadrao {
  id?: string;
  titulo: string;
  conceito: string;
  dataImplantacao: Timestamp | string;
  numeroEdicao: string;
  codificacao: string;
  validade: string;
  dataRevisao: Timestamp | string | null;
  quantidadePaginas: number;
  elaboradores: ProfissionalSaude[];
  revisores: ProfissionalSaude[];
  aprovadores: ProfissionalSaude[];
  imagemCapa: string;
  linkPdf: string;
  ativo: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
