import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agruparStatusCadastro,
  ordenarPerfisPorDataCadastro,
  perfilCadastroIncompleto,
  timestampToDate,
} from "../src/utils/registrationData";

test("ordena perfis com e sem data sem excluir os legados", () => {
  const profiles = [
    { id: "legacy" },
    { id: "old", dataCadastro: new Date("2024-01-01T00:00:00Z") },
    { id: "new", dataCadastro: { toDate: () => new Date("2025-01-01T00:00:00Z") } },
  ];
  assert.deepEqual(ordenarPerfisPorDataCadastro(profiles).map(({ id }) => id), ["new", "old", "legacy"]);
});

test("classifica variantes conhecidas e não presume status desconhecido como aguardando", () => {
  assert.equal(agruparStatusCadastro("  APROVADO "), "Liberado");
  assert.equal(agruparStatusCadastro("pendente"), "Aguardando");
  assert.equal(agruparStatusCadastro("rejeitado"), "Recusado");
  assert.equal(agruparStatusCadastro(undefined), "Status não identificado");
  assert.equal(agruparStatusCadastro("status-novo"), "Status não identificado");
});

test("marca perfis incompletos sem depender de dataCadastro e reconhece perfil completo", () => {
  const complete = {
    email: "user@example.invalid",
    statusAcesso: "Aguardando",
    dadosPessoais: { nomeCompleto: "NOME", cpf: "00000000000" },
    dadosProfissionais: { formacao: "Enfermeiro", atuaSMS: true },
  };
  assert.equal(perfilCadastroIncompleto(complete), false);
  assert.equal(perfilCadastroIncompleto({ ...complete, dadosPessoais: { nomeCompleto: "", cpf: "" } }), true);
  assert.equal(perfilCadastroIncompleto({ ...complete, statusAcesso: "Outro" }), true);
});

test("converte data válida com segurança e ignora data ausente ou inválida", () => {
  assert.equal(timestampToDate("2026-09-22T12:00:00Z")?.toISOString(), "2026-09-22T12:00:00.000Z");
  assert.equal(timestampToDate({ toDate: () => { throw new Error("invalid"); } }), null);
  assert.equal(timestampToDate("not-a-date"), null);
  assert.equal(timestampToDate(undefined), null);
});
