import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const index = readFileSync("src/pages/Index.tsx", "utf8");
const mesh = readFileSync("src/components/LoginNetworkBackground.tsx", "utf8");
const styles = readFileSync("src/components/LoginNetworkBackground.css", "utf8");

test("links institucionais exatos no rodapé de login", () => {
  assert.ok(index.includes("https://www.pmf.sc.gov.br/entidades/saude/index.php?cms=csae+++apresentacao&menu=10&submenuid=1478"));
  assert.ok(index.includes("https://www.linkedin.com/in/enfbrunovinicius/"));
  assert.equal((index.match(/rel="noopener noreferrer"/g) || []).length >= 2, true);
  assert.ok(index.includes("focus-visible:outline"));
});

test("malha visual não bloqueia o login e não re-renderiza por quadro", () => {
  assert.ok(index.includes("<LoginNetworkBackground />"));
  assert.ok(index.includes("relative z-10"));
  assert.ok(mesh.includes("pointer-events-none"));
  assert.ok(mesh.includes('aria-hidden="true"'));
  assert.ok(mesh.includes("strokeDasharray"));
  assert.equal(/requestAnimationFrame|setInterval|canvas|getContext\(/.test(mesh), false);
});

test("acessibilidade e responsividade das animações", () => {
  assert.ok(styles.includes("prefers-reduced-motion: reduce"));
  assert.ok(styles.includes("max-width: 640px"));
  assert.ok(styles.includes("animation: none !important"));
  assert.ok(styles.includes("csae-login-network__signal"));
});
