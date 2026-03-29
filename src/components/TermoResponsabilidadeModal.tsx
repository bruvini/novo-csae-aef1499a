import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, FileText, CheckCircle2, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TermoResponsabilidadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  dadosUsuario: {
    nomeCompleto: string;
    formacao: string;
    numeroCoren?: string;
    ufCoren?: string;
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    rg: string;
    cpf: string;
  } | null;
}

const TermoResponsabilidadeModal: React.FC<TermoResponsabilidadeModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  dadosUsuario,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  if (!dadosUsuario) return null;

  const formatarDataExtenso = () => {
    const hoje = new Date();
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;
  };

  const formatarCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  const formatarRG = (rg: string) => rg.replace(/(\d{1,2})(\d{3})(\d{3})/, "$1.$2.$3");

  const handleAceitar = async () => {
    setIsGeneratingPdf(true);
    try {
      const elemento = document.getElementById("termo-responsabilidade-pdf");
      if (!elemento) throw new Error("Elemento não encontrado");

      const html2pdf = (await import("html2pdf.js")).default;
      const filename = `termo-csae-${dadosUsuario.nomeCompleto.toLowerCase().replace(/\s+/g, "-")}.pdf`;

      const opcoes = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      const pdfOutput = await html2pdf().set(opcoes).from(elemento).output("bloburl");
      window.open(pdfOutput, "_blank"); 
      onAccept();
      
      toast({
        title: "Termo aceito!",
        description: "Documento gerado e aberto em nova aba. Processando cadastro...",
      });
    } catch (error) {
      console.error("PDF Error:", error);
      toast({ title: "Erro no PDF", description: "Falha ao gerar o termo. Tente novamente.", variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-csae-green-800 text-white shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <FileText className="h-6 w-6 text-csae-green-300" />
            Termo de Responsabilidade e Sigilo
          </DialogTitle>
          <p className="text-csae-green-100 text-sm opacity-90 font-medium">
            Leia atentamente as diretrizes de uso do Portal CSAE Floripa 2.0
          </p>
        </DialogHeader>

        <ScrollArea className="flex-grow p-0">
          {/* Versão Visual para o Modal */}
          <div className="p-8 md:p-12 bg-gray-50/50">
            <div className="max-w-2xl mx-auto space-y-8 bg-white p-10 shadow-sm border border-gray-100 rounded-xl leading-relaxed text-gray-800">
              <div className="text-center border-b border-gray-100 pb-8">
                <h3 className="text-sm font-bold text-csae-green-700 tracking-widest uppercase mb-1">Prefeitura de Florianópolis</h3>
                <h4 className="text-sm font-medium text-gray-500 uppercase">Secretaria Municipal de Saúde</h4>
                <div className="h-1 w-12 bg-csae-green-600 mx-auto mt-4 rounded-full"></div>
              </div>

              <div className="text-sm space-y-4">
                <p>Eu, <strong className="text-gray-900 underline decoration-csae-green-200 decoration-2">{dadosUsuario.nomeCompleto}</strong>, 
                inscrito no CPF sob o nº <strong>{formatarCPF(dadosUsuario.cpf)}</strong> e portador do RG nº <strong>{formatarRG(dadosUsuario.rg)}</strong>, 
                na qualidade de profissional de saúde (<strong>{dadosUsuario.formacao}</strong>) 
                {dadosUsuario.numeroCoren && ` com registro COREN/${dadosUsuario.ufCoren} nº ${dadosUsuario.numeroCoren}`}, 
                atuando na rede municipal de Florianópolis/SC.</p>

                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-3 font-medium text-gray-700">
                  <p><strong>ASSUMO</strong> a responsabilidade pelo uso das ferramentas de registro clínico eletrônico do Portal CSAE.</p>
                  <p><strong>DECLARO</strong> estar ciente de que o acesso é pessoal, intransferível e monitorado pela auditoria da SMS.</p>
                  <p><strong>RECONHEÇO</strong> o sigilo absoluto sobre os dados de saúde dos pacientes, nos termos da LGPD e legislação vigente.</p>
                </div>

                <p>Fico ciente de que o descumprimento destas normas poderá acarretar sanções éticas perante o conselho de classe e medidas administrativas ou judiciais pertinentes.</p>
              </div>

              <div className="pt-10 border-t border-gray-100 text-center">
                <p className="text-gray-500 font-medium tracking-tight">Florianópolis, {formatarDataExtenso()}</p>
                <div className="mt-8 flex justify-center">
                  <div className="w-64 border-t border-gray-400 pt-2 opacity-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Assinatura Eletrônica Registrada</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Versão Oculta dedicada estritamente ao PDF (Layout Profissional) */}
          <div className="hidden">
            <div id="termo-responsabilidade-pdf" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt', color: '#111', padding: '40px', lineHeight: '1.6' }}>
              <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #166534', paddingBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16pt', color: '#166534' }}>PREFEITURA DE FLORIANÓPOLIS</div>
                <div style={{ fontWeight: 'bold', fontSize: '12pt', color: '#444' }}>SECRETARIA MUNICIPAL DE SAÚDE</div>
                <div style={{ fontSize: '10pt', color: '#666', marginTop: '5px' }}>Comissão Permanente de Sistematização da Assistência de Enfermagem (CSAE)</div>
              </div>

              <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '14pt', fontWeight: 'bold' }}>
                TERMO DE RESPONSABILIDADE E COMPROMISSO DE SIGILO
              </h2>

              <p style={{ textAlign: 'justify', marginBottom: '20px' }}>
                Eu, <strong>{dadosUsuario.nomeCompleto}</strong>, brasileiro(a), {dadosUsuario.formacao}, {dadosUsuario.numeroCoren && `inscrito no COREN/${dadosUsuario.ufCoren} sob o nº ${dadosUsuario.numeroCoren},`} portador da cédula de identidade RG nº {formatarRG(dadosUsuario.rg)} e inscrito no CPF sob o nº {formatarCPF(dadosUsuario.cpf)}, residente em {dadosUsuario.rua}, nº {dadosUsuario.numero}, {dadosUsuario.bairro}, {dadosUsuario.cidade}/{dadosUsuario.uf}.
              </p>

              <p style={{ textAlign: 'justify', marginBottom: '20px' }}>
                <strong>DECLARO</strong> para os devidos fins de direito que, em razão das minhas atividades profissionais na Secretaria Municipal de Saúde de Florianópolis, terei acesso a informações confidenciais e prontuários eletrônicos de pacientes através do Portal CSAE.
              </p>

              <p style={{ textAlign: 'justify', marginBottom: '20px' }}>
                <strong>COMPROMETO-ME</strong> a manter o mais absoluto sigilo sobre quaisquer dados ou informações de natureza confidencial que venham a ser de meu conhecimento, não os divulgando a terceiros nem deles fazendo uso para fins diversos daqueles estritamente necessários ao exercício de minhas funções.
              </p>

              <p style={{ textAlign: 'justify', marginBottom: '20px' }}>
                Estou ciente de que a quebra de sigilo ou o uso indevido das informações constitui falta grave, sujeitando-me às sanções administrativas, civis e penais previstas na legislação vigente (Lei Geral de Proteção de Dados - LGPD e Código de Ética dos Profissionais de Enfermagem).
              </p>

              <div style={{ marginTop: '80px', textAlign: 'center' }}>
                <p>Florianópolis/SC, {formatarDataExtenso()}</p>
                <div style={{ marginTop: '60px', borderTop: '1px solid #000', width: '300px', margin: '60px auto 10px auto' }}></div>
                <p style={{ fontWeight: 'bold' }}>{dadosUsuario.nomeCompleto}</p>
                <p style={{ fontSize: '10pt', color: '#666' }}>{dadosUsuario.formacao} {dadosUsuario.numeroCoren && `(COREN ${dadosUsuario.numeroCoren})`}</p>
              </div>

              <div style={{ marginTop: '100px', fontSize: '8pt', color: '#999', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                Documento gerado eletronicamente através do Portal CSAE 2.0 - Autenticação Digital Vinculada ao CPF do Usuário.
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-6 bg-white border-t border-gray-100 flex flex-col md:flex-row justify-between gap-4 shrink-0">
          <Button
            onClick={() => {
              if (window.confirm("Você precisa aceitar os termos para prosseguir com o cadastro. Deseja realmente cancelar?")) {
                onClose();
              }
            }}
            variant="ghost"
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50"
            disabled={isGeneratingPdf}
          >
            <AlertTriangle className="h-4 w-4" />
            Recusar e Cancelar
          </Button>

          <Button
            onClick={handleAceitar}
            className="csae-btn-primary flex items-center gap-2 px-8 h-12 shadow-lg shadow-csae-green-600/20 active:scale-[0.98] transition-all"
            disabled={isGeneratingPdf}
          >
            {isGeneratingPdf ? (
              <>
                <Download className="h-4 w-4 animate-bounce" />
                Gerando Documento...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Aceitar e Gerar Comprovante
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermoResponsabilidadeModal;
