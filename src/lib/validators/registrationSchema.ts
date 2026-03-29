
import { z } from "zod";
import { formacoes } from "@/lib/constants";

export const registrationSchema = z.object({
  nomeCompleto: z.string().trim().min(5, "Por favor, insira seu nome completo (mínimo 5 caracteres)"),
  rg: z.string().trim().min(5, "RG é obrigatório (mínimo 5 dígitos)").regex(/^\d+$/, "RG deve conter apenas números"),
  cpf: z.string().trim().length(11, "O CPF deve ter exatamente 11 dígitos").regex(/^\d+$/, "CPF deve conter apenas números"),
  rua: z.string().trim().min(3, "Rua é obrigatória"),
  numero: z.string().trim().min(1, "Número é obrigatório (use S/N se necessário)"),
  bairro: z.string().trim().min(2, "Bairro é obrigatório"),
  cidade: z.string().trim().min(2, "Cidade é obrigatória"),
  uf: z.string().trim().min(2, "Estado (UF) é obrigatório"),
  cep: z.string().trim().length(8, "O CEP deve ter exatamente 8 dígitos").regex(/^\d+$/, "CEP deve conter apenas números"),

  formacao: z.enum(formacoes, { 
    errorMap: () => ({ message: "Por favor, selecione sua formação profissional" }) 
  }),
  numeroCoren: z.string().trim().optional(),
  ufCoren: z.string().trim().optional(),
  dataInicioResidencia: z.string().trim().optional(),
  iesEnfermagem: z.string().trim().optional(),
  
  atuaSMS: z.boolean().refine(val => val === true, {
    message: "O acesso é exclusivo para profissionais que atuam na SMS Florianópolis"
  }),
  lotacao: z.string().trim().optional(),
  matricula: z.string().trim().optional(),
  cidadeTrabalho: z.string().trim().optional(),
  localCargo: z.string().trim().optional(),

  email: z.string().trim().email("Por favor, insira um e-mail válido"),
  senha: z.string().min(6, "A senha deve ter no mínimo 6 caracteres para sua segurança"),
  confirmarSenha: z.string().min(6, "Repita a senha para confirmação"),
})
.superRefine((data, ctx) => {
    // Validação de correspondência de senha
    if (data.senha !== data.confirmarSenha) {
        ctx.addIssue({ 
          code: z.ZodIssueCode.custom, 
          message: "As senhas não conferem. Verifique a digitação.", 
          path: ["confirmarSenha"] 
        });
    }

    // Validação de campos técnicos/enfermagem
    const precisaCoren = ["Enfermeiro", "Residente de Enfermagem", "Técnico de Enfermagem"].includes(data.formacao);
    if (precisaCoren) {
        if (!data.numeroCoren || data.numeroCoren.length < 3) {
            ctx.addIssue({ 
              code: z.ZodIssueCode.custom, 
              message: "Número do COREN é obrigatório e deve ser válido", 
              path: ["numeroCoren"] 
            });
        }
        if (!data.ufCoren) {
            ctx.addIssue({ 
              code: z.ZodIssueCode.custom, 
              message: "Selecione o estado (UF) do registro COREN", 
              path: ["ufCoren"] 
            });
        }
    }

    // Validação de Residentes
    if (data.formacao === "Residente de Enfermagem" && !data.dataInicioResidencia) {
        ctx.addIssue({ 
          code: z.ZodIssueCode.custom, 
          message: "A data de início da residência é obrigatória para este perfil", 
          path: ["dataInicioResidencia"] 
        });
    }

    // Validação de Acadêmicos
    if (data.formacao === "Acadêmico de Enfermagem" && !data.iesEnfermagem) {
        ctx.addIssue({ 
          code: z.ZodIssueCode.custom, 
          message: "A Instituição de Ensino Superior (IES) é obrigatória", 
          path: ["iesEnfermagem"] 
        });
    }

    // Validação de Atuação SMS - Reforço contextual
    if (data.atuaSMS) {
        if (!data.lotacao) {
            ctx.addIssue({ 
              code: z.ZodIssueCode.custom, 
              message: "Selecione a sua unidade de lotação na SMS", 
              path: ["lotacao"] 
            });
        }
        if (!data.matricula || data.matricula.length < 3) {
            ctx.addIssue({ 
              code: z.ZodIssueCode.custom, 
              message: "A matrícula PMF é obrigatória e deve ser válida", 
              path: ["matricula"] 
            });
        }
    }
});

export type RegistrationSchema = z.infer<typeof registrationSchema>;
