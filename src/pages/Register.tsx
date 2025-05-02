import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User, Phone, MapPin, IdCard, GraduationCap, Briefcase, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAutenticacao } from "@/services/autenticacao";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  nomeCompleto: z.string().min(3, { message: "Nome completo é obrigatório" }),
  rg: z.string().min(9, { message: "RG é obrigatório" }),
  cpf: z.string().min(11, { message: "CPF é obrigatório" }),
  rua: z.string().min(3, { message: "Rua é obrigatória" }),
  numero: z.string().min(1, { message: "Número é obrigatório" }),
  bairro: z.string().min(3, { message: "Bairro é obrigatório" }),
  cidade: z.string().min(3, { message: "Cidade é obrigatória" }),
  uf: z.string().min(2, { message: "UF é obrigatória" }),
  cep: z.string().min(8, { message: "CEP é obrigatório" }),
  formacao: z.enum(['Enfermeiro', 'Residente de Enfermagem', 'Técnico de Enfermagem', 'Acadêmico de Enfermagem'], {
    required_error: "A sua formação é necessária.",
  }),
  numeroCoren: z.string().optional(),
  ufCoren: z.string().optional(),
  dataInicioResidencia: z.string().optional(),
  iesEnfermagem: z.string().optional(),
  atuaSMS: z.boolean().default(false),
  lotacao: z.string().optional(),
  matricula: z.string().optional(),
  cidadeTrabalho: z.string().optional(),
  localCargo: z.string().optional(),
  email: z.string().email({ message: "Email inválido" }),
  senha: z.string().min(6, { message: "Senha precisa ter no mínimo 6 caracteres" }),
});

