import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export interface IndicadorResumoItem {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icone: ReactNode;
}

export function IndicadoresResumo({
  itens,
  carregando = false,
}: {
  itens: IndicadorResumoItem[];
  carregando?: boolean;
}) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5" aria-label="Indicadores administrativos">
      {itens.map((item) => (
        <Card key={item.titulo} className="min-w-0 border border-slate-200 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium text-slate-600">{item.titulo}</p>
              <span aria-hidden="true" className="shrink-0 text-csae-green-600">{item.icone}</span>
            </div>
            <p className="mt-2 text-xl font-bold tabular-nums text-csae-green-800 sm:text-2xl">
              {carregando ? '…' : item.valor}
            </p>
            {item.descricao && <p className="mt-1 text-xs text-slate-500">{item.descricao}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
