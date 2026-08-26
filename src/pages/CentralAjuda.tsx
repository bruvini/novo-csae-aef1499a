import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Bug,
  Lightbulb,
  Star,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquareHeart,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportNotifications } from '@/contexts/SupportNotificationsContext';
import {
  salvarTicket,
  buscarMeusTickets,
  salvarSugestao,
  buscarMinhasSugestoes,
  salvarPesquisaNPS,
  verificarElegibilidadeNPS,
  marcarTicketsComoVisualizadosPeloUsuario,
  marcarSugestoesComoVisualizadasPeloUsuario,
  type TicketProblema,
  type SugestaoMelhoria,
} from '@/services/bancodados';
import { ehDetratorNps } from '@/utils/supportMetrics';

// ─── Helpers ─────────────────────────────────────────────────

function formatarData(ts: Timestamp | undefined): string {
  if (!ts) return '';
  try {
    return format(ts.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return '';
  }
}

const MODULOS = [
  'Login / Autenticação',
  'Processo de Enfermagem',
  'Gestão de Usuários',
  'Gestão de Conteúdos',
  'Painel Estatístico',
  'Central de Ajuda',
  'Avaliação NPS',
  'Outro',
];

const CATEGORIAS_SUGESTAO = [
  'Interface / Design',
  'Nova Funcionalidade',
  'Desempenho',
  'Acessibilidade',
  'Outro',
];

// ─── NPS Score Button ─────────────────────────────────────────

function ScoreButton({
  value,
  selected,
  max,
  onClick,
}: {
  value: number;
  selected: number | null;
  max: number;
  onClick: (v: number) => void;
}) {
  const isSelected = selected === value;
  // Gradient: 1 = red, max = green
  const ratio = (value - 1) / (max - 1);
  const hue = Math.round(ratio * 120); // 0 = red, 120 = green
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all duration-150 border-2 ${
        isSelected
          ? 'text-white scale-110 shadow-md border-transparent'
          : 'bg-white text-gray-600 border-gray-200 hover:scale-105'
      }`}
      style={isSelected ? { backgroundColor: `hsl(${hue}, 70%, 45%)`, borderColor: `hsl(${hue}, 70%, 45%)` } : {}}
      aria-pressed={isSelected}
      aria-label={`Nota ${value}`}
    >
      {value}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────

const CentralAjuda = () => {
  const { toast } = useToast();
  const { sessionData } = useAuth();
  const {
    respostasTicketsNaoVisualizadas,
    respostasSugestoesNaoVisualizadas,
  } = useSupportNotifications();
  const usuarioId = sessionData?.uid || '';
  const nomeUsuario = sessionData?.nomeCompleto || 'Usuário não identificado';
  const [abaAtiva, setAbaAtiva] = useState('ticket');
  const [gruposTicketsAbertos, setGruposTicketsAbertos] = useState<string[]>([]);

  // ── Tickets state
  const [moduloSelecionado, setModuloSelecionado] = useState('');
  const [descricaoTicket, setDescricaoTicket] = useState('');
  const [enviandoTicket, setEnviandoTicket] = useState(false);
  const [meusTickets, setMeusTickets] = useState<TicketProblema[]>([]);
  const [carregandoTickets, setCarregandoTickets] = useState(true);

  // ── Sugestões state
  const [categoriaSugestao, setCategoriaSugestao] = useState('');
  const [descricaoSugestao, setDescricaoSugestao] = useState('');
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);
  const [minhasSugestoes, setMinhasSugestoes] = useState<SugestaoMelhoria[]>([]);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(true);

  // ── NPS state
  const [notaGeral, setNotaGeral] = useState<number | null>(null);
  const [notaUsabilidade, setNotaUsabilidade] = useState<number | null>(null);
  const [notaPerformance, setNotaPerformance] = useState<number | null>(null);
  const [comentarioNPS, setComentarioNPS] = useState('');
  const [enviandoNPS, setEnviandoNPS] = useState(false);
  const [npsElegivel, setNpsElegivel] = useState(true);
  const [verificandoNPS, setVerificandoNPS] = useState(true);

  // ── Loaders ──────────────────────────────────────────────────

  const carregarTickets = useCallback(async () => {
    if (!usuarioId) return;
    setCarregandoTickets(true);
    try {
      const data = await buscarMeusTickets(usuarioId);
      setMeusTickets(data);
    } catch (err) {
      console.error('Erro ao carregar tickets:', err);
    } finally {
      setCarregandoTickets(false);
    }
  }, [usuarioId]);

  const carregarSugestoes = useCallback(async () => {
    if (!usuarioId) return;
    setCarregandoSugestoes(true);
    try {
      const data = await buscarMinhasSugestoes(usuarioId);
      setMinhasSugestoes(data);
    } catch (err) {
      console.error('Erro ao carregar sugestões:', err);
    } finally {
      setCarregandoSugestoes(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    carregarTickets();
    carregarSugestoes();

    const checarElegibilidade = async () => {
      if (!usuarioId) return;
      setVerificandoNPS(true);
      try {
        const elegivel = await verificarElegibilidadeNPS(usuarioId);
        setNpsElegivel(elegivel);
      } catch {
        setNpsElegivel(true);
      } finally {
        setVerificandoNPS(false);
      }
    };
    checarElegibilidade();
  }, [usuarioId, carregarTickets, carregarSugestoes]);

  useEffect(() => {
    if (respostasTicketsNaoVisualizadas > 0) carregarTickets();
  }, [respostasTicketsNaoVisualizadas, carregarTickets]);

  useEffect(() => {
    if (respostasSugestoesNaoVisualizadas > 0) carregarSugestoes();
  }, [respostasSugestoesNaoVisualizadas, carregarSugestoes]);

  useEffect(() => {
    if (abaAtiva !== 'sugestao' || carregandoSugestoes) return;

    const idsNaoVisualizados = minhasSugestoes
      .filter((sugestao) => Boolean(sugestao.respostaAdmin?.trim()) && sugestao.respostaVisualizadaPeloUsuario !== true)
      .map((sugestao) => sugestao.id)
      .filter((id): id is string => Boolean(id));

    if (idsNaoVisualizados.length === 0) return;

    marcarSugestoesComoVisualizadasPeloUsuario(idsNaoVisualizados)
      .then(() => {
        const ids = new Set(idsNaoVisualizados);
        setMinhasSugestoes((atuais) => atuais.map((sugestao) =>
          sugestao.id && ids.has(sugestao.id)
            ? { ...sugestao, respostaVisualizadaPeloUsuario: true }
            : sugestao
        ));
      })
      .catch((error) => console.error('[Central de Ajuda] Falha ao registrar leitura das sugestões:', error));
  }, [abaAtiva, carregandoSugestoes, minhasSugestoes]);

  // ── Handlers ──────────────────────────────────────────────────

  const handleEnviarTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduloSelecionado || !descricaoTicket.trim()) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos antes de enviar.', variant: 'destructive' });
      return;
    }
    setEnviandoTicket(true);
    try {
      await salvarTicket({ usuarioId, nomeUsuario, moduloAferido: moduloSelecionado, descricao: descricaoTicket.trim() });
      toast({ title: 'Chamado aberto!', description: 'Nossa equipe irá analisar em breve.' });
      setModuloSelecionado('');
      setDescricaoTicket('');
      carregarTickets();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível enviar o chamado.', variant: 'destructive' });
    } finally {
      setEnviandoTicket(false);
    }
  };

  const handleEnviarSugestao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaSugestao || !descricaoSugestao.trim()) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos antes de enviar.', variant: 'destructive' });
      return;
    }
    setEnviandoSugestao(true);
    try {
      await salvarSugestao({ usuarioId, nomeUsuario, categoria: categoriaSugestao, descricao: descricaoSugestao.trim() });
      toast({ title: 'Sugestão enviada!', description: 'Obrigado pela sua contribuição!' });
      setCategoriaSugestao('');
      setDescricaoSugestao('');
      carregarSugestoes();
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível enviar a sugestão.', variant: 'destructive' });
    } finally {
      setEnviandoSugestao(false);
    }
  };

  const handleEnviarNPS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaGeral || !notaUsabilidade || !notaPerformance) {
      toast({ title: 'Atenção', description: 'Por favor, preencha todas as notas antes de enviar.', variant: 'destructive' });
      return;
    }
    if (ehDetratorNps(notaGeral) && !comentarioNPS.trim()) {
      toast({
        title: 'Queremos entender como melhorar',
        description: 'Conte o que aconteceu ou o que podemos melhorar para sua próxima experiência ser melhor.',
        variant: 'destructive',
      });
      return;
    }
    setEnviandoNPS(true);
    try {
      // Não incluir comentario se vazio — evita enviar undefined para o Firestore
      const dadosNPS = {
        usuarioId,
        nomeUsuario,
        notaGeral,
        notaUsabilidade,
        notaPerformance,
        ...(comentarioNPS.trim() ? { comentario: comentarioNPS.trim() } : {}),
      };
      await salvarPesquisaNPS(dadosNPS);
      toast({ title: 'Avaliação enviada!', description: 'Obrigado pelo seu feedback!' });
      setNotaGeral(null);
      setNotaUsabilidade(null);
      setNotaPerformance(null);
      setComentarioNPS('');
      setNpsElegivel(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Não foi possível enviar a avaliação.';
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setEnviandoNPS(false);
    }
  };

  // ── Tickets abertos / resolvidos
  const ticketsAbertos = meusTickets.filter((t) => t.status === 'Aberto');
  const ticketsResolvidos = meusTickets.filter((t) => t.status === 'Resolvido');
  const ticketNaoVisualizado = (ticket: TicketProblema) => (
    Boolean(ticket.respostaAdmin?.trim()) && ticket.respostaVisualizadaPeloUsuario !== true
  );
  const ticketsAbertosNaoVisualizados = ticketsAbertos.filter(ticketNaoVisualizado).length;
  const ticketsResolvidosNaoVisualizados = ticketsResolvidos.filter(ticketNaoVisualizado).length;

  const handleAlterarGruposTickets = async (grupos: string[]) => {
    setGruposTicketsAbertos(grupos);

    const ticketsVisiveis = [
      ...(grupos.includes('abertos') ? ticketsAbertos : []),
      ...(grupos.includes('resolvidos') ? ticketsResolvidos : []),
    ];
    const idsNaoVisualizados = ticketsVisiveis
      .filter(ticketNaoVisualizado)
      .map((ticket) => ticket.id)
      .filter((id): id is string => Boolean(id));

    if (idsNaoVisualizados.length === 0) return;

    try {
      await marcarTicketsComoVisualizadosPeloUsuario(idsNaoVisualizados);
      const ids = new Set(idsNaoVisualizados);
      setMeusTickets((atuais) => atuais.map((ticket) =>
        ticket.id && ids.has(ticket.id)
          ? { ...ticket, respostaVisualizadaPeloUsuario: true }
          : ticket
      ));
    } catch (error) {
      console.error('[Central de Ajuda] Falha ao registrar leitura dos chamados:', error);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-3xl font-bold text-csae-green-800">Central de Ajuda</h1>
          <p className="text-gray-600 font-medium">
            Relate problemas, sugira melhorias e avalie o Portal CSAE.
          </p>
        </div>

        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-6">
          <TabsList className="bg-slate-100 p-1 rounded-lg w-full grid grid-cols-3 h-12">
            <TabsTrigger value="ticket" className="rounded-md flex items-center gap-2 font-semibold text-sm">
              <Bug className="w-4 h-4" />
              Relatar Problema
              {respostasTicketsNaoVisualizadas > 0 && (
                <Badge className="bg-red-600 hover:bg-red-600 text-white px-1.5 py-0 text-[10px]">
                  {respostasTicketsNaoVisualizadas > 99 ? '99+' : respostasTicketsNaoVisualizadas}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sugestao" className="rounded-md flex items-center gap-2 font-semibold text-sm">
              <Lightbulb className="w-4 h-4" />
              Sugerir Melhoria
              {respostasSugestoesNaoVisualizadas > 0 && (
                <Badge className="bg-red-600 hover:bg-red-600 text-white px-1.5 py-0 text-[10px]">
                  {respostasSugestoesNaoVisualizadas > 99 ? '99+' : respostasSugestoesNaoVisualizadas}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="nps" className="rounded-md flex items-center gap-2 font-semibold text-sm">
              <Star className="w-4 h-4" />
              Avaliar Portal
            </TabsTrigger>
          </TabsList>

          {/* ─── ABA 1: Relatar Problema ──────────────────────── */}
          <TabsContent value="ticket" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-700">
                  <Bug className="h-5 w-5 text-red-500" />
                  Abrir Chamado de Suporte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Canal exclusivo para erros técnicos</AlertTitle>
                  <AlertDescription className="text-red-700">
                    Use este canal apenas para relatar <strong>bugs e erros</strong> que esteja encontrando no sistema. Para sugestões, use a aba "Sugerir Melhoria".
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleEnviarTicket} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Módulo / Tela com problema</label>
                    <Select value={moduloSelecionado} onValueChange={setModuloSelecionado}>
                      <SelectTrigger className="focus:ring-csae-green-600">
                        <SelectValue placeholder="Selecione o módulo afetado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MODULOS.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Descreva o problema em detalhes</label>
                    <Textarea
                      id="descricao-ticket"
                      placeholder="Descreva o que aconteceu, o que você estava tentando fazer e quais mensagens de erro apareceram..."
                      value={descricaoTicket}
                      onChange={(e) => setDescricaoTicket(e.target.value)}
                      rows={5}
                      className="resize-none focus-visible:ring-csae-green-600"
                    />
                    <p className="text-xs text-gray-400">{descricaoTicket.length} / 1000 caracteres</p>
                  </div>

                  <Button
                    id="btn-enviar-ticket"
                    type="submit"
                    disabled={enviandoTicket}
                    className="csae-btn-primary gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {enviandoTicket ? 'Enviando...' : 'Abrir Chamado'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Meus Chamados */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base text-slate-700">Meus Chamados</CardTitle>
              </CardHeader>
              <CardContent>
                {carregandoTickets ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csae-green-600" />
                  </div>
                ) : meusTickets.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhum chamado aberto até o momento.</p>
                ) : (
                  <Accordion
                    type="multiple"
                    value={gruposTicketsAbertos}
                    onValueChange={handleAlterarGruposTickets}
                    className="space-y-2"
                  >
                    {ticketsAbertos.length > 0 && (
                      <AccordionItem value="abertos" className="border rounded-lg px-4">
                        <AccordionTrigger className="font-semibold text-sm text-amber-700 hover:no-underline">
                          <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Abertos ({ticketsAbertos.length})
                            {ticketsAbertosNaoVisualizados > 0 && (
                              <Badge className="bg-red-600 hover:bg-red-600 text-white px-1.5 py-0 text-[10px]">
                                {ticketsAbertosNaoVisualizados}
                              </Badge>
                            )}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-2">
                          {ticketsAbertos.map((t) => (
                            <div key={t.id} className="bg-amber-50 border border-amber-100 rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-amber-700 border-amber-300 text-xs">{t.moduloAferido}</Badge>
                                  {ticketNaoVisualizado(t) && <Badge className="bg-red-600 hover:bg-red-600 text-white text-[10px]">Nova resposta</Badge>}
                                </div>
                                <span className="text-xs text-gray-400">{formatarData(t.dataCriacao)}</span>
                              </div>
                              <p className="text-sm text-gray-700">{t.descricao}</p>
                              {t.respostaAdmin && (
                                <div className="mt-2 bg-white border border-amber-200 rounded p-3">
                                  <p className="text-xs font-bold text-csae-green-700 mb-1 flex items-center gap-1">
                                    <MessageSquareHeart className="h-3 w-3" /> Resposta da equipe:
                                  </p>
                                  <p className="text-sm text-gray-700">{t.respostaAdmin}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    {ticketsResolvidos.length > 0 && (
                      <AccordionItem value="resolvidos" className="border rounded-lg px-4">
                        <AccordionTrigger className="font-semibold text-sm text-green-700 hover:no-underline">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Resolvidos ({ticketsResolvidos.length})
                            {ticketsResolvidosNaoVisualizados > 0 && (
                              <Badge className="bg-red-600 hover:bg-red-600 text-white px-1.5 py-0 text-[10px]">
                                {ticketsResolvidosNaoVisualizados}
                              </Badge>
                            )}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-2">
                          {ticketsResolvidos.map((t) => (
                            <div key={t.id} className="bg-green-50 border border-green-100 rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-green-700 border-green-300 text-xs">{t.moduloAferido}</Badge>
                                  {ticketNaoVisualizado(t) && <Badge className="bg-red-600 hover:bg-red-600 text-white text-[10px]">Nova resposta</Badge>}
                                </div>
                                <span className="text-xs text-gray-400">{formatarData(t.dataCriacao)}</span>
                              </div>
                              <p className="text-sm text-gray-700">{t.descricao}</p>
                              {t.respostaAdmin && (
                                <div className="mt-2 bg-white border border-green-200 rounded p-3">
                                  <p className="text-xs font-bold text-csae-green-700 mb-1 flex items-center gap-1">
                                    <MessageSquareHeart className="h-3 w-3" /> Resposta da equipe:
                                  </p>
                                  <p className="text-sm text-gray-700">{t.respostaAdmin}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── ABA 2: Sugerir Melhoria ─────────────────────── */}
          <TabsContent value="sugestao" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-700">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Enviar Sugestão de Melhoria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-amber-200 bg-amber-50">
                  <Lightbulb className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Tem uma ideia brilhante? Conta pra gente!</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Use este espaço para sugerir funcionalidades, melhorias de design ou qualquer ideia que tornaria o portal melhor. <strong>Para erros técnicos, use a aba "Relatar Problema".</strong>
                  </AlertDescription>
                </Alert>

                <form onSubmit={handleEnviarSugestao} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Categoria da sugestão</label>
                    <Select value={categoriaSugestao} onValueChange={setCategoriaSugestao}>
                      <SelectTrigger className="focus:ring-csae-green-600">
                        <SelectValue placeholder="Selecione uma categoria..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS_SUGESTAO.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Descreva sua sugestão</label>
                    <Textarea
                      id="descricao-sugestao"
                      placeholder="Descreva sua ideia com o máximo de detalhes possível..."
                      value={descricaoSugestao}
                      onChange={(e) => setDescricaoSugestao(e.target.value)}
                      rows={5}
                      className="resize-none focus-visible:ring-csae-green-600"
                    />
                  </div>

                  <Button
                    id="btn-enviar-sugestao"
                    type="submit"
                    disabled={enviandoSugestao}
                    className="csae-btn-primary gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {enviandoSugestao ? 'Enviando...' : 'Enviar Sugestão'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Minhas Sugestões */}
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base text-slate-700">Minhas Sugestões</CardTitle>
              </CardHeader>
              <CardContent>
                {carregandoSugestoes ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csae-green-600" />
                  </div>
                ) : minhasSugestoes.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Nenhuma sugestão enviada até o momento.</p>
                ) : (
                  <div className="space-y-3">
                    {minhasSugestoes.map((s) => (
                      <div key={s.id} className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{s.categoria}</Badge>
                            {Boolean(s.respostaAdmin?.trim()) && s.respostaVisualizadaPeloUsuario !== true && (
                              <Badge className="bg-red-600 hover:bg-red-600 text-white text-[10px]">Nova resposta</Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{formatarData(s.dataCriacao)}</span>
                        </div>
                        <p className="text-sm text-gray-700">{s.descricao}</p>
                        {s.respostaAdmin && (
                          <div className="mt-2 bg-white border border-csae-green-100 rounded p-3">
                            <p className="text-xs font-bold text-csae-green-700 mb-1 flex items-center gap-1">
                              <MessageSquareHeart className="h-3 w-3" /> Resposta da equipe:
                            </p>
                            <p className="text-sm text-gray-700">{s.respostaAdmin}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── ABA 3: Avaliar Portal (NPS) ──────────────────── */}
          <TabsContent value="nps" className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-700">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Avalie o Portal CSAE
                </CardTitle>
              </CardHeader>
              <CardContent>
                {verificandoNPS ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csae-green-600" />
                  </div>
                ) : !npsElegivel ? (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Você já avaliou o portal recentemente!</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Você já enviou uma avaliação nas últimas 48 horas. <strong>Volte em 48 horas</strong> para avaliar novamente. Agradecemos o seu feedback!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <form onSubmit={handleEnviarNPS} className="space-y-8">
                    {/* Nota Geral 1-10 */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700">
                        Nota Geral do Portal{' '}
                        <span className="font-normal text-gray-400">(1 = Péssimo, 10 = Excelente)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                          <ScoreButton key={v} value={v} selected={notaGeral} max={10} onClick={setNotaGeral} />
                        ))}
                      </div>
                    </div>

                    {/* Nota Usabilidade 1-5 */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700">
                        Facilidade de Uso / Usabilidade{' '}
                        <span className="font-normal text-gray-400">(1 = Difícil, 5 = Muito Fácil)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 5 }, (_, i) => i + 1).map((v) => (
                          <ScoreButton key={v} value={v} selected={notaUsabilidade} max={5} onClick={setNotaUsabilidade} />
                        ))}
                      </div>
                    </div>

                    {/* Nota Performance 1-5 */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700">
                        Velocidade / Performance{' '}
                        <span className="font-normal text-gray-400">(1 = Muito Lento, 5 = Muito Rápido)</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 5 }, (_, i) => i + 1).map((v) => (
                          <ScoreButton key={v} value={v} selected={notaPerformance} max={5} onClick={setNotaPerformance} />
                        ))}
                      </div>
                    </div>

                    {/* Relato de melhoria */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {ehDetratorNps(notaGeral)
                          ? 'Queremos entender como melhorar sua experiência'
                          : 'Conte mais sobre sua experiência'}{' '}
                        <span className="font-normal text-gray-400">
                          ({ehDetratorNps(notaGeral) ? 'obrigatório' : 'opcional'})
                        </span>
                      </label>
                      {ehDetratorNps(notaGeral) && (
                        <p className="text-xs text-amber-700">
                          Sua percepção é importante. Conte o que podemos corrigir para buscarmos uma nota maior na próxima vez.
                        </p>
                      )}
                      <Textarea
                        id="comentario-nps"
                        placeholder={ehDetratorNps(notaGeral)
                          ? 'O que aconteceu e como podemos melhorar o Portal CSAE?'
                          : 'Conte o que você mais gostou ou o que ainda podemos melhorar...'}
                        value={comentarioNPS}
                        onChange={(e) => setComentarioNPS(e.target.value)}
                        required={ehDetratorNps(notaGeral)}
                        aria-required={ehDetratorNps(notaGeral)}
                        rows={4}
                        className="resize-none focus-visible:ring-csae-green-600"
                      />
                    </div>

                    <Button
                      id="btn-enviar-nps"
                      type="submit"
                      disabled={enviandoNPS || (ehDetratorNps(notaGeral) && !comentarioNPS.trim())}
                      className="csae-btn-primary gap-2"
                    >
                      <ChevronRight className="h-4 w-4" />
                      {enviandoNPS ? 'Enviando...' : 'Enviar Avaliação'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
};

export default CentralAjuda;
