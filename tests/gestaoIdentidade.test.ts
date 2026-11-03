import assert from "node:assert/strict";
import test from "node:test";
import { conteudosLegaisIguais } from "../src/services/bancodados/documentosLegaisDB";
import { verificarPrazoResidencia, residentesParaRevisao } from "../src/utils/revisaoCadastral";
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

test("residência: marco de dois anos e ausência de expiração automática", () => {
  const hoje = new Date("2026-11-03T12:00:00Z");
  const { termino, vencido, diasAposTermino } = verificarPrazoResidencia(residente("2024-11-03", "A"), hoje)!;
  assert.equal(termino, "2026-11-03");
  assert.equal(vencido, true);
  assert.equal(diasAposTermino, 0);
  assert.equal(verificarPrazoResidencia(residente("2025-11-03", "B"), hoje)!.vencido, false);
  assert.equal(residentesParaRevisao([residente("2025-11-03", "B"), residente("2024-11-03", "A")], hoje).length, 1);
  assert.equal(verificarPrazoResidencia(residente("2024-02-29", "C"), hoje)!.termino, "2026-02-28");
  assert.equal(verificarPrazoResidencia(residente("2024-99-30", "D"), hoje), null);
});
