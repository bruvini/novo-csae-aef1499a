
import { z } from "zod";
import { formacoes } from "@/lib/constants";

export const registrationSchema = z.object({
  nomeCompleto: z.string().min(1, "Nome completo é obrigatório"),
  rg: z.string().min(1, "RG é obrigatório").regex(/^\d+$/, "Apenas números"),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos").regex(/^\d+$/, "Apenas números"),
  rua: z.string().min(1, "Rua é obrigatória"),
  numero: z.string().min(1, "Número é obrigatório"),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  uf: z.string().min(1, "UF é obrigatório"),
  cep: z.string().length(8, "CEP deve ter 8 dígitos").regex(/^\d+$/, "Apenas números"),

  formacao: z.enum(formacoes, { errorMap: () => ({ message: "Formação é obrigatória" }) }),
  numeroCoren: z.string().optional(),
  ufCoren: z.string().optional(),
  dataInicioResidencia: z.string().optional(),
  iesEnfermagem: z.string().optional(),
  
  atuaSMS: z.boolean(),
  lotacao: z.string().optional(),
  matricula: z.string().optional(),
  cidadeTrabalho: z.string().optional(),
  localCargo: z.string().optional(),

  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmarSenha: z.string().min(6, "A confirmação de senha deve ter no mínimo 6 caracteres"),
})
.superRefine((data, ctx) => {
    if (data.senha !== data.confirmarSenha) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "As senhas não conferem", path: ["confirmarSenha"] });
    }

    const hasCoren = ["Enfermeiro", "Residente de Enfermagem", "Técnico de Enfermagem"].includes(data.formacao);
    if (hasCoren) {
        if (!data.numeroCoren) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Número do COREN é obrigatório", path: ["numeroCoren"] });
        if (!data.ufCoren) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "UF do COREN é obrigatória", path: ["ufCoren"] });
    }

    if (data.formacao === "Residente de Enfermagem" && !data.dataInicioResidencia) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de início da residência é obrigatória", path: ["dataInicioResidencia"] });
    }

    if (data.formacao === "Acadêmico de Enfermagem" && !data.iesEnfermagem) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Instituição de ensino é obrigatória", path: ["iesEnfermagem"] });
    }

    if (data.atuaSMS) {
        if (!data.lotacao) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Lotação é obrigatória", path: ["lotacao"] });
        if (!data.matricula) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Matrícula é obrigatória", path: ["matricula"] });
    } else {
        if (!data.cidadeTrabalho) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cidade que trabalha é obrigatória", path: ["cidadeTrabalho"] });
        if (!data.localCargo) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Local/Cargo é obrigatório", path: ["localCargo"] });
    }
});

export type RegistrationSchema = z.infer<typeof registrationSchema>;
