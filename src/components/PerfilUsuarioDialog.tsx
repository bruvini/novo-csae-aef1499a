import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import {
  BadgeCheck, BriefcaseBusiness, CalendarClock, Download, FileCheck2,
  FileText, KeyRound, Mail, MapPin, PencilLine, ShieldCheck,
  UserRound, UsersRound,
} from "lucide-react";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Usuario } from "@/types/usuario";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SegurancaConta from "@/components/SegurancaConta";
import SolicitacaoProfissional from "@/components/SolicitacaoProfissional";
import {
  baixarSegundaViaResponsabilidade, baixarTermosUsoPublicado,
} from "@/utils/termosPdf";

interface Props { open: boolean; onOpenChange: (open: boolean) => void }
type Endereco = Pick<Usuario["dadosPessoais"], "rua" | "numero" | "bairro" | "cidade" | "uf" | "cep">;
const vazio: Endereco = { rua: "", numero: "", bairro: "", cidade: "", uf: "", cep: "" };
const campos: Array<{ id: keyof Endereco; label: string; max: number; span?: boolean }> = [
  { id: "rua", label: "Logradouro", max: 160, span: true },
  { id: "numero", label: "Número", max: 24 },
  { id: "bairro", label: "Bairro", max: 100 },
  { id: "cidade", label: "Cidade", max: 100 },
  { id: "uf", label: "UF", max: 2 },
  { id: "cep", label: "CEP", max: 12 },
];

function dataHora(data: { toDate?: () => Date } | undefined, fallback = "Não registrada") {
  const valor = data?.toDate?.();
  return valor ? valor.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) : fallback;
}
const exibir = (valor?: string | null) => valor?.trim() || "Não informado";
const siglaNome = (nome: string) => nome.trim().split(/\s+/)
  .filter(Boolean).slice(0, 2).map(parte => parte.charAt(0).toUpperCase()).join("") || "U";

function CardSecao({
  titulo, legenda, icone, children, acao,
}: {
  titulo: string; legenda?: string; icone: ReactNode;
  children: ReactNode; acao?: ReactNode;
}) {
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">{icone}</div>
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-900">{titulo}</h3>
          {legenda && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{legenda}</p>}
        </div>
      </div>
      {acao}
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>;
}

function Item({ titulo, valor, largo = false }: { titulo: string; valor?: string | null; largo?: boolean }) {
  return <div className={"min-w-0 " + (largo ? "sm:col-span-2" : "")}>
    <dt className="text-xs font-medium tracking-wide text-slate-500">{titulo}</dt>
    <dd className="mt-1 break-words text-sm font-semibold leading-relaxed text-slate-800">{exibir(valor)}</dd>
  </div>;
}

