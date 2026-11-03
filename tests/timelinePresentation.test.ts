import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { LEGAL_DOCUMENTS } from "../src/lib/legalDocuments";

const hero = readFileSync("src/components/HeroBanner.tsx", "utf8");
const timeline = readFileSync("src/pages/Timeline.tsx", "utf8");
const service = readFileSync("src/services/bancodados/timelineDB.ts", "utf8");
const rules = readFileSync("firestore.rules", "utf8");
const app = readFileSync("src/App.tsx", "utf8");
const header = readFileSync("src/components/Header.tsx", "utf8");
const profile = readFileSync("src/components/PerfilUsuarioDialog.tsx", "utf8");
const legalEditor = readFileSync("src/components/gestao-conteudos/GestaoDocumentosLegais.tsx", "utf8");

test("indicadores do banner possuem dimensões iguais e valor sem quebra", () => {
  assert.match(hero, /lg:w-\[64%\]/);
  assert.match(hero, /md:grid-cols-4/);
  assert.equal((hero.match(/min-h-\[120px\]/g) ?? []).length, 4);
  assert.equal((hero.match(/whitespace-nowrap text-\[clamp/g) ?? []).length, 4);
});

test("História recupera a coleção real e os campos legados, sem divulgar UIDs para visitantes", () => {
  assert.match(app, /path="\/timeline"/);
  assert.match(timeline, /Nossa História/);
  assert.match(timeline, /sessionData\?\.ehAdmin === true/);
  assert.match(timeline, /dataParaInput\(evento\)/);
  assert.match(service, /TIMELINE_COLLECTION = "historiasPortal"/);
  assert.match(service, /"dataOrdenacao", "asc"/);
  assert.match(service, /descricao: input\.textoRedacao\.trim\(\)/);
  assert.match(service, /curtidasPor: Array\.isArray/);
  assert.match(rules, /match \/historiasPortal\/\{storyId\}/);
  assert.match(rules, /allow get, list: if isApproved\(\)/);
  assert.match(rules, /validHistoriaLike/);
});

test("nome no cabeçalho abre painel de dados, edição restrita ao endereço", () => {
  assert.match(header, /PerfilUsuarioDialog/);
  assert.match(header, /aria-label="Abrir meus dados cadastrais"/);
  assert.match(profile, /"dadosPessoais\.rua"/);
  assert.match(profile, /"dadosPessoais\.cep"/);
  assert.doesNotMatch(profile, /"dadosProfissionais\.matricula":/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['rua', 'numero', 'bairro', 'cidade', 'uf', 'cep'\]\)/);
});

test("editor legal mostra trecho responsável pelo bloqueio sem ignorar pendências", () => {
  assert.match(legalEditor, /localizarPendenciasLegais/);
  assert.match(legalEditor, /pendenciasDetalhadas\.map/);
  assert.match(legalEditor, /pendencias\.length > 0/);
  assert.match(legalEditor, /temAlteracoes/);
});

test("modelo inicial de privacidade exige dados institucionais verificáveis", () => {
  const privacy = LEGAL_DOCUMENTS.privacy;
  assert.ok(privacy.sections.length >= 7);
  assert.ok(privacy.sections.some(s => s.paragraphs.some(p => p.includes("[PREENCHER:"))));
  assert.match(privacy.sections.flatMap(s => s.paragraphs).join(" "), /não equivale a consentimento genérico/);
});
