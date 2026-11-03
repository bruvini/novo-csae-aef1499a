import type { DadosProfissionais, Usuario } from "@/types/usuario";

const campos: Array<keyof DadosProfissionais> = [
  "formacao", "numeroCoren", "ufCoren", "dataInicioResidencia", "iesEnfermagem",
  "atuaSMS", "lotacao", "matricula", "cidadeTrabalho", "localCargo",
];

export function dadosProfissionaisIguais(a: DadosProfissionais, b: DadosProfissionais): boolean {
  return campos.every(chave => (a[chave] ?? "") === (b[chave] ?? ""));
}


/**
 * Todas as decisões de residência usam o dia civil de Florianópolis, sem
 * depender do timezone do navegador nem de diferenças de 23/25 horas.
 */
export function dataCivilSaoPaulo(referencia = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(referencia);
  const obter = (tipo: string) => partes.find(p => p.type === tipo)?.value ?? "";
  return [obter("year"), obter("month"), obter("day")].join("-");
}

export function dataISOValida(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const dia = new Date(iso + "T12:00:00Z");
  return !Number.isNaN(dia.getTime()) && dia.toISOString().slice(0, 10) === iso;
}

export function somarDiasCivis(iso: string, dias: number): string {
  if (!dataISOValida(iso) || !Number.isInteger(dias)) throw new Error("Data ou prazo inválido.");
  const date = new Date(iso + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + dias);
  return date.toISOString().slice(0, 10);
}

export function marcoDoisAnosResidencia(inicio: string): string | null {
  if (!dataISOValida(inicio)) return null;
  const [ano, mes, dia] = inicio.split("-").map(Number);
  // A regra institucional é 01/03 em anos não bissextos para início em 29/02.
  const marco = new Date(Date.UTC(ano + 2, mes - 1, dia, 12));
  return marco.toISOString().slice(0, 10);
}

const diasEntreDatas = (inicio: string, fim: string): number =>
  Math.round((new Date(fim + "T12:00:00Z").getTime() -
    new Date(inicio + "T12:00:00Z").getTime()) / 86_400_000);

export interface PrazoRevisaoResidencia {
  termino: string;
  proximaVerificacao: string;
  origem: "biênio" | "prorrogação";
  vencido: boolean;
  diasAposTermino: number;
}

export function verificarPrazoResidencia(
  usuario: Pick<Usuario, "dadosProfissionais" | "revisaoResidenciaEm">,
  referencia = new Date(),
): PrazoRevisaoResidencia | null {
  const dados = usuario.dadosProfissionais;
  if (dados.formacao !== "Residente de Enfermagem") return null;
  const termino = marcoDoisAnosResidencia(dados.dataInicioResidencia ?? "");
  if (!termino) return null;
  const proxima = usuario.revisaoResidenciaEm || "";
  if (proxima && !dataISOValida(proxima)) return null;
  const prorrogado = Boolean(proxima);
  const proximaVerificacao = prorrogado ? proxima : somarDiasCivis(termino, 1);
  const hoje = dataCivilSaoPaulo(referencia);
  const dias = diasEntreDatas(proximaVerificacao, hoje);
  return {
    termino,
    proximaVerificacao,
    origem: prorrogado ? "prorrogação" : "biênio",
    vencido: dias >= 0,
    diasAposTermino: dias,
  };
}

export function residentesParaRevisao(usuarios: Usuario[], data = new Date()) {
  return usuarios
    .filter(u => ["Aprovado", "Liberado"].includes(u.statusAcesso) && u.alteracaoCadastralPendente !== true)
    .map(usuario => ({ usuario, prazo: verificarPrazoResidencia(usuario, data) }))
    .filter((item): item is { usuario: Usuario; prazo: PrazoRevisaoResidencia } => !!item.prazo?.vencido)
    .sort((a, b) => b.prazo.diasAposTermino - a.prazo.diasAposTermino);
}

export function residentesSemData(usuarios: Usuario[]) {
  return usuarios.filter(u =>
    ["Aprovado", "Liberado"].includes(u.statusAcesso)
    && u.dadosProfissionais.formacao === "Residente de Enfermagem"
    && !verificarPrazoResidencia(u));
}
