import assert from "node:assert/strict";
import test from "node:test";
import { conteudosLegaisIguais } from "../src/utils/documentosLegaisCompare";
import { verificarPrazoResidencia, residentesParaRevisao, marcoDoisAnosResidencia, somarDiasCivis, residentesSemData } from "../src/utils/revisaoCadastral";
import type { Usuario } from "../src/types/usuario";

test("legal: comparação sem depender da ordem das propriedades do Firestore", () => {
  const origem = { introducao: "Política", secoes: [{ titulo: "Objeto", corpo: "Texto original" }] };
  const inverso = { secoes: [{ corpo: "Texto original", titulo: "Objeto" }], introducao: "Política" };
  assert.equal(conteudosLegaisIguais(origem, inverso), true);
  assert.equal(conteudosLegaisIguais(origem, { ...inverso, secoes: [{ corpo: "Mudou", titulo: "Objeto" }] }), false);
  assert.equal(conteudosLegaisIguais(origem, { ...inverso, secoes: [{ corpo: "Texto original", titulo: "Outro" }] }), false);
});

const residente = (inicio: string, nome: string): Usuario => ({
  uid: nome, email: nome + "@teste.com",
  dadosPessoais: { nomeCompleto: nome, cpf: "00000000000", rg: "", rua: "", numero: "", bairro: "", cidade: "", uf: "", cep: "" },
  dadosProfissionais: { formacao: "Residente de Enfermagem", atuaSMS: true, dataInicioResidencia: inicio },
  termoResponsabilidadeAceito: true, termoResponsabilidadeData: {} as Usuario["termoResponsabilidadeData"],
  ehAdmin: false, gestorConteudos: false, tipoUsuario: "Comum", statusAcesso: "Liberado",
});

test("residência: só usuário aprovado e ativo é listado no dia posterior ao biênio", () => {
  const residenteA = residente("2024-11-03", "A");
  const noMarco = new Date("2026-11-03T15:00:00Z");
  const depois = new Date("2026-11-04T15:00:00Z");
  assert.equal(verificarPrazoResidencia(residenteA, noMarco)?.vencido, false);
  assert.equal(verificarPrazoResidencia(residenteA, depois)?.vencido, true);
  assert.equal(verificarPrazoResidencia(residenteA, depois)?.proximaVerificacao, "2026-11-04");
  assert.equal(residentesParaRevisao([residenteA], noMarco).length, 0);
  assert.equal(residentesParaRevisao([residenteA], depois).length, 1);
  const recusado = { ...residenteA, uid: "B", statusAcesso: "Recusado" as const };
  const revogado = { ...residenteA, uid: "C", statusAcesso: "Revogado" as const };
  assert.equal(residentesParaRevisao([residenteA, recusado, revogado], depois).length, 1);
});

test("29 de fevereiro é convertido para 01 de março, com aviso em 02 de março", () => {
  assert.equal(marcoDoisAnosResidencia("2024-02-29"), "2026-03-01");
  assert.equal(verificarPrazoResidencia(residente("2024-02-29", "A"), new Date("2026-03-01T15:00:00Z"))?.vencido, false);
  assert.equal(verificarPrazoResidencia(residente("2024-02-29", "A"), new Date("2026-03-02T15:00:00Z"))?.vencido, true);
});

test("prorrogação usa dia da decisão; novas prorrogações substituem só o próximo alerta", () => {
  assert.equal(somarDiasCivis("2026-11-03", 30), "2026-12-03");
  assert.equal(somarDiasCivis("2026-12-03", 45), "2027-01-17");
  const u = { ...residente("2024-01-15", "A"), revisaoResidenciaEm: "2026-12-03" };
  assert.equal(verificarPrazoResidencia(u, new Date("2026-11-03T15:00:00Z"))?.vencido, false);
  assert.equal(verificarPrazoResidencia(u, new Date("2026-12-03T15:00:00Z"))?.vencido, true);
  assert.equal(verificarPrazoResidencia(u)?.termino, "2026-01-15");
  assert.equal(verificarPrazoResidencia(u)?.origem, "prorrogação");
  assert.equal(residentesSemData([{...u, revisaoResidenciaEm: "9999-99-01"}]).length, 1);
  assert.equal(residentesSemData([{...u, statusAcesso: "Revogado"}]).length, 0);
});
