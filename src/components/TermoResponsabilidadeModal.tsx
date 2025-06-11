import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2pdf from "html2pdf.js";
import { uploadTermoResponsabilidade } from "@/services/storageService";

interface TermoResponsabilidadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (pdfUrl: string) => void;
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
  };
}

const TermoResponsabilidadeModal: React.FC<TermoResponsabilidadeModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  dadosUsuario
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  const formatarDataExtenso = () => {
    const hoje = new Date();
    const meses = [
      "janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    
    const dia = hoje.getDate();
    const mes = meses[hoje.getMonth()];
    const ano = hoje.getFullYear();
    
    return `${dia} de ${mes} de ${ano}`;
  };

  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatarRG = (rg: string) => {
    return rg.replace(/(\d{1,2})(\d{3})(\d{3})/, "$1.$2.$3");
  };

  const incluirCoren = () => {
    return dadosUsuario.formacao === "Enfermeiro" ||
           dadosUsuario.formacao === "Residente de Enfermagem" ||
           dadosUsuario.formacao === "Técnico de Enfermagem";
  };

  const gerarTextoCoren = () => {
    if (incluirCoren() && dadosUsuario.numeroCoren && dadosUsuario.ufCoren) {
      return `, COREN/${dadosUsuario.ufCoren} nº ${dadosUsuario.numeroCoren}`;
    }
    return "";
  };

  const handleRecusar = () => {
    const confirmar = window.confirm(
      "Você precisa aceitar o termo de responsabilidade para usar a plataforma. Deseja continuar sem aceitar?"
    );
    
    if (confirmar) {
      onClose();
    }
  };

  const handleAceitar = async () => {
    setIsGeneratingPdf(true);
    
    try {
      // Obter o elemento do termo para conversão em PDF
      const elemento = document.getElementById('termo-responsabilidade');
      
      if (!elemento) {
        throw new Error("Elemento do termo não encontrado");
      }

      // Configurações do PDF
      const opcoes = {
        margin: 1,
        filename: `termo-responsabilidade-${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      // Gerar PDF como blob
      const pdfBlob = await html2pdf().set(opcoes).from(elemento).outputPdf('blob');
      
      // Gerar UID temporário para o upload (será substituído pelo UID real após criação do usuário)
      const tempUid = `temp-${Date.now()}`;
      
      // Upload do PDF para Firebase Storage
      const downloadURL = await uploadTermoResponsabilidade(pdfBlob, tempUid);
      
      // Chamar callback com a URL do PDF
      onAccept(downloadURL);
      
      toast({
        title: "Termo aceito com sucesso!",
        description: "O PDF foi salvo e seu cadastro será processado.",
      });
      
    } catch (error) {
      console.error("Erro ao gerar e salvar PDF:", error);
      toast({
        title: "Erro ao processar termo",
        description: "Ocorreu um erro ao gerar e salvar o termo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-csae-green-800">
            <FileText className="h-5 w-5" />
            Termo de Responsabilidade
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div id="termo-responsabilidade" className="p-6 bg-white text-justify leading-relaxed">
            <h2 className="text-xl font-bold text-center mb-6 text-csae-green-800">
              TERMO DE RESPONSABILIDADE DE USO DO PORTAL CSAE FLORIPA
            </h2>
            
            <p className="mb-4">
              Eu, <strong>{dadosUsuario.nomeCompleto}</strong>, <strong>{dadosUsuario.formacao}</strong>
              {gerarTextoCoren()}, residente e domiciliado em {dadosUsuario.rua}, 
              Nº {dadosUsuario.numero}, Bairro {dadosUsuario.bairro}, {dadosUsuario.cidade}/{dadosUsuario.uf}, 
              portador da Cédula de Identidade R.G. nº {formatarRG(dadosUsuario.rg)}, 
              inscrito no CPF sob o nº {formatarCPF(dadosUsuario.cpf)}.
            </p>
            
            <p className="mb-4">
              <strong>ASSUMO</strong> a responsabilidade de participar como Piloto do Registro do Processo de Enfermagem, 
              utilizando a Classificação Internacional para a Prática de Enfermagem (CIPE) e o endereço eletrônico 
              www.csae.com.br no Centro de Saúde que estou alocado, conforme orientações fornecidas pela Comissão 
              Permanente da Sistematização da Assistência de Enfermagem (CSAE) – Subcomissão CIPE Protocolos de 
              Enfermagem da Secretaria Municipal de Saúde (SMS) de Florianópolis.
            </p>
            
            <p className="mb-4">
              <strong>DECLARO</strong> seguir os princípios e diretrizes combinadas no processo de trabalho.
            </p>
            
            <p className="mb-4">
              <strong>DECLARO</strong> ser de minha ciência que os dados contidos neste Piloto pertencem à SMS de 
              Florianópolis, portanto, é de minha responsabilidade NÃO compartilhar com pessoas externas ao projeto 
              os instrumentos e materiais disponibilizados, obrigando-me, assim, a ressarcir a ocorrência de qualquer 
              dano e/ou prejuízo oriundo de uma eventual quebra de sigilo das informações fornecidas.
            </p>
            
            <p className="mb-4">
              <strong>DECLARO</strong> não utilizar as informações confidenciais a que tiver acesso, para gerar 
              benefício próprio exclusivo e/ou unilateral, presente ou futuro, ou para o uso de terceiros.
            </p>
            
            <p className="mb-4">
              <strong>DECLARO</strong> ser da minha ciência que todos os dados que porventura forem utilizados para 
              fins de pesquisa e extensão, deverão ser autorizados pela CSAE e Responsabilidade Técnica de Enfermagem.
            </p>
            
            <p className="mb-6">
              Pelo não cumprimento do presente Termo de Responsabilidade, fica o abaixo assinado ciente de todas as 
              sanções judiciais que poderão advir.
            </p>
            
            <p className="text-center font-semibold">
              Florianópolis, {formatarDataExtenso()}
            </p>
          </div>
        </ScrollArea>
        
        <div className="flex justify-between gap-4 pt-4 border-t">
          <Button
            onClick={handleRecusar}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isGeneratingPdf}
          >
            <AlertTriangle className="h-4 w-4" />
            Recusar
          </Button>
          
          <Button
            onClick={handleAceitar}
            className="csae-btn-primary flex items-center gap-2"
            disabled={isGeneratingPdf}
          >
            <FileText className="h-4 w-4" />
            {isGeneratingPdf ? "Processando..." : "Aceitar e Prosseguir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermoResponsabilidadeModal;
