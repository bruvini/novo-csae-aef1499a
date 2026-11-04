import { doc, getDoc } from "firebase/firestore";
import type { Usuario } from "@/types/usuario";
import { db } from "@/services/firebase";
import type { ConteudoDocumentoLegal } from "@/services/bancodados/documentosLegaisDB";
import { comporPdfDocumento } from "@/utils/pdfDocumento";

const hora = (date: Date) => date.toLocaleString("pt-BR", {
  timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short",
});

const nomeArquivo = (valor: string) => valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 65);

/**
 * Uma segunda via informativa reconstruída a partir do aceite eletrônico e
 * do cadastro atual. Não se apresenta como cópia do PDF original não arquivado.
 */
export async function baixarSegundaViaResponsabilidade(perfil: Usuario): Promise<void> {
  if (!perfil.termoResponsabilidadeAceito) {
    throw new Error("Não existe aceite do Termo de Responsabilidade registrado neste cadastro.");
  }
  const dados = perfil.dadosPessoais;
  const profissionais = perfil.dadosProfissionais;
  const endereco = [
    dados.rua, "nº " + dados.numero, dados.bairro,
    [dados.cidade, dados.uf].filter(Boolean).join("/"),
  ].filter(Boolean).join(", ");
  const dataAceite = perfil.termoResponsabilidadeData?.toDate?.();
  const pdf = comporPdfDocumento({
    titulo: "TERMO DE RESPONSABILIDADE E COMPROMISSO DE SIGILO",
    subtitulo: "Segunda via informativa do compromisso individual",
    nota: "Reemissão feita com os dados cadastrais atuais. Este arquivo não é o PDF original emitido no cadastro nem equivale a um novo aceite.",
    paragrafos: [
      "Eu, " + dados.nomeCompleto + ", na condição de " + profissionais.formacao +
      ", inscrito(a) no COREN " + ([profissionais.numeroCoren, profissionais.ufCoren].filter(Boolean).join("/") || "não informado") +
      ", CPF " + dados.cpf + ", RG " + dados.rg +
      ", com endereço cadastrado em " + endereco + ", declaro ciência das responsabilidades associadas à utilização do Portal CSAE.",
      "ASSUMO a responsabilidade pelo uso adequado das funcionalidades de registro e apoio ao Processo de Enfermagem.",
      "COMPROMETO-ME a preservar o sigilo profissional e a confidencialidade das informações dos pacientes, utilizando-as exclusivamente nas atividades autorizadas.",
      "ESTOU CIENTE de que a utilização indevida de dados pode resultar nas consequências legais, éticas e administrativas cabíveis.",
      "Aceite eletrônico registrado: " + (dataAceite ? hora(dataAceite) : "data não disponível no cadastro") + ".",
      "Segunda via emitida em: " + hora(new Date()) + ".",
      "Profissional: " + dados.nomeCompleto + ".",
    ],
  });
  pdf.save("termo-responsabilidade-csae-" + nomeArquivo(dados.nomeCompleto) + ".pdf");
}

export async function baixarTermosUsoPublicado(): Promise<void> {
  const estado = await getDoc(doc(db, "documentosLegais", "terms"));
  const publicadoId = estado.data()?.publicadaId as string | undefined;
  if (!publicadoId) throw new Error("Ainda não há uma versão publicada dos Termos de Uso.");
  const versao = await getDoc(doc(db, "documentosLegais", "terms", "revisoes", publicadoId));
  if (!versao.exists() || versao.data().situacao !== "publicada") {
    throw new Error("A versão publicada dos Termos de Uso não está disponível.");
  }
  const { conteudo, versao: numero, publicadoEm } = versao.data() as {
    conteudo: ConteudoDocumentoLegal;
    versao: number;
    publicadoEm?: { toDate?: () => Date };
  };
  const pdf = comporPdfDocumento({
    titulo: "TERMOS DE USO",
    subtitulo: "Versão " + numero + " · Publicação: " +
      (publicadoEm?.toDate ? hora(publicadoEm.toDate()) : "data não informada"),
    paragrafos: [conteudo.introducao],
    secoes: conteudo.secoes.map(item => ({
      titulo: item.titulo,
      paragrafos: item.corpo.split(/\n\s*\n/).filter(Boolean),
    })),
  });
  pdf.save("termos-de-uso-csae-v" + numero + ".pdf");
}
