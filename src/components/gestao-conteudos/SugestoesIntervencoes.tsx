import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { type Diagnostico } from '@/services/bancodados/rolEnfermagemDB';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import {
  categoriasRejeicao, decidirSugestao, decidirSugestoesEmGrupo, desmembrarSugestao, listarDecisoes, listarIntervencoesBiblioteca, listarSugestoes, obterSugestao, salvarAvaliacaoQualidade,
  type AvaliacaoQualidadeIntervencao, type CategoriaRejeicao, type DestinoIntervencao, type IntervencaoAutoral, type IntervencaoBiblioteca, type PreparacaoAprovacao,
  type ModoDisponibilidadeIntervencao,
  type SituacaoSugestao,
} from '@/services/bancodados/intervencoesAutoraisDB';
import { agruparSugestoes, contagensSugestoes, filtrarOcorrenciasGrupo, filtrarSugestoes, indiceSemelhantes, selecionarPendentesGrupo } from '@/utils/sugestoesIntervencoes';
import { normalizarAcao } from '@/utils/intervencoesAutorais';
import { sinalizarIntervencoesMultiplas } from '@/utils/individualizacaoIntervencoes';
import { useSearchParams } from 'react-router-dom';

const vazio: PreparacaoAprovacao = { acaoPrescrita: '', acaoEnfermeiro: '', destinos: [], modoDisponibilidade: 'resultados_especificos', materiaisDeApoio: [] };
const rotulos: Record<SituacaoSugestao, string> = { aguardando: 'Aguardando Análise', aprovada: 'Aprovadas', rejeitada: 'Rejeitadas' };
const formatoData = (valor?: { toDate?: () => Date }) => valor?.toDate?.().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) || 'Data indisponível';
const TAMANHO_PAGINA = 25;
const nomeAutor = (item: IntervencaoAutoral) => item.autorNomeResolvido || (item.autorNome?.includes('@') ? 'Perfil não identificado' : item.autorNome) || 'Perfil não identificado';
const origem = (item: IntervencaoAutoral) => item.tituloDiagnosticoOrigem || (item.origemStatus === 'ambigua' ? 'Origem ambígua, aguardando revisão' : 'Origem não confirmada');

