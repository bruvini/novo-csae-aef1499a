#!/usr/bin/env bash
# Publica reparos de navegação das Etapas 2/3 e registra changelog.
# Sem migrações de dados, Firestore Rules, pacientes ou diagnósticos.
set -Eeuo pipefail

PROJECT=csaefloripa
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() { printf '\nERRO: %s\n' "$*" >&2; exit 1; }
step() { printf '\n=== %s ===\n' "$*"; }

[[ "$(git branch --show-current)" == "main" ]] || fail "Entre na branch main antes de publicar."
[[ -z "$(git status --porcelain)" ]] || fail "Há alterações locais; salve-as antes de atualizar."
step "Atualizar o código da branch main"
git pull --ff-only origin main

[[ -f .env ]] || fail "Arquivo .env não encontrado. Restaure a configuração existente."
grep -Eq '^VITE_FIREBASE_PROJECT_ID=csaefloripa[[:space:]]*$' .env ||
  fail "O projeto Firebase no .env não é csaefloripa."
if command -v gcloud >/dev/null; then
  [[ "$(gcloud config get-value project 2>/dev/null)" == "$PROJECT" ]] ||
    fail "Configure o projeto Cloud: gcloud config set project csaefloripa"
fi

step "Instalar dependências e executar testes"
npm ci --legacy-peer-deps
npm test
npx tsc -b
npm run build

step "Publicar somente Firebase Hosting"
# O CLI solicitará autenticação separadamente se necessário.
if ! npx --yes firebase-tools projects:list --json >/dev/null 2>&1; then
  echo "O Firebase CLI precisa de login. Siga as instruções:"
  npx --yes firebase-tools login --no-localhost
fi
npx --yes firebase-tools deploy --project "$PROJECT" --only hosting --non-interactive

step "Registrar changelog no Firestore"
if [[ ! -x .venv-csae-release/bin/python ]]; then
  python3 -m venv .venv-csae-release
fi
if ! .venv-csae-release/bin/python -c "import google.cloud.firestore" >/dev/null 2>&1; then
  .venv-csae-release/bin/python -m pip install google-cloud-firestore
fi
.venv-csae-release/bin/python scripts/registrar-changelog-correcao-pe-20261014.py

step "Concluído"
printf 'Commit: %s\n' "$(git rev-parse HEAD)"
printf 'Portal: https://csae.com.br/processo-enfermagem\n'
echo "Verifique a liberação das etapas 3 e 4 com processo de teste."
