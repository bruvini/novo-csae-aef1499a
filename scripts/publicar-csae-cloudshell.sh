#!/usr/bin/env bash
# Publicação assistida CSAE: executar no Google Cloud Shell com a própria conta Google.
set -Eeuo pipefail

PROJECT="csaefloripa"
TESTED="8477807de356491549b05ba3255b8fbd5f8aac5c"
# Hashes de conteúdo dos arquivos de segurança aprovados no CI.
EXPECTED_FIRESTORE_BLOB="062434f87305fd9f851f6e46b2715b868a362265"
EXPECTED_RULES_TEST_BLOB="61ca81751ed7e0fe8c6d3f09c2001204601ba5bd"
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
git diff --quiet "$TESTED" HEAD -- src/pages/Register.tsx src/contexts/AuthContext.tsx src/components/processo-enfermagem src/utils/processoUtils.ts firebase.json storage.rules \
  || die "Componentes críticos de cadastro, PE ou infraestrutura foram alterados e exigem revisão."
# Conferir os hashes dos módulos efetivamente validados no GitHub Actions.
check_blob() {
  [[ "$(git hash-object "$1")" == "$2" ]] || die "Arquivo fora da versão validada: $1"
}
check_blob "src/pages/PainelEstatistico.tsx" "bb6dd8ac8a94269857d6674f3ed2528c0222c618"
check_blob "src/services/bancodados/biProcessosEnfermagemDB.ts" "e0e053dcf1eeb8e3e4fddae8ccacdf1e76f2e103"
check_blob "src/components/HeroBanner.tsx" "1eb3268716721ffa9c444021a3d094432465b02b"
check_blob "src/pages/Dashboard.tsx" "7585524a0af6e5c3ac4e5d1cea1a1a524c5ffa48"
check_blob "src/services/bancodados/gestaoUsuariosDB.ts" "db85dfc5ed4ff0ba971817eb94765ff21190b462"
check_blob "src/services/bancodados/changelogDB.ts" "4ab83d4f0f986130df4689fdd9f059d26e1aab57"
check_blob "src/utils/painelEstatistico.ts" "3da9f08ac236891cb736f258e277b7d922ccae35"
check_blob "src/utils/painelEstatisticoCache.ts" "aea073224e1494b7bf2cab8dfdf7734da0461c06"
check_blob "src/utils/painelEstatisticoXlsx.ts" "5b428de5c941f1e517f1f73899e750328cd501d9"
check_blob "src/utils/tempoProcesso.ts" "87476df2655b51bc097de10653d56d01540652ed"
check_blob "package.json" "8b97b1410fe2499428447f1db3ce32b5d6ee40e5"
check_blob "package-lock.json" "36a16621e7bf45ed9356519bdc3c6911f4cb6226"
[[ "$(git hash-object firestore.rules)" == "$EXPECTED_FIRESTORE_BLOB" ]] \
  || die "As regras Firestore não são a versão aprovada. Cancelando."
[[ "$(git hash-object tests/firebaseRules.test.ts)" == "$EXPECTED_RULES_TEST_BLOB" ]] \
  || die "Os testes de segurança não são a versão aprovada. Cancelando."
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
echo "Comparando versões dos domínios (sem consultar dados pessoais)..."
bash scripts/diagnosticar-versao-publica.sh || die "O domínio csae.com.br não serve a mesma versão ou está inacessível. Verifique o domínio no Firebase Hosting antes de declarar sucesso."

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
