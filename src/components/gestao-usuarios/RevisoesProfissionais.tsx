import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Usuario, DadosProfissionais } from "@/types/usuario";
import { decidirRevisaoProfissional } from "@/services/bancodados/revisaoCadastralDB";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const campos: Array<[keyof DadosProfissionais, string]> = [
  ["formacao", "Formação"], ["numeroCoren", "COREN"], ["ufCoren", "UF COREN"],
  ["dataInicioResidencia", "Início da residência"], ["iesEnfermagem", "IES"],
  ["atuaSMS", "Atuação na SMS"], ["lotacao", "Lotação"], ["matricula", "Matrícula"],
  ["cidadeTrabalho", "Cidade de trabalho"], ["localCargo", "Cargo"],
];
const mostrar = (v: string | boolean | undefined) =>
  typeof v === "boolean" ? (v ? "Sim" : "Não") : (v || "—");

export default function RevisoesProfissionais({
  usuarios, onAtualizar,
}: { usuarios: Usuario[]; onAtualizar: () => Promise<void> }) {
  const { sessionData } = useAuth();
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [processando, setProcessando] = useState(false);

  const decidir = async (usuario: Usuario, decisao: "Aprovada" | "Recusada") => {
    if (!sessionData?.ehAdmin || !sessionData.uid || !usuario.id || processando) return;
    if (decisao === "Recusada" && motivo.trim().length < 8) {
      toast.error("Descreva a justificativa da recusa (mínimo de oito caracteres).");
      return;
    }
    setProcessando(true);
    try {
      await decidirRevisaoProfissional(usuario.id, sessionData.uid, decisao, motivo);
      toast.success(decisao === "Aprovada" ? "Novos dados aprovados; acesso restabelecido." : "Solicitação recusada; acesso bloqueado.");
      setSelecionado(null);
      setMotivo("");
      await onAtualizar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar a decisão.");
    } finally { setProcessando(false); }
  };

  if (!usuarios.length) return <p className="rounded-xl border bg-white p-8 text-center text-sm text-gray-600">Nenhuma alteração profissional aguardando análise.</p>;
  return <div className="space-y-3">
    <p className="text-sm text-gray-600">O acesso dos profissionais abaixo está suspenso. As informações vigentes são preservadas até a decisão; a aprovação aplica os novos dados e a recusa exige justificativa.</p>
    {usuarios.map(usuario => {
      const aberto = selecionado === usuario.id;
      const novo = usuario.dadosProfissionaisPropostos;
      return <div key={usuario.id} className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="font-semibold">{usuario.dadosPessoais.nomeCompleto}</h3><p className="text-xs text-gray-500">{usuario.email} · acesso suspenso para revisão</p></div>
          <Button variant="outline" size="sm" onClick={() => { setSelecionado(aberto ? null : usuario.id ?? null); setMotivo(""); }}>
            {aberto ? "Fechar análise" : "Analisar alteração"}
          </Button>
        </div>
        {aberto && novo && <div className="mt-4 space-y-4">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="bg-slate-50"><tr><th className="p-3">Campo</th><th className="p-3">Anterior</th><th className="p-3">Solicitado</th></tr></thead>
              <tbody>{campos.map(([campo, titulo]) =>
                <tr key={campo} className="border-t">
                  <td className="p-3 font-medium">{titulo}</td>
                  <td className="p-3">{mostrar(usuario.dadosProfissionais[campo])}</td>
                  <td className="p-3">{mostrar(novo[campo])}</td>
                </tr>
              )}</tbody>
            </table>
          </div>
          <div className="space-y-2">
            <label htmlFor="revisao-motivo" className="text-sm font-medium">Justificativa para recusar</label>
            <Textarea id="revisao-motivo" value={motivo} onChange={e => setMotivo(e.target.value)} maxLength={2000} placeholder="Explique o motivo e os dados que precisam ser corrigidos."/>
          </div>
          {sessionData?.ehAdmin ? <div className="flex flex-wrap gap-2">
            <Button disabled={processando} onClick={() => void decidir(usuario, "Aprovada")}>Aprovar e restabelecer acesso</Button>
            <Button variant="destructive" disabled={processando || motivo.trim().length < 8} onClick={() => void decidir(usuario, "Recusada")}>Recusar com justificativa</Button>
          </div> : <p className="text-sm text-amber-800">Somente administradores podem decidir alterações profissionais.</p>}
        </div>}
      </div>;
    })}
  </div>;
}
