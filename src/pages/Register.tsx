
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cadastrarUsuario } from "@/services/bancodados/usuariosDB";
import { collection, doc, getDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { createUserWithEmailAndPassword, inMemoryPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { registrationAuth, registrationDb } from "@/services/firebase";
import TermoResponsabilidadeModal from "@/components/TermoResponsabilidadeModal";
import {
  registrationSchema,
  RegistrationSchema,
} from "@/lib/validators/registrationSchema";
import { Form } from "@/components/ui/form";
import PersonalInfoForm from "@/components/register/PersonalInfoForm";
import ProfessionalInfoForm from "@/components/register/ProfessionalInfoForm";
import AccessInfoForm from "@/components/register/AccessInfoForm";
import { v4 as uuidv4 } from "uuid";
import { completeRegistration, criarOuRecuperarConta, RegistrationFlowError } from "@/services/registrationFlow";
import { registrarEventoCadastro } from "@/services/registrationTelemetry";
import type { UsuarioData } from "@/services/bancodados/usuariosDB";

interface TermoData {
  correlationId: string;
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
    // Limpeza inteligente de campos condicionados à formação
    if (!["Enfermeiro", "Residente de Enfermagem", "Técnico de Enfermagem"].includes(formacao)) {
      setValue("numeroCoren", "");
      setValue("ufCoren", "");
    }
    if (formacao !== "Residente de Enfermagem") setValue("dataInicioResidencia", "");
    if (formacao !== "Acadêmico de Enfermagem") setValue("iesEnfermagem", "");
  }, [formacao, setValue]);

  useEffect(() => {
    // Limpeza inteligente de campos condicionados à atuação SMS
    if (atuaSMS) {
      setValue("cidadeTrabalho", "");
      setValue("localCargo", "");
    } else {
      setValue("lotacao", "");
      setValue("matricula", "");
    }
  }, [atuaSMS, setValue]);

  const sanitizarDados = (data: RegistrationSchema) => {
    const raw = Object.fromEntries(
      Object.entries(data).filter(([key]) => key !== "confirmarSenha" && key !== "senha"),
    );
    const processed: Record<string, unknown> = {};
    Object.entries(raw).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== "") processed[key] = trimmed;
      } else if (value !== undefined && value !== null) {
        processed[key] = value;
      }
    });

    // 3. Destilação do Payload (Remover lixo de campos ocultos)
    const text = (key: string) => typeof processed[key] === "string" ? processed[key] as string : "";
    const dadosPessoais: UsuarioData["dadosPessoais"] = {
      nomeCompleto: text("nomeCompleto"), rg: text("rg"), cpf: text("cpf"), rua: text("rua"),
      numero: text("numero"), bairro: text("bairro"), cidade: text("cidade"), uf: text("uf"), cep: text("cep"),
    };
    const dadosProfissionais: UsuarioData["dadosProfissionais"] = {
      formacao: text("formacao"),
      atuaSMS: processed.atuaSMS === true,
    };

    if (text("numeroCoren")) dadosProfissionais.numeroCoren = text("numeroCoren");
    if (text("ufCoren")) dadosProfissionais.ufCoren = text("ufCoren");
    if (text("dataInicioResidencia")) dadosProfissionais.dataInicioResidencia = text("dataInicioResidencia");
    if (text("iesEnfermagem")) dadosProfissionais.iesEnfermagem = text("iesEnfermagem");

    if (dadosProfissionais.atuaSMS) {
      if (text("lotacao")) dadosProfissionais.lotacao = text("lotacao");
      if (text("matricula")) dadosProfissionais.matricula = text("matricula");
    } else {
      if (text("cidadeTrabalho")) dadosProfissionais.cidadeTrabalho = text("cidadeTrabalho");
      if (text("localCargo")) dadosProfissionais.localCargo = text("localCargo");
    }

    return { dadosPessoais, dadosProfissionais };
  };

  const onSubmit = (data: RegistrationSchema) => {
    if (!data.atuaSMS) {
      toast({
        title: "Acesso restrito",
        description: "Este portal é exclusivo para profissionais que atuam na Secretaria Municipal de Saúde de Florianópolis.",
        variant: "destructive",
      });
      return;
    }

    const correlationId = uuidv4();
    registrarEventoCadastro({ correlationId, stage: "form_validated" });
    setDadosParaTermo({
      correlationId,
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
    const correlationId = dadosParaTermo?.correlationId ?? uuidv4();
    registrarEventoCadastro({ correlationId, stage: "terms_accepted" });

    try {
      const sanitizedData = sanitizarDados(data);
      const profile = {
        email: data.email.trim().toLowerCase(),
        ...sanitizedData,
        termoResponsabilidadeAceito: true,
        termoResponsabilidadeData: serverTimestamp(),
        ehAdmin: false,
        gestorConteudos: false,
        tipoUsuario: "Comum",
        statusAcesso: "Aguardando",
      } as Omit<UsuarioData, "uid">;

      await completeRegistration({
        email: data.email.trim().toLowerCase(),
        password: data.senha,
        profile,
        correlationId,
        dependencies: {
          prepare: async () => {
            await setPersistence(registrationAuth, inMemoryPersistence);
            if (registrationAuth.currentUser) await signOut(registrationAuth);
          },
          createAccount: async (email, password) => {
            return criarOuRecuperarConta(email, password, {
              criarContaNova: async (address, secret) => {
                const credential = await createUserWithEmailAndPassword(registrationAuth, address, secret);
                return { uid: credential.user.uid };
              },
              autenticarContaExistente: async (address, secret) => {
                const credential = await signInWithEmailAndPassword(registrationAuth, address, secret);
                return { uid: credential.user.uid };
              },
              possuiPerfil: async (uid) => {
                const profileRef = doc(registrationDb, "usuarios", uid);
                const directProfile = await getDoc(profileRef);
                if (directProfile.exists()) return true;
                const legacyProfiles = await getDocs(query(
                  collection(registrationDb, "usuarios"),
                  where("uid", "==", uid),
                ));
                return !legacyProfiles.empty;
              },
            });
          },
          saveProfile: async (uid, userProfile) => {
            await cadastrarUsuario({ uid, ...userProfile }, registrationDb);
          },
          cleanup: async () => {
            if (registrationAuth.currentUser) await signOut(registrationAuth);
          },
          track: registrarEventoCadastro,
        },
      });

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu cadastro foi enviado para análise. Você receberá um e-mail quando for aprovado.",
      });

      navigate("/login");
    } catch (error) {
      const flowError = error instanceof RegistrationFlowError ? error : null;
      const errorCode = flowError?.errorCode ?? "unknown-error";
      let description = `Não foi possível concluir o envio. Informe o código ${correlationId} ao suporte e tente novamente somente após receber orientação.`;

      if (errorCode === "auth/email-already-in-use") {
        description = `Já existe uma conta associada a este e-mail. Não tente contornar usando outro endereço. Tente entrar ou recuperar a senha; se o cadastro anterior não aparecer para análise, fale com gerenf.sms.pmf@gmail.com ou @portalcsaefloripa e informe o código ${correlationId}.`;
      } else if (errorCode === "auth/profile-already-exists") {
        description = "Esta conta já possui um perfil no Portal. Acesse a opção de entrar ou redefina sua senha; o perfil existente não foi alterado.";
      } else if (errorCode === "auth/invalid-credential" || errorCode === "auth/wrong-password" || errorCode === "auth/user-not-found") {
        description = "Este e-mail já possui uma conta. Informe a senha já cadastrada ou use a recuperação de senha; não é necessário criar outra conta.";
      } else if (errorCode === "auth/weak-password") {
        description = "A senha não atende aos requisitos. Escolha uma senha mais segura e tente novamente.";
      } else if (flowError?.stage === "profile") {
        description = flowError.accountCreated
          ? `A conta foi criada, mas o perfil não foi confirmado no sistema. Não faça outro cadastro nem use outro e-mail. Fale com gerenf.sms.pmf@gmail.com ou @portalcsaefloripa e informe o código ${correlationId}.`
          : `A conta existente foi preservada, mas não foi possível salvar o perfil para análise. Tente novamente mais tarde ou informe o código ${correlationId} ao suporte.`;
      } else if (errorCode === "auth/network-request-failed" || errorCode === "unavailable") {
        description = `A conexão falhou antes da confirmação do cadastro. Verifique a internet e informe o código ${correlationId} ao suporte antes de repetir a tentativa.`;
      }

      toast({
        title: flowError?.stage === "profile" ? "Cadastro não confirmado" : "Não foi possível concluir o cadastro",
        description,
        variant: "destructive",
      });
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <main className="flex-grow container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          {/* Header de Boas-vindas Profissional */}
          <div className="mb-12 text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3 bg-csae-green-100 rounded-2xl mb-2 text-csae-green-700">
              <UserPlus className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Seja bem-vindo(a) ao <br/>
              <span className="text-csae-green-600 italic">Portal CSAE 2.0</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Inicie seu cadastro para acessar a plataforma oficial de gestão da assistência de enfermagem da Secretaria Municipal de Saúde de Florianópolis.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, () => {
                registrarEventoCadastro({ correlationId: uuidv4(), stage: "validation_rejected" });
              })}
              className="space-y-4"
            >
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden divide-y divide-gray-100">
                <div className="p-8 md:p-12 hover:bg-gray-50/30 transition-colors">
                  <PersonalInfoForm form={form} isLoading={carregando} />
                </div>
                <div className="p-8 md:p-12 hover:bg-gray-50/30 transition-colors">
                  <ProfessionalInfoForm form={form} isLoading={carregando} />
                </div>
                <div className="p-8 md:p-12 hover:bg-gray-50/30 transition-colors">
                  <AccessInfoForm form={form} isLoading={carregando} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 px-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="text-gray-500 hover:text-csae-green-700 hover:bg-csae-green-50 px-6 h-12 order-2 sm:order-1 font-semibold transition-all"
                  disabled={carregando}
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Voltar para o Login
                </Button>

                <Button
                  type="submit"
                  className="csae-btn-primary h-14 px-10 text-lg font-bold shadow-lg shadow-csae-green-600/30 w-full sm:w-auto order-1 sm:order-2 active:scale-[0.98] transition-all"
                  disabled={carregando}
                >
                  {carregando ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processando Cadastro...
                    </>
                  ) : (
                    <>
                      Concluir Cadastro
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <footer className="mt-20 py-8 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400 font-medium tracking-wide italic">
              "Enfermagem: Ciência, Arte e Tecnologia para Florianópolis."
            </p>
          </footer>
        </div>
      </main>

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
