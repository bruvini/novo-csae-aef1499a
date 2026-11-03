import { useState } from "react";
import {
  EmailAuthProvider, getIdToken, reauthenticateWithCredential,
  reload, updatePassword, verifyBeforeUpdateEmail,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/services/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Usuario } from "@/types/usuario";

type Props = { user: User; perfil: Usuario; onIdentityChange: (cpf: string, rg: string) => void };

function interpretarErro(error: unknown) {
  const codigo = (error as { code?: string })?.code;
  if (codigo === "auth/email-already-in-use") return "Esse e-mail já pertence a uma conta Firebase. Escolha outro.";
  if (codigo === "auth/wrong-password" || codigo === "auth/invalid-credential") return "Senha atual incorreta.";
  if (codigo === "auth/requires-recent-login") return "Faça uma autenticação recente para continuar.";
  if (codigo === "auth/weak-password") return "A senha nova não atende aos requisitos de segurança.";
  return error instanceof Error ? error.message : "Operação não concluída.";
}

export default function SegurancaConta({ user, perfil, onIdentityChange }: Props) {
  const [email, setEmail] = useState(user.email ?? perfil.email);
  const [cpf, setCpf] = useState(perfil.dadosPessoais.cpf);
  const [rg, setRg] = useState(perfil.dadosPessoais.rg);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senhaNova, setSenhaNova] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const reautenticar = async () => {
    if (!user.email || !senhaAtual) throw new Error("Informe sua senha atual para confirmar a identidade.");
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, senhaAtual));
  };

  const executar = async (acao: "identidade" | "email" | "senha" | "sincronizar") => {
    setOcupado(true);
    try {
      if (acao === "identidade") {
        if (!/^\d{11}$/.test(cpf.replace(/\D/g, ""))) throw new Error("Informe CPF com 11 dígitos.");
        if (!rg.trim() || rg.length > 32) throw new Error("Confira o RG informado.");
        await reautenticar();
        await getIdToken(user, true);
        await updateDoc(doc(db, "usuarios", user.uid), {
          "dadosPessoais.cpf": cpf.replace(/\D/g, ""),
          "dadosPessoais.rg": rg.trim(),
          dataAtualizacaoDadosPessoais: serverTimestamp(),
        });
        onIdentityChange(cpf.replace(/\D/g, ""), rg.trim());
        toast.success("CPF e RG atualizados.");
      } else if (acao === "email") {
        const novo = email.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novo)) throw new Error("E-mail inválido.");
        if (novo === (user.email ?? "").toLowerCase()) throw new Error("Esse já é seu e-mail de acesso.");
        await reautenticar();
        // Firebase Authentication é a fonte de unicidade e só efetiva após verificação.
        await verifyBeforeUpdateEmail(user, novo);
        toast.success("Enviamos um link ao novo e-mail. A mudança ocorrerá depois da confirmação.");
      } else if (acao === "senha") {
        if (senhaNova.length < 10) throw new Error("Use uma senha com pelo menos 10 caracteres.");
        if (senhaNova === senhaAtual) throw new Error("A nova senha deve ser diferente da anterior.");
        await reautenticar();
        await updatePassword(user, senhaNova);
        setSenhaNova("");
        setSenhaAtual("");
        toast.success("Senha alterada com sucesso.");
      } else {
        await reload(user);
        await getIdToken(user, true);
        if (!user.emailVerified) throw new Error("O endereço ainda não foi confirmado.");
        if (!user.email) throw new Error("Não foi possível carregar seu e-mail do Firebase.");
        if (user.email.toLowerCase() !== perfil.email.toLowerCase()) {
          await updateDoc(doc(db, "usuarios", user.uid), { email: user.email.toLowerCase() });
        }
        setEmail(user.email);
        toast.success("E-mail do perfil conferido com o Firebase Authentication.");
      }
    } catch (error) {
      toast.error(interpretarErro(error));
    } finally { setOcupado(false); }
  };

  return <div className="space-y-5">
    <p className="text-sm text-gray-600">A troca de e-mail e senha exige sua senha atual. O Firebase impede cadastrar duas contas com o mesmo e-mail de autenticação. A mudança de e-mail somente é efetivada após confirmar o novo endereço.</p>
    <div className="space-y-2 rounded-xl border p-4">
      <h3 className="font-semibold text-csae-green-900">E-mail de acesso</h3>
      <Label htmlFor="perfil-email-novo">Novo e-mail</Label>
      <Input id="perfil-email-novo" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} disabled={ocupado}/>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={ocupado || !senhaAtual} onClick={() => void executar("email")}>Enviar verificação</Button>
        <Button type="button" variant="outline" disabled={ocupado} onClick={() => void executar("sincronizar")}>Já confirmei: atualizar perfil</Button>
      </div>
    </div>
    <div className="space-y-3 rounded-xl border p-4">
      <h3 className="font-semibold text-csae-green-900">Identificação pessoal</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="perfil-cpf">CPF</Label><Input id="perfil-cpf" value={cpf} maxLength={20} disabled={ocupado} onChange={e => setCpf(e.target.value)}/></div>
        <div><Label htmlFor="perfil-rg">RG</Label><Input id="perfil-rg" value={rg} maxLength={32} disabled={ocupado} onChange={e => setRg(e.target.value)}/></div>
      </div>
      <Button type="button" variant="outline" disabled={ocupado || !senhaAtual} onClick={() => void executar("identidade")}>Salvar CPF e RG</Button>
    </div>
    <div className="space-y-3 rounded-xl border p-4">
      <h3 className="font-semibold text-csae-green-900">Alterar senha</h3>
      <Label htmlFor="perfil-nova-senha">Nova senha</Label>
      <Input id="perfil-nova-senha" type="password" autoComplete="new-password" value={senhaNova} onChange={e => setSenhaNova(e.target.value)} disabled={ocupado}/>
      <Button type="button" variant="outline" disabled={ocupado || !senhaAtual || !senhaNova} onClick={() => void executar("senha")}>Atualizar senha</Button>
    </div>
    <div className="rounded-xl bg-gray-50 p-4">
      <Label htmlFor="perfil-senha-atual">Senha atual — confirmação de identidade</Label>
      <Input id="perfil-senha-atual" type="password" autoComplete="current-password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} disabled={ocupado}/>
      <p className="mt-2 text-xs text-gray-500">Nunca armazenamos essa senha no documento do usuário. Ela é utilizada diretamente na autenticação do Firebase.</p>
    </div>
  </div>;
}
