export type RegistrationStatusGroup = "Liberado" | "Aguardando" | "Recusado" | "Status não identificado";

export function timestampToDate(value: unknown): Date | null {
  try {
    let date: Date | null = null;
    if (value instanceof Date) date = value;
    else if (typeof value === "object" && value !== null && "toDate" in value) {
      date = (value as { toDate: () => Date }).toDate();
    } else if (typeof value === "string" || typeof value === "number") {
      date = new Date(value);
    }
    return date && !Number.isNaN(date.getTime()) ? date : null;
  } catch {
    return null;
  }
}

export function ordenarPerfisPorDataCadastro<T extends { dataCadastro?: unknown }>(profiles: T[]): T[] {
  return profiles.sort((a, b) =>
    (timestampToDate(b.dataCadastro)?.getTime() ?? 0) -
    (timestampToDate(a.dataCadastro)?.getTime() ?? 0),
  );
}

export function agruparStatusCadastro(value: unknown): RegistrationStatusGroup {
  const status = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (["liberado", "aprovado"].includes(status)) return "Liberado";
  if (["aguardando", "pendente"].includes(status)) return "Aguardando";
  if (["recusado", "rejeitado"].includes(status)) return "Recusado";
  return "Status não identificado";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function perfilCadastroIncompleto(value: unknown): boolean {
  if (!isRecord(value)) return true;
  const dadosPessoais = isRecord(value.dadosPessoais) ? value.dadosPessoais : {};
  const dadosProfissionais = isRecord(value.dadosProfissionais) ? value.dadosProfissionais : {};

  return !(
    hasText(value.email) &&
    hasText(dadosPessoais.nomeCompleto) &&
    hasText(dadosPessoais.cpf) &&
    hasText(dadosProfissionais.formacao) &&
    typeof dadosProfissionais.atuaSMS === "boolean" &&
    agruparStatusCadastro(value.statusAcesso) !== "Status não identificado"
  );
}