const Register = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { registrarUsuario } = useAutenticacao();
  const { toast } = useToast();
  const router = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: "",
      rg: "",
      cpf: "",
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "",
      cep: "",
      formacao: "Enfermeiro",
      numeroCoren: "",
      ufCoren: "",
      dataInicioResidencia: "",
      iesEnfermagem: "",
      atuaSMS: false,
      lotacao: "",
      matricula: "",
      cidadeTrabalho: "",
      localCargo: "",
      email: "",
      senha: "",
    },
  });

  const handleFormacaoChange = (value: string) => {
    form.setValue("formacao", value);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
  setIsSubmitting(true);
  
  try {
    const { email, senha, ...resto } = values;
    const resultado = await registrarUsuario(email, senha, resto);
    
    if (resultado.sucesso && resultado.usuario) {
      router.push("/");
      toast({
        title: "Cadastro realizado com sucesso",
        description: "Seu cadastro está aguardando aprovação.",
      });
    } else {
      toast({
        title: "Erro no cadastro",
        description: resultado.mensagem || "Ocorreu um erro desconhecido",
        variant: "destructive",
      });
    }
  } catch (error: any) {
    console.error("Erro durante o registro:", error);
    toast({
      title: "Erro no cadastro",
      description: error.message || "Ocorreu um erro desconhecido",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <>
      <Helmet>
        <title>Registrar | CSAE</title>
      </Helmet>

      <div className="container mx-auto py-10 flex justify-center items-start">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg animate-fade-in">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-csae-green-800">
              Crie sua conta
            </h1>
            <p className="text-sm text-gray-500">
              Preencha os dados abaixo para solicitar acesso à plataforma
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite seu nome completo" {...form.register("nomeCompleto")} />
                  </FormControl>
                  <FormDescription>Este é o nome que será exibido em seu perfil.</FormDescription>
                  <FormMessage />
                </FormItem>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite seu RG" {...form.register("rg")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>

                <div className="space-y-2">
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite seu CPF" {...form.register("cpf")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              </div>

              <div className="space-y-2">
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <FormControl>
                        <Input placeholder="Rua" {...form.register("rua")} />
                      </FormControl>
                    </div>
                    <div className="col-span-1">
                      <FormControl>
                        <Input placeholder="Número" {...form.register("numero")} />
                      </FormControl>
                    </div>
                    <div className="col-span-1">
                      <FormControl>
                        <Input placeholder="CEP" {...form.register("cep")} />
                      </FormControl>
                    </div>
                  </div>
                  <FormDescription>Rua, número e CEP.</FormDescription>
                  <FormMessage />
                </FormItem>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Bairro" {...form.register("bairro")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>

                <div className="space-y-2">
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Cidade" {...form.register("cidade")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>

                <div className="space-y-2">
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <FormControl>
                      <Input placeholder="UF" {...form.register("uf")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              </div>

              <div className="space-y-2">
                <FormItem>
                  <FormLabel>Formação</FormLabel>
                  <Select onValueChange={handleFormacaoChange} defaultValue={form.getValues("formacao")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione sua formação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Enfermeiro">Enfermeiro(a)</SelectItem>
                      <SelectItem value="Residente de Enfermagem">Residente de Enfermagem</SelectItem>
                      <SelectItem value="Técnico de Enfermagem">Técnico(a) de Enfermagem</SelectItem>
                      <SelectItem value="Acadêmico de Enfermagem">Acadêmico(a) de Enfermagem</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Qual sua formação na área de enfermagem?</FormDescription>
                  <FormMessage />
                </FormItem>
              </div>

              {form.getValues("formacao") !== "Acadêmico de Enfermagem" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormItem>
                      <FormLabel>Número do COREN</FormLabel>
                      <FormControl>
                        <Input placeholder="Número do COREN" {...form.register("numeroCoren")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>

                  <div className="space-y-2">
                    <FormItem>
                      <FormLabel>UF do COREN</FormLabel>
                      <FormControl>
                        <Input placeholder="UF do COREN" {...form.register("ufCoren")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                </div>
              )}

              {form.getValues("formacao") === "Residente de Enfermagem" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormItem>
                      <FormLabel>Data de Início da Residência</FormLabel>
                      <FormControl>
                        <Input type="date" {...form.register("dataInicioResidencia")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>

                  <div className="space-y-2">
                    <FormItem>
                      <FormLabel>IES da Residência</FormLabel>
                      <FormControl>
                        <Input placeholder="IES da Residência" {...form.register("iesEnfermagem")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <FormItem>
                  <div className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-csae-green-600 focus:ring-csae-green-500"
                        {...form.register("atuaSMS")}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Atua na SMS?
                    </FormLabel>
                  </div>
                  <FormDescription>Você atua na Secretaria Municipal de Saúde?</FormDescription>
                  <FormMessage />
                </FormItem>
              </div>

              {form.getValues("atuaSMS") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormItem>
                      <FormLabel>Lotação</FormLabel>
                      <FormControl>
                        <Input placeholder="Lotação" {...form.register("lotacao")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>

                  <div className="space-y-2">
                    <FormItem>
                      <FormLabel>Matrícula</FormLabel>
                      <FormControl>
                        <Input placeholder="Matrícula" {...form.register("matricula")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                </div>
              )}

              {form.getValues("atuaSMS") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FormItem>
                      <FormLabel>Cidade de Trabalho</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade de Trabalho" {...form.register("cidadeTrabalho")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>

                  <div className="space-y-2">
                    <FormItem>
                      <FormLabel>Local/Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Local/Cargo" {...form.register("localCargo")} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Digite seu email" {...form.register("email")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              <div className="space-y-2">
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Digite sua senha" {...form.register("senha")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </div>

              <Button type="submit" className="w-full csae-btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M12 4V2m0 16v2m8-8h2M4 12H2m7.9-7.9l1.4 1.4M17.1 6.9l-1.4-1.4M6.9 17.1l-1.4 1.4M17.1 17.1l1.4-1.4" opacity=".5"/>
                      <path fill="currentColor" d="M12 22C7.029 22 3 17.971 3 12S7.029 2 12 2s9 4.029 9 9-4.029 10-9 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="15.708 15.708" strokeDashoffset="15.708"/>
                    </svg>
                    Cadastrando...
                  </>
                ) : (
                  "Solicitar Acesso"
                )}
              </Button>
              <div className="text-sm text-gray-500 text-center">
                Já possui uma conta?{" "}
                <Link to="/" className="csae-link">
                  Acesse agora
                </Link>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
};

export default Register;
