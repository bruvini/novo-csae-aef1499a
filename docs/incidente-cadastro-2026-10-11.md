# Investigação do incidente de cadastro — 11/10/2026

## Evidência de código

O cadastro anterior criava a conta no mesmo Firebase Auth observado pelo `AuthContext`. O listener global carregava imediatamente `usuarios/{uid}` e, se ainda não encontrasse o perfil, fazia `signOut`. A gravação do perfil ocorria depois, em outra etapa assíncrona. Portanto, há uma condição de corrida real no desenho do código. Isso não prova que tenha causado os relatos históricos.

Também foi confirmado que a rotina de cadastro tentava apagar a conta de Auth quando a gravação do perfil falhava. Se a exclusão falhasse, uma nova tentativa com o mesmo e-mail poderia retornar `auth/email-already-in-use`, sem deixar o perfil visível para a Gestão de Usuários.

As consultas administrativas usavam `orderBy(dataCadastro)`, que omite documentos sem esse campo, e convertiam erros em listas vazias. O BI lia perfis Firestore, não contas de Auth nem tentativas de cadastro, e mantinha cache de até seis horas.

## Limites da auditoria de produção

Esta sessão não tinha credencial segura do Firebase Admin SDK nem Application Default Credentials. O `gcloud` não estava instalado. A Firebase CLI autenticada conseguiu enumerar projetos, mas não oferece `firestore:rules:get`; as regras efetivamente publicadas também não estão versionadas neste repositório. A tentativa de usar essa subcomanda foi somente leitura e retornou que não é um comando reconhecido.

O comando `firebase auth:export` foi deliberadamente evitado: a exportação poderia materializar campos de credenciais/hashes além dos dados mínimos solicitados. Assim, não foi possível fazer paginação de contas Auth nem comparar UIDs com documentos Firestore por método autorizado e minimizado.

Não havia ferramenta `gcloud`/Cloud Logging conectada. Nenhuma consulta de eventos `identitytoolkit.googleapis.com` ou gravações Firestore foi realizada. A disponibilidade e retenção dos logs históricos não pôde ser determinada.

Consequentemente, as situações individuais das profissionais relatadas, a quantidade de contas órfãs, documentos invisíveis, duplicidades e tentativas fracassadas permanecem **inconclusivas**. Nenhuma identificação por nome/e-mail alternativo foi inferida e nenhuma alteração de dados foi executada.

## Alterações desta branch

- Usa uma instância secundária do Firebase Auth/Firestore e persistência em memória no fluxo de cadastro, isolada do `AuthContext`.
- Só informa conclusão depois que `setDoc` confirma o perfil com status inicial `Aguardando`.
- Remove o rollback automático que apagava contas de Auth após falha de perfil; a conta é preservada para recuperação assistida.
- Orienta a pessoa a não repetir o cadastro com outro e-mail e apresenta um identificador de correlação para o suporte.
- Registra etapas e códigos de erro no Firebase Analytics, sem nome, e-mail, UID, senha, CPF, RG, endereço ou conteúdo do formulário. O registro é best-effort, não bloqueia o cadastro e **não substitui Cloud Logging**; visibilidade e retenção dependem do acesso/configuração de Analytics do projeto.
- Esclarece que gerar/aceitar o termo não equivale ao envio do cadastro.
- A Gestão carrega também perfis sem `dataCadastro` em uma leitura por atualização, ordena datas ausentes ao final e apresenta falha de leitura com opção de nova tentativa. Status ausentes ou desconhecidos ficam para revisão manual, sem alteração automática de permissões.
- O BI separa status não reconhecidos e perfis incompletos, valida datas legadas, invalida caches antigos por versão e limita o cache a 15 minutos. As métricas continuam contando somente perfis Firestore salvos, não contas Auth órfãs nem tentativas sem perfil.

## Revisão e publicação

PRs #19 e #20 estavam abertos e sem merge na consulta ao GitHub desta data. O Hosting respondeu HTTP 200, mas a ferramenta disponível não expôs histórico de releases nem vínculo entre hash publicado e commit/branch. Não é possível confirmar por esse dado qual branch está atualmente publicada.

Rascunho de changelog para esta correção, a registrar somente após publicação e validação:

**Título:** Cadastro de profissionais mais confiável

**Descrição:** Melhoramos o envio do cadastro e deixamos mais claro quando ele foi realmente concluído. Se houver uma falha, a plataforma orienta como pedir ajuda sem criar outra conta com outro e-mail.

## Próxima etapa operacional

Completar a auditoria histórica requer acesso administrativo de leitura ao Auth, Firestore e Cloud Logging por ferramenta/credencial aprovada, com resultados processados em memória e sem exportar hashes ou dados além do necessário. Só então deve ser definido se há perfis recuperáveis e se é necessário preparar um script idempotente. Esta branch não modifica produção e não inclui script de recuperação porque nenhum caso pôde ser confirmado.
