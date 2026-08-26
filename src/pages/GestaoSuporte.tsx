import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Headphones, Lightbulb, BarChart2, CheckCircle2, MessageSquare, Eye, Star, Clock3, Percent, Layers3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useSupportNotifications } from '@/contexts/SupportNotificationsContext';
import {
  buscarTodosTickets,
  resolverTicket,
  buscarTodasSugestoes,
  responderSugestao,
  buscarAvaliacoesNPS,
  marcarTicketComoVisualizadoPeloSuporte,
  marcarSugestaoComoVisualizadaPeloSuporte,
  type TicketProblema,
  type SugestaoMelhoria,
  type PesquisaNPS,
} from '@/services/bancodados';
import {
  calcularKpisSugestoes,
  calcularKpisTickets,
  classificarFaixaNps,
  formatarDuracaoHoras,
} from '@/utils/supportMetrics';

// ─── Helper ───────────────────────────────────────────────────

function formatarData(ts: Timestamp | undefined): string {
  if (!ts) return '—';
  try {
    return format(ts.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return '—';
  }
}

function media(values: number[]): string {
  if (values.length === 0) return '—';
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return avg.toFixed(1);
}

interface BlocoKpisProps {
  total: number;
  porStatus: Record<string, number>;
  porGrupo: Record<string, number>;
  rotuloGrupo: string;
  taxa: number;
  rotuloTaxa: string;
  tempo: string;
  rotuloTempo: string;
}

function BlocoKpis({
  total,
  porStatus,
  porGrupo,
  rotuloGrupo,
  taxa,
  rotuloTaxa,
  tempo,
  rotuloTempo,
}: BlocoKpisProps) {
  const gruposOrdenados = Object.entries(porGrupo).sort((a, b) => b[1] - a[1]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <Card className="border-none shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <BarChart2 className="h-4 w-4" /> Por status
          </div>
          <p className="text-2xl font-bold mt-2">{total}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {Object.entries(porStatus).map(([status, quantidade]) => (
              <Badge key={status} variant="outline">{status}: {quantidade}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <Layers3 className="h-4 w-4" /> {rotuloGrupo}
          </div>
          <div className="space-y-1.5 mt-3 max-h-24 overflow-y-auto pr-1">
            {gruposOrdenados.length ? gruposOrdenados.map(([grupo, quantidade]) => (
              <div key={grupo} className="flex justify-between gap-3 text-xs">
                <span className="text-gray-600 truncate" title={grupo}>{grupo}</span>
                <strong>{quantidade}</strong>
              </div>
            )) : <span className="text-sm text-gray-400">Sem registros</span>}
          </div>
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <Percent className="h-4 w-4" /> {rotuloTaxa}
          </div>
          <p className="text-2xl font-bold mt-3">{taxa.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Considerando todos os registros</p>
        </CardContent>
      </Card>
      <Card className="border-none shadow-sm">
        <CardContent className="pt-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">
            <Clock3 className="h-4 w-4" /> {rotuloTempo}
          </div>
          <p className="text-2xl font-bold mt-3">{tempo}</p>
          <p className="text-xs text-gray-500 mt-1">Média dos registros concluídos</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── GestaoSuporte ────────────────────────────────────────────

const GestaoSuporte = () => {
  const { toast } = useToast();
  const { ticketsNovosSuporte, sugestoesNovasSuporte } = useSupportNotifications();

  // ── Tickets
  const [tickets, setTickets] = useState<TicketProblema[]>([]);
  const [carregandoTickets, setCarregandoTickets] = useState(true);
  const [ticketSelecionado, setTicketSelecionado] = useState<TicketProblema | null>(null);
  const [respostaTicket, setRespostaTicket] = useState('');
  const [resolvendo, setResolvendo] = useState(false);
  const [modalTicketAberto, setModalTicketAberto] = useState(false);

  // ── Sugestões
  const [sugestoes, setSugestoes] = useState<SugestaoMelhoria[]>([]);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(true);
  const [sugestaoSelecionada, setSugestaoSelecionada] = useState<SugestaoMelhoria | null>(null);
  const [respostaSugestao, setRespostaSugestao] = useState('');
  const [respondendo, setRespondendo] = useState(false);
  const [modalSugestaoAberto, setModalSugestaoAberto] = useState(false);

  // ── NPS
  const [avaliacoes, setAvaliacoes] = useState<PesquisaNPS[]>([]);
  const [carregandoNPS, setCarregandoNPS] = useState(true);

  // ── Loaders ──────────────────────────────────────────────────

  const carregarTickets = useCallback(async () => {
    setCarregandoTickets(true);
    try {
      const data = await buscarTodosTickets();
      setTickets(data);
    } catch (err) {
      console.error('Erro ao carregar tickets:', err);
    } finally {
      setCarregandoTickets(false);
    }
  }, []);

  const carregarSugestoes = useCallback(async () => {
    setCarregandoSugestoes(true);
    try {
      const data = await buscarTodasSugestoes();
      setSugestoes(data);
    } catch (err) {
      console.error('Erro ao carregar sugestões:', err);
    } finally {
      setCarregandoSugestoes(false);
    }
  }, []);

  const carregarNPS = useCallback(async () => {
    setCarregandoNPS(true);
    try {
      const data = await buscarAvaliacoesNPS();
      setAvaliacoes(data);
    } catch (err) {
      console.error('Erro ao carregar avaliações NPS:', err);
    } finally {
      setCarregandoNPS(false);
    }
  }, []);

  useEffect(() => {
    carregarTickets();
    carregarSugestoes();
    carregarNPS();
  }, [carregarTickets, carregarSugestoes, carregarNPS]);

  useEffect(() => {
    if (ticketsNovosSuporte > 0) carregarTickets();
  }, [ticketsNovosSuporte, carregarTickets]);

  useEffect(() => {
    if (sugestoesNovasSuporte > 0) carregarSugestoes();
  }, [sugestoesNovasSuporte, carregarSugestoes]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleAbrirTicket = async (ticket: TicketProblema) => {
    const ticketVisualizado = { ...ticket, visualizadoPeloSuporte: true };
    setTicketSelecionado(ticketVisualizado);
    setRespostaTicket(ticket.respostaAdmin || '');
    setModalTicketAberto(true);

    if (!ticket.id || ticket.visualizadoPeloSuporte !== false) return;

    setTickets((atuais) => atuais.map((item) =>
      item.id === ticket.id ? ticketVisualizado : item
    ));

    try {
      await marcarTicketComoVisualizadoPeloSuporte(ticket.id);
    } catch (error) {
      console.error('[Gestão de Suporte] Falha ao registrar leitura do ticket:', error);
      setTickets((atuais) => atuais.map((item) =>
        item.id === ticket.id ? { ...item, visualizadoPeloSuporte: false } : item
      ));
      toast({
        title: 'Aviso',
        description: 'O ticket foi aberto, mas não foi possível atualizar a notificação.',
        variant: 'destructive',
      });
    }
  };

  const handleResolverTicket = async () => {
    if (!ticketSelecionado?.id) return;
    setResolvendo(true);
    try {
      await resolverTicket(ticketSelecionado.id, respostaTicket);
      toast({ title: 'Ticket resolvido!', description: 'O chamado foi marcado como resolvido.' });
      setModalTicketAberto(false);
      setTicketSelecionado(null);
      setRespostaTicket('');
      carregarTickets();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível resolver o ticket.', variant: 'destructive' });
    } finally {
      setResolvendo(false);
    }
  };

  const handleAbrirSugestao = async (sugestao: SugestaoMelhoria) => {
    const sugestaoVisualizada = { ...sugestao, visualizadoPeloSuporte: true };
    setSugestaoSelecionada(sugestaoVisualizada);
    setRespostaSugestao(sugestao.respostaAdmin || '');
    setModalSugestaoAberto(true);

    if (!sugestao.id || sugestao.visualizadoPeloSuporte !== false) return;

    setSugestoes((atuais) => atuais.map((item) =>
      item.id === sugestao.id ? sugestaoVisualizada : item
    ));

    try {
      await marcarSugestaoComoVisualizadaPeloSuporte(sugestao.id);
    } catch (error) {
      console.error('[Gestão de Suporte] Falha ao registrar leitura da sugestão:', error);
      setSugestoes((atuais) => atuais.map((item) =>
        item.id === sugestao.id ? { ...item, visualizadoPeloSuporte: false } : item
      ));
      toast({
        title: 'Aviso',
        description: 'A sugestão foi aberta, mas não foi possível atualizar a notificação.',
        variant: 'destructive',
      });
    }
  };

  const handleResponderSugestao = async () => {
    if (!sugestaoSelecionada?.id || !respostaSugestao.trim()) return;
    setRespondendo(true);
    try {
      await responderSugestao(sugestaoSelecionada.id, respostaSugestao.trim());
      toast({ title: 'Resposta enviada!', description: 'O usuário receberá sua resposta na Central de Ajuda.' });
      setModalSugestaoAberto(false);
      setSugestaoSelecionada(null);
      setRespostaSugestao('');
      carregarSugestoes();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível enviar a resposta.', variant: 'destructive' });
    } finally {
      setRespondendo(false);
    }
  };

  // ── NPS metrics
  const mediaGeral = media(avaliacoes.map((a) => a.notaGeral));
  const mediaUsabilidade = media(avaliacoes.map((a) => a.notaUsabilidade));
  const mediaPerformance = media(avaliacoes.map((a) => a.notaPerformance));
  const kpisTickets = useMemo(() => calcularKpisTickets(tickets), [tickets]);
  const kpisSugestoes = useMemo(() => calcularKpisSugestoes(sugestoes), [sugestoes]);
  const notaMediaGeral = avaliacoes.length
    ? avaliacoes.reduce((soma, avaliacao) => soma + avaliacao.notaGeral, 0) / avaliacoes.length
    : null;
  const faixaNps = classificarFaixaNps(notaMediaGeral);

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-3xl font-bold text-csae-green-800">Gestão de Suporte</h1>
          <p className="text-gray-600 font-medium">
            Gerencie tickets de suporte, sugestões e avaliações dos usuários.
          </p>
        </div>

        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-lg grid grid-cols-3 h-12 w-full max-w-2xl">
            <TabsTrigger value="tickets" className="rounded-md flex items-center gap-2 font-semibold text-sm">
              <Headphones className="w-4 h-4" />
              Tickets
              {ticketsNovosSuporte > 0 && (
                <Badge className="bg-red-600 hover:bg-red-600 text-white px-1.5 py-0 text-[10px]">
                  {ticketsNovosSuporte > 99 ? '99+' : ticketsNovosSuporte}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sugestoes" className="rounded-md flex items-center gap-2 font-semibold text-sm">
              <Lightbulb className="w-4 h-4" />
              Sugestões
              {sugestoesNovasSuporte > 0 && (
                <Badge className="bg-red-600 hover:bg-red-600 text-white px-1.5 py-0 text-[10px]">
                  {sugestoesNovasSuporte > 99 ? '99+' : sugestoesNovasSuporte}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="nps" className="rounded-md flex items-center gap-2 font-semibold text-sm">
              <BarChart2 className="w-4 h-4" />
              Dashboard NPS
            </TabsTrigger>
          </TabsList>

          {/* ─── ABA 1: Tickets ──────────────────────────────── */}
          <TabsContent value="tickets">
            <BlocoKpis
              total={kpisTickets.total}
              porStatus={kpisTickets.porStatus}
              porGrupo={kpisTickets.porModulo}
              rotuloGrupo="Tickets por módulo"
              taxa={kpisTickets.taxaResolucao}
              rotuloTaxa="Taxa de resolução"
              tempo={formatarDuracaoHoras(kpisTickets.tempoMedioResolucaoHoras)}
              rotuloTempo="Tempo de resolução"
            />
            <Card className="border-none shadow-sm">
              <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-700">
                  <Headphones className="h-5 w-5 text-csae-green-600" />
                  Tickets de Suporte
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {carregandoTickets ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csae-green-600" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">Nenhum ticket encontrado.</p>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Usuário</TableHead>
                        <TableHead className="font-bold">Módulo</TableHead>
                        <TableHead className="font-bold">Descrição</TableHead>
                        <TableHead className="font-bold">Data</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="text-right font-bold">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((t) => (
                        <TableRow key={t.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {t.nomeUsuario}
                              {t.visualizadoPeloSuporte === false && (
                                <Badge className="bg-red-600 hover:bg-red-600 text-white text-[10px]">Novo</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">{t.moduloAferido}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[280px]">
                            <p className="text-sm text-gray-600 line-clamp-2">{t.descricao}</p>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                            {formatarData(t.dataCriacao)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={t.status === 'Aberto' ? 'destructive' : 'secondary'}
                              className={`text-xs ${t.status === 'Resolvido' ? 'bg-green-100 text-green-800' : ''}`}
                            >
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 gap-1 text-xs"
                              onClick={() => handleAbrirTicket(t)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Visualizar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── ABA 2: Sugestões ────────────────────────────── */}
          <TabsContent value="sugestoes">
            <BlocoKpis
              total={kpisSugestoes.total}
              porStatus={kpisSugestoes.porStatus}
              porGrupo={kpisSugestoes.porCategoria}
              rotuloGrupo="Sugestões por categoria"
              taxa={kpisSugestoes.taxaResposta}
              rotuloTaxa="Taxa de resposta"
              tempo={formatarDuracaoHoras(kpisSugestoes.tempoMedioRespostaHoras)}
              rotuloTempo="Tempo de resposta"
            />
            <Card className="border-none shadow-sm">
              <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-700">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Sugestões de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {carregandoSugestoes ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csae-green-600" />
                  </div>
                ) : sugestoes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">Nenhuma sugestão recebida.</p>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Usuário</TableHead>
                        <TableHead className="font-bold">Categoria</TableHead>
                        <TableHead className="font-bold">Sugestão</TableHead>
                        <TableHead className="font-bold">Data</TableHead>
                        <TableHead className="font-bold">Respondida</TableHead>
                        <TableHead className="text-right font-bold">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sugestoes.map((s) => (
                        <TableRow key={s.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {s.nomeUsuario}
                              {s.visualizadoPeloSuporte === false && (
                                <Badge className="bg-red-600 hover:bg-red-600 text-white text-[10px]">Novo</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{s.categoria}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[280px]">
                            <p className="text-sm text-gray-600 line-clamp-2">{s.descricao}</p>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                            {formatarData(s.dataCriacao)}
                          </TableCell>
                          <TableCell>
                            {s.respostaAdmin ? (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Sim</Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-400 text-xs">Não</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {s.respostaAdmin ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 gap-1 text-xs"
                                onClick={() => handleAbrirSugestao(s)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Visualizar
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 gap-1 text-xs"
                                onClick={() => handleAbrirSugestao(s)}
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                                Responder
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── ABA 3: Dashboard NPS ────────────────────────── */}
          <TabsContent value="nps" className="space-y-6">
            {/* Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total de Avaliações', value: String(avaliacoes.length), icon: Star, color: 'text-yellow-600 bg-yellow-50' },
                {
                  label: 'Média Geral (1–10)',
                  value: mediaGeral,
                  detail: `${faixaNps.rotulo} · ${faixaNps.detalhe}`,
                  icon: BarChart2,
                  color: faixaNps.cor,
                },
                { label: 'Média Usabilidade (1–5)', value: mediaUsabilidade, icon: BarChart2, color: 'text-blue-700 bg-blue-50' },
                { label: 'Média Performance (1–5)', value: mediaPerformance, icon: BarChart2, color: 'text-purple-700 bg-purple-50' },
              ].map((metric) => (
                <Card key={metric.label} className="border-none shadow-sm">
                  <CardContent className="pt-6 pb-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${metric.color}`}>
                      <metric.icon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{carregandoNPS ? '…' : metric.value}</p>
                    <p className="text-xs text-gray-500 mt-1 leading-tight">{metric.label}</p>
                    {'detail' in metric && metric.detail && (
                      <Badge variant="outline" className={`mt-2 text-[10px] border-0 ${metric.color}`}>
                        {metric.detail}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Listagem */}
            <Card className="border-none shadow-sm">
              <CardHeader className="bg-slate-50/50 pb-4">
                <CardTitle className="text-base text-slate-700">Avaliações Recentes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {carregandoNPS ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csae-green-600" />
                  </div>
                ) : avaliacoes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">Nenhuma avaliação recebida.</p>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Usuário</TableHead>
                        <TableHead className="font-bold">Nota Geral</TableHead>
                        <TableHead className="font-bold">Usabilidade</TableHead>
                        <TableHead className="font-bold">Performance</TableHead>
                        <TableHead className="font-bold">Comentário</TableHead>
                        <TableHead className="font-bold">Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {avaliacoes.map((a) => (
                        <TableRow key={a.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-medium">{a.nomeUsuario}</TableCell>
                          <TableCell>
                            <span className={`font-bold text-lg ${a.notaGeral >= 8 ? 'text-green-600' : a.notaGeral >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                              {a.notaGeral}
                            </span>
                            <span className="text-gray-400 text-xs">/10</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{a.notaUsabilidade}</span>
                            <span className="text-gray-400 text-xs">/5</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{a.notaPerformance}</span>
                            <span className="text-gray-400 text-xs">/5</span>
                          </TableCell>
                          <TableCell className="max-w-[240px]">
                            <p className="text-sm text-gray-500 italic line-clamp-2">
                              {a.comentario || '—'}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                            {formatarData(a.dataCriacao)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Modal Ticket ─────────────────────────────────── */}
        <Dialog open={modalTicketAberto} onOpenChange={(open) => { if (!open) { setModalTicketAberto(false); setTicketSelecionado(null); setRespostaTicket(''); } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-csae-green-600" />
                Chamado de Suporte
              </DialogTitle>
            </DialogHeader>
            {ticketSelecionado && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Usuário</p>
                    <p className="font-semibold">{ticketSelecionado.nomeUsuario}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Módulo</p>
                    <Badge variant="outline">{ticketSelecionado.moduloAferido}</Badge>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Data de abertura</p>
                    <p className="font-medium">{formatarData(ticketSelecionado.dataCriacao)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Status</p>
                    <Badge variant={ticketSelecionado.status === 'Aberto' ? 'destructive' : 'secondary'}>
                      {ticketSelecionado.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Descrição do problema</p>
                  <p className="text-sm text-gray-800 bg-white border rounded-lg p-3 leading-relaxed">{ticketSelecionado.descricao}</p>
                </div>
                {ticketSelecionado.status === 'Aberto' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Resposta / Solução (será exibida ao usuário)</label>
                    <Textarea
                      id="resposta-ticket"
                      value={respostaTicket}
                      onChange={(e) => setRespostaTicket(e.target.value)}
                      placeholder="Descreva a solução ou forneça orientações ao usuário..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                )}
                {ticketSelecionado.respostaAdmin && ticketSelecionado.status === 'Resolvido' && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Resposta registrada</p>
                    <p className="text-sm text-gray-800 bg-green-50 border border-green-100 rounded-lg p-3">{ticketSelecionado.respostaAdmin}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalTicketAberto(false)}>Fechar</Button>
              {ticketSelecionado?.status === 'Aberto' && (
                <Button
                  id="btn-resolver-ticket"
                  onClick={handleResolverTicket}
                  disabled={resolvendo}
                  className="bg-csae-green-600 hover:bg-csae-green-700 text-white gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {resolvendo ? 'Salvando...' : 'Marcar como Resolvido'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Modal Sugestão ───────────────────────────────── */}
        <Dialog open={modalSugestaoAberto} onOpenChange={(open) => { if (!open) { setModalSugestaoAberto(false); setSugestaoSelecionada(null); setRespostaSugestao(''); } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Sugestão de Melhoria
              </DialogTitle>
            </DialogHeader>
            {sugestaoSelecionada && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-slate-50 rounded-lg p-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Usuário</p>
                    <p className="font-semibold">{sugestaoSelecionada.nomeUsuario}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Categoria</p>
                    <Badge variant="secondary">{sugestaoSelecionada.categoria}</Badge>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Data de envio</p>
                    <p className="font-medium">{formatarData(sugestaoSelecionada.dataCriacao)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">Sugestão</p>
                  <p className="text-sm text-gray-800 bg-white border rounded-lg p-3 leading-relaxed">{sugestaoSelecionada.descricao}</p>
                </div>
                {!sugestaoSelecionada.respostaAdmin ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">
                      Resposta / Agradecimento <span className="font-normal text-gray-400">(será exibida ao usuário)</span>
                    </label>
                    <Textarea
                      id="resposta-sugestao"
                      value={respostaSugestao}
                      onChange={(e) => setRespostaSugestao(e.target.value)}
                      placeholder="Agradeça e dê um retorno ao usuário sobre a sugestão..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Resposta registrada</p>
                    <p className="text-sm text-gray-800 bg-green-50 border border-green-100 rounded-lg p-3">
                      {sugestaoSelecionada.respostaAdmin}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              {sugestaoSelecionada?.respostaAdmin ? (
                <Button variant="outline" onClick={() => setModalSugestaoAberto(false)}>
                  Fechar
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setModalSugestaoAberto(false)}>
                    Cancelar
                  </Button>
                  <Button
                    id="btn-responder-sugestao"
                    onClick={handleResponderSugestao}
                    disabled={respondendo || !respostaSugestao.trim()}
                    className="bg-csae-green-600 hover:bg-csae-green-700 text-white gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {respondendo ? 'Enviando...' : 'Enviar Resposta'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
};

export default GestaoSuporte;
