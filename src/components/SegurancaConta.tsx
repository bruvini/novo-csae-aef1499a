import { useEffect, useState } from "react";
import {
  EmailAuthProvider, getIdToken, reauthenticateWithCredential,
  reload, sendPasswordResetEmail, updatePassword, verifyBeforeUpdateEmail,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "@/services/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2, KeyRound, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import type { Usuario } from "@/types/usuario";

interface Props {
  user: User;
  perfil: Usuario;
  onIdentityChange: (cpf: string, rg: string) => void;
  onEmailChange: (email: string) => void;
}

export function mensagemErroConta(error: unknown): string {
  const codigo = (error as { code?: string })?.code;
  if (codigo === "auth/email-already-in-use") return "Este e-mail já está associado a outra conta.";
  if (codigo === "auth/wrong-password" || codigo === "auth/invalid-credential") return "A senha atual não confere.";
  if (codigo === "auth/requires-recent-login") return "Por segurança, autentique-se novamente para concluir a operação.";
  if (codigo === "auth/weak-password") return "A senha escolhida não atende aos requisitos mínimos.";
  if (codigo === "auth/too-many-requests") return "Muitas tentativas. Aguarde antes de repetir.";
  if (codigo === "auth/operation-not-allowed") return "Esta alteração não está disponível para o seu método de login.";
  if (codigo === "auth/invalid-email") return "Informe um e-mail válido.";
  return error instanceof Error ? error.message : "Não foi possível concluir a solicitação.";
}

export function validarTrocaSenha(atual: string, nova: string, confirmacao: string): string[] {
  const problemas: string[] = [];
  if (!atual) problemas.push("Informe a senha atual.");
  if (nova.length < 10) problemas.push("A nova senha precisa ter pelo menos 10 caracteres.");
  if (nova === atual) problemas.push("Escolha uma senha diferente da atual.");
  if (nova !== confirmacao) problemas.push("A confirmação não é igual à nova senha.");
  return problemas;
}

export default function SegurancaConta({ user, perfil, onIdentityChange, onEmailChange }: Props) {
  const [emailNovo, setEmailNovo] = useState(user.email ?? perfil.email);
  const [senhaEmail, setSenhaEmail] = useState("");
  const [emailPendente, setEmailPendente] = useState("");
  const [cpf, setCpf] = useState(perfil.dadosPessoais.cpf);
  const [rg, setRg] = useState(perfil.dadosPessoais.rg);
  const [senhaIdentidade, setSenhaIdentidade] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [ocupado, setOcupado] = useState<"email" | "identidade" | "senha" | "recuperar" | "">("");

  // A confirmação do link acontece fora desta tela. Ao retornar à aba,
  // o Firebase Authentication já é a fonte da verdade; o perfil é sincronizado
  // sem pedir que o usuário clique num segundo botão.
  useEffect(() => {
    let desativado = false;
    let emAndamento = false;
    async function sincronizarEmailConfirmado() {
      if (desativado || emAndamento || document.visibilityState === "hidden") return;
      emAndamento = true;
      try {
        await reload(user);
        const emailConfirmado = user.email?.trim().toLowerCase();
        if (!desativado && user.emailVerified && emailConfirmado &&
            emailConfirmado !== perfil.email.trim().toLowerCase()) {
          await getIdToken(user, true);
          await updateDoc(doc(db, "usuarios", user.uid), { email: emailConfirmado });
          if (!desativado) {
            onEmailChange(emailConfirmado);
            setEmailNovo(emailConfirmado);
            setEmailPendente("");
            toast.success("Seu novo e-mail já foi confirmado e atualizado no perfil.");
          }
        }
      } catch (error) {
        // Erros temporários não devem derrubar o perfil; no próximo login
        // o AuthContext também sincroniza o endereço confirmado.
        console.warn("Não foi possível conferir a atualização automática do e-mail.", error);
      } finally { emAndamento = false; }
    }
    const aoRetornar = () => { void sincronizarEmailConfirmado(); };
    window.addEventListener("focus", aoRetornar);
    document.addEventListener("visibilitychange", aoRetornar);
    return () => {
      desativado = true;
      window.removeEventListener("focus", aoRetornar);
      document.removeEventListener("visibilitychange", aoRetornar);
    };
  }, [user, perfil.email, onEmailChange]);

  const autenticar = async (senha: string) => {
    if (!user.email || !senha) throw new Error("Informe a senha atual para confirmar sua identidade.");
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, senha));
  };

  async function solicitarEmail() {
    setOcupado("email");
    try {
      const novo = emailNovo.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novo)) throw new Error("Informe um e-mail válido.");
      if (novo === user.email?.toLowerCase()) throw new Error("Este já é seu e-mail de acesso.");
      await autenticar(senhaEmail);
      await verifyBeforeUpdateEmail(user, novo);
      setEmailPendente(novo);
      setSenhaEmail("");
      toast.success("Enviamos um link para o novo endereço. Basta confirmar pelo e-mail.");
    } catch (error) { toast.error(mensagemErroConta(error)); }
    finally { setOcupado(""); }
  }

  async function salvarIdentidade() {
    setOcupado("identidade");
    try {
      const cpfNormalizado = cpf.replace(/\D/g, "");
      if (!/^\d{11}$/.test(cpfNormalizado)) throw new Error("O CPF precisa ter 11 dígitos.");
      if (!rg.trim() || rg.trim().length > 32) throw new Error("Informe um RG válido (até 32 caracteres).");
      await autenticar(senhaIdentidade);
      await getIdToken(user, true);
      await updateDoc(doc(db, "usuarios", user.uid), {
        "dadosPessoais.cpf": cpfNormalizado,
        "dadosPessoais.rg": rg.trim(),
        dataAtualizacaoDadosPessoais: serverTimestamp(),
      });
      onIdentityChange(cpfNormalizado, rg.trim());
      setSenhaIdentidade("");
      toast.success("CPF e RG atualizados.");
    } catch (error) { toast.error(mensagemErroConta(error)); }
    finally { setOcupado(""); }
  }

  async function alterarSenha() {
    const erros = validarTrocaSenha(senhaAtual, senhaNova, confirmarSenha);
    if (erros.length) { toast.error(erros[0]); return; }
    setOcupado("senha");
    try {
      await autenticar(senhaAtual);
      await updatePassword(user, senhaNova);
      setSenhaAtual(""); setSenhaNova(""); setConfirmarSenha("");
      toast.success("Senha atualizada. Você já pode utilizá-la no próximo acesso.");
    } catch (error) { toast.error(mensagemErroConta(error)); }
    finally { setOcupado(""); }
  }

  async function recuperarSenha() {
    if (!user.email) { toast.error("O e-mail da conta não foi encontrado."); return; }
    setOcupado("recuperar");
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success("Se o endereço estiver habilitado para recuperação, receberá as instruções por e-mail.");
    } catch (error) { toast.error(mensagemErroConta(error)); }
    finally { setOcupado(""); }
  }

  return <div className="grid gap-4 xl:grid-cols-2">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <MailCheck className="h-5 w-5 text-emerald-700" aria-hidden="true"/>
        <h3 className="font-semibold text-slate-900">E-mail de acesso</h3>
      </div>
      <p className="mb-3 text-sm text-slate-600">Atual: <strong className="break-all text-slate-800">{perfil.email}</strong></p>
      <div className="space-y-3">
        <div className="space-y-1.5"><Label htmlFor="conta-email">Novo e-mail</Label>
          <Input id="conta-email" type="email" value={emailNovo} autoComplete="email"
            onChange={e => setEmailNovo(e.target.value)} disabled={Boolean(ocupado)} /></div>
        <div className="space-y-1.5"><Label htmlFor="conta-senha-email">Senha atual</Label>
          <Input id="conta-senha-email" type="password" autoComplete="current-password" value={senhaEmail}
            onChange={e => setSenhaEmail(e.target.value)} disabled={Boolean(ocupado)}/></div>
        <Button type="button" size="sm" onClick={() => void solicitarEmail()}
          disabled={Boolean(ocupado) || !senhaEmail}>Enviar link de verificação</Button>
        {emailPendente && <div role="status" className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0"/>
          <span>Verificação enviada para <strong>{emailPendente}</strong>. Confirme pelo link; a atualização será sincronizada automaticamente ao retornar ao Portal.</span>
        </div>}
        <p className="text-xs leading-relaxed text-slate-500">A alteração só é concluída após validar o novo endereço. O Firebase Authentication não permite dois acessos com o mesmo e-mail.</p>
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true"/>
        <h3 className="font-semibold text-slate-900">CPF e RG</h3>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="conta-cpf">CPF</Label>
            <Input id="conta-cpf" value={cpf} onChange={e => setCpf(e.target.value)} maxLength={20}
              disabled={Boolean(ocupado)} /></div>
          <div className="space-y-1.5"><Label htmlFor="conta-rg">RG</Label>
            <Input id="conta-rg" value={rg} onChange={e => setRg(e.target.value)} maxLength={32}
              disabled={Boolean(ocupado)} /></div>
        </div>
        <div className="space-y-1.5"><Label htmlFor="conta-senha-cpf">Senha atual para confirmar</Label>
          <Input id="conta-senha-cpf" type="password" autoComplete="current-password"
            value={senhaIdentidade} onChange={e => setSenhaIdentidade(e.target.value)} disabled={Boolean(ocupado)} /></div>
        <Button size="sm" variant="outline" type="button" disabled={Boolean(ocupado) || !senhaIdentidade}
          onClick={() => void salvarIdentidade()}>Salvar identificação</Button>
        <p className="text-xs text-slate-500">A identidade só pode ser alterada após reautenticação recente.</p>
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-emerald-700" aria-hidden="true"/>
        <h3 className="font-semibold text-slate-900">Senha e recuperação</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5"><Label htmlFor="conta-senha-atual">Senha atual</Label>
          <Input id="conta-senha-atual" type="password" autoComplete="current-password"
            value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} disabled={Boolean(ocupado)} /></div>
        <div className="space-y-1.5"><Label htmlFor="conta-senha-nova">Nova senha</Label>
          <Input id="conta-senha-nova" type="password" autoComplete="new-password"
            value={senhaNova} onChange={e => setSenhaNova(e.target.value)} disabled={Boolean(ocupado)} /></div>
        <div className="space-y-1.5"><Label htmlFor="conta-senha-confirmacao">Repetir nova senha</Label>
          <Input id="conta-senha-confirmacao" type="password" autoComplete="new-password"
            value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} disabled={Boolean(ocupado)} /></div>
      </div>
      {senhaNova && confirmarSenha && senhaNova !== confirmarSenha &&
        <p role="alert" className="mt-2 text-xs text-rose-700">As duas senhas novas precisam ser iguais.</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Button size="sm" type="button" disabled={Boolean(ocupado) || validarTrocaSenha(senhaAtual, senhaNova, confirmarSenha).length > 0}
          onClick={() => void alterarSenha()}>Atualizar senha</Button>
        <Button variant="link" size="sm" type="button" className="gap-1 px-0"
          disabled={Boolean(ocupado)} onClick={() => void recuperarSenha()}>
          <RefreshCw className="h-3.5 w-3.5"/> Esqueci a senha atual
        </Button>
      </div>
      <p className="mt-3 text-xs text-slate-500">A recuperação utiliza o mesmo mecanismo da página de login e envia instruções para o e-mail de acesso atual.</p>
    </section>
  </div>;
}
