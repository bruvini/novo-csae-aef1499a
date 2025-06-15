
import { SinalVital, ValorReferencia } from "@/types/sinais-vitais";

const validateNumericValue = (valor: ValorReferencia) => {
  return valor.valorMinimo !== undefined || valor.valorMaximo !== undefined;
};

const validateTextValue = (valor: ValorReferencia) => {
  return !!valor.valorTexto?.trim();
};

const validateSexVariation = (valor: ValorReferencia) => {
  return !!valor.sexo;
};

const validateAgeVariation = (valor: ValorReferencia) => {
  return valor.idadeMinima !== undefined && valor.idadeMaxima !== undefined;
};

const validateAlterationRequirements = (valor: ValorReferencia) => {
  const hasTitle = !!valor.tituloAlteracao?.trim();
  const hasNhbs = valor.nhbIds && valor.nhbIds.length > 0;
  const hasDiagnoses = valor.diagnosticoIds && valor.diagnosticoIds.length > 0;
  
  return { hasTitle, hasNhbs, hasDiagnoses };
};

export const validarFormularioSinalVital = (formSinal: SinalVital): { valido: boolean; mensagem?: string } => {
    if (!formSinal.nome.trim()) {
      return {
        valido: false,
        mensagem: "Nome do sinal vital é obrigatório.",
      };
    }

    if (formSinal.valoresReferencia) {
      for (const [index, valor] of formSinal.valoresReferencia.entries()) {
        if (valor.tipoValor === "Numérico" && !valor.unidade?.trim()) {
          return {
            valido: false,
            mensagem: `Unidade é obrigatória para valores numéricos (valor #${index + 1}).`,
          };
        }

        if (valor.variacaoPor === "Sexo" || valor.variacaoPor === "Ambos") {
          if (!validateSexVariation(valor)) {
            return {
              valido: false,
              mensagem: `Sexo é obrigatório quando a variação inclui sexo (valor #${index + 1}).`,
            };
          }
        }

        if (valor.variacaoPor === "Idade" || valor.variacaoPor === "Ambos") {
          if (!validateAgeVariation(valor)) {
            return {
              valido: false,
              mensagem: `Idade mínima e máxima são obrigatórias quando a variação inclui idade (valor #${index + 1}).`,
            };
          }
        }

        if (valor.tipoValor === "Numérico") {
          if (!validateNumericValue(valor)) {
            return {
              valido: false,
              mensagem: `Pelo menos um valor (mínimo ou máximo) é obrigatório para valores numéricos (valor #${index + 1}).`,
            };
          }
        } else if (valor.tipoValor === "Texto") {
          if (!validateTextValue(valor)) {
            return {
              valido: false,
              mensagem: `Valor textual é obrigatório quando o tipo é texto (valor #${index + 1}).`,
            };
          }
        }

        if (valor.representaAlteracao) {
          const { hasTitle, hasNhbs, hasDiagnoses } = validateAlterationRequirements(valor);
          
          if (!hasTitle) {
            return {
              valido: false,
              mensagem: `Título da alteração é obrigatório quando o valor representa uma alteração (valor #${index + 1}).`,
            };
          }

          if (!hasNhbs) {
            return {
              valido: false,
              mensagem: `Pelo menos uma Necessidade Humana Básica (NHB) é obrigatória para valores que representam alteração (valor #${index + 1}).`,
            };
          }

          if (!hasDiagnoses) {
            return {
              valido: false,
              mensagem: `Pelo menos um Diagnóstico de Enfermagem é obrigatório para valores que representam alteração (valor #${index + 1}).`,
            };
          }
        }
      }
    }

    return { valido: true };
  };