export default function PerfilUsuarioDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [endereco, setEndereco] = useState<Endereco>({ ...vazio });
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [editandoEndereco, setEditandoEndereco] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState<"" | "responsabilidade" | "termos">("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    let ativo = true;
    setCarregando(true);
    setErro("");
    setEditandoEndereco(false);
    void getDoc(doc(db, "usuarios", user.uid)).then(snap => {
      if (!ativo) return;
      if (!snap.exists()) {
        setErro("Seu cadastro não foi encontrado. Procure o suporte para revisar o vínculo com sua conta.");
        return;
      }
      const dados = snap.data() as Usuario;
      setPerfil(dados);
      setEndereco({
        rua: dados.dadosPessoais.rua || "", numero: dados.dadosPessoais.numero || "",
        bairro: dados.dadosPessoais.bairro || "", cidade: dados.dadosPessoais.cidade || "",
        uf: dados.dadosPessoais.uf || "", cep: dados.dadosPessoais.cep || "",
      });
    }).catch(() => {
      if (ativo) setErro("Não foi possível carregar seus dados. Tente novamente.");
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [open, user]);

  const atualizarEmail = useCallback((emailConfirmado: string) => {
    setPerfil(p => p ? { ...p, email: emailConfirmado } : p);
  }, []);

  const salvarEndereco = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !perfil) return;
    const novo = Object.fromEntries(Object.entries(endereco).map(([k, v]) => [k, v.trim()])) as Endereco;
    novo.uf = novo.uf.toUpperCase();
    if (campos.some(({ id, max }) => !novo[id] || novo[id].length > max)) {
      toast.error("Preencha todos os campos do endereço, respeitando os limites de cada campo.");
      return;
    }
    setSalvando(true);
    try {
      await updateDoc(doc(db, "usuarios", user.uid), {
        "dadosPessoais.rua": novo.rua,
        "dadosPessoais.numero": novo.numero,
        "dadosPessoais.bairro": novo.bairro,
        "dadosPessoais.cidade": novo.cidade,
        "dadosPessoais.uf": novo.uf,
        "dadosPessoais.cep": novo.cep,
      });
      setPerfil(p => p ? { ...p, dadosPessoais: { ...p.dadosPessoais, ...novo } } : p);
      setEndereco(novo);
      setEditandoEndereco(false);
      toast.success("Endereço atualizado.");
    } catch (error) {
      console.error("Não foi possível atualizar o endereço:", error);
      toast.error("Falha ao salvar endereço. Confira seu acesso.");
    } finally { setSalvando(false); }
  };

  async function gerarPdf(tipo: "responsabilidade" | "termos") {
    if (!perfil || gerandoPdf) return;
    setGerandoPdf(tipo);
    try {
      if (tipo === "responsabilidade") await baixarSegundaViaResponsabilidade(perfil);
      else await baixarTermosUsoPublicado();
      toast.success("Documento PDF preparado para download.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o PDF.");
    } finally { setGerandoPdf(""); }
  }

  const aprovado = perfil ? ["Liberado", "Aprovado"].includes(perfil.statusAcesso) : false;
  // Dados de aprovador só estão disponíveis se efetivamente registrados
  // na aprovação. Não inferimos o autor dos cadastros históricos.
  const aprovadoPor = perfil?.aprovadoPorNome ||
    perfil?.analisadoPor ||
    (perfil?.aprovadoPorUid ? "ID " + perfil.aprovadoPorUid : "Não registrado no histórico");
  const nome = perfil?.dadosPessoais.nomeCompleto || "Profissional";
  const profissional = perfil?.dadosProfissionais;

  return <Dialog open={open} onOpenChange={aberto => { if (!salvando && !gerandoPdf) onOpenChange(aberto); }}>
    <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.25rem)] flex-col gap-0 overflow-hidden rounded-3xl border-0 p-0 shadow-2xl sm:!max-w-[1120px]">
      <DialogHeader className="sr-only">
        <DialogTitle>Meu perfil e dados cadastrais</DialogTitle>
        <DialogDescription>Consulte seus dados, atualize seu endereço e segurança, solicite alterações profissionais e gere documentos.</DialogDescription>
      </DialogHeader>
      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
        <header className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 px-5 pb-7 pt-9 text-white sm:px-8 sm:pt-10">
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border-[40px] border-white/5" aria-hidden="true"/>
          <div className="relative flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/25 bg-white/15 text-3xl font-bold shadow-lg backdrop-blur">
              {siglaNome(nome)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">Minha conta · Portal CSAE</p>
              <h2 className="break-words text-2xl font-bold leading-tight sm:text-3xl">{nome}</h2>
              <p className="mt-1 text-sm text-emerald-50/90">{profissional?.formacao ?? "Profissional"} · {perfil?.email ?? ""}</p>
            </div>
            {perfil && <div className={"rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur " +
              (aprovado ? "border-emerald-200/40 bg-emerald-100/20 text-white" : "border-amber-200/50 bg-amber-100/20 text-amber-50")}>
              {aprovado ? "Acesso liberado" : "Situação: " + perfil.statusAcesso}
            </div>}
          </div>
        </header>

        {carregando ? <div className="p-12 text-center text-slate-600" role="status">Carregando seus dados cadastrais...</div>
        : erro ? <p role="alert" className="m-6 rounded-xl bg-rose-50 p-5 text-rose-800">{erro}</p>
        : perfil && user ? <div className="space-y-6 p-4 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"/>
              <div><p className="text-xs text-slate-500">Situação da conta</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{aprovado ? "Aprovada e ativa" : perfil.statusAcesso}</p></div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"/>
              <div><p className="text-xs text-slate-500">Data da aprovação</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{dataHora(perfil.dataAprovacao)}</p></div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm">
              <UsersRound className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700"/>
              <div><p className="text-xs text-slate-500">Quem aprovou</p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-900">{aprovadoPor}</p>
                {!perfil.aprovadoPorNome && !perfil.analisadoPor && <p className="mt-1 text-[11px] text-slate-500">Aprovações antigas podem não ter essa informação.</p>}
              </div>
            </div>
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-2">
            <CardSecao titulo="Identificação" legenda="Informações pessoais vinculadas à sua conta"
              icone={<UserRound className="h-5 w-5"/>}>
              <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <Item titulo="Nome completo" valor={perfil.dadosPessoais.nomeCompleto} largo />
                <Item titulo="CPF" valor={perfil.dadosPessoais.cpf}/>
                <Item titulo="RG" valor={perfil.dadosPessoais.rg}/>
                <Item titulo="E-mail de acesso" valor={perfil.email} largo/>
                <Item titulo="Cadastro realizado em" valor={dataHora(perfil.dataCadastro)} largo/>
              </dl>
            </CardSecao>

            <CardSecao titulo="Dados profissionais" legenda="Informações validadas pela equipe do Portal"
              icone={<BriefcaseBusiness className="h-5 w-5"/>}>
              <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                <Item titulo="Formação" valor={profissional?.formacao}/>
                <Item titulo="COREN / UF" valor={[profissional?.numeroCoren, profissional?.ufCoren].filter(Boolean).join("/")}/>
                <Item titulo="Vínculo com a SMS" valor={profissional?.atuaSMS ? "Sim" : "Não"}/>
                <Item titulo="Matrícula" valor={profissional?.matricula}/>
                <Item titulo="Lotação" valor={profissional?.lotacao} largo/>
                {(profissional?.dataInicioResidencia || profissional?.formacao === "Residente de Enfermagem") &&
                  <Item titulo="Início da residência" valor={profissional?.dataInicioResidencia}/>}
                {profissional?.iesEnfermagem && <Item titulo="Instituição de ensino" valor={profissional.iesEnfermagem}/>}
                {profissional?.cidadeTrabalho && <Item titulo="Cidade de trabalho" valor={profissional.cidadeTrabalho}/>}
                {profissional?.localCargo && <Item titulo="Local de trabalho / cargo" valor={profissional.localCargo}/>}
              </dl>
            </CardSecao>
          </div>

          <CardSecao titulo="Endereço residencial" legenda="Você pode atualizar seu endereço diretamente, sem nova aprovação"
            icone={<MapPin className="h-5 w-5"/>}
            acao={<Button type="button" size="sm" variant="outline" className="gap-2" onClick={() => setEditandoEndereco(v => !v)}>
              <PencilLine className="h-4 w-4"/>{editandoEndereco ? "Cancelar" : "Editar endereço"}
            </Button>}>
            {editandoEndereco ? <form onSubmit={e => void salvarEndereco(e)} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {campos.map(({ id, label, max, span }) => <div className={"space-y-1.5 " + (span ? "sm:col-span-2" : "")} key={id}>
                  <Label htmlFor={"endereco-" + id}>{label}</Label>
                  <Input id={"endereco-" + id} autoComplete="off" maxLength={max} required
                    disabled={salvando} value={endereco[id]}
                    onChange={e => setEndereco(prev => ({ ...prev, [id]: e.target.value }))}/>
                </div>)}
              </div>
              <Button type="submit" size="sm" disabled={salvando}>{salvando ? "Salvando..." : "Salvar endereço"}</Button>
            </form> :
            <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <Item titulo="Rua" valor={perfil.dadosPessoais.rua}/>
              <Item titulo="Número" valor={perfil.dadosPessoais.numero}/>
              <Item titulo="Bairro" valor={perfil.dadosPessoais.bairro}/>
              <Item titulo="Cidade" valor={perfil.dadosPessoais.cidade}/>
              <Item titulo="UF" valor={perfil.dadosPessoais.uf}/>
              <Item titulo="CEP" valor={perfil.dadosPessoais.cep}/>
            </dl>}
          </CardSecao>

          <CardSecao titulo="Alteração de dados profissionais"
            legenda="Solicite revisão de formação, COREN, vínculo institucional ou lotação"
            icone={<BriefcaseBusiness className="h-5 w-5"/>}>
            <SolicitacaoProfissional perfil={perfil}/>
          </CardSecao>

          <CardSecao titulo="Segurança da conta"
            legenda="E-mail, identificação, senha e recuperação de acesso"
            icone={<KeyRound className="h-5 w-5"/>}>
            <SegurancaConta user={user} perfil={perfil}
              onIdentityChange={(cpf, rg) => setPerfil(p => p ? {
                ...p, dadosPessoais: { ...p.dadosPessoais, cpf, rg },
              } : p)}
              onEmailChange={atualizarEmail}/>
          </CardSecao>

          <CardSecao titulo="Termos e documentos"
            legenda="Consulte o aceite registrado e faça download dos documentos"
            icone={<FileCheck2 className="h-5 w-5"/>}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-700"/>
                <div><p className="font-semibold text-slate-900">Termo de Responsabilidade e Sigilo</p>
                  <p className="text-xs text-slate-500">Aceite: {perfil.termoResponsabilidadeAceito ? dataHora(perfil.termoResponsabilidadeData) : "não registrado"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" className="gap-2"
                  disabled={Boolean(gerandoPdf) || !perfil.termoResponsabilidadeAceito}
                  onClick={() => void gerarPdf("responsabilidade")}>
                  <Download className="h-4 w-4"/> {gerandoPdf === "responsabilidade" ? "Gerando..." : "Segunda via em PDF"}
                </Button>
                <Button type="button" size="sm" variant="outline" className="gap-2"
                  disabled={Boolean(gerandoPdf)} onClick={() => void gerarPdf("termos")}>
                  <FileText className="h-4 w-4"/> {gerandoPdf === "termos" ? "Gerando..." : "Termos de Uso em PDF"}
                </Button>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              A segunda via de responsabilidade é gerada com os dados cadastrais atuais e identifica a data do aceite eletrônico original. Como o PDF do cadastro não é arquivado, ela não é uma cópia autenticada do arquivo original.
            </p>
          </CardSecao>
        </div> : <p className="p-7 text-sm text-slate-600">Dados cadastrais indisponíveis.</p>}
      </div>
    </DialogContent>
  </Dialog>;
}
