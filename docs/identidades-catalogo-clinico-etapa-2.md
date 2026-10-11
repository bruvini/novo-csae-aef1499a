# Integridade dos identificadores do catálogo clínico — Etapa 2

**Estado:** implementação de código, pendente de implantação, **sem escrita em dados clínicos de produção**.

## Contexto e limite

Os processos de enfermagem existentes persistem sinais vitais e componentes laboratoriais sob seus nomes, e revisão de sistemas sob nomes de exame físico e achado. Alterar, repetir ou excluir um identificador pode ocultar ou confundir históricos.

Desde a primeira etapa, os serviços verificam duplicidade por leitura das coleções e bloqueiam remoções na interface. Entretanto, entre a verificação e a criação dois gestores poderiam registrar simultaneamente a mesma identidade.

## Nova reserva atômica

As criações nos serviços \`SinaisVitais\`, \`ExamesLabImagem\` e \`RevisaoSistemas\` agora:
1. fazem a conferência prévia do catálogo existente (necessária porque o legado ainda não possui reservas);
2. derivam chaves normalizadas por domínio: \`parametro\`, \`exame\`, \`sistema\`, \`exame-fisico\`;
3. leem as reservas em \`identidadesCatalogoClinico/{chave}\` na mesma transação Firestore da escrita do documento clínico;
4. cancelam a operação inteira se a chave já existir; apenas um concorrente consegue gravar;
5. em edições, reservam **somente as novas chaves** acrescentadas, sem interferir nas chaves históricas nem nos IDs originais.

As reservas são **imutáveis**: as regras permitem \`get\` a gestores de conteúdo aprovados, \`create\` validado e negam \`list\`, \`update\` e \`delete\`. O \`documentoId\` aponta para o registro de origem.

## Exclusão permanente

O bloqueio de exclusão permanente de \`SinaisVitais\`, \`ExamesLabImagem\` e \`RevisaoSistemas\` passa a existir também em \`firestore.rules\`. A proteção nos serviços e botões continua.

## Limitações documentadas

- **Não é uma migração do legado:** não cria reservas retroativas; nomes em uso permanecem preservados, e a consulta prévia continua sendo necessária.
- A garantia atômica é efetiva para operações que utilizam os serviços integrados e essas transações. As regras atuais permitem que gestores autorizados gravem o catálogo por outras rotas que não usem a reserva; bloqueio global dessas rotas requer uma migração de schema controlada, revisão de todos os escritores e regras mais restritas.
- Apenas as identidades dos novos sistemas/exames/componentes recebem reservas; atualização de referências por faixa, revisão de vínculos NHB e condições de idade continua sujeita a validação clínica.
- A publicação requer implantação coordenada das regras Firestore e do frontend. Não publicar apenas um dos dois.
- Não executar \`scripts/import-clinical-parameters.ts --apply\` sobre as coleções atuais: esse script destina-se a carga inicial e bloqueia bases não vazias.

## Validação obrigatória

- GitHub Actions: testes Firebase Emulator (concorrência, leitura por gestor, negação de exclusão/alteração do índice), testes existentes, TypeScript, build.
- Homologação: dois gestores criando simultaneamente o mesmo parâmetro; segundo deve falhar sem persistir conteúdo órfão. Criação de faixa em cadastro existente deve continuar funcionando.
- Conferência de documento legado antes e depois das edições e implantação.
- Caso seja necessário renomear, substituir ou desativar um item: migração ou arquivamento versionados e aprovados pela CSAE, nunca edição in-place de chaves históricas.
