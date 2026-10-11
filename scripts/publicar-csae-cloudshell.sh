#!/usr/bin/env bash
# Publicação assistida CSAE: executar no Google Cloud Shell com a própria conta Google.
set -Eeuo pipefail

PROJECT="csaefloripa"
TESTED="8477807de356491549b05ba3255b8fbd5f8aac5c"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

die() { printf '\nERRO: %s\n' "$*" >&2; exit 1; }
header() { printf '\n===== %s =====\n' "$*"; }
for cmd in git node npm python3 gcloud curl; do
  command -v "$cmd" >/dev/null || die "Ferramenta ausente: $cmd. Use Google Cloud Shell."
done

header "Conferência do repositório e da versão testada"
[[ "$(git branch --show-current)" == "main" ]] || die "Execute a versão da branch main."
git merge-base --is-ancestor "$TESTED" HEAD || die "O commit validado não está no histórico da main."
git diff --quiet "$TESTED" HEAD -- src tests package.json package-lock.json firebase.json firestore.rules storage.rules \
  || die "Código ou regras foram modificados depois da validação. Necessária nova revisão."
[[ -z "$(git status --porcelain)" ]] || die "Há alterações locais. Use um clone limpo do repositório."
grep -Eq '^VITE_FIREBASE_PROJECT_ID=csaefloripa[[:space:]]*$' .env \
  || die "A configuração .env não aponta para csaefloripa."
printf 'HEAD: %s\nProjeto: %s\n' "$(git rev-parse --short HEAD)" "$PROJECT"

header "Verificação de credenciais Google sem exportar segredos"
gcloud config set project "$PROJECT" >/dev/null
if ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
  printf 'Autorize sua conta Google para leitura e atualização controlada do Firestore.\n'
  gcloud auth application-default login
fi

header "Instalação de dependências e pré-validação"
if [[ ! -d .venv-csae-release ]]; then
  python3 -m venv .venv-csae-release
fi
.venv-csae-release/bin/pip -q install 'google-cloud-firestore>=2.19,<3'
.venv-csae-release/bin/python scripts/publicacao_csae_firestore.py preflight \
  || die "Os perfis reais não são compatíveis com as novas regras. NÃO publicar até corrigir."

header "Build e testes do código da main"
npm ci --legacy-peer-deps
npm test
npx tsc -b
npm run build
printf 'A suíte Firebase Emulator já passou no GitHub Actions:\n'
printf 'https://github.com/bruvini/novo-csae-aef1499a/actions/runs/38171497764\n'

header "Autenticação do Firebase CLI"
if ! npx --yes firebase-tools projects:list --json >/dev/null 2>&1; then
  printf 'O Firebase CLI precisa de autorização; conclua o login solicitado.\n'
  npx --yes firebase-tools login --no-localhost
fi
npx --yes firebase-tools use "$PROJECT" --project "$PROJECT" >/dev/null 2>&1 || true

echo
echo "ATENÇÃO: isto publicará REGRAS FIRESTORE, STORAGE e HOSTING no projeto csaefloripa."
echo "As regras públicas antigas serão substituídas por regras restritas."
read -r -p "Digite PUBLICAR CSAE para autorizar a implantação: " approval
[[ "$approval" == "PUBLICAR CSAE" ]] || die "Publicação cancelada."

header "DEPLOY DO PROJETO csaefloripa"
npx --yes firebase-tools deploy --project "$PROJECT" --only firestore:rules,storage,hosting --non-interactive \
  || die "Deploy falhou. Conferir mensagens do Firebase antes de tentar novamente."

header "Verificação básica do Hosting"
curl --fail --silent --show-error --location --output /dev/null https://csaefloripa.web.app/ \
  || die "Hosting não respondeu corretamente; revisar deploy."

echo
echo "O deploy respondeu sem erros. Agora acesse https://csaefloripa.web.app/"
echo "Confirme: login de um profissional aprovado, cadastro, Gestão de Usuários, Processo de Enfermagem"
echo "e resposta aos tickets. Se algo falhar, NÃO finalize o changelog e peça suporte."
read -r -p "Digite VALIDADO após conferir os fluxos para registrar a correção de sífilis e o changelog: " verified
[[ "$verified" == "VALIDADO" ]] || die "Deploy publicado. Correção clínica e changelog não executados."

header "Correção pontual do exame e registro do changelog"
.venv-csae-release/bin/python scripts/publicacao_csae_firestore.py finish \
  || die "Deploy realizado, mas finalização pendente. Não declarar conclusão até resolver."

header "CONCLUÍDO"
printf 'Portal: https://csaefloripa.web.app/\n'
printf 'Projeto: %s\nCommit: %s\n' "$PROJECT" "$(git rev-parse HEAD)"
printf 'Registros do changelog criados sem duplicações.\n'
