#!/usr/bin/env bash
# Executar no Google Cloud Shell, na raiz do repositório já clonado.
# Primeiro migra perfis legados, depois usa a publicação assistida já testada.
set -Eeuo pipefail

cd "$(dirname "$0")/.."
[[ "$(git branch --show-current)" == "main" ]] || {
  echo "ERRO: entre na branch main. Nenhuma mudança realizada." >&2
  exit 1
}
[[ -z "$(git status --porcelain)" ]] || {
  echo "ERRO: existem alterações locais; revise antes de começar." >&2
  exit 1
}

PY=".venv-csae-release/bin/python"
if [[ ! -x "$PY" ]]; then
  python3 -m venv .venv-csae-release
fi
.venv-csae-release/bin/pip -q install 'google-cloud-firestore>=2.19,<3'

echo
echo "CSAE — migração de perfis legados no projeto csaefloripa."
echo "Não modifica UID/Auth, privilégios, paciente ou histórico clínico."
echo "A migração é transacional por documento e exige autorização explícita."
echo
if [[ -f "$HOME/.config/csae-perfis-legados/mapa-migracao.json" ]]; then
  echo "Existe manifesto privado de uma migração já iniciada."
  read -r -p 'Para retomar com segurança, digite RETOMAR 42 PERFIS: ' approval
  "$PY" scripts/migrar-perfis-legados.py resume --confirm "$approval"
else
  "$PY" scripts/migrar-perfis-legados.py plan
  echo
  read -r -p 'Para migrar os 42 documentos legados, digite MIGRAR 42 PERFIS: ' approval
  "$PY" scripts/migrar-perfis-legados.py apply --expected 42 --confirm "$approval"
  "$PY" scripts/migrar-perfis-legados.py verify
fi

echo
echo "Verificando os 138 perfis após a migração..."
"$PY" scripts/publicacao_csae_firestore.py preflight
echo
echo "Perfis compatíveis. Iniciando o procedimento de deploy assistido."
echo "Ele solicitará confirmação antes de publicar e antes de registrar o changelog."
bash scripts/publicar-csae-cloudshell.sh
