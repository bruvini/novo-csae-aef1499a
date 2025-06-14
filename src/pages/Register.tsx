
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAutenticacao } from "@/hooks/useAutenticacao";
import { cadastrarUsuario } from "@/services/bancodados/usuariosDB";
import { serverTimestamp } from "firebase/firestore";
import SimpleFooter from "@/components/SimpleFooter";
import TermoResponsabilidadeModal from "@/components/TermoResponsabilidadeModal";
import {
  registrationSchema,
  RegistrationSchema,
} from "@/lib/validators/registrationSchema";
import { Form } from "@/components/ui/form";
import PersonalInfoForm from "@/components/register/PersonalInfoForm";
import ProfessionalInfoForm from "@/components/register/ProfessionalInfoForm";
import AccessInfoForm from "@/components/register/AccessInfoForm";

interface TermoData {
  nomeCompleto: string;
  formacao: string;
  numeroCoren?: string;
  ufCoren?: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  rg: string;
  cpf: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { registrar } = useAutenticacao();
  const [carregando, setCarregando] = useState(false);
  const [modalTermoAberto, setModalTermoAberto] = useState(false);
  const [dadosParaTermo, setDadosParaTermo] = useState<TermoData | null>(null);

  const form = useForm<RegistrationSchema>({
    resolver: zodResolver(registrationSchema),
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
      formacao: undefined,
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
      confirmarSenha: "",
    },
  });

  const { watch, setValue } = form;
  const formacao = watch("formacao");
  const atuaSMS = watch("atuaSMS");

  useEffect(() => {
    if (
      formacao !== "Enfermeiro" &&
      formacao !== "Residente de Enfermagem" &&
      formacao !== "Técnico de Enfermagem"
    ) {
      setValue("numeroCoren", "");
      setValue("ufCoren", "");
    }
    if (formacao !== "Residente de Enfermagem") {
      setValue("dataInicioResidencia", "");
    }
    if (formacao !== "Acadêmico de Enfermagem") {
      setValue("iesEnfermagem", "");
    }
  }, [formacao, setValue]);

  useEffect(() => {
    if (atuaSMS) {
      setValue("cidadeTrabalho", "");
      setValue("localCargo", "");
    } else {
      setValue("lotacao", "");
      setValue("matricula", "");
    }
  }, [atuaSMS, setValue]);

  const onSubmit = (data: RegistrationSchema) => {
    if (!data.atuaSMS) {
      toast({
        title: "Acesso restrito",
        description:
          "Este portal é exclusivo para profissionais que atuam na Secretaria Municipal de Saúde de Florianópolis.",
        variant: "destructive",
      });
      return;
    }

    setDadosParaTermo({
      nomeCompleto: data.nomeCompleto,
      formacao: data.formacao,
      numeroCoren: data.numeroCoren,
      ufCoren: data.ufCoren,
      rua: data.rua,
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.cidade,
      uf: data.uf,
      rg: data.rg,
      cpf: data.cpf,
    });
    setModalTermoAberto(true);
  };

  const handleTermoAceito = async () => {
    setCarregando(true);
    setModalTermoAberto(false);
    const data = form.getValues();

    try {
      const usuarioAuth = await registrar(
        data.email,
        data.senha,
        data.nomeCompleto,
        "",
        ""
      );
      if (!usuarioAuth?.uid) {
        throw new Error("Falha na autenticação: UID inválido.");
      }

      const dadosPessoais = {
        nomeCompleto: data.nomeCompleto,
        rg: data.rg,
        cpf: data.cpf,
        rua: data.rua,
        numero: data.numero,
        bairro: data.bairro,
        cidade: data.cidade,
        uf: data.uf,
        cep: data.cep,
      };

      const dadosProfissionais = {
        formacao: data.formacao,
        ...(data.numeroCoren && { numeroCoren: data.numeroCoren }),
        ...(data.ufCoren && { ufCoren: data.ufCoren }),
        ...(data.formacao === "Residente de Enfermagem" &&
          data.dataInicioResidencia && {
            dataInicioResidencia: data.dataInicioResidencia,
          }),
        ...(data.formacao === "Acadêmico de Enfermagem" &&
          data.iesEnfermagem && { iesEnfermagem: data.iesEnfermagem }),
        atuaSMS: data.atuaSMS,
        ...(data.atuaSMS
          ? { lotacao: data.lotacao, matricula: data.matricula }
          : { cidadeTrabalho: data.cidadeTrabalho, localCargo: data.localCargo }),
      };

      await cadastrarUsuario({
        uid: usuarioAuth.uid,
        email: data.email,
        dadosPessoais,
        dadosProfissionais,
        termoResponsabilidadeAceito: true,
        termoResponsabilidadeData: serverTimestamp(),
        ehAdmin: false,
        gestorConteudos: false,
        tipoUsuario: "Comum",
      });

      toast({
        title: "Cadastro realizado com sucesso!",
        description:
          "Seu cadastro foi enviado para análise. Você receberá um e-mail quando for aprovado.",
      });

      navigate("/");
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      toast({
        title: "Erro no cadastro",
        description:
          "Ocorreu um erro ao realizar o cadastro. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="container max-w-4xl">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-csae-green-800 mb-2">
              Junte-se à evolução da enfermagem em Florianópolis
            </h1>
            <p className="text-gray-600">
              Os dados abaixo serão utilizados para garantir segurança aos seus
              dados e dos pacientes sobre seus cuidados, assim como para gerar o
              termo de responsabilidade sobre o uso da plataforma.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 bg-white p-8 rounded-lg shadow-lg"
            >
              <PersonalInfoForm form={form} isLoading={carregando} />
              <ProfessionalInfoForm form={form} isLoading={carregando} />
              <AccessInfoForm form={form} isLoading={carregando} />

              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="csae-btn-secondary order-2 sm:order-1"
                  disabled={carregando}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para o Login
                </Button>

                <Button
                  type="submit"
                  className="csae-btn-primary order-1 sm:order-2"
                  disabled={carregando}
                >
                  {carregando ? (
                    "Processando..."
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Criar Conta
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>

      <SimpleFooter />

      <TermoResponsabilidadeModal
        isOpen={modalTermoAberto}
        onClose={() => setModalTermoAberto(false)}
        onAccept={handleTermoAceito}
        dadosUsuario={dadosParaTermo}
      />
    </div>
  );
};

export default Register;
