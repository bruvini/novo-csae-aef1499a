import { doc, getDoc } from "firebase/firestore";
import type { Usuario } from "@/types/usuario";
import { db } from "@/services/firebase";
import type { ConteudoDocumentoLegal } from "@/services/bancodados/documentosLegaisDB";

const escapar = (valor: string | undefined | null) =>
  String(valor ?? "").replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[s] ?? s);

const dataExtenso = (valor: Date) => valor.toLocaleDateString("pt-BR", {
  timeZone: "America/Sao_Paulo", day: "numeric", month: "long", year: "numeric",
});

const dataHora = (valor: Date) => valor.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

async function exportarHtml(nome: string, corpo: string): Promise<void> {
  const root = document.createElement("div");
  root.className = "csae-pdf-export";
  root.style.cssText = "position:fixed;left:-9999px;top:0;width:770px;background:white;color:#17212a;z-index:-1";
  root.innerHTML = `
    <div style="padding:36px 40px;font:14px/1.65 Arial,Helvetica,sans-serif;color:#263238;background:#fff">
      <header style="text-align:center;padding:0 0 24px;margin-bottom:28px;border-bottom:3px solid #12764b">
        <div style="color:#12764b;font-weight:800;font-size:20px">PORTAL CSAE FLORIPA 2.0</div>
        <div style="font-size:12px;color:#64748b">Processo de Enfermagem · Registro documental</div>
      </header>
      ${corpo}
      <footer style="padding-top:18px;margin-top:32px;border-top:1px solid #e2e8f0;font-size:10px;color:#6b7280">
        Documento gerado pelo Portal CSAE Floripa 2.0 em ${escapar(dataHora(new Date()))}.
      </footer>
    </div>`;
  document.body.appendChild(root);
  try {
    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf().set({
      filename: nome,
      margin: [12, 10, 12, 10],
      image: { type: "jpeg", quality: 0.97 },
      html2canvas: { scale: 2, useCORS: false, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    }).from(root).save();
  } finally {
    root.remove();
  }
}

function nomeArquivo(nome: string) {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 65);
}

/**
 * Reemite uma via informativa com os dados ATUAIS do cadastro.
 * O PDF original não é armazenado pelo portal; portanto não se afirma
 * que esta via é a reprodução fiel de um documento assinado em outra data.
 */
export async function baixarSegundaViaResponsabilidade(perfil: Usuario): Promise<void> {
  if (!perfil.termoResponsabilidadeAceito) throw new Error("Não existe aceite do termo registrado neste cadastro.");
  const dados = perfil.dadosPessoais;
  const prof = perfil.dadosProfissionais;
  const aceite = perfil.termoResponsabilidadeData?.toDate?.();
  const endereco = [dados.rua, "nº " + dados.numero, dados.bairro,
    [dados.cidade, dados.uf].filter(Boolean).join("/")].filter(Boolean).join(", ");
  const corpo = `
    <h1 style="text-align:center;font-size:17px;margin:0 0 18px">TERMO DE RESPONSABILIDADE E COMPROMISSO DE SIGILO</h1>
    <p style="font-size:12px;padding:10px 14px;background:#fff7e6;border:1px solid #f4d8a2;border-radius:8px">
      <strong>Segunda via informativa.</strong> Reemitida com os dados cadastrais atualmente disponíveis.
      O arquivo PDF originalmente fornecido durante o cadastro não é armazenado pelo Portal CSAE.
      Esta via não representa um novo aceite nem uma cópia autenticada do documento original.
    </p>
    <p>Eu, <strong>${escapar(dados.nomeCompleto)}</strong>, na condição de
      <strong>${escapar(prof.formacao)}</strong>, COREN
      <strong>${escapar([prof.numeroCoren, prof.ufCoren].filter(Boolean).join("/") || "não informado")}</strong>,
      CPF <strong>${escapar(dados.cpf)}</strong>, RG <strong>${escapar(dados.rg)}</strong>,
      endereço cadastrado <strong>${escapar(endereco)}</strong>, declaro ciência das responsabilidades
      associadas à utilização do Portal CSAE.</p>
    <p><strong>ASSUMO</strong> a responsabilidade pelo uso adequado das funcionalidades de registro
      e apoio ao Processo de Enfermagem.</p>
    <p><strong>COMPROMETO-ME</strong> a preservar o sigilo profissional e a confidencialidade
      das informações dos pacientes, utilizando-as exclusivamente nas atividades autorizadas.</p>
    <p><strong>ESTOU CIENTE</strong> de que a utilização indevida dos dados pode resultar
      nas consequências legais, éticas e administrativas cabíveis.</p>
    <div style="margin-top:40px;padding:15px;background:#f1f8f4;border-radius:8px">
      <p style="margin:0"><strong>Aceite eletrônico registrado:</strong>
      ${aceite ? escapar(dataHora(aceite)) : "data não disponível no cadastro"}</p>
      <p style="margin:6px 0 0"><strong>Reemissão:</strong> ${escapar(dataExtenso(new Date()))}</p>
      <p style="margin:6px 0 0"><strong>Usuário:</strong> ${escapar(dados.nomeCompleto)}</p>
    </div>`;
  await exportarHtml("termo-responsabilidade-csae-" + nomeArquivo(dados.nomeCompleto) + ".pdf", corpo);
}

export async function baixarTermosUsoPublicado(): Promise<void> {
  const estado = await getDoc(doc(db, "documentosLegais", "terms"));
  const publicadoId = estado.data()?.publicadaId as string | undefined;
  if (!publicadoId) throw new Error("Ainda não há uma versão publicada dos Termos de Uso.");
  const snap = await getDoc(doc(db, "documentosLegais", "terms", "revisoes", publicadoId));
  if (!snap.exists() || snap.data().situacao !== "publicada") {
    throw new Error("A versão publicada dos Termos de Uso não está disponível.");
  }
  const { conteudo, versao, publicadoEm } = snap.data() as {
    conteudo: ConteudoDocumentoLegal; versao: number;
    publicadoEm?: { toDate?: () => Date };
  };
  const texto = `
    <h1 style="text-align:center;font-size:18px;margin:0 0 14px">TERMOS DE USO</h1>
    <p style="text-align:center;color:#64748b">Versão ${versao} · Publicação:
    ${publicadoEm?.toDate ? escapar(dataHora(publicadoEm.toDate())) : "não informada"}</p>
    <p>${escapar(conteudo.introducao).replace(/\n/g, "<br>")}</p>
    ${conteudo.secoes.map(secao => `
      <section style="break-inside:avoid-page;margin-top:16px">
        <h2 style="font-size:15px;color:#145c3a;border-bottom:1px solid #d7e8dd;padding-bottom:5px">
          ${escapar(secao.titulo)}</h2>
        <p style="white-space:pre-line">${escapar(secao.corpo)}</p>
      </section>`).join("")}
  `;
  await exportarHtml("termos-de-uso-csae-v" + versao + ".pdf", texto);
}
