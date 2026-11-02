import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getDiagnosticos, type Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import {
  categoriasRejeicao, decidirSugestao, listarDecisoes, listarSugestoes,
  type CategoriaRejeicao, type DestinoIntervencao, type IntervencaoAutoral, type PreparacaoAprovacao,
  type SituacaoSugestao,
} from '@/services/bancodados/intervencoesAutoraisDB';
import { contagensSugestoes, filtrarSugestoes, sugestoesSemelhantes } from '@/utils/sugestoesIntervencoes';
import { normalizarAcao } from '@/utils/intervencoesAutorais';

const vazio: PreparacaoAprovacao = { acaoPrescrita: '', acaoEnfermeiro: '', destinos: [] };
const rotulos: Record<SituacaoSugestao, string> = { aguardando: 'Aguardando Análise', aprovada: 'Aprovadas', rejeitada: 'Rejeitadas' };
const formatoData = (valor?: { toDate?: () => Date }) => valor?.toDate?.().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) || 'Data indisponível';

export default function SugestoesIntervencoes() {
  const { user } = useAuth();
  const [items, setItems] = useState<IntervencaoAutoral[]>([]);
  const [catalogo, setCatalogo] = useState<Diagnostico[]>([]);
  const [status, setStatus] = useState<SituacaoSugestao>('aguardando');
  const [texto, setTexto] = useState('');
  const [autor, setAutor] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [resultado, setResultado] = useState('');
  const [ordem, setOrdem] = useState<'recentes' | 'antigas'>('recentes');
  const [selecionada, setSelecionada] = useState<IntervencaoAutoral | null>(null);
  const [modo, setModo] = useState<'detalhes' | 'rejeitar' | 'aprovar'>('detalhes');
  const [categoria, setCategoria] = useState<CategoriaRejeicao | ''>('');
  const [justificativa, setJustificativa] = useState('');
  const [preparacao, setPreparacao] = useState<PreparacaoAprovacao>(vazio);
  const [buscaDestino, setBuscaDestino] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [historico, setHistorico] = useState<Array<{ id: string; tipo?: string; dataHora?: { toDate?: () => Date }; avaliadorId?: string }>>([]);

  const carregar = async () => {
    try { setItems(await listarSugestoes()); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Falha ao carregar sugestões'); }
  };
  useEffect(() => { void carregar(); return getDiagnosticos(setCatalogo); }, []);
  useEffect(() => {
    if (selecionada?.id) void listarDecisoes(selecionada.id).then(setHistorico).catch(() => setHistorico([]));
  }, [selecionada]);

  const contagens = useMemo(() => contagensSugestoes(items), [items]);
  const filtrados = useMemo(() => filtrarSugestoes(items, { status, texto, autor, diagnostico, resultado, ordem }), [items, status, texto, autor, diagnostico, resultado, ordem]);
  const destinosDisponiveis = useMemo(() => catalogo.flatMap(diag => {
    const titulos = diag.resultadosEsperados.map(r => r.tituloResultado);
    return diag.resultadosEsperados.filter(r => titulos.filter(t => t === r.tituloResultado).length === 1).map(r => ({
      diagnosticoId: diag.id, tituloDiagnostico: diag.tituloDiagnostico, tituloResultado: r.tituloResultado,
    }));
  }).filter(d => normalizarAcao(`${d.tituloDiagnostico} ${d.tituloResultado}`).includes(normalizarAcao(buscaDestino))), [catalogo, buscaDestino]);

  function abrir(item: IntervencaoAutoral, novoModo: typeof modo) {
    setSelecionada(item); setModo(novoModo); setErro(''); setCategoria(''); setJustificativa('');
    setPreparacao(item.preparacao ? { ...item.preparacao } : { ...vazio, destinos: [] });
  }
  function alternarDestino(destino: DestinoIntervencao) {
    setPreparacao(atual => {
      const existe = atual.destinos.some(d => d.diagnosticoId === destino.diagnosticoId && d.tituloResultado === destino.tituloResultado);
      return { ...atual, destinos: existe ? atual.destinos.filter(d => !(d.diagnosticoId === destino.diagnosticoId && d.tituloResultado === destino.tituloResultado)) : [...atual.destinos, destino] };
    });
  }
  async function confirmar(decisao: 'preparar' | 'rejeitar' | 'publicar') {
    if (!selecionada?.id || !user?.uid) return;
    setOcupado(true); setErro('');
    try {
      await decidirSugestao(selecionada.id, decisao, user.uid, user.displayName || user.email || user.uid,
        decisao === 'rejeitar' ? { categoria: categoria || undefined, justificativa } : { preparacao });
      await carregar(); setSelecionada(null);
      toast.success(decisao === 'publicar' ? 'Intervenção publicada no catálogo' : decisao === 'rejeitar' ? 'Sugestão rejeitada' : 'Preparação salva');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar a decisão'); }
    finally { setOcupado(false); }
  }

  return <div className="space-y-5">
    <p className="text-sm text-muted-foreground">Sugestões autorais exigem análise técnica. A publicação no catálogo requer homologação institucional registrada.</p>
    <Tabs value={status} onValueChange={v => setStatus(v as SituacaoSugestao)}>
      <TabsList className="h-auto flex flex-wrap justify-start gap-1">
        {(Object.keys(rotulos) as SituacaoSugestao[]).map(chave => <TabsTrigger key={chave} value={chave}>{rotulos[chave]} ({contagens[chave]})</TabsTrigger>)}
      </TabsList>
    </Tabs>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Input aria-label="Pesquisar texto" placeholder="Pesquisar texto" value={texto} onChange={e => setTexto(e.target.value)} />
      <Input aria-label="Filtrar autor" placeholder="Autor" value={autor} onChange={e => setAutor(e.target.value)} />
      <Input aria-label="Filtrar diagnóstico" placeholder="Diagnóstico" value={diagnostico} onChange={e => setDiagnostico(e.target.value)} />
      <Input aria-label="Filtrar resultado" placeholder="Resultado esperado" value={resultado} onChange={e => setResultado(e.target.value)} />
      <select aria-label="Ordenar por data" className="rounded-md border px-3 py-2 text-sm" value={ordem} onChange={e => setOrdem(e.target.value as typeof ordem)}><option value="recentes">Mais recentes</option><option value="antigas">Mais antigas</option></select>
    </div>
    {erro && <p role="alert" className="text-red-700">{erro}</p>}
    <div className="space-y-3">
      {filtrados.map(item => <article key={item.id} className="rounded-lg border p-4 space-y-2">
        <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold whitespace-pre-wrap">{item.textoIntervencao}</p><span className="text-sm text-muted-foreground">{formatoData(item.dataCriacao)}</span></div>
        <p className="text-sm">Autor: {item.autorNome || 'Indisponível'} · Diagnóstico: {item.tituloDiagnosticoOrigem || 'Indisponível'} · Resultado: {item.tituloResultadoOrigem || item.tituloResultadoVinculado || 'Indisponível'}</p>
        <p className="text-sm text-muted-foreground">Situação: {item.preparacao && status === 'aguardando' ? 'Aprovação preparada' : rotulos[status]}{sugestoesSemelhantes(item, items) ? ` · ${sugestoesSemelhantes(item, items)} sugestão(ões) com texto igual` : ''}</p>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => abrir(item, 'detalhes')}>Visualizar</Button>{status === 'aguardando' && <><Button onClick={() => abrir(item, 'aprovar')}>Aprovar</Button><Button variant="destructive" onClick={() => abrir(item, 'rejeitar')}>Rejeitar</Button></>}</div>
      </article>)}
      {!filtrados.length && <p className="text-sm text-muted-foreground">Nenhuma sugestão encontrada.</p>}
    </div>
    <Dialog open={!!selecionada} onOpenChange={aberto => { if (!aberto && !ocupado) setSelecionada(null); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{modo === 'aprovar' ? 'Analisar e publicar intervenção' : modo === 'rejeitar' ? 'Rejeitar sugestão' : 'Detalhes da sugestão'}</DialogTitle></DialogHeader>
        {selecionada && <div className="space-y-4 text-sm">
          <div className="rounded-md bg-muted p-3"><strong>Texto original</strong><p className="whitespace-pre-wrap">{selecionada.textoIntervencao}</p></div>
          <p>Autor: {selecionada.autorNome || 'Indisponível'} · Criada em: {formatoData(selecionada.dataCriacao)}</p>
          <p>Diagnóstico de origem: {selecionada.tituloDiagnosticoOrigem || 'Indisponível'} · Resultado de origem: {selecionada.tituloResultadoOrigem || selecionada.tituloResultadoVinculado || 'Indisponível'}</p>
          {modo === 'rejeitar' && <><label className="block">Categoria<select className="mt-1 w-full rounded-md border p-2" value={categoria} onChange={e => setCategoria(e.target.value as CategoriaRejeicao)}><option value="">Selecione</option>{categoriasRejeicao.map(c => <option key={c}>{c}</option>)}</select></label><label className="block">Justificativa<Textarea value={justificativa} onChange={e => setJustificativa(e.target.value)} /></label></>}
          {modo === 'aprovar' && <>
            <label className="block">Ação Prescrita — verbo no infinitivo<Input value={preparacao.acaoPrescrita} onChange={e => setPreparacao(p => ({ ...p, acaoPrescrita: e.target.value }))} /></label>
            <label className="block">Ação do Enfermeiro — primeira pessoa do presente<Input value={preparacao.acaoEnfermeiro} onChange={e => setPreparacao(p => ({ ...p, acaoEnfermeiro: e.target.value }))} /></label>
            <div><strong>Destinos selecionados ({preparacao.destinos.length})</strong><div className="flex flex-wrap gap-2 mt-2">{preparacao.destinos.map(d => <Button key={`${d.diagnosticoId}|${d.tituloResultado}`} variant="outline" size="sm" onClick={() => alternarDestino(d)}>{d.tituloDiagnostico} → {d.tituloResultado} ×</Button>)}</div><Button variant="link" onClick={() => setPreparacao(p => ({ ...p, destinos: [] }))}>Limpar seleção</Button></div>
            <Input aria-label="Pesquisar diagnósticos e resultados" placeholder="Pesquisar diagnósticos e resultados" value={buscaDestino} onChange={e => setBuscaDestino(e.target.value)} />
            <div className="max-h-48 overflow-auto rounded-md border p-2 space-y-1">{destinosDisponiveis.map(d => <label key={`${d.diagnosticoId}|${d.tituloResultado}`} className="flex items-center gap-2"><input type="checkbox" checked={preparacao.destinos.some(s => s.diagnosticoId === d.diagnosticoId && s.tituloResultado === d.tituloResultado)} onChange={() => alternarDestino(d)} />{d.tituloDiagnostico} → {d.tituloResultado}</label>)}</div>
            <p className="text-muted-foreground">Resultados com título repetido no mesmo diagnóstico não podem ser selecionados até correção do catálogo.</p>
            {([['referenciaDeliberacao', 'Referência da deliberação'], ['dataDeliberacao', 'Data da deliberação'], ['documentoHomologacao', 'Documento, ata ou protocolo'], ['responsavelValidacao', 'Responsável pela validação']] as const).map(([campo, label]) => <label key={campo} className="block">{label}<Input type={campo === 'dataDeliberacao' ? 'date' : 'text'} value={preparacao[campo] || ''} onChange={e => setPreparacao(p => ({ ...p, [campo]: e.target.value }))} /></label>)}
            <p className="text-muted-foreground">A referência é uma declaração administrativa, não uma verificação independente do documento.</p>
          </>}
          {modo === 'detalhes' && <><p>Status: {rotulos[selecionada.status || 'aguardando']}</p>{selecionada.preparacao && <div><p>Ação Prescrita: {selecionada.preparacao.acaoPrescrita}</p><p>Ação do Enfermeiro: {selecionada.preparacao.acaoEnfermeiro}</p><p>Destinos: {selecionada.preparacao.destinos.map(d => `${d.tituloDiagnostico} → ${d.tituloResultado}`).join('; ')}</p><p>Homologação: {selecionada.preparacao.referenciaDeliberacao || 'Pendente'}</p></div>}{selecionada.categoriaRejeicao && <p>Rejeição: {selecionada.categoriaRejeicao} — {selecionada.justificativaRejeicao}</p>}<div><strong>Histórico administrativo</strong>{historico.map(h => <p key={h.id}>{h.tipo} · {formatoData(h.dataHora)} · {h.avaliadorId}</p>)}{!historico.length && <p>Sem decisões registradas.</p>}</div></>}
          {erro && <p role="alert" className="text-red-700">{erro}</p>}
        </div>}
        <DialogFooter>{modo === 'rejeitar' && <Button disabled={ocupado || !categoria || !justificativa.trim()} variant="destructive" onClick={() => void confirmar('rejeitar')}>Confirmar rejeição</Button>}{modo === 'aprovar' && <><Button variant="outline" disabled={ocupado} onClick={() => void confirmar('preparar')}>Salvar preparação</Button><Button disabled={ocupado} onClick={() => void confirmar('publicar')}>Confirmar homologação e publicar</Button></>}</DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
