import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { ProcessoEnfermagem, EvolucaoEnfermagem } from '@/types/processoEnfermagem';
import type { Paciente } from '@/types/paciente';
import { materiaisComEntrega } from '@/utils/materiaisApoioProcesso';
import { obterIntervencoesDaConsulta, referenciaResultado } from '@/utils/evolucaoProcesso';
import MateriaisApoioLeitura from './MateriaisApoioLeitura';

interface EtapaEvolucaoProps {
  processo: ProcessoEnfermagem;
  paciente: Paciente;
  onUpdateEvolucao: (evolucao: EvolucaoEnfermagem) => void;
}

const respostas = [
  ['favoravel', 'Resposta favorável observada'],
  ['parcial', 'Resposta parcial'],
  ['desfavoravel', 'Resposta desfavorável'],
  ['sem_resposta', 'Sem resposta avaliável nesta consulta'],
  ['acompanhamento', 'Requer acompanhamento posterior'],
] as const;
const resultados = [
  ['alcancado', 'Alcançado'],
  ['parcial', 'Parcialmente alcançado'],
  ['nao_alcancado', 'Não alcançado'],
  ['nao_avaliavel', 'Ainda não avaliável'],
] as const;

const EtapaEvolucao: React.FC<EtapaEvolucaoProps> = ({ processo, onUpdateEvolucao }) => {
  const [novaObservacao, setNovaObservacao] = useState('');
  const [novosVinculos, setNovosVinculos] = useState<string[]>([]);
  const evolucao = processo.evolucao || { resumoGerado: '' };
  const intervencoes = obterIntervencoesDaConsulta(processo);
  const executadas = intervencoes.filter((item) => item.executada);
  const atualizar = (mudanca: Partial<EvolucaoEnfermagem>) => onUpdateEvolucao({ ...evolucao, ...mudanca, resumoGerado: '' });

  const atualizarResposta = (id: string, diagnosticoId: string, campo: 'classificacao' | 'observacao', valor: string) => {
    const atual = evolucao.respostasIntervencoes?.[id] || { diagnosticoId };
    const nova = { ...atual, [campo]: valor };
    const mapa = { ...evolucao.respostasIntervencoes };
    if (nova.classificacao || nova.observacao?.trim()) mapa[id] = nova;
    else delete mapa[id];
    atualizar({ respostasIntervencoes: mapa });
  };

  const atualizarResultado = (id: string, diagnosticoId: string, resultadoTitulo: string, campo: 'classificacao' | 'observacao', valor: string) => {
    const atual = evolucao.avaliacoesResultados?.[id] || { diagnosticoId, resultadoTitulo };
    const nova = { ...atual, [campo]: valor };
    const mapa = { ...evolucao.avaliacoesResultados };
    if (nova.classificacao || nova.observacao?.trim()) mapa[id] = nova;
    else delete mapa[id];
    atualizar({ avaliacoesResultados: mapa });
  };

  const salvarObservacao = () => {
    if (!novaObservacao.trim() || novosVinculos.length === 0) return;
    atualizar({ observacoesCompartilhadas: [...(evolucao.observacoesCompartilhadas || []), { id: crypto.randomUUID(), texto: novaObservacao.trim(), intervencaoIds: novosVinculos }] });
    setNovaObservacao('');
    setNovosVinculos([]);
  };

  const editarObservacao = (id: string, texto?: string, intervencaoIds?: string[]) => {
    atualizar({ observacoesCompartilhadas: (evolucao.observacoesCompartilhadas || []).map((item) => item.id === id ? { ...item, ...(texto !== undefined ? { texto } : {}), ...(intervencaoIds ? { intervencaoIds } : {}) } : item) });
  };

  return <div className="space-y-5">
    <Card><CardHeader><CardTitle>5. Evolução de Enfermagem · Resposta às Intervenções</CardTitle></CardHeader><CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">As respostas são opcionais e não comprovam, por si só, que o resultado esperado foi alcançado.</p>
      {intervencoes.length === 0 && <p className="text-sm">Nenhuma intervenção foi planejada nesta consulta.</p>}
      {intervencoes.map((item) => {
        const resposta = evolucao.respostasIntervencoes?.[item.id];
        const materiais = materiaisComEntrega(item.prescrita.materiaisDeApoio, item.implementada);
        return <div key={item.id} className="rounded-lg border p-3 space-y-2">
          <p className="font-medium">{item.tituloDiagnostico}</p>
          {item.resultadoEsperado && <p className="text-sm">Resultado esperado: {item.resultadoEsperado}</p>}
          <p className="text-sm">{item.prescrita.acaoPrescrita}</p>
          <p className="text-xs text-muted-foreground">{item.executada ? `Realizada · Executor: ${item.implementada?.quemExecuta || 'não informado'}` : 'Não realizada nesta consulta'}</p>
          {materiais.length > 0 && <MateriaisApoioLeitura materiais={materiais} />}
          {item.executada && <div className="space-y-2">
            <label className="block text-sm" htmlFor={`resposta-${item.id}`}>Resposta observada (opcional)</label>
            <select id={`resposta-${item.id}`} className="w-full rounded-md border bg-background p-2 text-sm" value={resposta?.classificacao || ''} onChange={(event) => atualizarResposta(item.id, item.diagnosticoId, 'classificacao', event.target.value)}>
              <option value="">Sem classificação</option>{respostas.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
            </select>
            <Textarea aria-label={`Observação da intervenção ${item.prescrita.acaoPrescrita}`} value={resposta?.observacao || ''} onChange={(event) => atualizarResposta(item.id, item.diagnosticoId, 'observacao', event.target.value)} placeholder="Observação individual (opcional)" />
          </div>}
        </div>;
      })}
      {executadas.length > 0 && <div className="border-t pt-4 space-y-3">
        <h3 className="font-semibold">Observações compartilhadas</h3>
        {(evolucao.observacoesCompartilhadas || []).map((observacao) => <div key={observacao.id} className="rounded-md border p-3 space-y-2">
          <Textarea aria-label="Editar observação compartilhada" value={observacao.texto} onChange={(event) => editarObservacao(observacao.id, event.target.value)} />
          <p className="text-xs">Vinculada a:</p>
          {executadas.map((item) => <label key={item.id} className="flex items-center gap-2 text-sm"><Checkbox checked={observacao.intervencaoIds.includes(item.id)} onCheckedChange={(marcado) => editarObservacao(observacao.id, undefined, marcado ? [...observacao.intervencaoIds, item.id] : observacao.intervencaoIds.filter((id) => id !== item.id))} />{item.prescrita.acaoPrescrita}</label>)}
          <Button variant="outline" size="sm" onClick={() => atualizar({ observacoesCompartilhadas: (evolucao.observacoesCompartilhadas || []).filter((item) => item.id !== observacao.id) })}>Remover observação</Button>
        </div>)}
        <Textarea aria-label="Nova observação compartilhada" value={novaObservacao} onChange={(event) => setNovaObservacao(event.target.value)} placeholder="Observação que se aplica a várias intervenções" />
        {executadas.map((item) => <label key={item.id} className="flex items-center gap-2 text-sm"><Checkbox checked={novosVinculos.includes(item.id)} onCheckedChange={(marcado) => setNovosVinculos(marcado ? [...novosVinculos, item.id] : novosVinculos.filter((id) => id !== item.id))} />{item.prescrita.acaoPrescrita}</label>)}
        <Button type="button" disabled={!novaObservacao.trim() || novosVinculos.length === 0} onClick={salvarObservacao}>Adicionar observação</Button>
      </div>}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Avaliação dos Resultados Esperados</CardTitle></CardHeader><CardContent className="space-y-3">
      {(processo.planejamento?.diagnosticosPlanejados || []).map((diag) => {
        if (!diag.resultadoEsperadoSelecionado) return <div key={diag.diagnosticoId} className="rounded-md border p-3 text-sm">{diag.tituloDiagnostico} · sem resultado esperado selecionado</div>;
        const id = referenciaResultado(diag.diagnosticoId, diag.resultadoPlanejadoId);
        const avaliacao = evolucao.avaliacoesResultados?.[id];
        return <div key={id} className="rounded-md border p-3 space-y-2">
          <p className="font-medium">{diag.tituloDiagnostico}</p><p className="text-sm">{diag.resultadoEsperadoSelecionado}</p>
          <label className="block text-sm" htmlFor={`resultado-${id}`}>Avaliação (opcional)</label>
          <select id={`resultado-${id}`} className="w-full rounded-md border bg-background p-2 text-sm" value={avaliacao?.classificacao || ''} onChange={(event) => atualizarResultado(id, diag.diagnosticoId, diag.resultadoEsperadoSelecionado!, 'classificacao', event.target.value)}>
            <option value="">Sem classificação</option>{resultados.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
          <Textarea aria-label={`Observação do resultado ${diag.resultadoEsperadoSelecionado}`} value={avaliacao?.observacao || ''} onChange={(event) => atualizarResultado(id, diag.diagnosticoId, diag.resultadoEsperadoSelecionado!, 'observacao', event.target.value)} placeholder="Observação clínica (opcional)" />
        </div>;
      })}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Julgamento Clínico e Avaliação dos Resultados</CardTitle></CardHeader><CardContent className="space-y-2">
      <p className="text-sm text-muted-foreground">Registre sua avaliação clínica sobre os cuidados realizados, as respostas observadas na pessoa atendida, os resultados alcançados e as decisões de continuidade ou revisão do planejamento. Considere dúvidas, dificuldades, compreensão demonstrada, mudanças no estado de saúde e necessidades de acompanhamento.</p>
      <Textarea aria-label="Julgamento Clínico e Avaliação dos Resultados" value={evolucao.julgamentoClinico || ''} onChange={(event) => atualizar({ julgamentoClinico: event.target.value })} rows={5} placeholder="Síntese clínica da consulta (opcional)" />
    </CardContent></Card>
  </div>;
};

export default EtapaEvolucao;
