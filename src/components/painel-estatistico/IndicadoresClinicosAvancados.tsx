import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ItemRanking, EstatisticasProducao } from '@/utils/painelEstatistico';

export function RankingAvancadoCard({ titulo, dados, nota, cor = '#e11d48' }: {
  titulo: string; dados: ItemRanking[]; nota: string; cor?: string;
}) {
  return (
    <Card className="border-none shadow-xl bg-white">
      <CardHeader>
        <CardTitle className="text-sm font-bold">{titulo}</CardTitle>
        <CardDescription className="text-xs leading-relaxed">{nota}</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px]">
        {dados.length && dados.some(item => item.value > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} layout="vertical" margin={{ left: 10, right: 36, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={190} tick={{ fontSize: 10 }} tickFormatter={name => String(name).length > 28 ? String(name).slice(0, 27) + '…' : String(name)} />
              <Bar dataKey="value" name="Registros" fill={cor} radius={[0, 4, 4, 0]} />
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="flex h-full items-center justify-center text-center text-sm text-slate-500">Nenhum registro disponível para os filtros atuais.</p>}
      </CardContent>
    </Card>
  );
}

export function ComparacaoNHBsCard({ dados }: {
  dados: EstatisticasProducao['etapasPE']['diagnostico']['comparacaoNHBs'];
}) {
  return (
    <Card className="border-none shadow-xl bg-white lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-bold">NHBs identificadas na avaliação × incorporadas ao planejamento</CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Presença por Processo de Enfermagem: NHBs sinalizadas pelos achados de avaliação e NHBs vinculadas a diagnósticos com plano registrado. As séries podem se sobrepor. Diferenças não comprovam omissão clínica: a coleta subjetiva também pode fundamentar o plano.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[390px]">
        {dados.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 28, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={190} tick={{ fontSize: 10 }} tickFormatter={name => String(name).length > 28 ? String(name).slice(0, 27) + '…' : String(name)} />
              <Tooltip formatter={(value: number, name: string) => [value, name]} />
              <Legend />
              <Bar dataKey="avaliacao" name="Sinalizadas na avaliação" fill="#818cf8" radius={[0, 4, 4, 0]} />
              <Bar dataKey="planejamento" name="Com plano de cuidado" fill="#059669" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="flex h-full items-center justify-center text-sm text-slate-500">Nenhuma NHB disponível para comparação.</p>}
      </CardContent>
    </Card>
  );
}

export function ContinuidadeCuidadoCard({ dados }: { dados: EstatisticasProducao['continuidadeCuidado'] }) {
  return (
    <Card className="border-none shadow-xl bg-white">
      <CardHeader>
        <CardTitle className="text-base font-bold">Continuidade do cuidado documentada</CardTitle>
        <CardDescription>
          Somente retornos concluídos. Cada diagnóstico ativo antes de um retorno representa uma oportunidade; um diagnóstico mantido pode aparecer novamente no retorno seguinte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-600">Retornos elegíveis</p><p className="text-2xl font-bold">{dados.retornos}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-600">Oportunidades</p><p className="text-2xl font-bold">{dados.oportunidades}</p></div>
          <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-600">Abordagens</p><p className="text-2xl font-bold">{dados.abordados}</p></div>
          <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs text-emerald-800">Taxa de abordagem</p><p className="text-2xl font-bold text-emerald-800">{dados.oportunidades ? dados.taxaAbordagem.toLocaleString('pt-BR') + '%' : '—'}</p></div>
        </div>
        <div className="h-[290px]">
          {dados.decisoes.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados.decisoes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" name="Decisões registradas" fill="#059669" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="flex h-full items-center justify-center text-sm text-slate-500">Nenhuma decisão concluída registrada.</p>}
        </div>
        <p className="text-xs text-slate-600">
          Decisões: mantido, substituído ou encerrado. Abordagens sem decisão diagnóstica explícita: {dados.abordadosSemDecisao}. Acompanhamentos registrados em cadastros distintos do mesmo paciente não são vinculados automaticamente. Filtros de período referem-se à conclusão do retorno.
        </p>
      </CardContent>
    </Card>
  );
}
