import type { DadosProfissionais, Usuario } from "@/types/usuario";

const campos: Array<keyof DadosProfissionais> = [
  "formacao", "numeroCoren", "ufCoren", "dataInicioResidencia", "iesEnfermagem",
  "atuaSMS", "lotacao", "matricula", "cidadeTrabalho", "localCargo",
];

export function dadosProfissionaisIguais(a: DadosProfissionais, b: DadosProfissionais): boolean {
  return campos.every(chave => (a[chave] ?? "") === (b[chave] ?? ""));
}

export function verificarPrazoResidencia(
  usuario: Pick<Usuario, "dadosProfissionais">,
  referencia = new Date(),
): { termino: string; vencido: boolean; diasAposTermino: number } | null {
  const dados = usuario.dadosProfissionais;
  if (dados.formacao !== "Residente de Enfermagem") return null;
  const inicio = dados.dataInicioResidencia || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio)) return null;
  const data = new Date(`${inicio}T12:00:00Z`);
  if (!Number.isFinite(data.getTime()) || data.toISOString().slice(0, 10) !== inicio) return null;
  // Soma de dois anos pelo calendário, com cuidado especial para 29/02.
  const anoFinal = data.getUTCFullYear() + 2;
  const mes = data.getUTCMonth();
  const dia = data.getUTCDate();
  const final = new Date(Date.UTC(anoFinal, mes, dia, 12));
  // 29/02 não existe em muitos anos: término considerado em 28/02.
  if (final.getUTCMonth() !== mes) final.setUTCDate(0);
  const diaReferencia = Date.UTC(referencia.getFullYear(), referencia.getMonth(), referencia.getDate(), 12);
  const dias = Math.floor((diaReferencia - final.getTime()) / 86400000);
  return { termino: final.toISOString().slice(0, 10), vencido: dias >= 0, diasAposTermino: dias };
}

export function residentesParaRevisao(usuarios: Usuario[], data = new Date()) {
  return usuarios
    .map(usuario => ({ usuario, prazo: verificarPrazoResidencia(usuario, data) }))
    .filter((item): item is { usuario: Usuario; prazo: NonNullable<typeof item.prazo> } => !!item.prazo?.vencido)
    .sort((a, b) => b.prazo.diasAposTermino - a.prazo.diasAposTermino);
}

export function residentesSemData(usuarios: Usuario[]) {
  return usuarios.filter(u => u.dadosProfissionais.formacao === "Residente de Enfermagem"
    && !verificarPrazoResidencia(u));
}