export default function SugestoesIntervencoes() {
  const { user, sessionData } = useAuth();
  const [parametros] = useSearchParams();
  const [items, setItems] = useState<IntervencaoAutoral[]>([]);
  const [catalogo, setCatalogo] = useState<Diagnostico[]>([]);
  const [biblioteca, setBiblioteca] = useState<IntervencaoBiblioteca[]>([]);
  const [bibliotecaSelecionadaId, setBibliotecaSelecionadaId] = useState('');
  const [equivalenciaConfirmada, setEquivalenciaConfirmada] = useState(false);
  const [catalogoCarregando, setCatalogoCarregando] = useState(false);
  const [catalogoErro, setCatalogoErro] = useState('');
  const [diagnosticoDestinoId, setDiagnosticoDestinoId] = useState('');
  const [buscaDiagnostico, setBuscaDiagnostico] = useState('');
  const [pagina, setPagina] = useState(1);
  const [agrupar, setAgrupar] = useState(false);
  const [grupoAberto, setGrupoAberto] = useState<string | null>(null);
  const [paginaDetalhesGrupo, setPaginaDetalhesGrupo] = useState(1);
  const [paginaGrupos, setPaginaGrupos] = useState(1);
  const [buscaGrupo, setBuscaGrupo] = useState('');
  const [diagnosticoGrupo, setDiagnosticoGrupo] = useState('');
  const [resultadoGrupo, setResultadoGrupo] = useState('');
  const [autorGrupo, setAutorGrupo] = useState('');
  const [statusGrupo, setStatusGrupo] = useState('');
  const [paginaOcorrenciasGrupo, setPaginaOcorrenciasGrupo] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const geracao = useRef(0);
  const [status, setStatus] = useState<SituacaoSugestao>(() => (['aguardando', 'aprovada', 'rejeitada'].includes(parametros.get('status') || '') ? parametros.get('status') as SituacaoSugestao : 'aguardando'));
  const [texto, setTexto] = useState('');
  const [autor, setAutor] = useState('');
  const [diagnostico, setDiagnostico] = useState(() => parametros.get('diagnostico') || '');
  const [resultado, setResultado] = useState(() => parametros.get('resultado') || '');
  const [categoriaFiltro, setCategoriaFiltro] = useState(() => parametros.get('categoria') || '');
  const [tipoFiltro, setTipoFiltro] = useState(() => parametros.get('tipo') || '');
  const [dimensaoFiltro, setDimensaoFiltro] = useState<'' | 'atomicidadeStatus' | 'especificidadeNivel' | 'pertinenciaClinica' | 'exequibilidadeNivel' | 'reavaliabilidadeNivel'>(() => {
    const campo = parametros.get('dimensao') || '';
    return ['atomicidadeStatus', 'especificidadeNivel', 'pertinenciaClinica', 'exequibilidadeNivel', 'reavaliabilidadeNivel'].includes(campo) ? campo as typeof dimensaoFiltro : '';
  });
  const [classificacaoFiltro, setClassificacaoFiltro] = useState(() => parametros.get('classificacao') || '');
  const [ordem, setOrdem] = useState<'recentes' | 'antigas'>('recentes');
  const [selecionada, setSelecionada] = useState<IntervencaoAutoral | null>(null);
  const [modo, setModo] = useState<'detalhes' | 'rejeitar' | 'aprovar' | 'desmembrar' | 'grupo'>('detalhes');
  const [modoDisponibilidade, setModoDisponibilidade] = useState<ModoDisponibilidadeIntervencao>('resultados_especificos');
  const [diagnosticoAberto, setDiagnosticoAberto] = useState(false);
  const [grupoOcorrencias, setGrupoOcorrencias] = useState<IntervencaoAutoral[]>([]);
  const [idsGrupo, setIdsGrupo] = useState<string[]>([]);
  const [contextosConfirmados, setContextosConfirmados] = useState<string[]>([]);
  const [progressoGrupo, setProgressoGrupo] = useState<{ concluidas: number; total: number } | null>(null);
  const [textosDerivados, setTextosDerivados] = useState<string[]>([]);
  const [avaliacao, setAvaliacao] = useState<AvaliacaoQualidadeIntervencao>({});
  const [categoria, setCategoria] = useState<CategoriaRejeicao | ''>('');
  const [justificativa, setJustificativa] = useState('');
  const [preparacao, setPreparacao] = useState<PreparacaoAprovacao>(vazio);
  const [buscaDestino, setBuscaDestino] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [historico, setHistorico] = useState<Array<{ id: string; tipo?: string; dataHora?: { toDate?: () => Date }; avaliadorId?: string; avaliacaoQualidade?: AvaliacaoQualidadeIntervencao }>>([]);

  useEffect(() => {
    const controle = geracao;
    const atual = ++controle.current;
    void listarSugestoes().then(dados => { if (atual === controle.current) setItems(dados); })
      .catch(e => { if (atual === controle.current) setErro(e instanceof Error ? e.message : 'Falha ao carregar sugestões'); })
      .finally(() => { if (atual === controle.current) setCarregando(false); });
    return () => { controle.current++; };
  }, []);
  useEffect(() => {
    if (!selecionada?.id || modo !== 'detalhes') return;
    let ativo = true;
    void listarDecisoes(selecionada.id).then(dados => { if (ativo) setHistorico(dados); })
      .catch(() => { if (ativo) setHistorico([]); });
    return () => { ativo = false; };
  }, [selecionada, modo]);

  const contagens = useMemo(() => contagensSugestoes(items), [items]);
  const filtrados = useMemo(() => filtrarSugestoes(items, { status, texto, autor, diagnostico, resultado, ordem, categoria: categoriaFiltro, tipo: tipoFiltro, dimensao: dimensaoFiltro, classificacao: classificacaoFiltro }), [items, status, texto, autor, diagnostico, resultado, ordem, categoriaFiltro, tipoFiltro, dimensaoFiltro, classificacaoFiltro]);
  const semelhantes = useMemo(() => indiceSemelhantes(items), [items]);
  const grupos = useMemo(() => agruparSugestoes(items.filter(item => !item.divisao)), [items]);
  const gruposFiltrados = useMemo(() => grupos.filter(grupo => normalizarAcao(grupo.chave).includes(normalizarAcao(buscaGrupo))), [grupos, buscaGrupo]);
  const paginaAtual = Math.min(pagina, Math.max(1, Math.ceil(filtrados.length / TAMANHO_PAGINA)));
  const visiveis = useMemo(() => filtrados.slice((paginaAtual - 1) * TAMANHO_PAGINA, paginaAtual * TAMANHO_PAGINA), [filtrados, paginaAtual]);
  const diagnosticosFiltrados = useMemo(() => catalogo.filter(d => normalizarAcao(d.tituloDiagnostico).includes(normalizarAcao(buscaDiagnostico))), [catalogo, buscaDiagnostico]);
  const diagnosticoDestino = catalogo.find(d => d.id === diagnosticoDestinoId);
  const destinosDisponiveis = useMemo(() => {
    if (!diagnosticoDestino) return [];
    return diagnosticoDestino.resultadosEsperados
      .map((r, resultadoIndice) => ({ r, resultadoIndice }))
      .filter(({ r }) => normalizarAcao(r.tituloResultado).includes(normalizarAcao(buscaDestino)))
      .map(({ r, resultadoIndice }) => ({ diagnosticoId: diagnosticoDestino.id, tituloDiagnostico: diagnosticoDestino.tituloDiagnostico, tituloResultado: r.tituloResultado, resultadoIndice }));
  }, [diagnosticoDestino, buscaDestino]);
  const ocorrenciasEscolhidas = grupoOcorrencias.filter(item => idsGrupo.includes(item.id || ''));
  const ocorrenciasGrupoFiltradas = useMemo(() => filtrarOcorrenciasGrupo(grupoOcorrencias, { diagnostico: diagnosticoGrupo, resultado: resultadoGrupo, autor: autorGrupo, status: statusGrupo }), [grupoOcorrencias, diagnosticoGrupo, resultadoGrupo, autorGrupo, statusGrupo]);
  const ocorrenciasGrupoVisiveis = ocorrenciasGrupoFiltradas.slice((paginaOcorrenciasGrupo - 1) * TAMANHO_PAGINA, paginaOcorrenciasGrupo * TAMANHO_PAGINA);
  const contextosGrupo = new Set(ocorrenciasEscolhidas.map(item => `${item.diagnosticoOrigemId || ''}|${item.tituloDiagnosticoOrigem || ''}|${item.tituloResultadoOrigem || item.tituloResultadoVinculado || ''}`));
  const grupoTemContextosDistintos = contextosGrupo.size > 1;
  const destinosGrupo = [...new Map(ocorrenciasEscolhidas.flatMap(item => {
    const diagnosticoOrigem = catalogo.find(catalogoItem => catalogoItem.id === item.diagnosticoOrigemId);
    if (!diagnosticoOrigem) return [];
    const titulo = item.tituloResultadoOrigem || item.tituloResultadoVinculado;
    const indices = diagnosticoOrigem.resultadosEsperados.flatMap((resultado, resultadoIndice) => resultado.tituloResultado === titulo ? [resultadoIndice] : []);
    return indices.length === 1 ? [{ diagnosticoId: diagnosticoOrigem.id, tituloDiagnostico: diagnosticoOrigem.tituloDiagnostico, tituloResultado: titulo, resultadoIndice: indices[0] }] : [];
  }).map(destino => [`${destino.diagnosticoId}|${destino.resultadoIndice}`, destino] as const)).values()];
  const origensGrupoAmbiguas = modoDisponibilidade === 'resultados_especificos' && ocorrenciasEscolhidas.some(item => {
    const diagnosticoOrigem = catalogo.find(catalogoItem => catalogoItem.id === item.diagnosticoOrigemId);
    const titulo = item.tituloResultadoOrigem || item.tituloResultadoVinculado;
    return !diagnosticoOrigem || diagnosticoOrigem.resultadosEsperados.filter(resultadoItem => resultadoItem.tituloResultado === titulo).length !== 1;
  });

  useEffect(() => { setPagina(1); }, [status, texto, autor, diagnostico, resultado, ordem, categoriaFiltro, tipoFiltro, dimensaoFiltro, classificacaoFiltro]);

  useEffect(() => {
    if (!['aprovar', 'grupo'].includes(modo) || !selecionada || catalogo.length) return;
    setCatalogoCarregando(true);
    setCatalogoErro('');
    let ativo = true;
    void getDocs(collection(db, 'rolEnfermagem'))
      .then(snapshot => { if (ativo) setCatalogo(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Diagnostico)); })
      .catch(e => { if (ativo) setCatalogoErro(e instanceof Error ? e.message : 'Falha ao carregar diagnósticos'); })
      .finally(() => { if (ativo) setCatalogoCarregando(false); });
    return () => { ativo = false; };
  }, [modo, selecionada, catalogo.length]);

  function abrir(item: IntervencaoAutoral, novoModo: typeof modo) {
    setSelecionada(item); setModo(novoModo); setErro(''); setCategoria(''); setJustificativa('');
    setPreparacao(item.preparacao ? { ...item.preparacao } : { ...vazio, destinos: [] });
    setModoDisponibilidade(item.preparacao?.modoDisponibilidade || 'resultados_especificos');
    setDiagnosticoDestinoId(item.diagnosticoOrigemId || '');
    setBuscaDestino('');
    setAvaliacao(item.avaliacaoQualidade || {});
    if (novoModo === 'desmembrar') {
      const candidatas = sinalizarIntervencoesMultiplas(item.textoIntervencao).candidatas;
      setTextosDerivados(candidatas.length >= 2 ? candidatas : [item.textoIntervencao, '']);
    }
  }
  function abrirGrupo(ocorrencias: IntervencaoAutoral[]) {
    const pendentes = ocorrencias.filter(item => (item.status || 'aguardando') === 'aguardando' && !item.divisao);
    setGrupoOcorrencias(ocorrencias);
    setBibliotecaSelecionadaId(''); setEquivalenciaConfirmada(false);
    void listarIntervencoesBiblioteca().then(setBiblioteca).catch(() => setBiblioteca([]));
    setIdsGrupo([]);
    setDiagnosticoGrupo(''); setResultadoGrupo(''); setAutorGrupo(''); setStatusGrupo(''); setPaginaOcorrenciasGrupo(1);
    setContextosConfirmados([]);
    setProgressoGrupo(null);
    setSelecionada(pendentes[0] || ocorrencias[0] || null);
    setModo('grupo');
    setModoDisponibilidade('resultados_especificos');
    setPreparacao({ ...vazio, acaoPrescrita: '', acaoEnfermeiro: '' });
    setErro(''); setCategoria(''); setJustificativa('');
  }
  function reutilizarRedacao(item: IntervencaoAutoral, textoBase: string) {
    abrir(item, 'aprovar');
    setPreparacao(atual => ({ ...atual, acaoPrescrita: textoBase }));
  }
  async function confirmarDesmembramento() {
    if (!selecionada?.id || !user?.uid) return;
    setOcupado(true); setErro('');
    try {
      const ids = await desmembrarSugestao(selecionada.id, textosDerivados, user.uid, sessionData?.nomeCompleto || user.uid);
      const atualizados = await Promise.all([selecionada.id, ...ids].map(obterSugestao));
      setItems(anteriores => [...anteriores.filter(item => item.id !== selecionada.id), ...atualizados.filter((item): item is IntervencaoAutoral => item !== null)]);
      setSelecionada(null);
      window.dispatchEvent(new Event('csae-sugestao-decidida'));
      toast.success('Sugestão desmembrada; as propostas aguardam análise individual.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível desmembrar a sugestão.'); }
    finally { setOcupado(false); }
  }
  async function confirmarAvaliacao() {
    if (!selecionada?.id || !user?.uid) return;
    setOcupado(true); setErro('');
    try {
      const limpa = Object.fromEntries(Object.entries(avaliacao).filter(([, value]) => value !== undefined && value !== '')) as AvaliacaoQualidadeIntervencao;
      await salvarAvaliacaoQualidade(selecionada.id, limpa, user.uid);
      const atualizada = await obterSugestao(selecionada.id);
      if (atualizada) { setItems(anteriores => anteriores.map(item => item.id === atualizada.id ? atualizada : item)); setSelecionada(atualizada); }
      window.dispatchEvent(new Event('csae-sugestao-decidida'));
      toast.success('Avaliação técnica registrada.');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar a avaliação.'); }
    finally { setOcupado(false); }
  }
  function alternarDestino(destino: DestinoIntervencao) {
    setPreparacao(atual => {
      const identidade = (item: DestinoIntervencao) => `${item.diagnosticoId}|${item.resultadoIndice ?? item.tituloResultado}`;
      const existe = atual.destinos.some(d => identidade(d) === identidade(destino));
      return { ...atual, destinos: existe ? atual.destinos.filter(d => identidade(d) !== identidade(destino)) : [...atual.destinos, destino] };
    });
  }
  async function confirmar(decisao: 'preparar' | 'rejeitar' | 'publicar') {
    if (!selecionada?.id || !user?.uid) return;
    setOcupado(true); setErro('');
    try {
      const { materiaisDeApoio: _materiaisLegados, ...preparacaoSemMateriais } = preparacao;
      const preparacaoFinal = { ...(decisao === 'preparar' ? preparacao : preparacaoSemMateriais), modoDisponibilidade, destinos: modoDisponibilidade === 'transversal' ? [] : preparacao.destinos };
      await decidirSugestao(selecionada.id, decisao, user.uid, sessionData?.nomeCompleto || user.displayName || user.uid,
        decisao === 'rejeitar' ? { categoria: categoria || undefined, justificativa } : { preparacao: preparacaoFinal });
      let atualizado: IntervencaoAutoral | null = null;
      try { atualizado = await obterSugestao(selecionada.id); }
      catch { toast.warning('Decisão salva; atualize a aba para confirmar os detalhes.'); }
      const idDecidido = selecionada.id;
      setItems(anteriores => anteriores.map(item => item.id === idDecidido
        ? atualizado || { ...item, status: decisao === 'publicar' ? 'aprovada' : decisao === 'rejeitar' ? 'rejeitada' : 'aguardando', preparacao: decisao === 'rejeitar' ? item.preparacao : preparacaoFinal }
        : item));
      setSelecionada(null);
      window.dispatchEvent(new Event('csae-sugestao-decidida'));
      toast.success(decisao === 'publicar' ? 'Intervenção publicada no catálogo' : decisao === 'rejeitar' ? 'Sugestão rejeitada' : 'Preparação salva');
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar a decisão'); }
    finally { setOcupado(false); }
  }
  async function confirmarGrupo(decisao: 'publicar' | 'rejeitar' | 'vincular') {
    if (!user?.uid || idsGrupo.length < 2) return;
    if ((decisao === 'publicar' || decisao === 'vincular') && grupoTemContextosDistintos && idsGrupo.some(id => !contextosConfirmados.includes(id))) {
      setErro('Revise e confirme a pertinência clínica de cada ocorrência selecionada.'); return;
    }
    if (decisao === 'vincular' && (!bibliotecaSelecionadaId || !equivalenciaConfirmada)) { setErro('Selecione uma intervenção publicada e confirme a equivalência clínica.'); return; }
    if (decisao === 'publicar' && modoDisponibilidade === 'resultados_especificos' && origensGrupoAmbiguas) {
      setErro('Há origem clínica ausente ou ambígua. Escolha o modo transversal ou trate essas sugestões individualmente.'); return;
    }
    setOcupado(true); setErro(''); setProgressoGrupo({ concluidas: 0, total: idsGrupo.length });
    try {
      const { materiaisDeApoio: _materiaisLegados, ...preparacaoSemMateriais } = preparacao;
      const preparacaoFinal = { ...preparacaoSemMateriais, modoDisponibilidade, destinos: modoDisponibilidade === 'transversal' ? [] : destinosGrupo };
      await decidirSugestoesEmGrupo(idsGrupo, decisao, user.uid, sessionData?.nomeCompleto || user.displayName || user.uid,
        decisao === 'publicar' ? { preparacao: preparacaoFinal } : decisao === 'vincular' ? { intervencaoBibliotecaId: bibliotecaSelecionadaId } : { categoria: categoria || undefined, justificativa },
        (concluidas, total) => setProgressoGrupo({ concluidas, total }));
      const atualizadas = await Promise.all(idsGrupo.map(obterSugestao));
      setItems(anteriores => [...anteriores.filter(item => !idsGrupo.includes(item.id || '')), ...atualizadas.filter((item): item is IntervencaoAutoral => item !== null)]);
      window.dispatchEvent(new Event('csae-sugestao-decidida'));
      toast.success(decisao === 'publicar' ? `${idsGrupo.length} contribuições aprovadas em uma publicação canônica.` : decisao === 'vincular' ? `${idsGrupo.length} contribuições vinculadas à publicação existente.` : `${idsGrupo.length} sugestões rejeitadas com auditoria individual.`);
      setSelecionada(null);
    } catch (e) { setErro(e instanceof Error ? e.message : 'A operação em grupo ficou incompleta. Retome a operação para concluir.'); }
    finally { setOcupado(false); }
  }

  return <div className="space-y-5">
    <p className="text-sm text-muted-foreground">Revise a contribuição e registre a decisão administrativa de publicação. A autorização decorre do perfil de gestão do Portal e não representa homologação documental da CSAE.</p>
    <Button variant="outline" aria-pressed={agrupar} onClick={() => setAgrupar(valor => !valor)}>{agrupar ? 'Exibir sugestões individuais' : 'Agrupar sugestões semelhantes'}</Button>
    {agrupar && <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Agrupamento textual automático para triagem. Textos iguais em contextos clínicos diferentes exigem análise individual.</p>
      <Input aria-label="Buscar grupos de sugestões" placeholder="Buscar redação agrupada" value={buscaGrupo} onChange={e => { setBuscaGrupo(e.target.value); setPaginaGrupos(1); }} />
      {gruposFiltrados.slice((paginaGrupos - 1) * 25, paginaGrupos * 25).map(grupo => {
        const pendentes = grupo.ocorrencias.filter(item => (item.status || 'aguardando') === 'aguardando' && !item.divisao).length;
        const aprovadas = grupo.ocorrencias.filter(item => item.status === 'aprovada').length;
        const rejeitadas = grupo.ocorrencias.filter(item => item.status === 'rejeitada').length;
        return <section key={grupo.chave} className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1"><p className="whitespace-pre-wrap font-medium">{grupo.ocorrencias[0]?.textoIntervencao}</p>
              <p className="mt-1 text-xs text-muted-foreground">{grupo.tipo === 'exata' ? 'Textos idênticos' : grupo.tipo === 'similar' ? 'Semelhança textual; confirme equivalência clínica' : 'Textos normalizados'} · {grupo.autores} autores · {grupo.diagnosticos.length} diagnósticos · {grupo.resultados.length} resultados</p>
              <p className="mt-2 text-sm"><span className="font-medium">{grupo.ocorrencias.length} ocorrências</span> · {pendentes} pendentes · {aprovadas} aprovadas · {rejeitadas} rejeitadas</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {pendentes > 1 && <><Button size="sm" onClick={() => abrirGrupo(grupo.ocorrencias)}>Analisar grupo</Button><Button size="sm" variant="outline" onClick={() => abrirGrupo(grupo.ocorrencias)}>Selecionar ocorrências</Button></>}
              <Button size="sm" variant="ghost" aria-expanded={grupoAberto === grupo.chave} onClick={() => { setGrupoAberto(atual => atual === grupo.chave ? null : grupo.chave); setPaginaDetalhesGrupo(1); }}>{grupoAberto === grupo.chave ? 'Recolher detalhes' : 'Expandir detalhes'}</Button>
            </div>
          </div>
          {(grupo.diagnosticos.length > 0 || grupo.resultados.length > 0) && <div className="flex flex-wrap gap-x-4 gap-y-1 border-t pt-2 text-xs text-muted-foreground"><span><strong>Diagnósticos:</strong> {grupo.diagnosticos.join(' · ') || 'Não identificados'}</span><span><strong>Resultados:</strong> {grupo.resultados.join(' · ') || 'Não identificados'}</span></div>}
          {grupoAberto === grupo.chave && <div className="space-y-2 border-t pt-3">{grupo.ocorrencias.slice((paginaDetalhesGrupo - 1) * TAMANHO_PAGINA, paginaDetalhesGrupo * TAMANHO_PAGINA).map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 p-2 text-sm">
            <p className="min-w-0 flex-1">{nomeAutor(item)} · {origem(item)} → {item.tituloResultadoOrigem || item.tituloResultadoVinculado || 'Resultado não identificado'} · {rotulos[item.status || 'aguardando']}</p>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => abrir(item, 'detalhes')}>Detalhes</Button>{item.status !== 'aprovada' && item.status !== 'rejeitada' && <Button size="sm" variant="outline" onClick={() => reutilizarRedacao(item, grupo.ocorrencias[0].textoIntervencao)}>Reutilizar redação</Button>}</div>
          </div>)}{grupo.ocorrencias.length > TAMANHO_PAGINA && <nav aria-label="Páginas dos detalhes do grupo" className="flex items-center justify-center gap-3"><Button size="sm" variant="outline" disabled={paginaDetalhesGrupo === 1} onClick={() => setPaginaDetalhesGrupo(page => page - 1)}>Anterior</Button><span className="text-xs">Página {paginaDetalhesGrupo} de {Math.ceil(grupo.ocorrencias.length / TAMANHO_PAGINA)}</span><Button size="sm" variant="outline" disabled={paginaDetalhesGrupo * TAMANHO_PAGINA >= grupo.ocorrencias.length} onClick={() => setPaginaDetalhesGrupo(page => page + 1)}>Próxima</Button></nav>}</div>}
        </section>;
      })}
      {gruposFiltrados.length > 25 && <nav aria-label="Páginas dos grupos" className="flex items-center gap-2 text-sm"><Button variant="outline" disabled={paginaGrupos === 1} onClick={() => setPaginaGrupos(n => n - 1)}>Anterior</Button><span>Página {paginaGrupos} de {Math.ceil(gruposFiltrados.length / 25)}</span><Button variant="outline" disabled={paginaGrupos * 25 >= gruposFiltrados.length} onClick={() => setPaginaGrupos(n => n + 1)}>Próxima</Button></nav>}
      {!gruposFiltrados.length && !carregando && <p className="text-sm text-muted-foreground">Nenhum grupo textual encontrado.</p>}
    </div>}
    {!agrupar && <>
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
    <div className="flex flex-wrap gap-2 text-sm"><select aria-label="Filtrar categoria de rejeição" className="rounded border p-2" value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}><option value="">Todas as categorias</option>{categoriasRejeicao.map(c => <option key={c}>{c}</option>)}</select><select aria-label="Filtrar tipo de registro" className="rounded border p-2" value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}><option value="">Originais e derivados</option><option value="original">Originais</option><option value="derivada">Derivados</option></select><select aria-label="Filtrar dimensão técnica" className="rounded border p-2" value={dimensaoFiltro} onChange={e => { setDimensaoFiltro(e.target.value as typeof dimensaoFiltro); setClassificacaoFiltro(''); }}><option value="">Todas as dimensões</option><option value="atomicidadeStatus">Atomicidade</option><option value="especificidadeNivel">Especificidade</option><option value="pertinenciaClinica">Pertinência clínica</option><option value="exequibilidadeNivel">Exequibilidade</option><option value="reavaliabilidadeNivel">Reavaliabilidade</option></select><Input aria-label="Filtrar classificação técnica" className="w-48" placeholder="Classificação técnica" value={classificacaoFiltro} onChange={e => setClassificacaoFiltro(e.target.value)} disabled={!dimensaoFiltro} /></div>
    {erro && !selecionada && <p role="alert" className="text-red-700">{erro}</p>}
    <div className="space-y-3">
      {carregando && Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
      {!carregando && visiveis.map(item => <article key={item.id} className="rounded-lg border p-4 space-y-2">
        <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold whitespace-pre-wrap">{item.textoIntervencao}</p><span className="text-sm text-muted-foreground">{formatoData(item.dataCriacao)}</span></div>
        <p className="text-sm">Autor: {nomeAutor(item)} · Diagnóstico de origem: {origem(item)} · Resultado de origem: {item.tituloResultadoOrigem || item.tituloResultadoVinculado || 'Indisponível'}</p>
        <p className="text-sm text-muted-foreground">Situação: {item.preparacao && status === 'aguardando' ? 'Aprovação preparada' : rotulos[status]}{(semelhantes.get(normalizarAcao(item.textoIntervencao)) || 0) > 1 ? ` · ${(semelhantes.get(normalizarAcao(item.textoIntervencao)) || 1) - 1} sugestão(ões) com texto igual` : ''}</p>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => abrir(item, 'detalhes')}>Visualizar</Button>{status === 'aguardando' && <><Button onClick={() => abrir(item, 'aprovar')}>Aprovar</Button><Button variant="destructive" onClick={() => abrir(item, 'rejeitar')}>Rejeitar</Button>{!item.derivacao && sinalizarIntervencoesMultiplas(item.textoIntervencao).nivel !== 'nenhuma' && <Button variant="outline" onClick={() => abrir(item, 'desmembrar')}>Desmembrar sugestão</Button>}</>}</div>
      </article>)}
      {!carregando && !filtrados.length && !erro && <p className="text-sm text-muted-foreground">Nenhuma sugestão encontrada.</p>}
      {!carregando && filtrados.length > TAMANHO_PAGINA && <nav aria-label="Páginas das sugestões" className="flex items-center justify-center gap-3 py-3"><Button variant="outline" disabled={paginaAtual === 1} onClick={() => setPagina(paginaAtual - 1)}>Anterior</Button><span className="text-sm">Página {paginaAtual} de {Math.ceil(filtrados.length / TAMANHO_PAGINA)} · {filtrados.length} sugestões</span><Button variant="outline" disabled={paginaAtual * TAMANHO_PAGINA >= filtrados.length} onClick={() => setPagina(paginaAtual + 1)}>Próxima</Button></nav>}
    </div>
    </>}
    <Dialog open={!!selecionada} onOpenChange={aberto => { if (!aberto && !ocupado) setSelecionada(null); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{modo === 'aprovar' ? 'Analisar e publicar intervenção' : modo === 'grupo' ? 'Analisar sugestões equivalentes em grupo' : modo === 'rejeitar' ? 'Rejeitar sugestão' : modo === 'desmembrar' ? 'Desmembrar sugestão' : 'Detalhes da sugestão'}</DialogTitle></DialogHeader>
        {selecionada && <div className="space-y-4 text-sm">
          <div className="rounded-md bg-muted p-3"><strong>Texto original</strong><p className="whitespace-pre-wrap">{selecionada.textoIntervencao}</p></div>
          {(sinalizarIntervencoesMultiplas(selecionada.textoIntervencao).nivel !== 'nenhuma' || selecionada.textoIntervencao.trim().length < 20 || (semelhantes.get(normalizarAcao(selecionada.textoIntervencao)) || 0) > 1) && <p className="rounded bg-amber-50 p-2 text-amber-900">Sinalização automática — requer avaliação: {[
            sinalizarIntervencoesMultiplas(selecionada.textoIntervencao).nivel !== 'nenhuma' ? 'possível lista de ações' : '',
            selecionada.textoIntervencao.trim().length < 20 ? 'texto curto' : '',
            (semelhantes.get(normalizarAcao(selecionada.textoIntervencao)) || 0) > 1 ? 'texto repetido' : '',
          ].filter(Boolean).join('; ')}. Isso não constitui parecer clínico.</p>}
          <p>Autor: {nomeAutor(selecionada)} · Criada em: {formatoData(selecionada.dataCriacao)}</p>
          <p>Diagnóstico de origem: {origem(selecionada)} · Resultado de origem: {selecionada.tituloResultadoOrigem || selecionada.tituloResultadoVinculado || 'Indisponível'}</p>
          {selecionada.derivacao && <p className="rounded bg-amber-50 p-2">Proposta derivada da submissão original. {items.find(item => item.id === selecionada.derivacao?.originalId)?.textoIntervencao && <span>Texto original preservado: {items.find(item => item.id === selecionada.derivacao?.originalId)?.textoIntervencao}</span>}</p>}
          {modo === 'desmembrar' && <><p>Revise cada ação antes de criar propostas administrativas independentes. Nenhuma delas será aprovada automaticamente.</p>{textosDerivados.map((texto, index) => <div key={index} className="flex gap-2"><Textarea aria-label={`Proposta derivada ${index + 1}`} value={texto} onChange={e => setTextosDerivados(atuais => atuais.map((item, i) => i === index ? e.target.value : item))} /><Button variant="outline" onClick={() => setTextosDerivados(atuais => atuais.filter((_, i) => i !== index))} aria-label={`Remover proposta ${index + 1}`}>Remover</Button></div>)}<Button variant="outline" disabled={textosDerivados.length >= 5} onClick={() => setTextosDerivados(atuais => [...atuais, ''])}>Adicionar intervenção</Button><p className="text-muted-foreground">Pré-visualização: {textosDerivados.filter(Boolean).length} proposta(s) aguardando análise.</p></>}
          {modo === 'detalhes' && <details className="rounded border p-3"><summary className="cursor-pointer font-semibold">Avaliação da Qualidade da Intervenção</summary><p className="my-2 text-muted-foreground">Avaliação técnica humana. Sinalizações textuais automáticas não substituem o julgamento da CSAE.</p><div className="grid gap-3 sm:grid-cols-2">{([
            ['atomicidadeStatus', 'Atomicidade', [['unica', 'Ação única'], ['multiplas_relacionadas', 'Múltiplas relacionadas'], ['multiplas_independentes', 'Múltiplas independentes'], ['indeterminada', 'Indeterminada']]],
            ['especificidadeNivel', 'Especificidade', [['adequada', 'Adequada'], ['parcial', 'Parcial'], ['insuficiente', 'Insuficiente']]],
            ['pertinenciaClinica', 'Pertinência clínica', [['pertinente', 'Pertinente'], ['condicionada', 'Condicionada'], ['incompativel', 'Incompatível'], ['indeterminada', 'Contexto insuficiente']]],
            ['exequibilidadeNivel', 'Exequibilidade', [['adequada', 'Adequada'], ['parcial', 'Parcial'], ['insuficiente', 'Insuficiente']]],
            ['reavaliabilidadeNivel', 'Reavaliabilidade', [['adequada', 'Adequada'], ['parcial', 'Parcial'], ['insuficiente', 'Insuficiente']]],
            ['intensidadeRevisao', 'Transformação editorial', [['sem_alteracoes', 'Sem alterações'], ['ajuste_textual', 'Ajuste textual'], ['reformulacao_tecnica', 'Reformulação técnica'], ['desmembramento', 'Desmembramento']]],
          ] as const).map(([campo, titulo, opcoes]) => <label key={campo}>{titulo}<select className="mt-1 w-full rounded border p-2" value={String(avaliacao[campo] || '')} onChange={e => setAvaliacao(atual => ({ ...atual, [campo]: e.target.value || undefined }))}><option value="">Não avaliado</option>{opcoes.map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></label>)}</div><p className="mt-3">Alertas de segurança confirmados na avaliação técnica</p><div className="flex flex-wrap gap-3">{(['medicamentos', 'procedimentos', 'contencao', 'atribuicoes', 'protocolos', 'outros'] as const).map(alerta => <label key={alerta} className="flex items-center gap-1"><input type="checkbox" checked={avaliacao.alertasSeguranca?.includes(alerta) || false} onChange={e => setAvaliacao(atual => ({ ...atual, alertasSeguranca: e.target.checked ? [...(atual.alertasSeguranca || []), alerta] : (atual.alertasSeguranca || []).filter(item => item !== alerta) }))} />{alerta}</label>)}</div><label className="block mt-3">Observação técnica<Textarea value={avaliacao.observacaoTecnica || ''} onChange={e => setAvaliacao(atual => ({ ...atual, observacaoTecnica: e.target.value }))} /></label><Button className="mt-3" disabled={ocupado} onClick={() => void confirmarAvaliacao()}>Salvar avaliação parcial</Button></details>}
          {modo === 'rejeitar' && <><label className="block">Categoria<select className="mt-1 w-full rounded-md border p-2" value={categoria} onChange={e => setCategoria(e.target.value as CategoriaRejeicao)}><option value="">Selecione</option>{categoriasRejeicao.map(c => <option key={c}>{c}</option>)}</select></label><label className="block">Justificativa<Textarea value={justificativa} onChange={e => setJustificativa(e.target.value)} /></label></>}
          {modo === 'grupo' && <section className="space-y-2 rounded-lg border p-3"><h3 className="font-semibold">Rejeição em grupo</h3><p>A categoria e a justificativa serão registradas em cada sugestão selecionada.</p><label className="block">Categoria<select className="mt-1 w-full rounded-md border p-2" value={categoria} onChange={event => setCategoria(event.target.value as CategoriaRejeicao)}><option value="">Selecione</option>{categoriasRejeicao.map(item => <option key={item}>{item}</option>)}</select></label><label className="block">Justificativa<Textarea value={justificativa} onChange={event => setJustificativa(event.target.value)} /></label></section>}
          {(modo === 'aprovar' || modo === 'grupo') && <>
            {modo === 'grupo' && <section className="space-y-2 rounded-lg border p-3">
              <h3 className="font-semibold">1. Confirmar ocorrências equivalentes</h3>
              <p>A semelhança textual é uma sugestão de triagem. Marque apenas as contribuições que você confirmou como equivalentes.</p>
              <div className="sticky top-0 z-10 space-y-2 rounded-md border bg-background p-3 shadow-sm">
                <p role="status" aria-live="polite" className="font-semibold">{grupoOcorrencias.length} ocorrências — {idsGrupo.length} selecionadas</p>
                <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={ocupado} onClick={() => setIdsGrupo(selecionarPendentesGrupo(grupoOcorrencias))}>Selecionar todas as pendentes</Button><Button type="button" size="sm" variant="outline" disabled={ocupado || !ocorrenciasGrupoFiltradas.length} onClick={() => setIdsGrupo(atual => [...new Set([...atual, ...selecionarPendentesGrupo(ocorrenciasGrupoFiltradas)])])}>Selecionar pendentes filtradas</Button><Button type="button" size="sm" variant="ghost" disabled={ocupado || !idsGrupo.length} onClick={() => { setIdsGrupo([]); setContextosConfirmados([]); }}>Desmarcar todas</Button></div>
                <div className="grid gap-2 sm:grid-cols-2"><Input aria-label="Filtrar ocorrências por diagnóstico" placeholder="Diagnóstico" value={diagnosticoGrupo} onChange={event => { setDiagnosticoGrupo(event.target.value); setPaginaOcorrenciasGrupo(1); }} /><Input aria-label="Filtrar ocorrências por resultado esperado" placeholder="Resultado esperado" value={resultadoGrupo} onChange={event => { setResultadoGrupo(event.target.value); setPaginaOcorrenciasGrupo(1); }} /><Input aria-label="Filtrar ocorrências por autor" placeholder="Autor" value={autorGrupo} onChange={event => { setAutorGrupo(event.target.value); setPaginaOcorrenciasGrupo(1); }} /><select aria-label="Filtrar ocorrências por situação" className="rounded-md border px-3 py-2" value={statusGrupo} onChange={event => { setStatusGrupo(event.target.value); setPaginaOcorrenciasGrupo(1); }}><option value="">Todas as situações</option><option value="aguardando">Pendentes</option><option value="aprovada">Aprovadas</option><option value="rejeitada">Rejeitadas</option></select></div>
                <p className="text-xs text-muted-foreground">{ocorrenciasGrupoFiltradas.length} ocorrência(s) correspondem aos filtros. A seleção permanece ao filtrar ou paginar.</p>
              </div>
              {ocorrenciasGrupoVisiveis.map(item => {
                const id = item.id || '';
                const pendente = (item.status || 'aguardando') === 'aguardando' && !item.divisao;
                const origemItem = origem(item) + ' → ' + (item.tituloResultadoOrigem || item.tituloResultadoVinculado || 'Resultado não identificado');
                return <label key={id} className="block rounded border p-2">
                  <span className="flex gap-2"><input type="checkbox" disabled={!pendente || ocupado} checked={idsGrupo.includes(id)} onChange={event => setIdsGrupo(atual => event.target.checked ? [...atual, id] : atual.filter(valor => valor !== id))} />
                    <span><strong>{nomeAutor(item)}</strong> · {origemItem} · {rotulos[item.status || 'aguardando']}<br /><span className="whitespace-pre-wrap">{item.textoIntervencao}</span></span>
                  </span>
                  {grupoTemContextosDistintos && idsGrupo.includes(id) && <span className="ml-6 mt-2 flex items-start gap-2 text-amber-900"><input type="checkbox" checked={contextosConfirmados.includes(id)} onChange={event => setContextosConfirmados(atual => event.target.checked ? [...atual, id] : atual.filter(valor => valor !== id))} />Confirmei a pertinência clínica da redação aprovada neste contexto.</span>}
                </label>;
              })}
              {ocorrenciasGrupoFiltradas.length > TAMANHO_PAGINA && <nav aria-label="Páginas das ocorrências do grupo" className="flex items-center justify-center gap-3"><Button type="button" variant="outline" disabled={paginaOcorrenciasGrupo === 1} onClick={() => setPaginaOcorrenciasGrupo(page => page - 1)}>Anterior</Button><span>Página {paginaOcorrenciasGrupo} de {Math.ceil(ocorrenciasGrupoFiltradas.length / TAMANHO_PAGINA)}</span><Button type="button" variant="outline" disabled={paginaOcorrenciasGrupo * TAMANHO_PAGINA >= ocorrenciasGrupoFiltradas.length} onClick={() => setPaginaOcorrenciasGrupo(page => page + 1)}>Próxima</Button></nav>}
              {!ocorrenciasGrupoFiltradas.length && <p className="text-muted-foreground">Nenhuma ocorrência corresponde aos filtros.</p>}
            </section>}
            <section className="space-y-3 rounded-lg border p-3">
              <h3 className="font-semibold">{modo === 'grupo' ? '2.' : '1.'} Revisar intervenção</h3>
              <p>Texto original preservado: <span className="whitespace-pre-wrap">{modo === 'grupo' ? (grupoOcorrencias.find(item => idsGrupo.includes(item.id || ''))?.textoIntervencao || selecionada.textoIntervencao) : selecionada.textoIntervencao}</span></p>
              <p>Autor: {modo === 'grupo' ? new Set(ocorrenciasEscolhidas.map(nomeAutor)).size + ' autor(es) distintos' : nomeAutor(selecionada)} · Origem: {modo === 'grupo' ? contextosGrupo.size + ' contexto(s) clínico(s)' : origem(selecionada) + ' → ' + (selecionada.tituloResultadoOrigem || selecionada.tituloResultadoVinculado || 'Origem não identificada')}</p>
              <label className="block">Ação Prescrita — verbo no infinitivo<Input value={preparacao.acaoPrescrita} onChange={event => setPreparacao(atual => ({ ...atual, acaoPrescrita: event.target.value }))} /></label>
              <label className="block">Ação do Enfermeiro — primeira pessoa do presente<Input value={preparacao.acaoEnfermeiro} onChange={event => setPreparacao(atual => ({ ...atual, acaoEnfermeiro: event.target.value }))} /></label>
            </section>
            <section className="space-y-3 rounded-lg border p-3">
              <h3 className="font-semibold">{modo === 'grupo' ? '3.' : '2.'} Definir disponibilidade</h3>
              <label className="flex items-start gap-2"><input type="radio" name="modo-disponibilidade" checked={modoDisponibilidade === 'resultados_especificos'} onChange={() => setModoDisponibilidade('resultados_especificos')} /><span><strong>Vincular a resultados específicos</strong><br /><span className="text-muted-foreground">Visível no Planejamento somente nos vínculos clínicos selecionados.</span></span></label>
              <label className="flex items-start gap-2"><input type="radio" name="modo-disponibilidade" checked={modoDisponibilidade === 'transversal'} onChange={() => { setModoDisponibilidade('transversal'); setPreparacao(atual => ({ ...atual, destinos: [] })); }} /><span><strong>Disponibilizar como intervenção transversal</strong><br /><span className="text-muted-foreground">Biblioteca reutilizável; o profissional confirma pertinência para cada consulta. Nada é prescrito automaticamente.</span></span></label>
              {modoDisponibilidade === 'resultados_especificos' && modo === 'aprovar' && <>
                <div className="flex items-center justify-between gap-2"><p className="font-medium">Diagnósticos carregados: {catalogo.length}</p>
                  <Popover open={diagnosticoAberto} onOpenChange={setDiagnosticoAberto}><PopoverTrigger asChild><Button type="button" variant="outline" role="combobox" aria-expanded={diagnosticoAberto} className="min-w-64 justify-between">{diagnosticoDestino?.tituloDiagnostico || 'Buscar diagnóstico'}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
                    <PopoverContent className="w-[min(34rem,90vw)] p-0" align="end"><Command shouldFilter={false}><CommandInput aria-label="Buscar em todo o catálogo de diagnósticos" placeholder="Digite parte do diagnóstico" value={buscaDiagnostico} onValueChange={setBuscaDiagnostico} /><CommandList>{catalogoCarregando ? <div className="p-4 text-sm">Carregando catálogo…</div> : diagnosticosFiltrados.length ? diagnosticosFiltrados.slice(0, 100).map(item => <CommandItem key={item.id} value={item.id} onSelect={() => { setDiagnosticoDestinoId(item.id); setBuscaDiagnostico(''); setBuscaDestino(''); setDiagnosticoAberto(false); }}><Check className={'mr-2 h-4 w-4 ' + (diagnosticoDestinoId === item.id ? 'opacity-100' : 'opacity-0')} />{item.tituloDiagnostico}</CommandItem>) : <CommandEmpty>Nenhum diagnóstico correspondente.</CommandEmpty>}</CommandList><p className="border-t p-2 text-xs text-muted-foreground">Exibindo até 100 resultados visualmente; a busca consulta o catálogo completo.</p></Command></PopoverContent>
                  </Popover>
                </div>
                {diagnosticoDestino && <>
                  <div className="flex items-center justify-between gap-2"><p>{diagnosticoDestino.tituloDiagnostico} · {diagnosticoDestino.resultadosEsperados.length} resultados</p><Input className="max-w-xs" aria-label="Pesquisar resultados esperados deste diagnóstico" placeholder="Filtrar resultados" value={buscaDestino} onChange={event => setBuscaDestino(event.target.value)} /></div>
                  <div className="max-h-56 space-y-1 overflow-auto rounded border p-2">{destinosDisponiveis.map(destino => {
                    const identidade = destino.diagnosticoId + '|' + destino.resultadoIndice;
                    const marcado = preparacao.destinos.some(item => item.diagnosticoId + '|' + (item.resultadoIndice ?? item.tituloResultado) === identidade);
                    return <label key={identidade} className="flex items-start gap-2 rounded p-1 hover:bg-muted"><input type="checkbox" checked={marcado} onChange={() => alternarDestino(destino)} /><span>{destino.tituloResultado} <span className="text-xs text-muted-foreground">#{destino.resultadoIndice! + 1}</span></span></label>;
                  })}{!destinosDisponiveis.length && <p className="p-2 text-muted-foreground">Nenhum resultado corresponde a esta busca.</p>}</div>
                  {destinosDisponiveis.length > 0 && <Button type="button" variant="outline" onClick={() => {
                    if (destinosDisponiveis.length > 20 && !window.confirm('Selecionar ' + destinosDisponiveis.length + ' resultados visíveis?')) return;
                    setPreparacao(atual => {
                      const porChave = new Map(atual.destinos.map(item => [item.diagnosticoId + '|' + (item.resultadoIndice ?? item.tituloResultado), item]));
                      destinosDisponiveis.forEach(item => porChave.set(item.diagnosticoId + '|' + item.resultadoIndice, item));
                      return { ...atual, destinos: [...porChave.values()] };
                    });
                  }}>Selecionar todos os resultados filtrados ({destinosDisponiveis.length})</Button>}
                </>}
              </>}
              {modoDisponibilidade === 'resultados_especificos' && modo === 'grupo' && <>
                {origensGrupoAmbiguas ? <p role="alert" className="text-amber-800">Origem clínica ausente ou ambígua. Escolha disponibilidade transversal ou analise essas sugestões individualmente.</p> : <div className="max-h-48 space-y-1 overflow-auto rounded border p-2">{[...new Map(destinosGrupo.map(item => [item.diagnosticoId + '|' + item.resultadoIndice, item])).values()].map(item => <p key={item.diagnosticoId + '|' + item.resultadoIndice}>{item.tituloDiagnostico} → {item.tituloResultado}</p>)}</div>}
              </>}
              {(modo === 'aprovar' ? preparacao.destinos : modoDisponibilidade === 'transversal' ? [] : destinosGrupo).length > 0 && <div className="space-y-2"><p className="font-medium">Vínculos selecionados: {(modo === 'aprovar' ? preparacao.destinos : modoDisponibilidade === 'transversal' ? [] : destinosGrupo).length}</p><div className="flex flex-wrap gap-2">{(modo === 'aprovar' ? preparacao.destinos : modoDisponibilidade === 'transversal' ? [] : destinosGrupo).map(destino => <Button key={destino.diagnosticoId + '|' + (destino.resultadoIndice ?? destino.tituloResultado)} type="button" variant="outline" size="sm" onClick={() => modo === 'aprovar' && alternarDestino(destino)}>{destino.tituloDiagnostico} → {destino.tituloResultado}{modo === 'aprovar' ? ' ×' : ''}</Button>)}</div>{modo === 'aprovar' && <Button type="button" variant="link" onClick={() => { if (window.confirm('Limpar todos os destinos selecionados?')) setPreparacao(atual => ({ ...atual, destinos: [] })); }}>Limpar seleção</Button>}</div>}
            </section>
            <section className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <h3 className="font-semibold">{modo === 'grupo' ? '4.' : '3.'} Confirmar decisão</h3>
              <p><strong>Redação aprovada:</strong> {preparacao.acaoPrescrita || 'Ação prescrita pendente'} · {preparacao.acaoEnfermeiro || 'Ação do enfermeiro pendente'}</p>
              <p><strong>Disponibilidade:</strong> {modoDisponibilidade === 'transversal' ? 'Biblioteca transversal' : (modo === 'grupo' ? destinosGrupo.length : preparacao.destinos.length) + ' vínculo(s) específico(s)'}</p>
              {modo === 'grupo' && <p><strong>Contribuições afetadas:</strong> {idsGrupo.length} de {grupoOcorrencias.length}</p>}
              <p className="text-muted-foreground">O Portal registrará UID e nome do gestor autenticado, horário do servidor, decisão e IDs afetados. Aprovação administrativa não comprova homologação documental da CSAE.</p>
            </section>
          </>}
          {modo === 'grupo' && <section className="space-y-2 rounded-lg border p-3">
            <h3 className="font-semibold">Vincular a intervenção existente no catálogo</h3>
            <p className="text-muted-foreground">A publicação existente e seus vínculos clínicos não serão alterados. Só é possível associar as sugestões quando todos os contextos selecionados já estiverem cobertos.</p>
            <label className="block">Intervenção publicada<select aria-label="Intervenção existente no catálogo" className="mt-1 w-full rounded-md border p-2" value={bibliotecaSelecionadaId} onChange={event => { setBibliotecaSelecionadaId(event.target.value); setEquivalenciaConfirmada(false); }}><option value="">Selecione uma publicação existente</option>{biblioteca.map(item => <option key={item.id} value={item.id}>{item.acaoPrescrita} — {item.acaoEnfermeiro} ({item.modoDisponibilidade === 'transversal' ? 'transversal' : `${item.destinos.length} vínculos`})</option>)}</select></label>
            {bibliotecaSelecionadaId && <><p className="rounded bg-muted p-2">{biblioteca.find(item => item.id === bibliotecaSelecionadaId)?.acaoPrescrita} · {biblioteca.find(item => item.id === bibliotecaSelecionadaId)?.acaoEnfermeiro}</p><label className="flex items-start gap-2"><input type="checkbox" checked={equivalenciaConfirmada} onChange={event => setEquivalenciaConfirmada(event.target.checked)} /><span>Confirmei que a intervenção publicada é equivalente às contribuições selecionadas e apropriada para os contextos clínicos envolvidos.</span></label></>}
          </section>}
          {modo === 'detalhes' && <><p>Status: {rotulos[selecionada.status || 'aguardando']}</p>{selecionada.preparacao && <div><p>Ação Prescrita: {selecionada.preparacao.acaoPrescrita}</p><p>Ação do Enfermeiro: {selecionada.preparacao.acaoEnfermeiro}</p><p>Disponibilidade: {selecionada.preparacao.modoDisponibilidade === 'transversal' ? 'Transversal' : 'Resultados específicos'}</p><p>Destinos: {selecionada.preparacao.destinos.map(d => d.tituloDiagnostico + ' → ' + d.tituloResultado).join('; ') || 'Biblioteca transversal'}</p></div>}{selecionada.categoriaRejeicao && <p>Rejeição: {selecionada.categoriaRejeicao} — {selecionada.justificativaRejeicao}</p>}{(selecionada.status || 'aguardando') === 'aguardando' && !selecionada.derivacao && sinalizarIntervencoesMultiplas(selecionada.textoIntervencao).nivel === 'nenhuma' && <Button variant="outline" size="sm" onClick={() => abrir(selecionada, 'desmembrar')}>Ação avançada: revisar desmembramento manual</Button>}<div><strong>Histórico administrativo</strong>{historico.map(h => <div key={h.id} className="border-b py-1"><p>{h.tipo} · {formatoData(h.dataHora)} · {h.avaliadorId}</p>{h.avaliacaoQualidade && <p className="text-xs text-muted-foreground">Avaliação técnica registrada: {Object.entries(h.avaliacaoQualidade).filter(([campo]) => !['avaliadorId', 'avaliadoEm', 'versaoCriterios'].includes(campo)).map(([campo, valor]) => campo + ': ' + (Array.isArray(valor) ? valor.join(', ') : valor)).join('; ') || 'parcial sem dimensões classificadas'}</p>}</div>)}{!historico.length && <p>Sem decisões registradas.</p>}</div></>}
          {erro && <p role="alert" className="text-red-700">{erro}</p>}
        </div>}
        <DialogFooter className="sticky bottom-0 z-10 flex-wrap border-t bg-background py-3">{modo === 'desmembrar' && <Button disabled={ocupado} onClick={() => void confirmarDesmembramento()}>Confirmar desmembramento</Button>}{modo === 'rejeitar' && <Button disabled={ocupado || !categoria || !justificativa.trim()} variant="destructive" onClick={() => void confirmar('rejeitar')}>Confirmar rejeição</Button>}{modo === 'aprovar' && <><Button variant="outline" disabled={ocupado} onClick={() => void confirmar('preparar')}>Salvar revisão</Button><Button disabled={ocupado || !preparacao.acaoPrescrita.trim() || !preparacao.acaoEnfermeiro.trim() || (modoDisponibilidade === 'resultados_especificos' && !preparacao.destinos.length)} onClick={() => void confirmar('publicar')}>Aprovar e publicar</Button></>}{modo === 'grupo' && <><Button variant="destructive" disabled={ocupado || idsGrupo.length < 2 || !categoria || !justificativa.trim()} onClick={() => void confirmarGrupo('rejeitar')}>Rejeitar {idsGrupo.length} selecionadas</Button><Button disabled={ocupado || idsGrupo.length < 2 || !preparacao.acaoPrescrita.trim() || !preparacao.acaoEnfermeiro.trim() || (modoDisponibilidade === 'resultados_especificos' && (origensGrupoAmbiguas || !destinosGrupo.length)) || (grupoTemContextosDistintos && idsGrupo.some(id => !contextosConfirmados.includes(id)))} onClick={() => void confirmarGrupo('publicar')}>Aprovar selecionadas e publicar</Button><Button variant="outline" disabled={ocupado || idsGrupo.length < 2 || !bibliotecaSelecionadaId || !equivalenciaConfirmada || (grupoTemContextosDistintos && idsGrupo.some(id => !contextosConfirmados.includes(id)))} onClick={() => void confirmarGrupo('vincular')}>Vincular {idsGrupo.length} selecionadas</Button></>}{progressoGrupo && <span role="status" className="self-center text-sm">Progresso da operação: {progressoGrupo.concluidas}/{progressoGrupo.total}</span>}</DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
