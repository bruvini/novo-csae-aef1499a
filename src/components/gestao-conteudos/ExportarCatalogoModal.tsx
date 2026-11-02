import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { lerCatalogoCompleto } from '@/services/bancodados/exportarCatalogoDB';
import { COLECOES_CATALOGO, criarAbasCatalogo, criarJsonCatalogo, gerarXlsxCatalogo, gerarZipCatalogo } from '@/utils/catalogoClinicoExport';

type Formato = 'xlsx' | 'csv' | 'json';

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function ExportarCatalogoModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [formato, setFormato] = useState<Formato>('xlsx');
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);

  const exportar = async () => {
    setCarregando(true);
    setMensagem('Lendo e conferindo as cinco coleções…');
    setErro(false);
    try {
      const { catalogo, inicio, fim } = await lerCatalogoCompleto();
      const abas = criarAbasCatalogo(catalogo);
      setMensagem('Gerando o arquivo…');
      const data = new Date().toISOString().slice(0, 10);
      if (formato === 'json') {
        baixar(new Blob([criarJsonCatalogo(catalogo, inicio, fim)], { type: 'application/json;charset=utf-8' }), `catalogo-clinico-${data}.json`);
      } else if (formato === 'csv') {
        baixar(await gerarZipCatalogo(abas), `catalogo-clinico-${data}-csv.zip`);
      } else {
        baixar(await gerarXlsxCatalogo(abas), `catalogo-clinico-${data}.xlsx`);
      }
      const total = COLECOES_CATALOGO.reduce((soma, nome) => soma + catalogo[nome].length, 0);
      setMensagem(`Arquivo gerado com ${total} documentos. Leituras: ${inicio.toLocaleTimeString('pt-BR')}–${fim.toLocaleTimeString('pt-BR')}. As coleções podem mudar entre as leituras.`);
    } catch (cause) {
      setErro(true);
      setMensagem(cause instanceof Error ? cause.message : 'Não foi possível exportar o catálogo. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Exportar Catálogo Clínico</DialogTitle>
        <DialogDescription>Exporte o catálogo atual para conferência e revisão, sem alterar os registros.</DialogDescription>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">Inclui {COLECOES_CATALOGO.join(', ')}. Os dados podem mudar durante a leitura.</p>
      <fieldset className="grid gap-2" disabled={carregando}>
        <legend className="mb-2 text-sm font-semibold">Formato do arquivo</legend>
        {([['xlsx', 'Excel (.xlsx)'], ['csv', 'CSV (.zip)'], ['json', 'JSON (.json)']] as const).map(([valor, rotulo]) =>
          <label key={valor} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer">
            <input type="radio" name="formato-catalogo" value={valor} checked={formato === valor} onChange={() => setFormato(valor)} />
            <span>{rotulo}</span>
          </label>,
        )}
      </fieldset>
      <Button onClick={exportar} disabled={carregando} className="w-full">
        {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        {carregando ? 'Preparando…' : 'Iniciar exportação'}
      </Button>
      {mensagem && <p role={erro ? 'alert' : 'status'} className={`text-sm ${erro ? 'text-destructive' : 'text-muted-foreground'}`}>{mensagem}</p>}
    </DialogContent>
  </Dialog>;
}
