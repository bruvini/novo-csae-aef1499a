import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizarEmailAutenticacao,
  obterFeedbackErroAutenticacao,
} from "./auth";

test("normaliza espaços e capitalização do e-mail", () => {
  assert.equal(
    normalizarEmailAutenticacao("  Profissional@Exemplo.COM "),
    "profissional@exemplo.com",
  );
});

test("não revela se o e-mail ou a senha estão incorretos", () => {
  const codigos = [
    "auth/invalid-credential",
    "auth/user-not-found",
    "auth/wrong-password",
    "auth/invalid-email",
  ];
  const mensagens = codigos.map(obterFeedbackErroAutenticacao);

  mensagens.forEach((mensagem) => assert.deepEqual(mensagem, mensagens[0]));
});

test("mantém orientações específicas para bloqueio e conectividade", () => {
  assert.equal(
    obterFeedbackErroAutenticacao("auth/user-disabled").titulo,
    "Acesso indisponível",
  );
  assert.equal(
    obterFeedbackErroAutenticacao("auth/too-many-requests").titulo,
    "Muitas tentativas",
  );
  assert.equal(
    obterFeedbackErroAutenticacao("auth/network-request-failed").titulo,
    "Falha de conexão",
  );
});
