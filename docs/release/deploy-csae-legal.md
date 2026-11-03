# Publicação controlada do Portal CSAE Floripa 2.0

Projeto Firebase: `csaefloripa` | Hosting site: `csaefloripa` | domínio: `csae.com.br`.

## Antes de publicar

O PR #61 foi incorporado à `main`. Os documentos são minutas não publicadas: a interface do rodapé exibirá a ausência de versão oficial até a primeira publicação pela equipe. O Termo de Responsabilidade e Sigilo do cadastro permanece intacto.

O deploy necessita da aplicação e das regras Firestore **na mesma liberação**, porque `documentosLegais` não é acessível pelas regras de produção antigas. Não publicar apenas o Hosting.

## Configurar uma conta técnica no Google Cloud

1. Em https://console.cloud.google.com/iam-admin/serviceaccounts?project=csaefloripa, selecione o projeto **csaefloripa** e crie a conta **csae-github-deploy**.
2. Conceda somente os papéis:
   - `Firebase Hosting Admin` — `roles/firebasehosting.admin`;
   - `Firebase Rules Admin` — `roles/firebaserules.admin`;
   - `API Keys Viewer` — `roles/serviceusage.apiKeysViewer`.
3. Não conceder `Owner`, `Editor`, `Firebase Admin`, `Cloud Datastore User` ou permissões de leitura de dados clínicos à automação.
4. Em **Chaves → Adicionar chave → Criar nova chave → JSON**, guarde a chave em local seguro. Nunca enviá-la ao chat, nem colocá-la no repositório.
5. Em https://github.com/bruvini/novo-csae-aef1499a/settings/secrets/actions, use **New repository secret** e crie `FIREBASE_SERVICE_ACCOUNT_CSAE`, com **todo o conteúdo do JSON**.
6. Recomenda-se criar o ambiente `production` em GitHub **Settings → Environments**, com revisores obrigatórios autorizados para aprovar execuções antes do deploy. O fluxo usa esse ambiente.
7. Depois, em https://github.com/bruvini/novo-csae-aef1499a/actions, escolha **Publicar Portal CSAE (Firebase)** → **Run workflow** → branch `main`.

O workflow testa regras, aplicação, minutas, TypeScript e build, autentica a conta do projeto, publica primeiro as regras Firestore e depois o Hosting, e verifica os assets do build em `csaefloripa.web.app` e `csae.com.br`. Não publica regras Storage, não acessa pacientes, não altera cadastros e não publica os textos jurídicos como vigentes.

A conta do GitHub Actions não escreve o changelog, para evitar conceder-lhe acesso ao banco de dados clínico.

## Registrar o changelog obrigatório

A diretriz `GOVERNANCE.md` exige o registro da atualização em `changelogs` no Firestore. Após confirmar a publicação, execute pelo Cloud Shell com uma conta institucional autorizada:

```bash
gcloud config set project csaefloripa
gcloud auth application-default login
python3 -m venv .venv-csae-release
.venv-csae-release/bin/pip install 'google-cloud-firestore>=2.19,<3'
.venv-csae-release/bin/python scripts/release/registrar_changelog_documentos_legais.py
```

O script usa ID fixo e `create` para evitar duplicações e não consulta registros de pacientes. Também é possível cadastrar manualmente, usando o mesmo título, descrição e data/hora da liberação, pelo console do Firestore.

## Atenção

Chaves JSON são credenciais de longa duração. Depois da implantação, prefira migrar a integração para **Workload Identity Federation** (OIDC), com confiança restrita ao repositório e à branch `main`. Caso uma chave seja exposta, revogue-a no Google Cloud e substitua o secret no GitHub.

Não rodar `scripts/publicar-csae-cloudshell.sh` sem atualização: ele contém hashes fixos de uma versão antiga, faz modificações clínicas fora do escopo deste deploy e não foi concebido para esta mudança.
