import { jsPDF } from "jspdf";

export interface DocumentoPdf {
  titulo: string;
  subtitulo?: string;
  nota?: string;
  paragrafos: string[];
  secoes?: Array<{ titulo: string; paragrafos: string[] }>;
}

const MARGEM = 18;
const LARGURA = 210;
const RODAPE = 283;
const ALTURA_LINHA = 5.35;

/**
 * PDF com texto vetorial selecionável. Sem html2canvas nem elementos ocultos:
 * a renderização ocorre diretamente no jsPDF, evitando páginas em branco.
 */
export function comporPdfDocumento(dados: DocumentoPdf): jsPDF {
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  let y = 0;
  const larguraTexto = LARGURA - MARGEM * 2;
  const cabecalho = () => {
    pdf.setTextColor(16, 99, 67);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("PORTAL CSAE FLORIPA 2.0", MARGEM, 17);
    pdf.setDrawColor(187, 220, 197);
    pdf.setLineWidth(0.55);
    pdf.line(MARGEM, 21.5, LARGURA - MARGEM, 21.5);
    pdf.setTextColor(43, 55, 65);
    y = 30;
  };
  const novaPaginaSe = (necessario: number) => {
    if (y + necessario <= RODAPE - 8) return;
    pdf.addPage();
    cabecalho();
  };
  const texto = (str: string, op: { negrito?: boolean; tamanho?: number; espacamento?: number } = {}) => {
    const strLimpo = str.trim();
    if (!strLimpo) { y += 3; return; }
    const tamanho = op.tamanho ?? 10.3;
    pdf.setFont("helvetica", op.negrito ? "bold" : "normal");
    pdf.setFontSize(tamanho);
    pdf.setTextColor(48, 59, 69);
    const linhas = pdf.splitTextToSize(strLimpo, larguraTexto) as string[];
    const altura = tamanho >= 13 ? 6.8 : ALTURA_LINHA;
    for (const linha of linhas) {
      novaPaginaSe(altura);
      pdf.text(linha, MARGEM, y);
      y += altura;
    }
    y += op.espacamento ?? 3.3;
  };
  cabecalho();
  texto(dados.titulo, { tamanho: 15, negrito: true, espacamento: 4 });
  if (dados.subtitulo) texto(dados.subtitulo, { tamanho: 9.3, espacamento: 5 });
  if (dados.nota) {
    novaPaginaSe(14);
    pdf.setFillColor(247, 252, 249);
    pdf.setDrawColor(194, 224, 202);
    pdf.roundedRect(MARGEM - 2, y - 4, larguraTexto + 4, 4, 1, 1, "FD");
    texto(dados.nota, { tamanho: 9.2, espacamento: 6 });
  }
  dados.paragrafos.forEach(paragrafo => texto(paragrafo));
  for (const secao of dados.secoes ?? []) {
    novaPaginaSe(15);
    y += 2;
    texto(secao.titulo, { tamanho: 12, negrito: true, espacamento: 4 });
    secao.paragrafos.forEach(paragrafo => texto(paragrafo));
  }
  const total = pdf.getNumberOfPages();
  for (let pagina = 1; pagina <= total; pagina++) {
    pdf.setPage(pagina);
    pdf.setDrawColor(218, 229, 220);
    pdf.setLineWidth(0.25);
    pdf.line(MARGEM, RODAPE - 4, LARGURA - MARGEM, RODAPE - 4);
    pdf.setTextColor(113, 128, 139);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Documento gerado pelo Portal CSAE Floripa 2.0", MARGEM, RODAPE);
    pdf.text("Página " + pagina + " de " + total, LARGURA - MARGEM, RODAPE, { align: "right" });
  }
  return pdf;
}
