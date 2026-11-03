import { useCallback, useEffect, useState } from "react";
import { FileClock, FilePlus2, History, Save, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  criarVersaoLegal, listarVersoesLegais, pendenciasParaPublicacao,
  publicarVersaoLegal, salvarRevisaoLegal, validarConteudoLegal,
  type ConteudoDocumentoLegal, type EstadoDocumentoLegal, type RevisaoDocumentoLegal,
} from "@/services/bancodados/documentosLegaisDB";
import type { LegalDocumentKind } from "@/lib/legalDocuments";

const TITULOS: Record<LegalDocumentKind, string> = { terms: "Termos de Uso", privacy: "Política de Privacidade" };
const dataHora = (ts?: { toDate?: () => Date }) => ts?.toDate?.().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }) ?? "—";
const clonar = (value: ConteudoDocumentoLegal): ConteudoDocumentoLegal =>
  ({ introducao: value.introducao, secoes: value.secoes.map((s) => ({ ...s })) });

export default function GestaoDocumentosLegais() {
  const { user, sessionData } = useAuth();
  const [tipo, setTipo] = useState<LegalDocumentKind>("terms");
  const [estado, setEstado] = useState<EstadoDocumentoLegal | null>(null);
  const [historico, setHistorico] = useState<RevisaoDocumentoLegal[]>([]);
  const [editor, setEditor] = useState<ConteudoDocumentoLegal | null>(null);
  const [origemId, setOrigemId] = useState("");
  const [visualizacao, setVisualizacao] = useState<RevisaoDocumentoLegal | null>(null);
  const [confirmado, setConfirmado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const atualizar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await listarVersoesLegais(tipo);
      setEstado(resposta.estado);
      setHistorico(resposta.versoes);
      const rascunho = resposta.versoes.find((v) => v.id === resposta.estado?.rascunhoId);
      setEditor(rascunho ? clonar(rascunho.conteudo) : null);
      setOrigemId(rascunho?.id ?? "");
      setConfirmado(false);
    } catch {
      setErro("Não foi possível carregar o histórico de documentos. Confira suas permissões e conexão.");
    } finally {
      setCarregando(false);
    }
  }, [tipo]);

  useEffect(() => { void atualizar(); }, [atualizar]);

  if (!sessionData?.ehAdmin) {
    return <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">Somente administradores ativos podem gerenciar documentos legais.</p>;
  }

  const publicado = historico.find((item) => item.id === estado?.publicadaId);
  const rascunho = historico.find((item) => item.id === estado?.rascunhoId);
  const erros = editor ? validarConteudoLegal(editor) : [];
  const pendencias = editor ? pendenciasParaPublicacao(editor) : [];
  const temAlteracoes = !!(editor && rascunho && JSON.stringify(editor) !== JSON.stringify(rascunho.conteudo));

  const executar = async (acao: "criar" | "salvar" | "publicar") => {
    if (!user) return;
    setSalvando(true);
    try {
      if (acao === "criar") await criarVersaoLegal(tipo, user.uid);
      if (acao === "salvar") {
        if (!editor || !origemId) throw new Error("Rascunho não carregado.");
        await salvarRevisaoLegal(tipo, user.uid, editor, origemId);
      }
      if (acao === "publicar") {
        if (!origemId) throw new Error("Salve o rascunho antes de publicar.");
        if (temAlteracoes) throw new Error("Salve suas edições antes da publicação.");
        if (!confirmado) throw new Error("Confirme a revisão institucional antes de publicar.");
        if (erros.length || pendencias.length) throw new Error("Resolva as pendências do documento antes da publicação.");
        await publicarVersaoLegal(tipo, user.uid, origemId);
      }
      toast.success(acao === "criar" ? "Nova versão criada a partir da vigente." : acao === "salvar" ? "Revisão salva no histórico." : "Nova versão publicada.");
      await atualizar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao atualizar o documento.");
    } finally {
      setSalvando(false);
    }
  };

  const alterarSecao = (index: number, chave: "titulo" | "corpo", valor: string) =>
    setEditor((atual) => atual ? ({ ...atual, secoes: atual.secoes.map((s, i) => i === index ? { ...s, [chave]: valor } : s) }) : atual);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Documentos versionados:</strong> cada edição salva gera uma revisão imutável, com autor e data. A publicação não altera nem exclui versões anteriores. O termo de sigilo do cadastro permanece separado.
      </div>
      <Tabs value={tipo} onValueChange={(valor) => setTipo(valor as LegalDocumentKind)}>
        <TabsList className="w-full max-w-lg">
          <TabsTrigger className="flex-1" value="terms">Termos de Uso</TabsTrigger>
          <TabsTrigger className="flex-1" value="privacy">Política de Privacidade</TabsTrigger>
        </TabsList>
      </Tabs>
      {carregando ? <p role="status">Carregando histórico...</p> : erro ? <p role="alert" className="text-red-700">{erro}</p> : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Versão publicada</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {publicado ? (
                  <><p className="font-semibold">Versão {publicado.versao}.0</p>
                    <p>Publicada em {dataHora(publicado.criadoEm)}</p>
                    <p>Responsável pela publicação (UID): {publicado.autorUid}</p>
                    <Button variant="outline" size="sm" onClick={() => setVisualizacao(publicado)}>Consultar versão vigente</Button></>
                ) : <p>Não existe versão oficial publicada.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Próxima versão</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {rascunho ? (
                  <><p className="font-semibold">Versão {rascunho.versao}.0, revisão {rascunho.revisao} · Rascunho</p>
                  <p>Última edição em {dataHora(rascunho.criadoEm)}</p>
                  <p>Histórico completo de alterações disponível abaixo.</p></>
                ) : (
                  <Button onClick={() => void executar("criar")} disabled={salvando}><FilePlus2 className="mr-2 h-4 w-4"/> {publicado ? "Duplicar versão vigente" : "Criar primeira versão"}</Button>
                )}
              </CardContent>
            </Card>
          </div>

          {editor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Editor da versão {rascunho?.versao}.0</CardTitle>
                <p className="text-sm text-muted-foreground">O texto publicado não muda até que esta nova versão seja aprovada e publicada.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="legal-intro">Introdução</Label>
                  <Textarea id="legal-intro" value={editor.introducao} onChange={(event) => setEditor({ ...editor, introducao: event.target.value })} rows={5} disabled={salvando} />
                </div>
                {editor.secoes.map((s, index) => (
                  <div key={index} className="space-y-2 rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor={`legal-section-${index}`}>Seção {index + 1}</Label>
                      <Button type="button" variant="ghost" size="sm" disabled={salvando || editor.secoes.length === 1}
                        onClick={() => setEditor({ ...editor, secoes: editor.secoes.filter((_, i) => i !== index) })}>Remover seção</Button>
                    </div>
                    <Input id={`legal-section-${index}`} value={s.titulo} onChange={(event) => alterarSecao(index, "titulo", event.target.value)} maxLength={180} disabled={salvando} placeholder="Título da seção" />
                    <Textarea aria-label={`Conteúdo da seção ${index + 1}`} value={s.corpo} onChange={(event) => alterarSecao(index, "corpo", event.target.value)} rows={6} disabled={salvando} />
                  </div>
                ))}
                <Button variant="outline" disabled={salvando || editor.secoes.length >= 25} onClick={() => setEditor({ ...editor, secoes: [...editor.secoes, { titulo: "", corpo: "" }] })}>Adicionar seção</Button>
                {erros.length > 0 && <div role="alert" className="text-sm text-red-700">{erros.join(" ")}</div>}
                {pendencias.length > 0 && <div role="alert" className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <ShieldAlert className="h-5 w-5 shrink-0" /><span>Revise os trechos de validação pendente: {pendencias.join(", ")}. O sistema bloqueará a publicação enquanto permanecerem.</span>
                </div>}
                <div className="flex flex-col gap-3 border-t pt-4">
                  <Button className="self-start" disabled={salvando || !temAlteracoes || erros.length > 0} onClick={() => void executar("salvar")}>
                    <Save className="mr-2 h-4 w-4"/> Salvar nova revisão
                  </Button>
                  <label className="flex items-start gap-2 text-sm">
                    <Checkbox checked={confirmado} onCheckedChange={(checked) => setConfirmado(checked === true)} disabled={salvando} />
                    <span>Confirmo que a versão foi revisada e aprovada pela equipe responsável, inclusive as questões jurídicas e de proteção de dados. Estou ciente de que a publicação terá efeito imediato no rodapé.</span>
                  </label>
                  <Button variant="default" className="self-start" disabled={salvando || !confirmado || temAlteracoes || erros.length > 0 || pendencias.length > 0} onClick={() => void executar("publicar")}>
                    <Send className="mr-2 h-4 w-4"/> Publicar versão {rascunho?.versao}.0
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><History className="h-5 w-5"/> Histórico integral de revisões — {TITULOS[tipo]}</CardTitle></CardHeader>
            <CardContent>
              {historico.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma revisão registrada.</p> : (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {historico.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                      <div><p className="font-semibold">Versão {item.versao}.0 · revisão {item.revisao} · {item.operacao}</p>
                        <p className="text-muted-foreground">Em {dataHora(item.criadoEm)} · UID: {item.autorUid}</p>
                        <p className="text-xs text-muted-foreground">Origem: {item.anteriorId || "versão inicial"}</p></div>
                      <Button variant="outline" size="sm" onClick={() => setVisualizacao(item)}><FileClock className="mr-1 h-4 w-4"/> Ver conteúdo</Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      <Dialog open={visualizacao !== null} onOpenChange={(open) => { if (!open) setVisualizacao(null); }}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{visualizacao ? `Versão ${visualizacao.versao}.0 · revisão ${visualizacao.revisao}` : "Revisão"}</DialogTitle></DialogHeader>
          {visualizacao && <div className="space-y-5 text-sm">
            <p className="whitespace-pre-wrap">{visualizacao.conteudo.introducao}</p>
            {visualizacao.conteudo.secoes.map((s, i) => <section key={i}><h3 className="font-bold">{s.titulo}</h3><p className="mt-1 whitespace-pre-wrap">{s.corpo}</p></section>)}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
