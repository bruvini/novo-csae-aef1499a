#!/usr/bin/env bash
# Publicação COORDENADA da aplicação e regras do catálogo clínico CSAE.
# A carga dos dados NÃO é disparada aqui.
set -Eeuo pipefail

PROJECT="csaefloripa"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { printf '\nERRO: %s\n' "$*" >&2; exit 1; }
header() { printf '\n===== %s =====\n' "$*"; }

for tool in git node npm gcloud curl python3; do
  command -v "$tool" >/dev/null 2>&1 || fail "Ferramenta ausente: $tool"
done
header "Integridade do checkout"
[[ "$(git branch --show-current)" == "main" ]] || fail "Faça a publicação a partir da branch main."
git fetch origin main >/dev/null
[[ "$(git rev-parse HEAD)" == "$(git rev-parse origin/main)" ]] \
  || fail "A main local não coincide com origin/main. Execute git pull --ff-only origin main."
# A CLI do Firebase pode alterar APENAS caches conhecidos; não descartamos nenhum arquivo.
mudancas="$(git status --porcelain)"
inesperadas="$(printf '%s\n' "$mudancas" | sed '/^$/d' | grep -Ev '^ M \.firebase/hosting\.[[:alnum:]]+\.cache$' || true)"
if [[ -n "$inesperadas" ]]; then
  printf '%s\n' "$inesperadas" >&2
  fail "Arquivos locais fora dos caches Firebase conhecidos. Revise-os antes de publicar (não serão apagados)."
fi
[[ -f .env ]] || fail "O .env do projeto está ausente."
grep -Eq '^VITE_FIREBASE_PROJECT_ID=csaefloripa[[:space:]]*$' .env \
  || fail "O projeto Firebase de .env não é csaefloripa."
[[ -f scripts/data/catalogo-protocolos-csae-v1.json ]] \
  || fail "Pacote de protocolos não está no checkout."
[[ -f firestore.rules && -f storage.rules && -f firebase.json ]] \
  || fail "Regras Firebase ou firebase.json não encontrados."
printf 'Commit: %s\nProjeto: %s\n' "$(git rev-parse HEAD)" "$PROJECT"

header "Validação local do frontend e do pacote"
python3 -m py_compile scripts/popular-catalogo-protocolos.py
python3 -m unittest discover -s scripts/tests -p 'test_popular_catalogo_protocolos.py'
npm ci --legacy-peer-deps
npm test
npx tsc -b
npm run build
header "Confirmação"
printf '%s\n' \
  "O frontend, firestore.rules e storage.rules serão publicados em $PROJECT." \
  "Nenhum dado do catálogo será inserido por este comando." \
  "Após publicar, faremos dry-run e carga clínica em comando SEPARADO."
read -r -p 'Digite PUBLICAR PORTAL CSAE para prosseguir: ' confirm
[[ "$confirm" == "PUBLICAR PORTAL CSAE" ]] || fail "Publicação cancelada."

header "Deploy Firebase Hosting + Regras"
npx --yes firebase-tools deploy --project "$PROJECT" --only firestore:rules,storage,hosting --non-interactive

header "Conferência dos domínios"
bash scripts/diagnosticar-versao-publica.sh
printf '\nConfira visualmente: https://csae.com.br/gestao-conteudos\n'
printf 'Indicador Revisão de Sistemas deve aparecer; faça teste com dados FICTÍCIOS.\n'
printf 'A carga das novas coleções ainda NÃO foi executada.\n'
