
import { Timestamp } from "firebase/firestore";

export interface TimelineEvent {
  id?: string;
  dataEvento: Timestamp;
  titulo: string;
  subtitulo: string;
  textoRedacao: string;
  foto: string;
  legendaFoto: string;
  autoriaFoto: string;
}
