import { useState } from "react";
import { toast } from "sonner";
import type { DadosProfissionais, Usuario } from "@/types/usuario";
import { useAuth } from "@/contexts/AuthContext";
import {
  solicitarRevisaoProfissional, validarDadosProfissionais,
} from "@/services/bancodados/revisaoCadastralDB";
import { dadosProfissionaisIguais } from "@/utils/revisaoCadastral";
import { formacoes, estadosBrasileiros, lotacoesSMS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ClipboardCheck, FilePenLine } from "lucide-react";

export default function SolicitacaoProfissional({ perfil }: { perfil: Usuario }) {
  const { user, logout } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [proposta, setProposta] = useState<DadosProfissionais>({ ...perfil.dadosProfissionais });
  const [confirmado, setConfirmado] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const mudar = (chave: keyof DadosProfissionais, valor: string | boolean) => {
    setProposta(prev => ({
      ...prev, [chave]: valor,
      ...(chave === "atuaSMS"
        ? (valor === true ? { cidadeTrabalho: "", localCargo: "" } : { lotacao: "", matricula: "" })
        : {}),
    }));
    setConfirmado(false);
  };

  const mudancas = !dadosProfissionaisIguais(proposta, perfil.dadosProfissionais);
  const pendencias = validarDadosProfissionais(proposta);
  const enviar = async () => {
    if (!user || !confirmado || ocupado || !mudancas || pendencias.length) return;
    setOcupado(true);
    try {
      await solicitarRevisaoProfissional(user.uid, proposta);
      toast.success("Solicitação enviada. O acesso foi suspenso até a revisão administrativa.");
      await logout();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar a solicitação.");
    } finally { setOcupado(false); }
  };

  if (perfil.alteracaoCadastralPendente || perfil.statusAcesso === "AguardandoRevisaoCadastro") {
    return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <h3 className="font-semibold">Alteração profissional aguardando análise</h3>
      <p className="mt-1 text-sm">A conta está suspensa até um administrador aprovar ou recusar a solicitação, com justificativa.</p>
    </div>;
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="min-w-0">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <FilePenLine className="h-5 w-5 text-emerald-700"/> Atualizar dados profissionais
        </div>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          Solicite alterações de formação, COREN, vínculo, lotação, matrícula ou dados da residência.
          Os dados atuais permanecem válidos até a análise.
        </p>
      </div>
      <Button type="button" variant={aberto ? "outline" : "default"} size="sm" onClick={() => {
        setAberto(v => !v); setConfirmado(false);
      }}>{aberto ? "Cancelar edição" : "Solicitar alteração"}</Button>
    </div>

    {aberto && <div className="space-y-5 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6">
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700"/>
        <div>
          <strong>Atenção: o envio suspende seu acesso imediatamente.</strong>
          <p className="mt-1">Você não conseguirá utilizar o Processo de Enfermagem nem acessar os demais módulos até que outro administrador avalie e aprove a solicitação. Em caso de recusa, a conta permanecerá bloqueada e será apresentada uma justificativa.</p>
          {perfil.ehAdmin && <p className="mt-2 font-medium">
            Sua conta é administradora. Esta solicitação também suspenderá seus privilégios administrativos e dependerá de outro administrador ativo para aprovação.
          </p>}
        </div>
      </div>

      <fieldset disabled={ocupado} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="pedido-formacao">Formação profissional</Label>
            <select id="pedido-formacao" value={proposta.formacao} onChange={e => mudar("formacao", e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
              {formacoes.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pedido-coren">Número COREN</Label>
            <Input id="pedido-coren" value={proposta.numeroCoren ?? ""} maxLength={40}
              onChange={e => mudar("numeroCoren", e.target.value)}/>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pedido-ufcoren">UF do COREN</Label>
            <select id="pedido-ufcoren" value={proposta.ufCoren ?? ""} onChange={e => mudar("ufCoren", e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
              <option value="">Selecione</option>
              {estadosBrasileiros.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          {proposta.formacao === "Residente de Enfermagem" && <div className="space-y-1.5">
            <Label htmlFor="pedido-data-residencia">Início da residência</Label>
            <Input id="pedido-data-residencia" type="date" value={proposta.dataInicioResidencia ?? ""}
              onChange={e => mudar("dataInicioResidencia", e.target.value)}/>
          </div>}
          {(proposta.formacao === "Acadêmico de Enfermagem" || proposta.formacao === "Residente de Enfermagem" || proposta.iesEnfermagem) &&
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pedido-ies">Instituição de ensino</Label>
              <Input id="pedido-ies" value={proposta.iesEnfermagem ?? ""} maxLength={180}
                onChange={e => mudar("iesEnfermagem", e.target.value)}/>
            </div>}
        </div>

        <div className="space-y-4 rounded-xl border bg-slate-50 p-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
            <Checkbox checked={proposta.atuaSMS} onCheckedChange={v => mudar("atuaSMS", v === true)}/>
            Atuo na Secretaria Municipal de Saúde de Florianópolis
          </label>
          {proposta.atuaSMS ? <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pedido-lotacao">Lotação oficial</Label>
              <select id="pedido-lotacao" value={proposta.lotacao ?? ""}
                onChange={e => mudar("lotacao", e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
                <option value="">Selecione a lotação</option>
                {!lotacoesSMS.includes(proposta.lotacao ?? "") && proposta.lotacao &&
                  <option value={proposta.lotacao}>{proposta.lotacao} (cadastro anterior)</option>}
                {lotacoesSMS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pedido-matricula">Matrícula funcional</Label>
              <Input id="pedido-matricula" value={proposta.matricula ?? ""} maxLength={40}
                onChange={e => mudar("matricula", e.target.value)}/>
            </div>
          </div> : <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pedido-cidade">Cidade onde trabalha</Label>
              <Input id="pedido-cidade" value={proposta.cidadeTrabalho ?? ""} maxLength={100}
                onChange={e => mudar("cidadeTrabalho", e.target.value)}/>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pedido-local">Local de trabalho / cargo</Label>
              <Input id="pedido-local" value={proposta.localCargo ?? ""} maxLength={140}
                onChange={e => mudar("localCargo", e.target.value)}/>
            </div>
          </div>}
        </div>
        {pendencias.length > 0 && <p role="alert" className="text-sm text-rose-700">{pendencias.join(" ")}</p>}
        {!mudancas && <p className="text-sm text-slate-500">Altere pelo menos um campo para enviar uma solicitação.</p>}
        <label className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
          <Checkbox checked={confirmado} onCheckedChange={v => setConfirmado(v === true)}/>
          <span>Estou ciente de que, ao enviar esta solicitação, <strong>meu acesso será suspenso imediatamente</strong> até a aprovação por outro administrador. Compreendo que a recusa poderá manter minha conta bloqueada.</span>
        </label>
        <div className="flex flex-wrap gap-3">
          <Button type="button" disabled={!confirmado || !mudancas || pendencias.length > 0 || ocupado}
            onClick={() => void enviar()} className="gap-2">
            <ClipboardCheck className="h-4 w-4"/> {ocupado ? "Registrando..." : "Enviar para análise e suspender acesso"}
          </Button>
          <Button type="button" variant="outline" disabled={ocupado}
            onClick={() => { setAberto(false); setConfirmado(false); setProposta({ ...perfil.dadosProfissionais }); }}>Cancelar</Button>
        </div>
      </fieldset>
    </div>}
  </div>;
}
