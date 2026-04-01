
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cadastrarUsuario } from "@/services/bancodados/usuariosDB";
import { serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { auth } from "@/services/firebase";
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
    const fieldsToClear = [];
    if (!["Enfermeiro", "Residente de Enfermagem", "Técnico de Enfermagem"].includes(formacao)) {
      fieldsToClear.push("numeroCoren", "ufCoren");
    }
    if (formacao !== "Residente de Enfermagem") fieldsToClear.push("dataInicioResidencia");
    if (formacao !== "Acadêmico de Enfermagem") fieldsToClear.push("iesEnfermagem");
    
    fieldsToClear.forEach(field => setValue(field as any, ""));
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
    const raw = { ...data };
    
    // 1. Remover campos de controle de UI/Auth sensíveis
    delete (raw as any).confirmarSenha;
    delete (raw as any).senha; // Senha vai apenas para o Auth, não para o Firestore

    // 2. Higienização de Strings (Trim e Limpeza)
    const processed: any = {};
    Object.entries(raw).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== "") processed[key] = trimmed;
      } else if (value !== undefined && value !== null) {
        processed[key] = value;
      }
    });

    // 3. Destilação do Payload (Remover lixo de campos ocultos)
    const payload: any = {
      dadosPessoais: {
        nomeCompleto: processed.nomeCompleto,
        rg: processed.rg,
        cpf: processed.cpf,
        rua: processed.rua,
        numero: processed.numero,
        bairro: processed.bairro,
        cidade: processed.cidade,
        uf: processed.uf,
        cep: processed.cep,
      },
      dadosProfissionais: {
        formacao: processed.formacao,
        atuaSMS: processed.atuaSMS,
      }
    };

    // Adição condicional baseada na formação (apenas o que existe)
    if (processed.numeroCoren) payload.dadosProfissionais.numeroCoren = processed.numeroCoren;
    if (processed.ufCoren) payload.dadosProfissionais.ufCoren = processed.ufCoren;
    if (processed.dataInicioResidencia) payload.dadosProfissionais.dataInicioResidencia = processed.dataInicioResidencia;
    if (processed.iesEnfermagem) payload.dadosProfissionais.iesEnfermagem = processed.iesEnfermagem;

    // Adição condicional baseada na lotação
    if (processed.atuaSMS) {
      payload.dadosProfissionais.lotacao = processed.lotacao;
      payload.dadosProfissionais.matricula = processed.matricula;
    } else {
      payload.dadosProfissionais.cidadeTrabalho = processed.cidadeTrabalho;
      payload.dadosProfissionais.localCargo = processed.localCargo;
    }

    return payload;
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
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.senha);
      const usuarioAuth = userCredential.user;

      if (!usuarioAuth?.uid) {
        throw new Error("Falha na autenticação: UID inválido.");
      }

      const sanitizedData = sanitizarDados(data);

      try {
        await cadastrarUsuario({
          uid: usuarioAuth.uid,
          email: data.email.trim().toLowerCase(),
          ...sanitizedData,
          termoResponsabilidadeAceito: true,
          termoResponsabilidadeData: serverTimestamp(),
          ehAdmin: false,
          gestorConteudos: false,
          tipoUsuario: "Comum",
          statusAcesso: "Aguardando", // Explicitamente definindo status inicial
        });
      } catch (firestoreError) {
        console.error("Erro ao gravar documento no Firestore:", firestoreError);
        // Rollback: excluir usuário do Authentication se Firestore falhar
        try {
          await deleteUser(usuarioAuth);
          console.log("Rollback executado: usuário removido do Auth.");
        } catch (rollbackError) {
          console.error("Erro severo ao realizar rollback no Auth:", rollbackError);
        }
        
        // Relançar um erro claro
        if (firestoreError instanceof Error && firestoreError.message.includes('permission-denied')) {
            throw new Error("Permissão negada no Firestore (permission-denied). Contate o suporte.");
        }
        throw new Error("Falha na gravação do Firestore. O cadastro foi revertido.");
      }

      await signOut(auth);

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Seu cadastro foi enviado para análise. Você receberá um e-mail quando for aprovado.",
      });

      navigate("/login");
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      let description = "Ocorreu um erro ao realizar o cadastro. Por favor, tente novamente.";
      if (error instanceof Error && 'code' in error) {
        const firebaseError = error as { code: string };
        if (firebaseError.code === 'auth/email-already-in-use') {
            description = "Este e-mail já está em uso por outra conta.";
        } else if (firebaseError.code === 'auth/weak-password') {
            description = "A senha é muito fraca. Use pelo menos 6 caracteres.";
        }
      } else if (error instanceof Error) {
        description = error.message; // Mostrar a mensagem real de erro caso não seja firebase auth
      }
      toast({
        title: "Erro no cadastro",
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
              onSubmit={form.handleSubmit(onSubmit)}
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
