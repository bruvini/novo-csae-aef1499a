import type { SugestaoMelhoria, TicketProblema } from '@/services/bancodados/suporteDB';

const horasEntre = (inicio?: { toDate: () => Date }, fim?: { toDate: () => Date }) => {
  if (!inicio || !fim) return null;
  const horas = (fim.toDate().getTime() - inicio.toDate().getTime()) / 3_600_000;
  return Number.isFinite(horas) && horas >= 0 ? horas : null;
};

const contarPor = <T>(itens: T[], obterChave: (item: T) => string) =>
  itens.reduce<Record<string, number>>((resultado, item) => {
    const chave = obterChave(item) || 'Não informado';
    resultado[chave] = (resultado[chave] || 0) + 1;
    return resultado;
  }, {});

const mediaHoras = (valores: Array<number | null>) => {
  const validos = valores.filter((valor): valor is number => valor !== null);
  return validos.length ? validos.reduce((soma, valor) => soma + valor, 0) / validos.length : null;
};

export const calcularKpisTickets = (tickets: TicketProblema[]) => {
  const resolvidos = tickets.filter((ticket) => ticket.status === 'Resolvido');
  return {
    total: tickets.length,
    porStatus: contarPor(tickets, (ticket) => ticket.status),
    porModulo: contarPor(tickets, (ticket) => ticket.moduloAferido),
    taxaResolucao: tickets.length ? (resolvidos.length / tickets.length) * 100 : 0,
    tempoMedioResolucaoHoras: mediaHoras(
      resolvidos.map((ticket) => horasEntre(ticket.dataCriacao, ticket.dataResolucao))
    ),
  };
};

export const calcularKpisSugestoes = (sugestoes: SugestaoMelhoria[]) => {
  const respondidas = sugestoes.filter((sugestao) => Boolean(sugestao.respostaAdmin?.trim()));
  return {
    total: sugestoes.length,
    porStatus: {
      Pendentes: sugestoes.length - respondidas.length,
      Respondidas: respondidas.length,
    },
    porCategoria: contarPor(sugestoes, (sugestao) => sugestao.categoria),
    taxaResposta: sugestoes.length ? (respondidas.length / sugestoes.length) * 100 : 0,
    tempoMedioRespostaHoras: mediaHoras(
      respondidas.map((sugestao) => horasEntre(sugestao.dataCriacao, sugestao.dataRespostaAdmin))
    ),
  };
};

export const ehDetratorNps = (nota: number | null) => nota !== null && nota <= 6;

export const classificarFaixaNps = (nota: number | null) => {
  if (nota === null || !Number.isFinite(nota)) {
    return { rotulo: 'Sem avaliações', detalhe: 'Aguardando respostas', cor: 'text-gray-600 bg-gray-100' };
  }
  if (nota <= 6) {
    return { rotulo: 'Faixa detratora', detalhe: 'Notas de 1 a 6', cor: 'text-red-700 bg-red-50' };
  }
  if (nota <= 8) {
    return { rotulo: 'Faixa neutra', detalhe: 'Notas 7 e 8', cor: 'text-amber-700 bg-amber-50' };
  }
  return { rotulo: 'Faixa promotora', detalhe: 'Notas 9 e 10', cor: 'text-green-700 bg-green-50' };
};

export const formatarDuracaoHoras = (horas: number | null) => {
  if (horas === null) return '—';
  if (horas < 24) return `${horas.toFixed(1)} h`;
  return `${(horas / 24).toFixed(1)} dias`;
};
