import { useState } from "react";
import { toast } from "sonner";
import type { DadosProfissionais, Usuario } from "@/types/usuario";
import { useAuth } from "@/contexts/AuthContext";
import { solicitarRevisaoProfissional } from "@/services/bancodados/revisaoCadastralDB";
import { dadosProfissionaisIguais } from "@/utils/revisaoCadastral";
import { formacoes, estadosBrasileiros, lotacoesSMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function SolicitacaoProfissional({ perfil }: { perfil: Usuario }) {
  const { user, logout } = useAuth();
  const [proposta, setProposta] = useState<DadosProfissionais>({ ...perfil.dadosProfissionais });
  const [confirmado, setConfirmado] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const mudar = (chave: keyof DadosProfissionais, valor: string | boolean) => {
    setProposta(prev => ({ ...prev, [chave]: valor }));
    setConfirmado(false);
  };
  const enviar = async () => {
    if (!user || !confirmado || ocupado) return;
    setOcupado(true);
    try {
      await solicitarRevisaoProfissional(user.uid, proposta);
      toast.success("Solicitação registrada. O acesso ficará suspenso até a análise da equipe.");
      await logout();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao registrar solicitação.");
    } finally { setOcupado(false); }
  };
  if (perfil.ehAdmin) {
    return <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
      O perfil administrador exige revisão assistida pela equipe antes de modificar os dados profissionais.
    </p>;
  }
  if (perfil.alteracaoCadastralPendente || perfil.statusAcesso === "AguardandoRevisaoCadastro") {
    return <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
      Seus dados profissionais estão aguardando revisão. O acesso assistencial permanece suspenso até a decisão da equipe.
    </p>;
  }
  return <div className="space-y-4">
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      Alterações profissionais exigem validação. Ao enviar, sua conta ficará suspensa imediatamente; a equipe poderá aprovar os novos dados ou recusar o pedido, informando o motivo. Não envie sem ter certeza.
    </p>
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="perfil-formacao">Formação</Label>
        <select id="perfil-formacao" value={proposta.formacao} disabled={ocupado}
          onChange={e => mudar("formacao", e.target.value)} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
          {formacoes.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="perfil-coren">Número COREN</Label>
        <Input id="perfil-coren" value={proposta.numeroCoren ?? ""} onChange={e => mudar("numeroCoren", e.target.value)} disabled={ocupado} maxLength={40}/>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="perfil-uf-coren">UF COREN</Label>
        <select id="perfil-uf-coren" value={proposta.ufCoren ?? ""} onChange={e => mudar("ufCoren", e.target.value)} disabled={ocupado} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
          <option value="">Selecione</option>
          {estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}
        </select>
      </div>
      {proposta.formacao === "Residente de Enfermagem" && <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="perfil-inicio-residencia">Data de início da residência</Label>
        <Input id="perfil-inicio-residencia" type="date" value={proposta.dataInicioResidencia ?? ""} disabled={ocupado}
          onChange={e => mudar("dataInicioResidencia", e.target.value)}/>
      </div>}
      {proposta.formacao === "Acadêmico de Enfermagem" && <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="perfil-ies">Instituição de Ensino</Label>
        <Input id="perfil-ies" value={proposta.iesEnfermagem ?? ""} disabled={ocupado} onChange={e => mudar("iesEnfermagem", e.target.value)}/>
      </div>}
      <div className="flex items-center gap-2 sm:col-span-2">
        <Checkbox id="perfil-atua-sms" checked={proposta.atuaSMS} disabled={ocupado}
          onCheckedChange={v => mudar("atuaSMS", v === true)}/>
        <Label htmlFor="perfil-atua-sms">Atuo na Secretaria Municipal de Saúde de Florianópolis</Label>
      </div>
      {proposta.atuaSMS ? <>
        <div className="space-y-1.5">
          <Label htmlFor="perfil-lotacao">Lotação</Label>
          <select id="perfil-lotacao" value={proposta.lotacao ?? ""} disabled={ocupado}
            onChange={e => mudar("lotacao", e.target.value)} className="h-10 w-full rounded-md border bg-white px-3 text-sm">
            <option value="">Selecione</option>
            {!lotacoesSMS.includes(proposta.lotacao ?? "") && proposta.lotacao && <option value={proposta.lotacao}>{proposta.lotacao}</option>}
            {lotacoesSMS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="perfil-matricula">Matrícula</Label>
          <Input id="perfil-matricula" value={proposta.matricula ?? ""} disabled={ocupado} onChange={e => mudar("matricula", e.target.value)}/>
        </div>
      </> : <>
        <div className="space-y-1.5"><Label htmlFor="perfil-cidade-trabalho">Cidade onde trabalha</Label><Input id="perfil-cidade-trabalho" value={proposta.cidadeTrabalho ?? ""} onChange={e => mudar("cidadeTrabalho", e.target.value)} disabled={ocupado}/></div>
        <div className="space-y-1.5"><Label htmlFor="perfil-local-cargo">Local / cargo</Label><Input id="perfil-local-cargo" value={proposta.localCargo ?? ""} onChange={e => mudar("localCargo", e.target.value)} disabled={ocupado}/></div>
      </>}
    </div>
    <label className="flex items-start gap-2 text-sm">
      <Checkbox checked={confirmado} disabled={ocupado} onCheckedChange={v => setConfirmado(v === true)}/>
      <span>Confirmo que desejo enviar estes dados para análise e que meu acesso ficará suspenso até a aprovação ou recusa motivada pela equipe.</span>
    </label>
    <Button type="button" className="w-full sm:w-auto" onClick={() => void enviar()}
      disabled={ocupado || !confirmado || dadosProfissionaisIguais(proposta, perfil.dadosProfissionais)}>
      {ocupado ? "Registrando..." : "Enviar para revisão e suspender acesso"}
    </Button>
  </div>;
}
