import type { DadosProfissionais } from "@/types/usuario";

const rotulosProfissionais: Record<keyof DadosProfissionais, string> = {
  formacao: "Formação",
  numeroCoren: "Número do COREN",
  ufCoren: "UF do COREN",
  dataInicioResidencia: "Início da residência",
  iesEnfermagem: "Instituição de ensino",
  atuaSMS: "Atua na SMS",
  lotacao: "Lotação",
  matricula: "Matrícula",
  cidadeTrabalho: "Cidade de trabalho",
  localCargo: "Local / cargo",
};

const exibirValor = (valor: unknown) => {
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  return String(valor ?? "").trim() || "Não informado";
};

export const listarAlteracoesProfissionais = (
  anteriores: DadosProfissionais,
  novos: DadosProfissionais,
) =>
  (Object.keys(rotulosProfissionais) as Array<keyof DadosProfissionais>)
    .filter(
      (campo) => exibirValor(anteriores[campo]) !== exibirValor(novos[campo]),
    )
    .map((campo) => ({
      campo: rotulosProfissionais[campo],
      anterior: exibirValor(anteriores[campo]),
      novo: exibirValor(novos[campo]),
    }));
