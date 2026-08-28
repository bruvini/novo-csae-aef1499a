import type { Usuario } from "@/types/usuario";

type DataFirestore = { toDate: () => Date } | Date | undefined;

const paraData = (valor: DataFirestore) => {
  if (!valor) return null;
  const data = valor instanceof Date ? valor : valor.toDate();
  return Number.isNaN(data.getTime()) ? null : data;
};

const diasEntre = (inicio: DataFirestore, fim: DataFirestore) => {
  const dataInicio = paraData(inicio);
  const dataFim = paraData(fim);
  if (!dataInicio || !dataFim) return null;
  const dias = (dataFim.getTime() - dataInicio.getTime()) / 86_400_000;
  return dias >= 0 && Number.isFinite(dias) ? dias : null;
};

const media = (valores: Array<number | null>) => {
  const validos = valores.filter((valor): valor is number => valor !== null);
  return validos.length
    ? validos.reduce((total, valor) => total + valor, 0) / validos.length
    : null;
};

export interface GruposUsuarios {
  aguardando: Usuario[];
  aprovados: Usuario[];
  recusados: Usuario[];
  alteracoes: Usuario[];
}

export const calcularKpisUsuarios = (
  grupos: GruposUsuarios,
  agora = new Date(),
) => {
  const analisados = [...grupos.aprovados, ...grupos.recusados];
  const temposDecisao = analisados.map((usuario) =>
    diasEntre(
      usuario.dataCadastro,
      usuario.dataAprovacao ?? usuario.dataRecusa,
    ),
  );
  const temposEspera = grupos.aguardando.map((usuario) =>
    diasEntre(usuario.dataCadastro, agora),
  );

  return {
    total:
      grupos.aguardando.length +
      grupos.aprovados.length +
      grupos.recusados.length +
      grupos.alteracoes.length,
    aguardando: grupos.aguardando.length,
    aprovados: grupos.aprovados.length,
    recusados: grupos.recusados.length,
    alteracoes: grupos.alteracoes.length,
    taxaAprovacao: analisados.length
      ? (grupos.aprovados.length / analisados.length) * 100
      : 0,
    tempoMedioDecisaoDias: media(temposDecisao),
    tempoMedioEsperaDias: media(temposEspera),
  };
};

export const formatarDias = (dias: number | null) => {
  if (dias === null) return "—";
  if (dias < 1) return `${Math.max(0, dias * 24).toFixed(1)} h`;
  return `${dias.toFixed(1)} dias`;
};
