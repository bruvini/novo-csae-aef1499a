import assert from "node:assert/strict";
import test from "node:test";
import { LEGAL_DOCUMENTS } from "../src/lib/legalDocuments";

test("os dois documentos têm seção, versão e estado de revisão", () => {
  assert.deepEqual(Object.keys(LEGAL_DOCUMENTS).sort(), ["privacy", "terms"]);
  for (const document of Object.values(LEGAL_DOCUMENTS)) {
    assert.ok(document.title.trim());
    assert.ok(document.version.includes("minuta"));
    assert.ok(document.status.includes("validação"));
    assert.ok(document.sections.length >= 5);
    assert.ok(document.sections.every((section) => section.title && section.paragraphs.every(Boolean)));
  }
});

test("a política trata dados de saúde e não presume consentimento geral", () => {
  const text = LEGAL_DOCUMENTS.privacy.sections.flatMap((section) => section.paragraphs).join(" ");
  assert.match(text, /dados pessoais sensíveis/);
  assert.match(text, /não equivale a consentimento genérico/);
  assert.match(text, /retenção|conservação/i);
});

test("termos distinguem a responsabilidade profissional do apoio tecnológico", () => {
  const text = LEGAL_DOCUMENTS.terms.sections.flatMap((section) => section.paragraphs).join(" ");
  assert.match(text, /julgamento clínico/);
  assert.match(text, /Termo de Responsabilidade e Sigilo/);
});
