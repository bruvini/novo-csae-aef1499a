import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { LEGAL_DOCUMENTS } from "../src/lib/legalDocuments";

const hero = readFileSync("src/components/HeroBanner.tsx", "utf8");
const timeline = readFileSync("src/pages/Timeline.tsx", "utf8");
const rules = readFileSync("firestore.rules", "utf8");
const app = readFileSync("src/App.tsx", "utf8");

test("indicadores do banner possuem dimensões iguais e valor sem quebra", () => {
  assert.match(hero, /lg:w-\[64%\]/);
  assert.match(hero, /md:grid-cols-4/);
  assert.equal((hero.match(/min-h-\[120px\]/g) ?? []).length, 4);
  assert.equal((hero.match(/whitespace-nowrap text-\[clamp/g) ?? []).length, 4);
});

test("história é pública e utiliza os campos antigos, com editor só para admin", () => {
  assert.match(app, /path="\/timeline"/);
  assert.match(timeline, /Nossa História/);
  assert.match(timeline, /sessionData\?\.ehAdmin === true/);
  assert.match(timeline, /dataParaInput\(evento\.dataEvento\)/);
  assert.match(timeline, /legendaFoto/);
  assert.match(timeline, /autoriaFoto/);
  assert.match(rules, /match \/timelineEvents\/\{eventId\}/);
  assert.match(rules, /allow get, list: if true;/);
  assert.match(rules, /allow create: if isActiveAdmin\(\)/);
});

test("modelo inicial de privacidade contém dados obrigatórios em aberto", () => {
  const privacy = LEGAL_DOCUMENTS.privacy;
  assert.ok(privacy.sections.length >= 7);
  assert.ok(privacy.sections.some(s => s.paragraphs.some(p => p.includes("[PREENCHER:"))));
  assert.match(privacy.sections.flatMap(s => s.paragraphs).join(" "), /não equivale a consentimento genérico/);
});
