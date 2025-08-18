
import { SessaoDeTrabalho } from '@/types/processoEnfermagem';
import { Timestamp } from 'firebase/firestore';

export function calcularTempoAtivo(sessoes: SessaoDeTrabalho[]): string {
  if (!sessoes || sessoes.length === 0) {
    return "00 dias, 00:00:00";
  }

  let tempoTotalMs = 0;
  const agora = Timestamp.now().toMillis();

  sessoes.forEach((sessao, index) => {
    const inicioMs = sessao.inicioSessao.toMillis();
    
    if (sessao.fimSessao) {
      // Sessão finalizada
      tempoTotalMs += sessao.fimSessao.toMillis() - inicioMs;
    } else if (index === sessoes.length - 1) {
      // Última sessão (ativa)
      tempoTotalMs += agora - inicioMs;
    }
  });

  // Converter milissegundos para formato legível
  const segundosTotal = Math.floor(tempoTotalMs / 1000);
  const minutos = Math.floor(segundosTotal / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  const segundosRestantes = segundosTotal % 60;
  const minutosRestantes = minutos % 60;
  const horasRestantes = horas % 24;

  const horasFormatadas = String(horasRestantes).padStart(2, '0');
  const minutosFormatados = String(minutosRestantes).padStart(2, '0');
  const segundosFormatados = String(segundosRestantes).padStart(2, '0');

  return `${dias.toString().padStart(2, '0')} dias, ${horasFormatadas}:${minutosFormatados}:${segundosFormatados}`;
}
