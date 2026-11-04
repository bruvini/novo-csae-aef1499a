import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const perfil = readFileSync("src/components/PerfilUsuarioDialog.tsx", "utf8");
const seguranca = readFileSync("src/components/SegurancaConta.tsx", "utf8");
const profissionais = readFileSync("src/components/SolicitacaoProfissional.tsx", "utf8");
const pdf = readFileSync("src/utils/termosPdf.ts", "utf8");
const revisao = readFileSync("src/services/bancodados/revisaoCadastralDB.ts", "utf8");

test("perfil social: modal amplo, sem abas e com todos os blocos", () => {
  assert.match(perfil, /sm:!max-w-\[1120px\]/);
  assert.doesNotMatch(perfil, /<Tabs|<TabsTrigger|<TabsContent/);
  for (const titulo of ["Identificação", "Dados profissionais", "Endereço residencial",
    "Alteração de dados profissionais", "Segurança da conta", "Termos e documentos",
    "Quem aprovou", "Data da aprovação"]) {
    assert.ok(perfil.includes(titulo), "Seção ausente: " + titulo);
  }
  assert.match(perfil, /aprovadoPorNome/);
  assert.match(perfil, /Não registrado no histórico/);
  assert.match(perfil, /<SolicitacaoProfissional perfil=\{perfil\}/);
});

test("autenticação: mudança de e-mail automática e redefinição de senha com confirmação", () => {
  assert.match(seguranca, /verifyBeforeUpdateEmail/);
  assert.match(seguranca, /window\.addEventListener\("focus"/);
  assert.match(seguranca, /document\.addEventListener\("visibilitychange"/);
  assert.match(seguranca, /getIdToken\(user, true\)/);
  assert.doesNotMatch(seguranca, /Já confirmei: atualizar perfil/);
  assert.match(seguranca, /sendPasswordResetEmail\(auth, user\.email\)/);
  assert.match(seguranca, /Nova senha/);
  assert.match(seguranca, /Repetir nova senha/);
  assert.match(seguranca, /nova !== confirmacao/);
  assert.match(seguranca, /senhaAtual/);
});

test("dados profissionais: administrador também solicita, mas perde acesso até revisão", () => {
  assert.match(profissionais, /perfil\.ehAdmin/);
  assert.match(profissionais, /Solicita|solicita/);
  assert.match(profissionais, /suspens/);
  assert.match(revisao, /outroAdminAtivo/);
  assert.match(revisao, /statusAcesso: "AguardandoRevisaoCadastro"/);
  assert.match(revisao, /alteracaoCadastralPendente: true/);
});

test("documentos: termo original não é forjado e PDFs diferenciam os modelos", () => {
  assert.match(pdf, /baixarSegundaViaResponsabilidade/);
  assert.match(pdf, /baixarTermosUsoPublicado/);
  assert.match(pdf, /não é uma cópia autenticada/i);
  assert.match(pdf, /termoResponsabilidadeData/);
  assert.match(pdf, /documentosLegais/);
  assert.match(pdf, /html2pdf/);
  assert.match(pdf, /escapar/);
});
