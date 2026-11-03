import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { BookOpen, CalendarDays, Heart, Image as ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  criarEvento, curtirEvento, dataParaInput, editarEvento, excluirEvento, formatarDataEvento,
  listarEventos, validarEvento, type TimelineEvent, type TimelineEventInput,
} from "@/services/bancodados/timelineDB";

const vazio: TimelineEventInput = {
  dataEvento: "", titulo: "", subtitulo: "", textoRedacao: "",
  foto: "", legendaFoto: "", autoriaFoto: "",
};

const Timeline = () => {
  const { user, sessionData } = useAuth();
  const isAdmin = sessionData?.ehAdmin === true &&
    ["liberado", "aprovado"].includes((sessionData.statusAcesso || "").toLowerCase());
  const reduzirMovimento = useReducedMotion();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<TimelineEvent | null>(null);
  const [excluindo, setExcluindo] = useState<TimelineEvent | null>(null);
  const [form, setForm] = useState<TimelineEventInput>({ ...vazio });
  const [salvando, setSalvando] = useState(false);

  const atualizar = useCallback(async () => {
    setCarregando(true);
    try {
      setEvents(await listarEventos());
      setFalha(false);
    } catch (error) {
      console.error("Erro ao consultar a história do Portal:", error);
      setFalha(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (user && sessionData) void atualizar();
    else { setEvents([]); setCarregando(false); }
  }, [atualizar, user, sessionData]);

  const abrirNovo = () => {
    setEditando(null);
    setForm({ ...vazio });
    setModalAberto(true);
  };

  const abrirEdicao = (evento: TimelineEvent) => {
    setEditando(evento);
    setForm({
      dataEvento: dataParaInput(evento),
      titulo: evento.titulo || "",
      subtitulo: evento.subtitulo || "",
      textoRedacao: evento.textoRedacao || "",
      foto: evento.foto || "",
      legendaFoto: evento.legendaFoto || "",
      autoriaFoto: evento.autoriaFoto || "",
    });
    setModalAberto(true);
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAdmin || !user) return;
    const erros = validarEvento(form);
    if (erros.length) {
      toast.error(erros.join(" "));
      return;
    }
    setSalvando(true);
    try {
      if (editando) await editarEvento(editando.id, form, user.uid);
      else await criarEvento(form, user.uid);
      toast.success(editando ? "Acontecimento atualizado." : "Acontecimento incluído na história.");
      setModalAberto(false);
      await atualizar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao salvar o acontecimento.");
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!isAdmin || !excluindo) return;
    setSalvando(true);
    try {
      await excluirEvento(excluindo.id);
      setExcluindo(null);
      toast.success("Acontecimento excluído.");
      await atualizar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível excluir o acontecimento.");
    } finally {
      setSalvando(false);
    }
  };

  const curtir = async (evento: TimelineEvent) => {
    if (!user || !sessionData) return;
    try {
      await curtirEvento(evento.id, user.uid, evento.curtidasPor.includes(user.uid));
      await atualizar();
    } catch {
      toast.error("Não foi possível registrar sua curtida.");
    }
  };

  const alterar = (campo: keyof TimelineEventInput, valor: string) =>
    setForm((atual) => ({ ...atual, [campo]: valor }));

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-csae-green-50 to-gray-50">
      {sessionData ? <Header /> : (
        <header className="sticky top-0 z-50 border-b border-csae-green-100 bg-white">
          <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-8">
            <Link to="/" className="flex items-center gap-2 rounded-lg font-bold text-csae-green-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-csae-green-600">
              <img src="/logo_csae.png" alt="" className="h-10 w-auto" />
              Portal CSAE Floripa 2.0
            </Link>
            <Link to="/login" className="text-sm font-semibold text-csae-green-700 hover:underline">Entrar</Link>
          </div>
        </header>
      )}
      <main className="relative z-0 w-full flex-1 px-4 py-10 sm:px-8 lg:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 flex flex-col items-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-csae-green-100 text-csae-green-700">
              <BookOpen className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="text-3xl font-black tracking-tight text-csae-green-900 sm:text-5xl">Nossa História</h1>
            <p className="max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Uma viagem pelos acontecimentos, pessoas e ideias que construíram o Portal CSAE Floripa.
            </p>
            {isAdmin && (
              <Button type="button" onClick={abrirNovo} className="mt-2 bg-csae-green-700 hover:bg-csae-green-800">
                <Plus className="mr-2 h-4 w-4" /> Cadastrar acontecimento
              </Button>
            )}
          </div>

          {!user || !sessionData ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-gray-600">
              Para conhecer a história do Portal CSAE, entre com sua conta autorizada.
              <div className="mt-4"><Link className="font-semibold text-csae-green-700 underline" to="/login">Entrar</Link></div>
            </div>
          ) : carregando ? (
            <p role="status" className="py-16 text-center text-gray-600">Carregando os acontecimentos...</p>
          ) : falha ? (
            <div role="alert" className="rounded-2xl border border-red-100 bg-white p-6 text-center text-red-800">
              Não foi possível carregar a história neste momento.
              <Button type="button" variant="outline" className="ml-3" onClick={() => void atualizar()}>Tentar novamente</Button>
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center text-gray-600">
              Ainda não há acontecimentos cadastrados na linha do tempo.
            </div>
          ) : (
            <div className="relative space-y-8 pb-12 md:space-y-12">
              <div className="absolute bottom-0 left-4 top-0 w-1 rounded-full bg-gradient-to-b from-csae-green-200 via-csae-green-500 to-csae-green-200 md:left-1/2 md:-translate-x-1/2" aria-hidden="true" />
              {events.map((evento, indice) => (
                <motion.article
                  key={evento.id}
                  initial={reduzirMovimento ? false : { opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.4 }}
                  className={`relative pl-12 md:grid md:grid-cols-2 md:gap-14 md:pl-0 ${indice % 2 === 0 ? "" : "md:[direction:rtl]"}`}
                >
                  <span className="absolute left-[9px] top-8 z-10 h-4 w-4 rounded-full border-4 border-white bg-csae-green-600 shadow-md md:left-1/2 md:-translate-x-1/2" aria-hidden="true" />
                  <div className="min-w-0 md:[direction:ltr]">
                    <div className="overflow-hidden rounded-2xl border border-csae-green-100 bg-white shadow-sm">
                      {evento.foto && (
                        <figure>
                          <img src={evento.foto} alt={evento.legendaFoto || evento.titulo} loading="lazy" className="aspect-video w-full object-cover" referrerPolicy="no-referrer" />
                          {(evento.legendaFoto || evento.autoriaFoto) && (
                            <figcaption className="border-b bg-gray-50 px-5 py-2 text-xs text-gray-600">
                              {evento.legendaFoto}{evento.autoriaFoto ? ` · Foto: ${evento.autoriaFoto}` : ""}
                            </figcaption>
                          )}
                        </figure>
                      )}
                      <div className="space-y-3 p-5 sm:p-6">
                        <time className="inline-flex items-center gap-2 rounded-full bg-csae-green-50 px-3 py-1 text-xs font-semibold text-csae-green-800">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {formatarDataEvento(evento)}
                        </time>
                        <h2 className="text-xl font-bold text-csae-green-900">{evento.titulo}</h2>
                        {evento.subtitulo && <p className="font-medium text-gray-600">{evento.subtitulo}</p>}
                        <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                          {(evento.textoRedacao || "").split(/\n\s*\n|\n/).filter(Boolean).map((paragrafo, i) => <p key={i}>{paragrafo}</p>)}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                          <Button type="button" variant="ghost" size="sm" onClick={() => void curtir(evento)}
                            aria-label={evento.curtidasPor.includes(user.uid) ? "Remover minha curtida" : "Curtir acontecimento"}
                            aria-pressed={evento.curtidasPor.includes(user.uid)}
                            className={evento.curtidasPor.includes(user.uid) ? "text-red-700" : "text-gray-600"}>
                            <Heart className="mr-1 h-4 w-4" aria-hidden="true" />
                            {evento.curtidasPor.length} curtidas
                          </Button>
                        {isAdmin && (
                          <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => abrirEdicao(evento)}>
                              <Pencil className="mr-1 h-4 w-4" /> Editar
                            </Button>
                            <Button type="button" size="sm" variant="outline" className="text-red-700" onClick={() => setExcluindo(evento)}>
                              <Trash2 className="mr-1 h-4 w-4" /> Excluir
                            </Button>
                          </div>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
              <p className="relative z-10 bg-gray-50 py-6 text-center text-lg font-semibold italic text-csae-green-800">
                A história do CSAE continua sendo escrita...
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Dialog open={modalAberto && isAdmin} onOpenChange={(open) => { if (!open && !salvando) setModalAberto(false); }}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar acontecimento" : "Cadastrar acontecimento"}</DialogTitle>
            <DialogDescription>Os acontecimentos publicados nesta página são visíveis ao público. Não inclua dados pessoais de pacientes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void salvar(event)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="timeline-data">Mês e ano do acontecimento</Label>
                <Input id="timeline-data" type="month" required value={form.dataEvento} onChange={(e) => alterar("dataEvento", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timeline-titulo">Título</Label>
                <Input id="timeline-titulo" required maxLength={180} value={form.titulo} onChange={(e) => alterar("titulo", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timeline-subtitulo">Subtítulo</Label>
              <Input id="timeline-subtitulo" maxLength={240} value={form.subtitulo} onChange={(e) => alterar("subtitulo", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timeline-texto">Texto da história</Label>
              <Textarea id="timeline-texto" required rows={7} maxLength={12000} value={form.textoRedacao} onChange={(e) => alterar("textoRedacao", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timeline-foto">URL da fotografia (HTTPS, opcional)</Label>
              <Input id="timeline-foto" type="url" placeholder="https://..." value={form.foto} onChange={(e) => alterar("foto", e.target.value)} />
              {form.foto.startsWith("https://") && (
                <div className="flex items-center gap-3 rounded-lg border p-2 text-xs text-gray-500">
                  <ImageIcon className="h-4 w-4 shrink-0" /><span>Imagem cadastrada por link externo</span>
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="timeline-legenda">Legenda da foto</Label>
                <Input id="timeline-legenda" maxLength={300} value={form.legendaFoto} onChange={(e) => alterar("legendaFoto", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timeline-autoria">Autoria / crédito da foto</Label>
                <Input id="timeline-autoria" maxLength={160} value={form.autoriaFoto} onChange={(e) => alterar("autoriaFoto", e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={salvando} onClick={() => setModalAberto(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando || !isAdmin}>{salvando ? "Salvando..." : editando ? "Salvar alterações" : "Publicar acontecimento"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={excluindo !== null && isAdmin} onOpenChange={(open) => { if (!open && !salvando) setExcluindo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir acontecimento?</AlertDialogTitle>
            <AlertDialogDescription>
              O evento “{excluindo?.titulo}” será removido da linha do tempo. Esta exclusão é permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={salvando} className="bg-red-600 hover:bg-red-700" onClick={() => void confirmarExclusao()}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Timeline;
