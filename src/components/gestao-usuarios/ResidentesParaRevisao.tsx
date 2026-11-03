import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Usuario } from "@/types/usuario";
import { useAuth } from "@/contexts/AuthContext";
import { lotacoesSMS } from "@/lib/constants";
import {
  residentesParaRevisao, residentesSemData, dataCivilSaoPaulo, somarDiasCivis,
} from "@/utils/revisaoCadastral";
import {
  decidirRevisaoResidencia, validarDecisaoResidencia,
  MOTIVO_REVOGACAO_RESIDENCIA, type DecisaoResidencia,
} from "@/services/bancodados/revisaoResidenciaDB";

type Operacao = DecisaoResidencia["acao"];
interface Props { usuarios: Usuario[]; onAtualizar?: () => Promise<void>; hoje?: Date }

const dataBR = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? m[3] + "/" + m[2] + "/" + m[1] : "—";
};

export default function ResidentesParaRevisao({ usuarios, onAtualizar, hoje = new Date() }: Props) {
  const { sessionData } = useAuth();
  const elegiveis = useMemo(() => residentesParaRevisao(usuarios, hoje), [usuarios, hoje]);
  const semData = useMemo(() => residentesSemData(usuarios), [usuarios]);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [operacao, setOperacao] = useState<Operacao>("Converter");
  const [atuaSMS, setAtuaSMS] = useState(true);
  const [lotacao, setLotacao] = useState("");
  const [matricula, setMatricula] = useState("");
  const [dias, setDias] = useState("30");
  const [observacao, setObservacao] = useState("");
  const [confirmacao, setConfirmacao] = useState(false);
  const [processando, setProcessando] = useState(false);

  const expandir = (usuario: Usuario) => {
    if (selecionado === usuario.uid) { setSelecionado(null); return; }
    setSelecionado(usuario.uid);
    setOperacao("Converter");
    setAtuaSMS(usuario.dadosProfissionais.atuaSMS);
    setLotacao(usuario.dadosProfissionais.lotacao ?? "");
    setMatricula(usuario.dadosProfissionais.matricula ?? "");
    setDias("30"); setObservacao(""); setConfirmacao(false);
  };

  const mudarOperacao = (v: Operacao) => {
    setOperacao(v); setConfirmacao(false);
  };

  const decisao: DecisaoResidencia =
    operacao === "Prorrogar"
      ? { acao: "Prorrogar", dias: Number(dias), observacao }
      : operacao === "Revogar"
        ? { acao: "Revogar" }
        : { acao: "Converter", atuaSMS, lotacao, matricula };

  const erros = validarDecisaoResidencia(decisao);
  const prazoPrevisto = operacao === "Prorrogar" && erros.length === 0
    ? somarDiasCivis(dataCivilSaoPaulo(hoje), Number(dias)) : "";

  const concluir = async (usuario: Usuario) => {
    if (!sessionData?.ehAdmin || !sessionData.uid || !confirmacao || erros.length || processando) return;
    setProcessando(true);
    try {
      const status = await decidirRevisaoResidencia(usuario.id ?? usuario.uid, sessionData.uid, decisao);
      toast.success(
        operacao === "Prorrogar"
          ? "Prorrogação registrada e novo alerta agendado."
          : status === "Liberado"
            ? "Formação convertida para Enfermeiro; acesso mantido."
            : "Revisão concluída. Acesso revogado com histórico preservado."
      );
      setSelecionado(null); setConfirmacao(false);
      await onAtualizar?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "A decisão não pôde ser registrada.");
    } finally { setProcessando(false); }
  };

  return <section className="space-y-5">
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
      <strong>Revisão de residentes ativos:</strong> os perfis são listados a partir do primeiro dia após completar dois anos de residência.
      As prorrogações geram novas datas de verificação sem alterar o início original. Nenhuma decisão é automática.
      Somente administradores podem decidir, e o histórico clínico é preservado mesmo após a revogação.
    </div>

    {elegiveis.length === 0 ? <p className="rounded-xl border bg-white p-6 text-center text-sm text-gray-600">Nenhum residente aprovado e ativo com prazo de revisão atingido.</p> :
      <div className="space-y-3">
        <p className="text-sm font-semibold text-csae-green-900">{elegiveis.length} residente(s) aguardando revisão</p>
        {elegiveis.map(({ usuario, prazo }) => {
          const expanded = selecionado === usuario.uid;
          const historico = usuario.historicoRevisoesResidencia ?? [];
          return <article key={usuario.uid} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">{usuario.dadosPessoais.nomeCompleto}</h3>
                <p className="text-xs text-slate-500">{usuario.dadosProfissionais.lotacao || "Lotação não informada"}</p>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-700">
                  <span>Início: <strong>{dataBR(usuario.dadosProfissionais.dataInicioResidencia ?? "")}</strong></span>
                  <span>Marco de 2 anos: <strong>{dataBR(prazo.termino)}</strong></span>
                  <span>Revisão: <strong>{dataBR(prazo.proximaVerificacao)}</strong></span>
                  <span>Origem: <strong>{prazo.origem === "prorrogação" ? "Prorrogação" : "Biênio"}</strong></span>
                  <span>Vencida há: <strong>{prazo.diasAposTermino} dia(s)</strong></span>
                </div>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => expandir(usuario)}>
                {expanded ? "Fechar análise" : "Analisar residente"}
              </Button>
            </div>

            {expanded && <div className="mt-4 space-y-5 border-t pt-4">
              {usuario.ehAdmin ? <p role="alert" className="text-sm text-amber-900">Conta administradora: revisão assistida necessária.</p> : <>
                <fieldset disabled={processando} className="space-y-4">
                  <legend className="mb-3 font-semibold text-csae-green-900">Decisão administrativa</legend>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {([
                      ["Converter", "Converter em enfermeiro"],
                      ["Revogar", "Revogar acesso"],
                      ["Prorrogar", "Prorrogar residência"],
                    ] as const).map(([id, nome]) =>
                      <Button type="button" key={id} variant={operacao === id ? "default" : "outline"}
                        onClick={() => mudarOperacao(id)}>{nome}</Button>
                    )}
                  </div>

                  {operacao === "Converter" && <div className="space-y-4 rounded-lg border p-4">
                    <p className="text-sm">Formação após decisão: <strong>Enfermeiro</strong>. A data de início da residência permanece registrada para auditoria.</p>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={atuaSMS} onCheckedChange={v => { setAtuaSMS(v === true); setConfirmacao(false); }}/>
                      Atua na Secretaria Municipal de Saúde de Florianópolis
                    </label>
                    {atuaSMS ? <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Lotação oficial</Label>
                        <Select value={lotacao} onValueChange={v => { setLotacao(v); setConfirmacao(false); }}>
                          <SelectTrigger><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                          <SelectContent>{lotacoesSMS.map(l => <SelectItem value={l} key={l}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="residencia-matricula">Matrícula SMS</Label>
                        <Input id="residencia-matricula" maxLength={40} value={matricula}
                          onChange={e => { setMatricula(e.target.value); setConfirmacao(false); }}/>
                      </div>
                    </div> : <p role="alert" className="text-sm font-medium text-rose-800">
                      Sem vínculo com a SMS: os dados serão atualizados para Enfermeiro, mas o acesso será registrado como Revogado.
                    </p>}
                  </div>}

                  {operacao === "Revogar" && <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
                    O usuário ficará sem acesso ao Portal, mantendo seu histórico clínico, cadastral e de decisões.
                    <p className="mt-2 font-semibold">Justificativa registrada automaticamente: {MOTIVO_REVOGACAO_RESIDENCIA}</p>
                  </div>}

                  {operacao === "Prorrogar" && <div className="space-y-3 rounded-lg border p-4">
                    <div className="space-y-2">
                      <Label htmlFor="residencia-dias">Prazo em dias corridos (1 a 730)</Label>
                      <Input id="residencia-dias" type="number" min={1} max={730} step={1} value={dias}
                        onChange={e => { setDias(e.target.value); setConfirmacao(false); }}/>
                      {prazoPrevisto && <p className="text-sm text-slate-600">
                        Próxima verificação em <strong>{dataBR(prazoPrevisto)}</strong>, contada a partir da decisão.
                      </p>}
                    </div>
                    <Label htmlFor="residencia-observacao">Observação administrativa (opcional)</Label>
                    <Textarea id="residencia-observacao" maxLength={600} value={observacao}
                      onChange={e => { setObservacao(e.target.value); setConfirmacao(false); }}/>
                  </div>}

                  {erros.length > 0 && <p role="alert" className="text-sm text-rose-700">{erros.join(" ")}</p>}
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={confirmacao} onCheckedChange={v => setConfirmacao(v === true)} />
                    <span>Confirmo a decisão, seus efeitos sobre o acesso e o registro permanente do histórico administrativo.</span>
                  </label>
                  <Button type="button" disabled={!confirmacao || erros.length > 0 || processando || !sessionData?.ehAdmin}
                    onClick={() => void concluir(usuario)}>
                    {processando ? "Registrando decisão..." : operacao === "Prorrogar" ? "Confirmar prorrogação" :
                      operacao === "Revogar" ? "Confirmar revogação" :
                      atuaSMS ? "Converter e manter acesso" : "Converter e revogar acesso"}
                  </Button>
                </fieldset>
              </>}

              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <h4 className="font-semibold">Histórico de decisões ({historico.length})</h4>
                {historico.length === 0 ? <p className="mt-1 text-slate-500">Nenhuma revisão anterior registrada.</p> :
                  <ol className="mt-2 space-y-2">{[...historico].reverse().map((item, i) =>
                    <li key={i} className="border-t pt-2">
                      <strong>{item.acao}</strong> · {item.decididoEm?.toDate?.().toLocaleString("pt-BR") ?? "Data indisponível"}
                      <p>{item.motivo}</p>
                      {item.proximoPrazo && <p>Nova revisão: {dataBR(item.proximoPrazo)} · {item.diasProrrogados} dias</p>}
                      <p className="text-xs text-slate-500">Responsável (UID): {item.revisorUid}</p>
                    </li>
                  )}</ol>
                }
              </div>
            </div>}
          </article>;
        })}
      </div>
    }

    {semData.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="font-semibold text-amber-950">Residentes ativos sem data válida de início ou prorrogação: {semData.length}</h3>
      <p className="mt-1 text-xs text-amber-800">Esses cadastros exigem conferência manual e não podem receber decisão automática.</p>
      <ul className="mt-2 list-disc pl-5 text-sm">{semData.map(u =>
        <li key={u.uid}>{u.dadosPessoais.nomeCompleto} — {u.statusAcesso}</li>
      )}</ul>
    </div>}
  </section>;
}
