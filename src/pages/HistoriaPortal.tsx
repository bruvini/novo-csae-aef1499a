import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import {
  CalendarDays,
  Heart,
  History as HistoryIcon,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  atualizarHistoriaPortal,
  criarHistoriaPortal,
  curtirHistoriaPortal,
  excluirHistoriaPortal,
  observarHistoriasPortal,
  type HistoriaPortal as HistoriaPortalItem,
  type HistoriaPortalInput,
} from "@/services/bancodados/historiasPortalDB";

const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 5000;

function criarDataOrdenacao(dataReferencia: string): string | null {
  const partes = /^(0[1-9]|1[0-2])\/(\d{4})$/.exec(dataReferencia);
  if (!partes) return null;
  return `${partes[2]}-${partes[1]}`;
}

function formatarEntradaData(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

interface EditorHistoriaProps {
  open: boolean;
  historia: HistoriaPortalItem | null;
  onOpenChange: (open: boolean) => void;
  onSave: (input: HistoriaPortalInput) => Promise<void>;
}

function EditorHistoria({ open, historia, onOpenChange, onSave }: EditorHistoriaProps) {
  const [dataReferencia, setDataReferencia] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setDataReferencia(historia?.dataReferencia ?? "");
    setTitulo(historia?.titulo ?? "");
    setDescricao(historia?.descricao ?? "");
  }, [open, historia?.id, historia?.dataReferencia, historia?.titulo, historia?.descricao]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const dataOrdenacao = criarDataOrdenacao(dataReferencia);
    const tituloLimpo = titulo.trim();
    const descricaoLimpa = descricao.trim();

    if (!dataOrdenacao) {
      toast({
        title: "Data inválida",
        description: "Informe a data no formato MM/AAAA, com um mês entre 01 e 12.",
        variant: "destructive",
      });
      return;
    }
    if (!tituloLimpo || !descricaoLimpa) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a descrição da história.",
        variant: "destructive",
      });
      return;
    }

    setSalvando(true);
    try {
      await onSave({
        dataReferencia,
        dataOrdenacao,
        titulo: tituloLimpo,
        descricao: descricaoLimpa,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar história do Portal:", error);
      toast({
        title: "Não foi possível salvar",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{historia ? "Editar história" : "Cadastrar história"}</DialogTitle>
          <DialogDescription>
            Registre um momento importante da trajetória do Portal CSAE.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="historia-data">Data (MM/AAAA)</Label>
            <Input
              id="historia-data"
              inputMode="numeric"
              autoComplete="off"
              placeholder="MM/AAAA"
              value={dataReferencia}
              onChange={(event) => setDataReferencia(formatarEntradaData(event.target.value))}
              maxLength={7}
              aria-describedby="historia-data-ajuda"
              required
            />
            <p id="historia-data-ajuda" className="text-xs text-muted-foreground">
              Digite o mês e o ano do acontecimento.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="historia-titulo">Título</Label>
            <Input
              id="historia-titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              maxLength={MAX_TITLE_LENGTH}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="historia-descricao">Descrição</Label>
            <Textarea
              id="historia-descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={6}
              className="resize-y"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {historia ? "Salvar alterações" : "Publicar história"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const HistoriaPortal = () => {
  const { sessionData } = useAuth();
  const { toast } = useToast();
  const [historias, setHistorias] = useState<HistoriaPortalItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [editorAberto, setEditorAberto] = useState(false);
  const [historiaEmEdicao, setHistoriaEmEdicao] = useState<HistoriaPortalItem | null>(null);
  const [historiaParaExcluir, setHistoriaParaExcluir] = useState<HistoriaPortalItem | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [curtindoId, setCurtindoId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 80%", "end 45%"],
  });
  const linhaProgressiva = useSpring(scrollYProgress, { stiffness: 70, damping: 24 });
  const ehAdmin = sessionData?.ehAdmin === true;

  useEffect(() => {
    return observarHistoriasPortal(
      (items) => {
        setHistorias(items);
        setCarregando(false);
        setErroCarregamento(false);
      },
      (error) => {
        console.error("Erro ao carregar histórias do Portal:", error);
        setCarregando(false);
        setErroCarregamento(true);
      },
    );
  }, []);

  const abrirCadastro = () => {
    setHistoriaEmEdicao(null);
    setEditorAberto(true);
  };

  const abrirEdicao = (historia: HistoriaPortalItem) => {
    setHistoriaEmEdicao(historia);
    setEditorAberto(true);
  };

  const salvarHistoria = useCallback(async (input: HistoriaPortalInput) => {
    if (!sessionData?.uid) throw new Error("Sessão não encontrada.");

    if (historiaEmEdicao) {
      await atualizarHistoriaPortal(historiaEmEdicao.id, input, sessionData.uid);
      toast({ title: "História atualizada", description: "As alterações já aparecem na linha do tempo." });
    } else {
      await criarHistoriaPortal(input, sessionData.uid);
      toast({ title: "História publicada", description: "O relato já aparece na linha do tempo." });
    }
  }, [historiaEmEdicao, sessionData?.uid, toast]);

  const confirmarExclusao = async () => {
    if (!historiaParaExcluir) return;
    setExcluindo(true);
    try {
      await excluirHistoriaPortal(historiaParaExcluir.id);
      toast({ title: "História apagada", description: "O relato foi removido da linha do tempo." });
      setHistoriaParaExcluir(null);
    } catch (error) {
      console.error("Erro ao excluir história do Portal:", error);
      toast({
        title: "Não foi possível apagar",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setExcluindo(false);
    }
  };

  const curtir = async (historia: HistoriaPortalItem) => {
    const uid = sessionData?.uid;
    if (!uid || historia.curtidasPor.includes(uid) || curtindoId) return;
    setCurtindoId(historia.id);
    try {
      const adicionouCurtida = await curtirHistoriaPortal(historia.id, uid);
      if (adicionouCurtida) {
        toast({ title: "Curtida registrada", description: "Obrigado por destacar este momento da história." });
      }
    } catch (error) {
      console.error("Erro ao curtir história:", error);
      toast({
        title: "Não foi possível curtir",
        description: "Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCurtindoId(null);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-5xl space-y-10 pb-12">
        <section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-green-100/70 p-7 shadow-sm sm:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-sm font-semibold text-csae-green-800">
                <Sparkles className="h-4 w-4" />
                Nossa trajetória
              </div>
              <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                <HistoryIcon className="h-8 w-8 shrink-0 text-csae-green-600 sm:h-9 sm:w-9" />
                História do Portal
              </h1>
              <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
                Cada etapa conecta pessoas, cuidado e inovação na construção do Processo de Enfermagem em Florianópolis.
              </p>
            </div>
            {ehAdmin && (
              <Button onClick={abrirCadastro} className="shrink-0 gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Cadastrar história
              </Button>
            )}
          </div>
        </section>

        {carregando ? (
          <div className="flex min-h-48 items-center justify-center gap-3 text-csae-green-700" role="status">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando a história do Portal...</span>
          </div>
        ) : erroCarregamento ? (
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar as histórias agora. Atualize a página ou tente novamente mais tarde.
            </AlertDescription>
          </Alert>
        ) : historias.length === 0 ? (
          <Card className="border-dashed border-emerald-200 bg-white/80">
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-csae-green-600">
                <HistoryIcon className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">A história começa aqui</h2>
              <p className="max-w-md text-sm text-gray-500">
                {ehAdmin
                  ? "Cadastre o primeiro marco para iniciar a linha do tempo do Portal CSAE."
                  : "Em breve, os momentos importantes da trajetória do Portal aparecerão nesta linha do tempo."}
              </p>
              {ehAdmin && (
                <Button onClick={abrirCadastro} variant="outline" className="mt-2 gap-2">
                  <Plus className="h-4 w-4" />
                  Cadastrar primeira história
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <section aria-label="Linha do tempo da História do Portal" className="relative">
            <div ref={timelineRef} className="relative space-y-7 md:space-y-10">
              <div aria-hidden="true" className="pointer-events-none absolute bottom-5 left-[11px] top-5 w-1 -translate-x-1/2 rounded-full bg-emerald-100 md:left-1/2">
                <motion.div
                  className="h-full w-full origin-top rounded-full bg-gradient-to-b from-emerald-300 via-csae-green-500 to-emerald-200"
                  style={{ scaleY: prefersReducedMotion ? 1 : linhaProgressiva }}
                />
              </div>
              {historias.map((historia, index) => {
                const curtidaRegistrada = Boolean(sessionData?.uid && historia.curtidasPor.includes(sessionData.uid));
                const cardNaEsquerda = index % 2 === 0;

                return (
                  <motion.article
                    key={historia.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: prefersReducedMotion ? 0 : 0.55, ease: "easeOut" }}
                    className="relative grid grid-cols-[24px_minmax(0,1fr)] gap-x-4 md:grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] md:gap-x-6"
                  >
                    <div className="col-start-1 row-start-1 flex justify-center pt-5 md:col-start-2">
                      <span className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-4 border-white bg-csae-green-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]">
                        <span className="absolute inset-[-5px] -z-10 animate-ping rounded-full bg-emerald-300/40 motion-reduce:animate-none" />
                      </span>
                    </div>
                    <div className={`col-start-2 row-start-1 min-w-0 ${cardNaEsquerda ? "md:col-start-1 md:justify-self-end" : "md:col-start-3 md:justify-self-start"}`}>
                      <Card className="group w-full max-w-xl overflow-hidden border-emerald-100 bg-white/95 shadow-sm transition-shadow duration-300 hover:shadow-lg">
                        <div className={`h-1 w-full bg-gradient-to-r ${cardNaEsquerda ? "from-emerald-300 to-csae-green-500" : "from-csae-green-500 to-emerald-300"}`} />
                        <CardHeader className="space-y-3 pb-3">
                          <div className={`flex flex-wrap items-center justify-between gap-3 ${cardNaEsquerda ? "md:flex-row-reverse" : ""}`}>
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-csae-green-800">
                              <CalendarDays className="h-4 w-4" />
                              {historia.dataReferencia}
                            </span>
                            {ehAdmin && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => abrirEdicao(historia)}
                                  aria-label={`Editar história: ${historia.titulo}`}
                                  title="Editar história"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setHistoriaParaExcluir(historia)}
                                  aria-label={`Apagar história: ${historia.titulo}`}
                                  title="Apagar história"
                                  className="text-gray-500 hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <CardTitle className={`text-xl leading-snug text-csae-green-900 ${cardNaEsquerda ? "md:text-right" : ""}`}>
                            {historia.titulo}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          <p className={`whitespace-pre-wrap break-words leading-relaxed text-gray-600 ${cardNaEsquerda ? "md:text-right" : ""}`}>
                            {historia.descricao}
                          </p>
                          <div className={`flex ${cardNaEsquerda ? "md:justify-end" : ""}`}>
                            <Button
                              variant={curtidaRegistrada ? "secondary" : "outline"}
                              size="sm"
                              disabled={curtidaRegistrada || curtindoId !== null}
                              onClick={() => void curtir(historia)}
                              aria-pressed={curtidaRegistrada}
                              aria-label={curtidaRegistrada ? `Você curtiu ${historia.titulo}` : `Curtir ${historia.titulo}`}
                              className={`gap-2 rounded-full ${curtidaRegistrada ? "text-rose-600" : "hover:border-rose-200 hover:text-rose-600"}`}
                            >
                              {curtindoId === historia.id
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Heart className={`h-4 w-4 ${curtidaRegistrada ? "fill-current" : ""}`} />}
                              {historia.curtidasPor.length}
                              <span>{historia.curtidasPor.length === 1 ? "curtida" : "curtidas"}</span>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <EditorHistoria
        open={editorAberto}
        historia={historiaEmEdicao}
        onOpenChange={(open) => {
          setEditorAberto(open);
          if (!open) setHistoriaEmEdicao(null);
        }}
        onSave={salvarHistoria}
      />

      <AlertDialog open={historiaParaExcluir !== null} onOpenChange={(open) => !open && !excluindo && setHistoriaParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar esta história?</AlertDialogTitle>
            <AlertDialogDescription>
              “{historiaParaExcluir?.titulo}” será removida da linha do tempo. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={excluindo}
              onClick={(event) => {
                event.preventDefault();
                void confirmarExclusao();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apagar história
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  );
};

export default HistoriaPortal;
