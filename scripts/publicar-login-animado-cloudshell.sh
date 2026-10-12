#!/usr/bin/env bash
# Publicação da nova tela de login; altera apenas Firebase Hosting.
set -Eeuo pipefail

PROJECT="csaefloripa"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() { printf 'ERRO: %s\n' "$*" >&2; exit 1; }
step() { printf '\n===== %s =====\n' "$*"; }

for command in git npm node; do
  command -v "$command" >/dev/null 2>&1 || fail "Comando ausente: $command"
done
[[ "$(git branch --show-current)" == "main" ]] || fail "Execute na branch main."
changes="$(git status --porcelain)"
unexpected="$(printf '%s\n' "$changes" | sed '/^$/d' | grep -Ev '^ M \.firebase/hosting\.[[:alnum:]]+\.cache$' || true)"
[[ -z "$unexpected" ]] || fail "Há arquivos locais alterados; revise antes de atualizar: $unexpected"

step "Atualizar código"
git pull --ff-only origin main
[[ -f .env ]] || fail "Arquivo .env ausente."
grep -Eq '^VITE_FIREBASE_PROJECT_ID=csaefloripa[[:space:]]*$' .env \
  || fail "O projeto Firebase configurado no .env não é csaefloripa."

step "Testes, tipagem e build"
npm ci --legacy-peer-deps
npm test
npx tsc -b
npm run build

step "Publicar somente o Hosting"
npx --yes firebase-tools deploy --project "$PROJECT" --only hosting --non-interactive

step "Publicação concluída"
printf 'Commit: %s\n' "$(git rev-parse HEAD)"
printf 'Login: https://csae.com.br/login\n'
echo "Valide os dois links do rodapé, animação e modo de movimento reduzido."
