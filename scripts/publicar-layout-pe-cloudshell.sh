#!/usr/bin/env bash
# Publicação pontual da página de Processo de Enfermagem.
# Somente Firebase Hosting e um changelog; não publica regras nem migra dados clínicos.
set -Eeuo pipefail

PROJECT="csaefloripa"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { printf 'ERRO: %s\n' "$*" >&2; exit 1; }
step() { printf '\n===== %s =====\n' "$*"; }

for tool in git node npm python3; do
  command -v "$tool" >/dev/null || fail "Comando ausente: $tool"
done
[[ "$(git branch --show-current)" == "main" ]] || fail "Execute na branch main."
step "Atualizar main"
git pull --ff-only origin main
[[ -f .env ]] || fail "Arquivo .env ausente; configurar Firebase antes."
grep -Eq '^VITE_FIREBASE_PROJECT_ID=csaefloripa[[:space:]]*$' .env \
  || fail "VITE_FIREBASE_PROJECT_ID diferente de csaefloripa."
[[ -x .venv-csae-release/bin/python ]] \
  || fail "Ambiente Python .venv-csae-release ausente."

step "Testes e compilação"
npm ci --legacy-peer-deps
npm test
npx tsc -b
npm run build

step "Publicar somente Firebase Hosting"
npx --yes firebase-tools deploy --project "$PROJECT" --only hosting --non-interactive

step "Registrar novidade para os usuários"
.venv-csae-release/bin/python scripts/registrar-changelog-layout-pe.py

step "Concluído"
printf 'Commit: %s\n' "$(git rev-parse HEAD)"
printf 'Página: https://csae.com.br/processo-enfermagem\n'
echo "Confira a responsividade em desktop, tablet e celular."
