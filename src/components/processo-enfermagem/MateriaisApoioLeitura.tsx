import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { MaterialApoioConsulta } from '@/types/processoEnfermagem';
import { linkMaterialSeguro } from '@/utils/materiaisApoioProcesso';

export default function MateriaisApoioLeitura({ materiais }: { materiais: Array<MaterialApoioConsulta & { entregue: boolean }> }) {
  return <ul className="mt-2 space-y-1 text-xs">
    {materiais.map(material => {
      const href = linkMaterialSeguro(material.urlMaterialApoio);
      return <li key={material.id} className="flex flex-wrap items-center gap-2">
        {href ? <a className="inline-flex items-center gap-1 underline underline-offset-2" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${material.tituloMaterialApoio} em nova aba`}>{material.tituloMaterialApoio}<ExternalLink className="h-3 w-3" aria-hidden="true" /></a> : <span title="Link HTTPS indisponível">{material.tituloMaterialApoio} · link indisponível</span>}
        <span className={material.entregue ? 'text-emerald-700' : 'text-muted-foreground'}>{material.entregue ? 'Entregue' : 'Não entregue'}</span>
      </li>;
    })}
  </ul>;
}
