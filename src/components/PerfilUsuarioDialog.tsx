import { useEffect, useState, type FormEvent } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/services/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { Usuario } from "@/types/usuario";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props { open: boolean; onOpenChange: (open: boolean) => void }
type Endereco = Pick<Usuario["dadosPessoais"], "rua" | "numero" | "bairro" | "cidade" | "uf" | "cep">;
const vazio: Endereco = { rua: "", numero: "", bairro: "", cidade: "", uf: "", cep: "" };
const campos: Array<{ id: keyof Endereco; label: string; max: number }> = [
  { id: "rua", label: "Rua", max: 160 },
  { id: "numero", label: "Número", max: 24 },
  { id: "bairro", label: "Bairro", max: 100 },
  { id: "cidade", label: "Cidade", max: 100 },
  { id: "uf", label: "UF", max: 2 },
  { id: "cep", label: "CEP", max: 12 },
];

export default function PerfilUsuarioDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<Usuario | null>(null);
  const [endereco, setEndereco] = useState<Endereco>({ ...vazio });
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!open || !user) return;
    let ativo = true;
    setCarregando(true);
    setErro("");
    void getDoc(doc(db, "usuarios", user.uid)).then(snap => {
      if (!ativo) return;
      if (!snap.exists()) {
        setErro("Seu perfil não foi encontrado. Procure o suporte para corrigir o vínculo do cadastro.");
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
      if (ativo) setErro("Não foi possível consultar seus dados. Tente novamente.");
    }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [open, user]);

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user || !perfil) return;
    const novo = Object.fromEntries(
      Object.entries(endereco).map(([k, v]) => [k, v.trim()])
    ) as Endereco;
    novo.uf = novo.uf.toUpperCase();
    if (campos.some(({ id, max }) => !novo[id] || novo[id].length > max)) {
      toast.error("Preencha todos os campos do endereço dentro dos limites indicados.");
      return;
    }
    setSalvando(true);
    try {
      // Atualização parcial, não sobrescreve documentos nem privilégios da conta.
      await updateDoc(doc(db, "usuarios", user.uid), {
        "dadosPessoais.rua": novo.rua,
        "dadosPessoais.numero": novo.numero,
        "dadosPessoais.bairro": novo.bairro,
        "dadosPessoais.cidade": novo.cidade,
        "dadosPessoais.uf": novo.uf,
        "dadosPessoais.cep": novo.cep,
      });
      setEndereco(novo);
      setPerfil({ ...perfil, dadosPessoais: { ...perfil.dadosPessoais, ...novo } });
      toast.success("Endereço atualizado com sucesso.");
    } catch (error) {
      console.error("Falha ao atualizar endereço do perfil:", error);
      toast.error("Não foi possível salvar as alterações. Confira suas permissões.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(aberto) => { if (!salvando) onOpenChange(aberto); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Meus dados cadastrais</DialogTitle>
          <DialogDescription>Consulte seus dados e mantenha seu endereço atualizado. Alterações de identidade e vínculo passam por verificação da equipe.</DialogDescription>
        </DialogHeader>
        {carregando ? <p role="status">Carregando perfil...</p> : erro ? (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{erro}</p>
        ) : perfil ? (
          <div className="space-y-6">
            <section className="space-y-2">
              <h3 className="font-semibold text-csae-green-800">Identificação</h3>
              <dl className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
                <div><dt className="text-gray-500">Nome</dt><dd className="font-medium">{perfil.dadosPessoais.nomeCompleto}</dd></div>
                <div><dt className="text-gray-500">E-mail de acesso</dt><dd className="break-all font-medium">{perfil.email}</dd></div>
                <div><dt className="text-gray-500">CPF</dt><dd className="font-medium">{perfil.dadosPessoais.cpf}</dd></div>
                <div><dt className="text-gray-500">RG</dt><dd className="font-medium">{perfil.dadosPessoais.rg}</dd></div>
              </dl>
            </section>
            <section className="space-y-2">
              <h3 className="font-semibold text-csae-green-800">Dados profissionais</h3>
              <dl className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-2">
                <div><dt className="text-gray-500">Formação</dt><dd className="font-medium">{perfil.dadosProfissionais.formacao}</dd></div>
                <div><dt className="text-gray-500">COREN</dt><dd className="font-medium">{[perfil.dadosProfissionais.numeroCoren, perfil.dadosProfissionais.ufCoren].filter(Boolean).join("/") || "Não informado"}</dd></div>
                <div><dt className="text-gray-500">Lotação</dt><dd className="font-medium">{perfil.dadosProfissionais.lotacao || "Não informada"}</dd></div>
                <div><dt className="text-gray-500">Matrícula</dt><dd className="font-medium">{perfil.dadosProfissionais.matricula || "Não informada"}</dd></div>
              </dl>
              <p className="text-xs leading-relaxed text-gray-600">Para corrigir nome, CPF, RG, e-mail, formação, COREN, lotação, matrícula ou vínculo, solicite revisão à equipe do portal pela Central de Ajuda. Esses dados são utilizados na aprovação de acesso.</p>
            </section>
            <form onSubmit={(event) => void salvar(event)} className="space-y-4">
              <h3 className="font-semibold text-csae-green-800">Endereço residencial</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {campos.map(({ id, label, max }) => (
                  <div className={id === "rua" ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"} key={id}>
                    <Label htmlFor={"perfil-" + id}>{label}</Label>
                    <Input id={"perfil-" + id} autoComplete="off" required maxLength={max} disabled={salvando}
                      value={endereco[id]} onChange={e => setEndereco(old => ({ ...old, [id]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>Fechar</Button>
                <Button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar endereço"}</Button>
              </div>
            </form>
          </div>
        ) : <p className="text-sm text-gray-600">Dados cadastrais indisponíveis.</p>}
      </DialogContent>
    </Dialog>
  );
}
