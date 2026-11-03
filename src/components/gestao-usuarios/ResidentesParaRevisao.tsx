import type { Usuario } from "@/types/usuario";
import { residentesParaRevisao, residentesSemData } from "@/utils/revisaoCadastral";

function formatar(s: string) {
  const [ano, mes, dia] = s.split("-");
  return ano && mes && dia ? dia + "/" + mes + "/" + ano : "Não informado";
}

export default function ResidentesParaRevisao({ usuarios, hoje = new Date() }: { usuarios: Usuario[]; hoje?: Date }) {
  const vencidos = residentesParaRevisao(usuarios, hoje);
  const semData = residentesSemData(usuarios);
  return <div className="space-y-5">
    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
      <strong>Revisão de vínculos:</strong> o marco de dois anos é calculado a partir da data de início informada no cadastro. Não comprova sozinho conclusão da residência e não suspende nem revoga o acesso. Próxima etapa: permitir prorrogação por prazo definido, conversão de perfil e revogação mediante decisão motivada.
    </div>
    {!vencidos.length ? <p className="rounded-lg border p-6 text-center text-sm text-gray-600">Nenhum residente ultrapassou o marco de dois anos.</p> :
      <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-slate-50"><tr>
          <th className="p-3">Profissional</th><th className="p-3">Início</th>
          <th className="p-3">Marco de 2 anos</th><th className="p-3">Dias transcorridos</th><th className="p-3">Acesso</th>
        </tr></thead>
        <tbody>{vencidos.map(({ usuario, prazo }) =>
          <tr key={usuario.id ?? usuario.uid} className="border-t">
            <td className="p-3"><strong>{usuario.dadosPessoais.nomeCompleto}</strong><div className="text-xs text-gray-500">{usuario.dadosProfissionais.lotacao || usuario.email}</div></td>
            <td className="p-3">{formatar(usuario.dadosProfissionais.dataInicioResidencia ?? "")}</td>
            <td className="p-3">{formatar(prazo.termino)}</td>
            <td className="p-3 tabular-nums">{prazo.diasAposTermino}</td>
            <td className="p-3">{usuario.statusAcesso}</td>
          </tr>
        )}</tbody>
      </table></div>
    }
    {semData.length > 0 && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="font-semibold text-amber-950">Residentes sem data válida de início: {semData.length}</h3>
      <p className="mt-1 text-xs text-amber-800">Esses perfis precisam de conferência manual para não ficarem invisíveis no monitoramento.</p>
      <ul className="mt-2 list-disc pl-5 text-sm">{semData.map(u => <li key={u.id ?? u.uid}>{u.dadosPessoais.nomeCompleto} — {u.statusAcesso}</li>)}</ul>
    </div>}
  </div>;
}
